import { useParams, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Calendar, MapPin, Trophy, Users, Zap } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { YouTubeEmbed } from '@/components/common/youtube-embed';
import { MatchCredentials } from '@/components/match/match-credentials';
import { TournamentProgress } from '@/components/tournament/tournament-progress';
import { ExportCsvButton } from '@/components/common/export-csv-button';
import { useAsync } from '@/hooks/useAsync';
import { useLeaderboardAutoRefresh } from '@/hooks/useLeaderboardAutoRefresh';
import { matchApi, streamApi, teamApi, tournamentApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MAP_LABEL, formatDate, formatMoney } from '@/lib/utils';
import { buildFilename } from '@/lib/csv';
import type { Team, TournamentTeam } from '@/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'Teams' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'matches', label: 'Matches' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'rules', label: 'Rules' },
  { id: 'stream', label: 'Live Stream' },
];

type RegisteredTeam = TournamentTeam & { team: Team };

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, can } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: t, loading } = useAsync(
    () => (id ? tournamentApi.get(id) : Promise.resolve(undefined)),
    [id],
  );
  const { data: teams, refetch: refetchTeams } = useAsync(
    () => (id ? tournamentApi.registeredTeams(id) : Promise.resolve([])),
    [id],
  );
  const { data: matches } = useAsync(
    () => (id ? matchApi.byTournament(id) : Promise.resolve([])),
    [id],
  );
  const { data: streams } = useAsync(
    () => (id ? streamApi.byTournament(id) : Promise.resolve([])),
    [id],
  );
  const { data: lb, refetch: refetchLb } = useAsync(
    () => (id ? tournamentApi.leaderboard(id) : Promise.resolve([])),
    [id],
  );
  const { data: myTeam } = useAsync(
    () => (user ? teamApi.byUser(user.id) : Promise.resolve(undefined)),
    [user?.id],
  );

  // Auto-refresh leaderboard
  useLeaderboardAutoRefresh(t?.id, refetchLb);

  if (loading) {
    return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  }
  if (!t) return <Navigate to="/404" replace />;

  const primaryStream = streams?.find(s => s.isPrimary) ?? streams?.[0];

  const handleRegister = async () => {
    if (!user) {
      toast('INFO', 'Please login or create an account.');
      return;
    }
    if (!myTeam) {
      toast('WARNING', 'You need a team first.');
      return;
    }
    setBusy(true);
    try {
      await tournamentApi.registerTeam(t.id, myTeam.id, user.id);
      toast('SUCCESS', 'Team registered', myTeam.name + ' joined ' + t.name);
      setRegisterOpen(false);
      void refetchLb();
      void refetchTeams();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown';
      if (msg.startsWith('INSUFFICIENT_FUNDS:')) {
        const needed = parseInt(msg.split(':')[1] || '0', 10);
        toast(
          'ERROR',
          'Insufficient balance',
          'Add ' + needed.toLocaleString() + ' UZS to your wallet',
        );
        setRegisterOpen(false);
        setTimeout(() => {
          window.location.href = '/wallet/topup';
        }, 900);
        return;
      }
      toast('ERROR', 'Registration failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* ───────────── Hero ───────────── */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-bg-deep">
        {t.banner && (
          <img
            src={t.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent" />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <StatusBadge status={t.status} />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {t.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t.description}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Trophy size={14} className="text-brand-400" />{' '}
              {formatMoney(t.prizePool)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-400" />{' '}
              {formatDate(t.startDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-brand-400" /> {teams?.length ?? 0} /{' '}
              {t.maxTeams}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-brand-400" />{' '}
              {t.maps.map(m => MAP_LABEL[m]).join(' - ')}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => setRegisterOpen(true)}
              disabled={!can('tournaments.register')}
            >
              <Zap size={15} /> Register Team
            </Button>
            {primaryStream && (
              <Button variant="secondary" onClick={() => setTab('stream')}>
                Watch Live
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs items={TABS} value={tab} onChange={setTab} className="mb-6" />

      {/* ───────────── Overview ───────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                  {t.description}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Info label="Reg opens" value={formatDate(t.registrationOpen)} />
                  <Info label="Reg closes" value={formatDate(t.registrationClose)} />
                  <Info
                    label="Team size"
                    value={
                      t.rosterRules.minPlayers +
                      '-' +
                      t.rosterRules.maxPlayers +
                      ' players'
                    }
                  />
                  <Info label="Timezone" value={t.timezone} />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Prize Pool</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="font-display text-3xl font-bold text-white">
                  {formatMoney(t.prizePool)}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {t.prizeDistribution.map(p => (
                    <li
                      key={p.place}
                      className="flex items-center justify-between border-b border-line pb-2 last:border-0"
                    >
                      <span className="text-ink-muted">#{p.place} place</span>
                      <span className="font-mono font-semibold text-white">
                        {formatMoney(p.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {/* ── Tournament Progress on Overview ── */}
          {t.stages.length > 0 && (
            <Card>
              <CardBody className="pt-5">
                <TournamentProgress tournament={t} />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ───────────── Teams ───────────── */}
      {tab === 'teams' &&
        (teams && teams.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-faint">
                {teams.length} registered teams
              </p>
              <ExportCsvButton<RegisteredTeam>
                rows={teams}
                columns={[
                  {
                    header: 'Slot',
                    key: 'slot',
                    value: tt => String(tt.slot).padStart(2, '0'),
                  },
                  { header: 'Team Name', key: 'name', value: tt => tt.team.name },
                  { header: 'Tag', key: 'tag', value: tt => tt.team.tag },
                  {
                    header: 'Captain ID',
                    key: 'captainId',
                    value: tt => tt.team.captainId,
                  },
                  {
                    header: 'Country',
                    key: 'country',
                    value: tt => tt.team.country ?? '',
                  },
                  { header: 'City', key: 'city', value: tt => tt.team.city ?? '' },
                  { header: 'Status', key: 'status', value: tt => tt.status },
                  {
                    header: 'Registered',
                    key: 'registeredAt',
                    value: tt => tt.registeredAt.slice(0, 10),
                  },
                ]}
                filename={buildFilename('teams', t.name)}
                label="Export teams"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map(tt => (
                <Link
                  key={tt.id}
                  to={'/teams/' + tt.team.id}
                  className="surface flex items-center gap-3 p-4 transition hover:border-brand-600/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 font-mono text-xs font-bold text-brand-400">
                    {String(tt.slot).padStart(2, '0')}
                  </span>
                  {tt.team.logo && (
                    <img
                      src={tt.team.logo}
                      alt=""
                      className="h-10 w-10 rounded-xl border border-line"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold uppercase text-white">
                      {tt.team.name}
                    </p>
                    <p className="text-xs text-ink-faint">{tt.team.tag}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No registered teams"
            description="Be the first to register your squad."
          />
        ))}

      {/* ───────────── Schedule ───────────── */}
      {tab === 'schedule' && (
        <div className="space-y-6">
          {/* ── Visual progress timeline ── */}
          <Card>
            <CardBody className="pt-5">
              <TournamentProgress tournament={t} />
            </CardBody>
          </Card>

          {/* ── Detailed stage cards ── */}
          <div className="space-y-4">
            {t.stages.map(s => (
              <Card key={s.id}>
                <CardHeader>
                  <div>
                    <CardTitle>{s.name}</CardTitle>
                    <p className="mt-1 text-xs text-ink-faint">
                      {formatDate(s.date)} - {s.startTime} - {s.endTime ?? '-'} -{' '}
                      {s.matchCount} matches
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      s.status === 'FINISHED'
                        ? 'FINISHED'
                        : s.status === 'LIVE'
                          ? 'LIVE'
                          : 'UPCOMING'
                    }
                  />
                </CardHeader>
                <CardBody>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Info label="Teams" value={String(s.teamCount)} />
                    <Info label="Matches" value={String(s.matchCount)} />
                    <Info
                      label="Advance"
                      value={
                        s.qualificationCount && s.qualificationCount > 0
                          ? 'Top ' + s.qualificationCount
                          : '—'
                      }
                    />
                  </div>

                  <p className="mb-2 mt-4 text-xs uppercase tracking-wider text-ink-faint">
                    Maps
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.maps.map((m, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-line bg-bg-deep px-2.5 py-1 text-xs text-ink-muted"
                      >
                        {MAP_LABEL[m]}
                      </span>
                    ))}
                  </div>

                  {s.qualificationRules && (
                    <p className="mt-4 text-xs text-ink-muted">
                      {s.qualificationRules}
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ───────────── Matches ───────────── */}
      {tab === 'matches' && (
        <div className="space-y-3">
          {(matches ?? []).length === 0 ? (
            <EmptyState icon={Trophy} title="No matches scheduled" />
          ) : (
            (matches ?? []).map(m => (
              <Card key={m.id}>
                <CardBody className="pt-5">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 font-mono text-sm font-bold text-brand-400">
                      {String(m.matchNumber).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-white">
                        Match {m.matchNumber} - {MAP_LABEL[m.map]}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {formatDate(m.startTime)}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        m.status === 'LIVE'
                          ? 'LIVE'
                          : m.status === 'FINISHED'
                            ? 'FINISHED'
                            : 'UPCOMING'
                      }
                    />
                  </div>
                  <MatchCredentials matchId={m.id} status={m.status} />
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ───────────── Leaderboard ───────────── */}
      {tab === 'leaderboard' && (
        <LeaderboardTable
          rows={lb ?? []}
          loading={!lb}
          live={t.status === 'LIVE'}
          autoRefresh={true}
          tournamentName={t.name}
        />
      )}

      {/* ───────────── Rules ───────────── */}
      {tab === 'rules' && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Rules</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {t.rules}
            </p>
          </CardBody>
        </Card>
      )}

      {/* ───────────── Stream ───────────── */}
      {tab === 'stream' &&
        (primaryStream ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-danger animate-pulse-live" />
              <span className="text-xs font-bold uppercase tracking-wider text-danger">
                Live now
              </span>
              <span className="text-xs text-ink-faint">- {primaryStream.label}</span>
            </div>
            <YouTubeEmbed url={primaryStream.youtubeUrl} title={t.name} />
          </div>
        ) : (
          <EmptyState icon={Trophy} title="No stream scheduled" />
        ))}

      {/* ───────────── Register modal ───────────── */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register Team"
        description={
          t.name + ' - ' + (teams?.length ?? 0) + '/' + t.maxTeams + ' slots'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              loading={busy}
              disabled={!myTeam || !user}
            >
              <Zap size={14} /> Confirm registration
            </Button>
          </>
        }
      >
        {!user && (
          <p className="text-sm text-ink-muted">
            Please login or create an account to register your team.
          </p>
        )}
        {user && !myTeam && (
          <p className="text-sm text-ink-muted">
            You need to be a team captain.{' '}
            <Link to="/team/create" className="text-brand-400 underline">
              Create a team
            </Link>
            .
          </p>
        )}
        {user && myTeam && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep p-3">
            {myTeam.logo && (
              <img
                src={myTeam.logo}
                alt=""
                className="h-12 w-12 rounded-xl border border-line"
              />
            )}
            <div>
              <p className="font-display text-sm font-semibold uppercase text-white">
                {myTeam.name}
              </p>
              <p className="text-xs text-ink-faint">
                {myTeam.tag}
                {myTeam.slogan ? ' - ' + myTeam.slogan : ''}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
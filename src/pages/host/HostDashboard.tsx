import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Gauge, PlayCircle, Radio, Trophy, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { matchApi, tournamentApi } from '@/services/api';
import { MAP_LABEL, formatDate, cn } from '@/lib/utils';
import type { Match, Tournament } from '@/types';

export function HostDashboard() {
  return (
    <RequireAuth permission="dashboard.view">
      <HostDashboardInner />
    </RequireAuth>
  );
}

function HostDashboardInner() {
  const { user } = useAuth();

  const { data: allTournaments, loading: tLoading } = useAsync(
    () => tournamentApi.list(),
    [],
  );

  const assigned = useMemo<Tournament[]>(() => {
    if (!user || !allTournaments) return [];
    return allTournaments.filter(t => t.hostIds.includes(user.id));
  }, [allTournaments, user]);

  const activeTournament = assigned.find(t => t.status === 'LIVE')
    ?? assigned.find(t => t.status === 'PAUSED')
    ?? assigned[0];

  const { data: matches, loading: mLoading } = useAsync(
    () => activeTournament ? matchApi.byTournament(activeTournament.id) : Promise.resolve([] as Match[]),
    [activeTournament?.id],
  );

  const liveMatches = (matches ?? []).filter(m => m.status === 'LIVE');
  const upcoming = (matches ?? []).filter(m => m.status === 'UPCOMING');
  const pendingPublish = (matches ?? []).filter(m => m.resultsStatus === 'SUBMITTED');
  const finished = (matches ?? []).filter(m => m.status === 'FINISHED');

  if (tLoading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  return (
    <div>
      <PageHeader title="Host Dashboard" subtitle="Manage your assigned matches" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Trophy} label="Assigned tournaments" value={assigned.length} />
        <StatCard icon={Gauge} label="Total matches" value={matches?.length ?? 0} />
        <StatCard icon={Radio} label="Live now" value={liveMatches.length} tone="danger" />
        <StatCard
          icon={PlayCircle}
          label="Pending publish"
          value={pendingPublish.length}
          tone="warning"
        />
      </div>

      {assigned.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Trophy}
            title="No tournaments assigned"
            description="An organizer must assign you as a host before you can manage matches."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Tournaments</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {assigned.map(t => (
                <Link
                  key={t.id}
                  to={'/tournaments/' + t.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40"
                >
                  {t.logo
                    ? <img src={t.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-line" />
                    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                        <Trophy size={16} />
                      </span>
                    }
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold uppercase text-white">
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {formatDate(t.startDate)} В· {t.maps.length} maps В· max {t.maxTeams} teams
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                  <ChevronRight size={14} className="shrink-0 text-ink-faint" />
                </Link>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {liveMatches.map(m => (
                <MatchLink key={m.id} match={m} tournament={activeTournament!} tone="live" />
              ))}
              {pendingPublish.map(m => (
                <MatchLink key={m.id} match={m} tournament={activeTournament!} tone="warning" />
              ))}
              {liveMatches.length === 0 && pendingPublish.length === 0 && (
                <p className="text-xs text-ink-faint">No matches require immediate action.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTournament && matches && matches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div>
              <CardTitle>Matches В· {activeTournament.name}</CardTitle>
              <p className="mt-1 text-xs text-ink-faint">
                {matches.length} total В· {liveMatches.length} live В· {upcoming.length} upcoming В· {finished.length} finished
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {matches.map(m => (
                <Link
                  key={m.id}
                  to={'/host/matches/' + m.id}
                  className={cn(
                    'group flex flex-wrap items-center gap-3 rounded-xl border p-3 transition',
                    m.status === 'LIVE'
                      ? 'border-danger/40 bg-danger/[.06] hover:border-danger/60'
                      : m.resultsStatus === 'SUBMITTED'
                        ? 'border-warning/40 bg-warning/[.06] hover:border-warning/60'
                        : 'border-line bg-bg-deep/40 hover:border-brand-600/40',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/20 font-mono text-sm font-bold text-brand-400">
                    {String(m.matchNumber).padStart(2, '0')}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-white">
                      Match {m.matchNumber} В· {MAP_LABEL[m.map]}
                    </p>
                    <p className="truncate text-[11px] text-ink-faint">
                      <Calendar size={10} className="mr-1 inline" />
                      {formatDate(m.startTime)}
                      {m.hostId === user?.id && ' В· assigned to you'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.resultsStatus === 'PUBLISHED' && (
                      <span className="rounded-full border border-success/30 bg-success/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                        Published
                      </span>
                    )}
                    {m.resultsStatus === 'SUBMITTED' && (
                      <span className="rounded-full border border-warning/30 bg-warning/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                        Ready to publish
                      </span>
                    )}
                    <StatusBadge
                      status={
                        m.status === 'LIVE' ? 'LIVE'
                        : m.status === 'FINISHED' ? 'FINISHED'
                        : m.status === 'CANCELLED' ? 'CANCELLED'
                        : 'UPCOMING'
                      }
                    />
                    <ChevronRight size={14} className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {mLoading && !matches && (
        <div className="mt-6 p-12 text-center text-ink-faint">Loading matches...</div>
      )}
    </div>
  );
}

function MatchLink({ match, tournament, tone }: {
  match: Match;
  tournament: Tournament;
  tone: 'live' | 'warning';
}) {
  return (
    <Link
      to={'/host/matches/' + match.id}
      className={cn(
        'flex items-center gap-2 rounded-xl border p-2.5 transition',
        tone === 'live'
          ? 'border-danger/40 bg-danger/[.06] hover:border-danger/60'
          : 'border-warning/40 bg-warning/[.06] hover:border-warning/60',
      )}
    >
      <span className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        tone === 'live' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning',
      )}>
        {tone === 'live' ? <Radio size={13} className="animate-pulse-live" /> : <PlayCircle size={13} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-white">
          Match {match.matchNumber} В· {MAP_LABEL[match.map]}
        </p>
        <p className="truncate text-[10px] text-ink-faint">
          {tone === 'live' ? 'Currently live' : 'Ready to publish'}
        </p>
      </div>
      <ChevronRight size={13} className="shrink-0 text-ink-faint" />
    </Link>
  );
}

export function HostTournaments() {
  return <HostDashboard />;
}

/* Keep imports consistent with existing routes */
void Users;
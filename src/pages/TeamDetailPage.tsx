import { useParams, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Award, ChevronRight, Globe, Instagram, Mail, MapPin,
  MessageCircle, Music, Phone, Swords, Trophy, Users, Youtube,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs } from '@/components/ui/tabs';
import { useAsync } from '@/hooks/useAsync';
import { teamApi, matchApi } from '@/services/api';
import { MAP_LABEL, formatDate, cn } from '@/lib/utils';

const TABS = [
  { id: 'roster', label: 'Roster' },
  { id: 'matches', label: 'Matches' },
  { id: 'info', label: 'Info' },
];

const SOCIAL_ICONS = {
  telegram: MessageCircle,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
  discord: MessageCircle,
  website: Globe,
} as const;

const SOCIAL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  discord: 'Discord',
  website: 'Website',
};

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState('roster');

  const { data: team, loading } = useAsync(
    () => id ? teamApi.get(id) : Promise.resolve(undefined),
    [id],
  );
  const { data: members } = useAsync(
    () => id ? teamApi.members(id) : Promise.resolve([]),
    [id],
  );
  const { data: matchHistory, loading: matchLoading } = useAsync(
    () => id ? matchApi.resultsForTeam(id) : Promise.resolve([]),
    [id],
  );

  if (loading) {
    return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  }
  if (!team) return <Navigate to="/404" replace />;

  const captain = members?.find(m => m.role === 'CAPTAIN');
  const socials = Object.entries(team.socials ?? {}).filter(([, v]) => v);

  /* ─── Match stats ─── */
  const stats = matchHistory && matchHistory.length > 0 ? {
    played: matchHistory.length,
    wins: matchHistory.filter(m => m.result.placement === 1).length,
    top3: matchHistory.filter(m => m.result.placement <= 3).length,
    totalKills: matchHistory.reduce((s, m) => s + m.result.kills, 0),
    totalPoints: matchHistory.reduce((s, m) => s + m.result.totalPoints, 0),
    bestPlacement: Math.min(...matchHistory.map(m => m.result.placement)),
  } : null;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-deep">
        {team.banner && (
          <img
            src={team.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent" />
        <div className="relative flex flex-wrap items-end gap-5 p-6 sm:p-10">
          {team.logo && (
            <img
              src={team.logo}
              alt=""
              className="h-20 w-20 rounded-3xl border-4 border-bg-panel bg-bg-deep sm:h-24 sm:w-24"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono uppercase tracking-wider text-brand-400">
              {team.tag}
            </p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              {team.name}
            </h1>
            {team.slogan && (
              <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>
            )}
            {captain && (
              <p className="mt-2 text-xs text-ink-faint">
                Captain:{' '}
                <span className="font-semibold text-white">
                  @{captain.user.username}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats — only if matches exist */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <StatMini label="Matches" value={stats.played} icon={Swords} tone="brand" />
          <StatMini label="Wins" value={stats.wins} icon={Trophy} tone="warning" />
          <StatMini label="Top 3" value={stats.top3} icon={Award} tone="success" />
          <StatMini label="Total kills" value={stats.totalKills} icon={Swords} tone="danger" />
        </div>
      )}

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {/* ─── Roster ─── */}
      {tab === 'roster' && (
        <Card>
          <CardHeader>
            <CardTitle>Roster - {members?.length ?? 0}</CardTitle>
            <Users size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody>
            {!members?.length ? (
              <EmptyState icon={Users} title="No approved members" />
            ) : (
              <ul className="space-y-2">
                {members.map(m => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3"
                  >
                    <Avatar src={m.user.avatar} name={m.user.fullName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.user.fullName}
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        @{m.user.username}
                        {m.user.pubgNickname && (
                          <span className="hidden sm:inline"> · {m.user.pubgNickname}</span>
                        )}
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* ─── Matches ─── */}
      {tab === 'matches' && (
        <div className="space-y-3">
          {matchLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[.04]" />
              ))}
            </div>
          ) : !matchHistory?.length ? (
            <EmptyState
              icon={Swords}
              title="No matches yet"
              description="Match results will appear here once this team participates in tournaments."
            />
          ) : (
            matchHistory.map(item => (
              <Card key={item.result.id}>
                <CardBody className="pt-5">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold',
                        item.result.placement === 1
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
                          : item.result.placement <= 3
                            ? 'bg-brand-600/25 text-brand-400'
                            : 'bg-white/[.06] text-ink-muted',
                      )}
                    >
                      #{item.result.placement}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-white">
                        {item.tournament?.name ?? 'Unknown tournament'}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {item.stage?.name ?? 'Stage'}
                        {item.match && (
                          <>
                            {' · Match '}
                            {item.match.matchNumber}
                            {' · '}
                            {MAP_LABEL[item.match.map]}
                          </>
                        )}
                      </p>
                      {item.match && (
                        <p className="text-[10px] text-ink-faint/70">
                          {formatDate(item.match.startTime)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold tabular-nums text-white">
                        {item.result.totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                        points
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 rounded-xl border border-line bg-bg-deep/40 p-2">
                    <MiniStat label="Place" value={'#' + item.result.placement} />
                    <MiniStat label="Kills" value={item.result.kills} />
                    <MiniStat label="PP" value={item.result.placementPoints} />
                    <MiniStat label="KP" value={item.result.killPoints} />
                  </div>

                  {item.tournament && (
                    <Link
                      to={'/tournaments/' + item.tournament.id}
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-400 hover:text-brand-500"
                    >
                      View tournament <ChevronRight size={11} />
                    </Link>
                  )}
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── Info ─── */}
      {tab === 'info' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team info</CardTitle>
              <Users size={14} className="text-brand-400" />
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <InfoRow icon={MapPin} label="Country" value={team.country ?? '—'} />
              <InfoRow icon={MapPin} label="City" value={team.city ?? '—'} />
              <InfoRow
                icon={Users}
                label="Captain"
                value={captain ? '@' + captain.user.username : '—'}
              />
              <InfoRow
                icon={Users}
                label="Members"
                value={String(members?.length ?? 0)}
              />
              <InfoRow
                icon={Trophy}
                label="Created"
                value={formatDate(team.createdAt)}
              />
            </CardBody>
          </Card>

          {team.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                  {team.description}
                </p>
              </CardBody>
            </Card>
          )}

          {socials.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Social links</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {socials.map(([key, url]) => {
                    const Icon = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] ?? Globe;
                    return (
                      <a
                        key={key}
                        href={url.startsWith('http') ? url : 'https://' + url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-line bg-bg-deep/40 px-3 py-2 text-xs text-ink-muted transition hover:border-brand-600/40 hover:text-white"
                      >
                        <Icon size={13} />
                        <span>{SOCIAL_LABELS[key] ?? key}</span>
                      </a>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function StatMini({ icon: Icon, label, value, tone }: {
  icon: typeof Trophy;
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const t = {
    brand: 'text-brand-400 bg-brand-600/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  }[tone];

  return (
    <div className="surface p-3">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t)}>
        <Icon size={14} />
      </span>
      <p className="mt-2 font-display text-xl font-bold tabular-nums text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <Icon size={14} className="shrink-0 text-ink-faint" />
      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="truncate text-sm text-white">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

/* Keep unused imports for future use */
void Phone;
void Award;
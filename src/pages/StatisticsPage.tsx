import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Crosshair, Crown, Medal, Swords, Target, TrendingUp,
  Trophy, Users, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi, tournamentApi, userApi } from '@/services/api';
import { load } from '@/lib/db';
import {
  computeGlobalStats,
  computeTeamStandings,
  computePlayerStandings,
  computeTournamentStandings,
} from '@/lib/stats';
import { formatMoney, cn } from '@/lib/utils';

const TABS = [
  { id: 'teams', label: 'Top Teams' },
  { id: 'players', label: 'Top Players' },
  { id: 'tournaments', label: 'Tournaments' },
];

export function StatisticsPage() {
  const { data: users } = useAsync(() => userApi.list(), []);
  const { data: teams } = useAsync(() => teamApi.list(), []);
  const { data: tournaments } = useAsync(() => tournamentApi.list(), []);
  const [tab, setTab] = useState('teams');

  const db = load();
  const results = db?.results ?? [];

  const stats = useMemo(
    () =>
      computeGlobalStats(
        users ?? [],
        teams ?? [],
        tournaments ?? [],
        results,
      ),
    [users, teams, tournaments, results],
  );

  const teamStandings = useMemo(
    () => computeTeamStandings(teams ?? [], tournaments ?? [], results),
    [teams, tournaments, results],
  );

  const playerStandings = useMemo(
    () => computePlayerStandings(users ?? [], teams ?? [], results),
    [users, teams, results],
  );

  const tournamentStandings = useMemo(
    () => computeTournamentStandings(tournaments ?? [], results),
    [tournaments, results],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Global Statistics"
        subtitle="Platform-wide leaderboards and insights"
      />

      {/* Global stats cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <GlobalCard icon={Users} label="Players" value={stats.totalUsers} tone="brand" />
        <GlobalCard icon={Swords} label="Teams" value={stats.totalTeams} tone="success" />
        <GlobalCard icon={Trophy} label="Tournaments" value={stats.totalTournaments} tone="warning" />
        <GlobalCard icon={Target} label="Matches played" value={stats.totalMatches} tone="danger" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <GlobalCard
          icon={Crosshair}
          label="Total kills"
          value={stats.totalKills}
          tone="danger"
        />
        <GlobalCard
          icon={Zap}
          label="Live now"
          value={stats.liveTournaments}
          tone="danger"
          pulse
        />
        <GlobalCard
          icon={Medal}
          label="Finished"
          value={stats.finishedTournaments}
          tone="muted"
        />
        <GlobalCard
          icon={TrendingUp}
          label="Prize pool"
          value={stats.totalPrizePool}
          tone="warning"
          isMoney
        />
      </div>

      {/* Tabs */}
      <Tabs items={TABS} value={tab} onChange={setTab} />

      {/* Top Teams */}
      {tab === 'teams' && (
        <Card>
          <CardHeader>
            <CardTitle>Team leaderboard</CardTitle>
            <Trophy size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody className="pt-0">
            {teamStandings.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No team data yet"
                description="Stats appear after matches are published."
              />
            ) : (
              <ul className="space-y-1.5">
                {teamStandings.slice(0, 30).map((t, i) => (
                  <TeamRow key={t.teamId} team={t} rank={i + 1} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* Top Players */}
      {tab === 'players' && (
        <Card>
          <CardHeader>
            <CardTitle>Kill leaders</CardTitle>
            <Crosshair size={14} className="text-danger" />
          </CardHeader>
          <CardBody className="pt-0">
            {playerStandings.length === 0 ? (
              <EmptyState
                icon={Crosshair}
                title="No player data yet"
                description="Player statistics require published match results."
              />
            ) : (
              <ul className="space-y-1.5">
                {playerStandings.slice(0, 30).map((p, i) => (
                  <PlayerRow key={p.userId} player={p} rank={i + 1} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tournaments */}
      {tab === 'tournaments' && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament history</CardTitle>
            <BarChart3 size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody className="pt-0">
            {tournamentStandings.length === 0 ? (
              <EmptyState icon={Trophy} title="No tournaments yet" />
            ) : (
              <ul className="space-y-1.5">
                {tournamentStandings.map(t => (
                  <TournamentRow key={t.tournamentId} t={t} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ── Helpers ── */

function GlobalCard({
  icon: Icon,
  label,
  value,
  tone,
  isMoney,
  pulse,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'warning' | 'danger' | 'muted';
  isMoney?: boolean;
  pulse?: boolean;
}) {
  const tones = {
    brand: 'text-brand-400 bg-brand-600/12',
    success: 'text-success bg-success/12',
    warning: 'text-warning bg-warning/12',
    danger: 'text-danger bg-danger/12',
    muted: 'text-ink-muted bg-white/[.05]',
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface p-3"
    >
      <div className="flex items-center gap-2">
        <span className={cn('relative flex h-8 w-8 items-center justify-center rounded-lg', tones)}>
          <Icon size={14} />
          {pulse && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-danger" />
          )}
        </span>
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </p>
      </div>
      <p className={cn('mt-2 font-display font-bold tabular-nums text-white', isMoney ? 'text-base' : 'text-2xl')}>
        {isMoney ? formatMoney(value) : value.toLocaleString()}
      </p>
    </motion.div>
  );
}

function TeamRow({ team, rank }: {
  team: {
    teamId: string;
    teamName: string;
    teamTag: string;
    teamLogo?: string;
    matches: number;
    wins: number;
    top3: number;
    totalKills: number;
    totalPoints: number;
    bestPlacement: number;
    winRate: number;
  };
  rank: number;
}) {
  const rankTone =
    rank === 1
      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
      : rank === 2
        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black'
        : rank === 3
          ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black'
          : 'bg-white/[.06] text-ink-muted';

  return (
    <li>
      <Link
        to={'/teams/' + team.teamId}
        className="group flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-2.5 transition hover:border-brand-600/40"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold tabular-nums',
            rankTone,
          )}
        >
          {String(rank).padStart(2, '0')}
        </span>

        {team.teamLogo ? (
          <img
            src={team.teamLogo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-line"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
            <Swords size={14} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold uppercase text-white">
            {team.teamName}
          </p>
          <p className="truncate text-[10px] text-ink-faint">
            {team.matches} matches · {team.wins} wins · {team.totalKills} kills
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">Top3</p>
          <p className="font-mono text-sm font-bold text-ink-muted">{team.top3}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-base font-bold tabular-nums text-white">
            {team.totalPoints}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-ink-faint">points</p>
        </div>
      </Link>
    </li>
  );
}

function PlayerRow({ player, rank }: {
  player: {
    userId: string;
    userName: string;
    userAvatar?: string;
    teamName?: string;
    matches: number;
    kills: number;
    avgKills: number;
  };
  rank: number;
}) {
  const rankTone =
    rank === 1
      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
      : rank === 2
        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black'
        : rank === 3
          ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-black'
          : 'bg-white/[.06] text-ink-muted';

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-2.5">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold tabular-nums',
          rankTone,
        )}
      >
        {String(rank).padStart(2, '0')}
      </span>

      <Avatar src={player.userAvatar} name={player.userName} size={36} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{player.userName}</p>
        <p className="truncate text-[10px] text-ink-faint">
          {player.teamName && <>{player.teamName} · </>}
          {player.matches} matches
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-base font-bold tabular-nums text-danger">
          {player.kills}
        </p>
        <p className="text-[9px] uppercase tracking-wider text-ink-faint">
          avg {player.avgKills.toFixed(1)}
        </p>
      </div>
    </li>
  );
}

function TournamentRow({ t }: {
  t: {
    tournamentId: string;
    name: string;
    shortName: string;
    logo?: string;
    status: string;
    teams: number;
    matches: number;
    prizePool: number;
    startDate: string;
  };
}) {
  return (
    <li>
      <Link
        to={'/tournaments/' + t.tournamentId}
        className="group flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-2.5 transition hover:border-brand-600/40"
      >
        {t.logo ? (
          <img src={t.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-line" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
            <Trophy size={16} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold uppercase text-white">
            {t.name}
          </p>
          <p className="truncate text-[10px] text-ink-faint">
            {t.shortName} · {t.matches} matches · {t.teams} teams
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
            t.status === 'LIVE'
              ? 'border-danger/40 bg-danger/12 text-danger'
              : t.status === 'FINISHED'
                ? 'border-line bg-white/[.05] text-ink-faint'
                : 'border-brand-600/30 bg-brand-600/10 text-brand-400',
          )}
        >
          {t.status.replace(/_/g, ' ')}
        </span>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-bold text-ink-muted">{formatMoney(t.prizePool)}</p>
        </div>
      </Link>
    </li>
  );
}

void Crown;
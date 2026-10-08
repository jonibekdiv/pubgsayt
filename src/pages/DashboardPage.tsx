import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Award, Bell, Calendar, ChevronRight, Flame, Radio,
  Sparkles, Swords, TrendingUp, Trophy, UserPlus, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi, teamApi, tournamentApi, walletApi } from '@/services/api';
import { cn, relativeTime, formatDate, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import { MAP_LABEL } from '@/lib/utils';

export function DashboardPage() {
  return <RequireAuth><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: allT } = useAsync(() => tournamentApi.list(), []);
  const { data: notes } = useAsync(() => user ? notificationApi.forUser(user.id) : Promise.resolve([]), [user?.id]);
  const { data: wallet } = useAsync(() => user ? walletApi.get(user.id) : Promise.resolve(undefined), [user?.id]);

  const tournaments = allT ?? [];
  const liveT = tournaments.filter(t => t.status === 'LIVE');
  const upcoming = tournaments.filter(t => ['UPCOMING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'].includes(t.status)).slice(0, 4);
  const finished = tournaments.filter(t => t.status === 'FINISHED');
  const unread = notes?.filter(n => !n.read).length ?? 0;
  const firstName = user?.fullName.split(' ')[0] ?? 'Player';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* HERO — premium welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-brand-600/25 bg-gradient-to-br from-brand-700/40 via-bg-panel to-bg-deep p-5 sm:p-7"
      >
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand-700/30 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar
              src={user?.avatar}
              name={user?.fullName ?? 'Player'}
              size={56}
              ring
              className="shrink-0 border-2 border-white/10 sm:!h-16 sm:!w-16"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-300">
                Welcome back
              </p>
              <h1 className="truncate font-display text-xl font-bold text-white sm:text-2xl">
                {firstName}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted sm:text-xs">
                <Sparkles size={11} className="text-brand-400" />
                Your esports command center
              </p>
            </div>
          </div>

          {wallet && (
            <Link
              to="/wallet"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 backdrop-blur-sm transition hover:border-brand-600/40 sm:justify-start"
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">
                  Wallet balance
                </p>
                <p className="font-display text-lg font-bold tabular-nums text-white">
                  {formatMoney(wallet.balance)}
                </p>
              </div>
              <ChevronRight size={16} className="text-ink-faint" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* STATS — 2x2 grid on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Tournaments"
          value={tournaments.length}
          tone="brand"
          href="/tournaments"
        />
        <StatCard
          icon={Swords}
          label={team ? 'My Team' : 'No team'}
          value={team ? 1 : 0}
          tone="success"
          href={team ? '/my-team' : '/team/create'}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming"
          value={upcoming.length}
          tone="warning"
          href="/tournaments"
        />
        <StatCard
          icon={Bell}
          label="Notifications"
          value={unread}
          tone="danger"
          href="/dashboard"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <QuickAction icon={Trophy} label="Browse" href="/tournaments" tone="brand" />
        <QuickAction icon={Radio} label="Watch Live" href="/live" tone="danger" />
        {team ? (
          <QuickAction icon={Swords} label="My Team" href="/my-team" tone="success" />
        ) : (
          <QuickAction icon={UserPlus} label="Create Team" href="/team/create" tone="warning" />
        )}
      </div>

      {/* LIVE NOW */}
      {liveT.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-danger" />
              </span>
              <CardTitle className="text-danger">Live now</CardTitle>
            </div>
            <Link to="/live" className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-500">
              View all <ArrowRight size={11} />
            </Link>
          </CardHeader>
          <CardBody className="space-y-2 pt-0">
            {liveT.map(t => <TournamentRow key={t.id} t={t} accent="danger" />)}
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* UPCOMING */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming tournaments</CardTitle>
            <Link to="/tournaments" className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-500">
              View all <ArrowRight size={11} />
            </Link>
          </CardHeader>
          <CardBody className="pt-0">
            {upcoming.length === 0 ? (
              <EmptyState icon={Calendar} title="Nothing scheduled" description="Check back soon." />
            ) : (
              <div className="space-y-2">
                {upcoming.map(t => <TournamentRow key={t.id} t={t} />)}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ACTIVITY */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Bell size={14} className="text-ink-faint" />
          </CardHeader>
          <CardBody className="pt-0">
            {!notes?.length ? (
              <p className="py-6 text-center text-xs text-ink-faint">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.slice(0, 5).map(n => (
                  <li key={n.id} className="flex gap-2.5">
                    <span className={cn(
                      'mt-1.5 flex h-2 w-2 shrink-0 rounded-full',
                      n.type === 'SUCCESS' ? 'bg-success'
                        : n.type === 'WARNING' ? 'bg-warning'
                        : n.type === 'ERROR' ? 'bg-danger'
                        : 'bg-brand-500',
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white">{n.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-ink-faint">
                        {n.body ?? ''}
                      </p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-faint/70">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* QUICK STATS */}
      {finished.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent results</CardTitle>
            <Award size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-2">
              {finished.slice(0, 3).map(t => <TournamentRow key={t.id} t={t} />)}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   StatCard — compact, clickable, tone-aware
   ============================================================ */
function StatCard({ icon: Icon, label, value, tone, href }: {
  icon: typeof Trophy;
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'warning' | 'danger';
  href: string;
}) {
  const tones = {
    brand: { icon: 'text-brand-400 bg-brand-600/12', value: 'text-white' },
    success: { icon: 'text-success bg-success/12', value: 'text-white' },
    warning: { icon: 'text-warning bg-warning/12', value: 'text-white' },
    danger: { icon: 'text-danger bg-danger/12', value: 'text-white' },
  }[tone];

  return (
    <Link
      to={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-panel/70 p-3 transition hover:border-brand-600/40 active:scale-[.98] sm:p-4"
    >
      <div className="flex items-center gap-2">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tones.icon)}>
          <Icon size={15} />
        </span>
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </p>
      </div>
      <p className={cn('mt-2 font-display text-2xl font-bold tabular-nums sm:text-3xl', tones.value)}>
        {value}
      </p>
      <ChevronRight
        size={14}
        className="absolute right-3 top-3 text-ink-faint/40 transition group-hover:translate-x-0.5 group-hover:text-brand-400"
      />
    </Link>
  );
}

/* ============================================================
   QuickAction — 3-tile action row
   ============================================================ */
function QuickAction({ icon: Icon, label, href, tone }: {
  icon: typeof Trophy;
  label: string;
  href: string;
  tone: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    brand: 'border-brand-600/30 bg-brand-600/[.08] hover:border-brand-600/60 text-brand-300',
    success: 'border-success/30 bg-success/[.06] hover:border-success/60 text-success',
    warning: 'border-warning/30 bg-warning/[.06] hover:border-warning/60 text-warning',
    danger: 'border-danger/30 bg-danger/[.06] hover:border-danger/60 text-danger',
  }[tone];

  return (
    <Link
      to={href}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition active:scale-[.97] sm:py-4',
        tones,
      )}
    >
      <Icon size={18} />
      <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
        {label}
      </span>
    </Link>
  );
}

/* ============================================================
   TournamentRow — reusable list item
   ============================================================ */
function TournamentRow({ t, accent }: {
  t: { id: string; name: string; shortName: string; logo?: string; status: string; maps: string[]; prizePool: number; maxTeams: number; startDate: string };
  accent?: 'danger';
}) {
  return (
    <Link
      to={'/tournaments/' + t.id}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 transition active:scale-[.99]',
        accent === 'danger'
          ? 'border-danger/40 bg-danger/[.06] hover:border-danger/60'
          : 'border-line bg-bg-deep/40 hover:border-brand-600/40',
      )}
    >
      {t.logo ? (
        <img
          src={t.logo}
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl border border-line bg-bg-deep object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
          <Trophy size={18} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-white">
          {t.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-ink-faint">
          <span>{t.shortName}</span>
          <span className="text-ink-faint/50">·</span>
          <span>{t.maps.length} maps</span>
          <span className="text-ink-faint/50">·</span>
          <span>{t.maxTeams} teams</span>
          <span className="text-ink-faint/50">·</span>
          <span>{formatMoney(t.prizePool)}</span>
        </p>
      </div>

      <StatusBadge status={t.status as never} />
      <ChevronRight
        size={14}
        className="hidden shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-400 sm:block"
      />
    </Link>
  );
}
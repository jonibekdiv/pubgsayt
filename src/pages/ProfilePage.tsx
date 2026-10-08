import { Link } from 'react-router-dom';
import {
  Award, Calendar, Edit3, Globe, Instagram, Mail, MapPin, MessageCircle,
  Music, Phone, Sparkles, Trophy, Youtube,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AchievementsGrid } from '@/components/profile/achievements-grid';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi, tournamentApi, walletApi } from '@/services/api';
import { load } from '@/lib/db';
import { formatDate, cn } from '@/lib/utils';
import { computeAchievements, computePlayerStats } from '@/lib/achievements';

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

export function ProfilePage() {
  const { user } = useAuth();
  const { data: team } = useAsync(
    () => user ? teamApi.byUser(user.id) : Promise.resolve(undefined),
    [user?.id],
  );
  const { data: tournaments } = useAsync(() => tournamentApi.list(), []);
  const { data: wallet } = useAsync(
    () => user ? walletApi.get(user.id) : Promise.resolve(undefined),
    [user?.id],
  );

  if (!user) return null;

  // Load results directly from DB (no api wrapper needed for this view)
  const db = load();
  const allResults = db?.results ?? [];

  const stats = computePlayerStats(user.id, team, allResults, tournaments ?? []);

  const achievements = computeAchievements({
    user,
    team,
    tournaments: tournaments ?? [],
    matches: stats.matches,
    wins: stats.wins,
    totalKills: stats.totalKills,
    totalPoints: stats.totalPoints,
    bestPlacement: stats.bestPlacement,
    wallet,
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const socials = Object.entries(user.socials ?? {}).filter(([, v]) => v);

  return (
    <div className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Profile"
        subtitle="Your player identity and achievements"
        action={
          <Link to="/profile/edit">
            <Button size="sm">
              <Edit3 size={14} />
              <span className="hidden sm:inline">Edit profile</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </Link>
        }
      />

      {/* ── Hero card ── */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="h-20 bg-gradient-to-br from-brand-600/30 via-brand-700/20 to-transparent sm:h-24" />
          <div className="absolute inset-x-0 top-0 flex justify-center pt-10 sm:pt-12">
            <Avatar
              src={user.avatar}
              name={user.fullName}
              size={80}
              ring
              className="border-4 border-bg-panel shadow-2xl"
            />
          </div>
        </div>
        <CardBody className="pt-14 text-center sm:pt-16">
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            {user.fullName}
          </h2>
          <p className="text-xs text-ink-faint sm:text-sm">@{user.username}</p>

          {user.bio && (
            <p className="mx-auto mt-3 max-w-md text-xs italic text-ink-muted sm:text-sm">
              "{user.bio}"
            </p>
          )}

          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {user.roles.map(r => (
              <span
                key={r}
                className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400"
              >
                {r}
              </span>
            ))}
          </div>

          {(user.experienceYears ?? 0) > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-300">
                {user.experienceYears} yillik tajriba
              </span>
            </div>
          )}

          {team && (
            <div className="mt-4 rounded-xl border border-line bg-bg-deep/40 p-3">
              <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                Current team
              </p>
              <Link
                to={'/teams/' + team.id}
                className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold text-white hover:text-brand-400"
              >
                {team.logo && (
                  <img src={team.logo} alt="" className="h-6 w-6 rounded" />
                )}
                {team.name}
              </Link>
            </div>
          )}

          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] ?? Globe;
                return (
                  <a
                    key={key}
                    href={url.startsWith('http') ? url : 'https://' + url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line bg-bg-deep/40 px-3 py-1.5 text-[11px] text-ink-muted transition hover:border-brand-600/40 hover:text-white"
                    aria-label={SOCIAL_LABELS[key] ?? key}
                  >
                    <Icon size={12} />
                    <span>{SOCIAL_LABELS[key] ?? key}</span>
                  </a>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <QuickStat label="Matches" value={stats.matches} icon={Trophy} tone="brand" />
        <QuickStat label="Wins" value={stats.wins} icon={Award} tone="warning" />
        <QuickStat label="Kills" value={stats.totalKills} icon={Award} tone="danger" />
        <QuickStat
          label="Achievements"
          value={unlockedCount + '/' + achievements.length}
          icon={Sparkles}
          tone="success"
          isText
        />
      </div>

      {/* ── Achievements ── */}
      <Card>
        <CardBody className="pt-5">
          <AchievementsGrid achievements={achievements} />
        </CardBody>
      </Card>

      {/* ── Account ── */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={Phone} label="Phone" value={user.phone ?? '—'} />
          <Row
            icon={MapPin}
            label="Location"
            value={[user.city, user.country].filter(Boolean).join(', ') || '—'}
          />
          <Row icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
        </CardBody>
      </Card>

      {/* ── PUBG Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle>PUBG Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Info label="Nickname" value={user.pubgNickname ?? '—'} />
            <Info label="PUBG ID" value={user.pubgId ?? '—'} />
            <Info
              label="Experience"
              value={
                (user.experienceYears ?? 0) > 0 ? user.experienceYears + ' yil' : '—'
              }
            />
            <Info label="Favorite map" value={user.favoriteMap ?? '—'} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ── Helpers ── */

function QuickStat({ icon: Icon, label, value, tone, isText }: {
  icon: typeof Trophy;
  label: string;
  value: number | string;
  tone: 'brand' | 'success' | 'warning' | 'danger';
  isText?: boolean;
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
      <p className={cn(
        'mt-2 font-display font-bold tabular-nums text-white',
        isText ? 'text-base' : 'text-xl',
      )}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <Icon size={15} className="shrink-0 text-ink-faint" />
      <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-ink-faint sm:w-32 sm:text-xs">
        {label}
      </span>
      <span className="truncate text-sm text-white">{value}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}
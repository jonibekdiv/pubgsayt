import { Link } from 'react-router-dom';
import {
  Award, Calendar, Edit3, Globe, Instagram, Mail, MapPin, MessageCircle,
  Music, Phone, Sparkles, Trophy, Youtube,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi, tournamentApi } from '@/services/api';
import { formatDate } from '@/lib/utils';

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
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: tournaments } = useAsync(() => tournamentApi.list(), []);

  if (!user) return null;

  const socials = Object.entries(user.socials ?? {}).filter(([, v]) => v);

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your player identity"
        action={
          <Link to="/profile/edit">
            <Button>
              <Edit3 size={14} /> Edit profile
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="pt-6 text-center">
            <Avatar src={user.avatar} name={user.fullName} size={96} className="mx-auto" ring />
            <h2 className="mt-4 font-display text-xl font-bold text-white">{user.fullName}</h2>
            <p className="text-xs text-ink-faint">@{user.username}</p>

            {user.bio && (
              <p className="mt-3 text-xs italic text-ink-muted">"{user.bio}"</p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-1">
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
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-300">
                  {user.experienceYears} yillik tajriba
                </span>
              </div>
            )}

            {team && (
              <div className="mt-4 rounded-xl border border-line bg-bg-deep/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-ink-faint">Current team</p>
                <Link
                  to={'/teams/' + team.id}
                  className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold text-white hover:text-brand-400"
                >
                  {team.logo && <img src={team.logo} alt="" className="h-6 w-6 rounded" />}
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
                      className="flex items-center gap-1.5 rounded-full border border-line bg-bg-deep/40 px-2.5 py-1 text-[10px] text-ink-muted transition hover:border-brand-600/40 hover:text-white"
                      aria-label={SOCIAL_LABELS[key] ?? key}
                    >
                      <Icon size={11} />
                      <span>{SOCIAL_LABELS[key] ?? key}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Row icon={Mail} label="Email" value={user.email} />
              <Row icon={Phone} label="Phone" value={user.phone ?? 'вЂ”'} />
              <Row
                icon={MapPin}
                label="Location"
                value={[user.city, user.country].filter(Boolean).join(', ') || 'вЂ”'}
              />
              <Row icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>PUBG Profile</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Info label="Nickname" value={user.pubgNickname ?? 'вЂ”'} />
                <Info label="PUBG ID" value={user.pubgId ?? 'вЂ”'} />
                <Info label="Experience" value={(user.experienceYears ?? 0) > 0 ? user.experienceYears + ' yil' : 'вЂ”'} />
                <Info label="Favorite map" value={user.favoriteMap ?? 'вЂ”'} />
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tournaments</CardTitle>
                <Trophy size={14} className="text-brand-400" />
              </CardHeader>
              <CardBody>
                <p className="font-display text-3xl font-bold text-white">{tournaments?.length ?? 0}</p>
                <p className="text-xs text-ink-faint">available on platform</p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <Award size={14} className="text-brand-400" />
              </CardHeader>
              <CardBody>
                <p className="font-display text-3xl font-bold text-white">{team ? 1 : 0}</p>
                <p className="text-xs text-ink-faint">{team ? team.name : 'No team yet'}</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
      <Icon size={15} className="text-ink-faint" />
      <span className="w-32 shrink-0 text-xs uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="truncate text-white">{value}</span>
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
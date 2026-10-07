# ============================================================
#  RANGER ESPORTS - setup3b.ps1 (pages + App.tsx)
#  Ishga tushirish: powershell -ExecutionPolicy Bypass -File setup3b.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "==> setup3b: pages + App.tsx..." -ForegroundColor Cyan

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  [+] $RelPath" -ForegroundColor DarkGray
}

# ============================================================
# HOME PAGE
# ============================================================
Write-File 'src/pages/HomePage.tsx' @'
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Radio, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';
import { formatMoney } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

export function HomePage() {
  const { user } = useAuth();
  const { data, loading } = useAsync(() => tournamentApi.list(), []);
  const tournaments = data ?? [];

  const live = tournaments.filter(t => t.status === 'LIVE');
  const upcoming = tournaments.filter(t => ['UPCOMING','REGISTRATION_OPEN','REGISTRATION_CLOSED'].includes(t.status));
  const finished = tournaments.filter(t => t.status === 'FINISHED');
  const totalPrize = tournaments.reduce((s, t) => s + t.prizePool, 0);

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-bg-deep">
        <div className="absolute inset-0 grid-lines opacity-60"/>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-transparent"/>
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/40 bg-brand-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.18em] text-brand-400">
              <Sparkles size={12}/> Season 2026
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              THE NEXT GENERATION<br/>
              <span className="text-gradient">OF ESPORTS TOURNAMENTS</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
              Compete in premium PUBG scrims, climb the leaderboard, and broadcast your squad to the world.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tournaments"><Button size="lg"><Trophy size={16}/> Browse Tournaments</Button></Link>
              <Link to="/team/create"><Button size="lg" variant="secondary"><Users size={16}/> Create Team</Button></Link>
              <Link to="/organizer/apply"><Button size="lg" variant="outline"><Zap size={16}/> Become Organizer</Button></Link>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 self-center lg:grid">
            <StatCard label="Live now" value={String(live.length)} icon={Radio}/>
            <StatCard label="Upcoming" value={String(upcoming.length)} icon={Trophy}/>
            <StatCard label="Teams" value="22" icon={Users}/>
            <StatCard label="Total prize" value={formatMoney(totalPrize)} icon={Flame} small/>
          </div>
        </div>
      </section>

      {live.length > 0 && (
        <Section title="LIVE NOW" action={{ to:'/live', label:'Watch all' }}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {live.map(t => <TournamentCard key={t.id} tournament={t}/>)}
          </div>
        </Section>
      )}

      <Section title="UPCOMING TOURNAMENTS" action={{ to:'/tournaments', label:'View all' }}>
        {loading ? <CardGridSkeleton count={3}/> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.slice(0,6).map(t => <TournamentCard key={t.id} tournament={t}/>)}
            {upcoming.length === 0 && <p className="text-sm text-ink-faint">No upcoming tournaments right now.</p>}
          </div>
        )}
      </Section>

      {finished.length > 0 && (
        <Section title="RECENT RESULTS" action={{ to:'/leaderboard', label:'Leaderboards' }}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {finished.slice(0,3).map(t => <TournamentCard key={t.id} tournament={t}/>)}
          </div>
        </Section>
      )}

      {!user && (
        <section className="relative overflow-hidden rounded-3xl border border-brand-600/25 bg-gradient-to-br from-brand-600/15 via-bg-panel to-bg-panel p-8 text-center sm:p-12">
          <div className="absolute inset-0 grid-lines opacity-40"/>
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to dominate?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">Create your account, build a squad, and register for the next tournament.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register"><Button size="lg">Create free account</Button></Link>
              <Link to="/login"><Button size="lg" variant="secondary">I have an account</Button></Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title:string; action?:{to:string;label:string}; children:ReactNode }) {
  return <section>
    <div className="mb-5 flex items-end justify-between">
      <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white sm:text-xl">{title}</h2>
      {action && <Link to={action.to} className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-500">
        {action.label} <ChevronRight size={12}/>
      </Link>}
    </div>
    {children}
  </section>;
}

function StatCard({ label, value, icon:Icon, small }: { label:string; value:string; icon:typeof Radio; small?:boolean }) {
  return <div className="glass rounded-2xl p-4">
    <Icon size={16} className="text-brand-400"/>
    <p className={"mt-2 font-display font-bold text-white " + (small ? 'text-base' : 'text-2xl')}>{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
  </div>;
}
'@

# ============================================================
# TOURNAMENTS PAGE
# ============================================================
Write-File 'src/pages/TournamentsPage.tsx' @'
import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';
import type { TournamentStatus } from '@/types';

const FILTERS: { id:string; label:string; statuses:TournamentStatus[] }[] = [
  { id:'all', label:'All', statuses:[] },
  { id:'live', label:'Live', statuses:['LIVE','PAUSED'] },
  { id:'open', label:'Registration Open', statuses:['REGISTRATION_OPEN'] },
  { id:'upcoming', label:'Upcoming', statuses:['UPCOMING'] },
  { id:'finished', label:'Finished', statuses:['FINISHED'] }
];

export function TournamentsPage() {
  const { data, loading } = useAsync(() => tournamentApi.list(), []);
  const [filter, setFilter] = useState('all');
  const all = data ?? [];
  const active = FILTERS.find(f => f.id === filter)!;
  const list = active.statuses.length === 0 ? all : all.filter(t => active.statuses.includes(t.status));

  return <div>
    <PageHeader title="Tournaments" subtitle="Browse live, upcoming and finished PUBG tournaments"/>
    <Tabs items={FILTERS.map(f => ({
      id:f.id, label:f.label,
      count:f.id === 'all' ? all.length : all.filter(t => f.statuses.includes(t.status)).length
    }))} value={filter} onChange={setFilter} className="mb-6"/>
    {loading ? <CardGridSkeleton/> : list.length === 0 ? (
      <EmptyState icon={Trophy} title="No tournaments available" description="Check back soon or create your own organizer account."/>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(t => <TournamentCard key={t.id} tournament={t}/>)}
      </div>
    )}
  </div>;
}
'@

# ============================================================
# TOURNAMENT DETAIL
# ============================================================
Write-File 'src/pages/TournamentDetailPage.tsx' @'
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
import { useAsync } from '@/hooks/useAsync';
import { matchApi, streamApi, teamApi, tournamentApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MAP_LABEL, formatDate, formatMoney } from '@/lib/utils';

const TABS = [
  { id:'overview', label:'Overview' },
  { id:'teams', label:'Teams' },
  { id:'schedule', label:'Schedule' },
  { id:'matches', label:'Matches' },
  { id:'leaderboard', label:'Leaderboard' },
  { id:'rules', label:'Rules' },
  { id:'stream', label:'Live Stream' }
];

export function TournamentDetailPage() {
  const { id } = useParams<{ id:string }>();
  const { user, can } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data: t, loading } = useAsync(() => id ? tournamentApi.get(id) : Promise.resolve(undefined), [id]);
  const { data: teams, refetch: refetchTeams } = useAsync(() => id ? tournamentApi.registeredTeams(id) : Promise.resolve([]), [id]);
  const { data: matches } = useAsync(() => id ? matchApi.byTournament(id) : Promise.resolve([]), [id]);
  const { data: streams } = useAsync(() => id ? streamApi.byTournament(id) : Promise.resolve([]), [id]);
  const { data: lb, refetch: refetchLb } = useAsync(() => id ? tournamentApi.leaderboard(id) : Promise.resolve([]), [id]);
  const { data: myTeam } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!t) return <Navigate to="/404" replace/>;

  const primaryStream = streams?.find(s => s.isPrimary) ?? streams?.[0];

  const handleRegister = async () => {
    if (!user) { toast('INFO', 'Please login or create an account.'); return; }
    if (!myTeam) { toast('WARNING', 'You need a team first.'); return; }
    try {
      await tournamentApi.registerTeam(t.id, myTeam.id, user.id);
      toast('SUCCESS', 'Team registered', myTeam.name + ' joined ' + t.name);
      setRegisterOpen(false);
      void refetchLb();
      void refetchTeams();
    } catch (e) {
      toast('ERROR', 'Registration failed', e instanceof Error ? e.message : 'Unknown');
    }
  };

  return <div>
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-bg-deep">
      {t.banner && <img src={t.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent"/>
      <div className="relative p-6 sm:p-8 lg:p-10">
        <StatusBadge status={t.status}/>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{t.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t.description}</p>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Trophy size={14} className="text-brand-400"/> {formatMoney(t.prizePool)}</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-400"/> {formatDate(t.startDate)}</span>
          <span className="flex items-center gap-1.5"><Users size={14} className="text-brand-400"/> {teams?.length ?? 0} / {t.maxTeams}</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-400"/> {t.maps.map(m => MAP_LABEL[m]).join(' - ')}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => setRegisterOpen(true)} disabled={!can('tournaments.register')}>
            <Zap size={15}/> Register Team
          </Button>
          {primaryStream && <Button variant="secondary" onClick={() => setTab('stream')}>Watch Live</Button>}
        </div>
      </div>
    </div>

    <Tabs items={TABS} value={tab} onChange={setTab} className="mb-6"/>

    {tab === 'overview' && (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardBody>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{t.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Reg opens" value={formatDate(t.registrationOpen)}/>
              <Info label="Reg closes" value={formatDate(t.registrationClose)}/>
              <Info label="Team size" value={t.minTeamSize + '+ players'}/>
              <Info label="Timezone" value={t.timezone}/>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Prize Pool</CardTitle></CardHeader>
          <CardBody>
            <p className="font-display text-3xl font-bold text-white">{formatMoney(t.prizePool)}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {t.prizeDistribution.map(p => (
                <li key={p.place} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                  <span className="text-ink-muted">#{p.place} place</span>
                  <span className="font-mono font-semibold text-white">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    )}

    {tab === 'teams' && (teams && teams.length > 0 ? (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map(tt => (
          <Link key={tt.id} to={'/teams/' + tt.team.id}
            className="surface flex items-center gap-3 p-4 transition hover:border-brand-600/40">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 font-mono text-xs font-bold text-brand-400">
              {String(tt.slot).padStart(2,'0')}
            </span>
            {tt.team.logo && <img src={tt.team.logo} alt="" className="h-10 w-10 rounded-xl border border-line"/>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold uppercase text-white">{tt.team.name}</p>
              <p className="text-xs text-ink-faint">{tt.team.tag}</p>
            </div>
          </Link>
        ))}
      </div>
    ) : <EmptyState icon={Users} title="No registered teams" description="Be the first to register your squad."/>)}

    {tab === 'schedule' && (
      <div className="space-y-4">
        {t.stages.map(s => (
          <Card key={s.id}>
            <CardHeader>
              <div>
                <CardTitle>{s.name}</CardTitle>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatDate(s.date)} - {s.startTime} - {s.endTime ?? '-'} - {s.matchCount} matches
                </p>
              </div>
              <StatusBadge status={s.status === 'FINISHED' ? 'FINISHED' : s.status === 'LIVE' ? 'LIVE' : 'UPCOMING'}/>
            </CardHeader>
            <CardBody>
              <p className="mb-2 text-xs uppercase tracking-wider text-ink-faint">Maps</p>
              <div className="flex flex-wrap gap-2">
                {s.maps.map((m, i) => (
                  <span key={i} className="rounded-lg border border-line bg-bg-deep px-2.5 py-1 text-xs text-ink-muted">
                    {MAP_LABEL[m]}
                  </span>
                ))}
              </div>
              {s.qualificationRules && <p className="mt-4 text-xs text-ink-muted">{s.qualificationRules}</p>}
            </CardBody>
          </Card>
        ))}
      </div>
    )}

    {tab === 'matches' && (
      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-bg-deep/60 text-left text-[11px] uppercase tracking-wider text-ink-faint">
            <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Map</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {(matches ?? []).map(m => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-4 py-3 font-mono text-ink-muted">{String(m.matchNumber).padStart(2,'0')}</td>
                <td className="px-4 py-3 text-white">{MAP_LABEL[m.map]}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(m.startTime)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status === 'LIVE' ? 'LIVE' : m.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING'}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {tab === 'leaderboard' && <LeaderboardTable rows={lb ?? []} loading={!lb} live={t.status === 'LIVE'}/>}

    {tab === 'rules' && (
      <Card>
        <CardHeader><CardTitle>Tournament Rules</CardTitle></CardHeader>
        <CardBody><p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{t.rules}</p></CardBody>
      </Card>
    )}

    {tab === 'stream' && (primaryStream ? (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-danger animate-pulse-live"/>
          <span className="text-xs font-bold uppercase tracking-wider text-danger">Live now</span>
          <span className="text-xs text-ink-faint">- {primaryStream.label}</span>
        </div>
        <YouTubeEmbed url={primaryStream.youtubeUrl} title={t.name}/>
      </div>
    ) : <EmptyState icon={Trophy} title="No stream scheduled"/>)}
  </div>;

  function Info({ label, value }: { label:string; value:string }) {
    return <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>;
  }
}
'@

# ============================================================
# LEADERBOARD PAGE
# ============================================================
Write-File 'src/pages/LeaderboardPage.tsx' @'
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy } from 'lucide-react';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { LeaderboardPodium } from '@/components/leaderboard/leaderboard-podium';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';

export function LeaderboardPage() {
  const { data: list } = useAsync(() => tournamentApi.list(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const tournaments = list ?? [];
  const current = tournaments.find(t => t.id === selected) ?? tournaments[0];

  const { data: rows, loading } = useAsync(
    () => current ? tournamentApi.leaderboard(current.id) : Promise.resolve([]),
    [current?.id]
  );

  if (!tournaments.length) return <EmptyState icon={Trophy} title="No tournaments available"/>;

  return <div>
    <PageHeader title="Leaderboards" subtitle="Live and final standings"/>
    <Tabs items={tournaments.map(t => ({ id:t.id, label:t.shortName }))}
      value={current?.id ?? ''} onChange={setSelected} className="mb-6"/>
    {rows && rows.length >= 3 && <div className="mb-8"><LeaderboardPodium rows={rows}/></div>}
    <LeaderboardTable rows={rows ?? []} loading={loading} live={current?.status === 'LIVE'}/>
  </div>;
}
'@

# ============================================================
# TEAMS PAGE
# ============================================================
Write-File 'src/pages/TeamsPage.tsx' @'
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';

export function TeamsPage() {
  const { data, loading } = useAsync(() => teamApi.list(), []);
  const teams = data ?? [];

  return <div>
    <PageHeader title="Teams" subtitle={teams.length + ' registered teams'}/>
    {loading ? <CardGridSkeleton count={9}/> : teams.length === 0 ? (
      <EmptyState icon={Users} title="No teams yet"/>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teams.map(t => (
          <Link key={t.id} to={'/teams/' + t.id} className="surface overflow-hidden transition hover:border-brand-600/40">
            <div className="h-20 bg-gradient-to-br from-brand-600/20 to-transparent"/>
            <div className="-mt-8 px-4 pb-4">
              {t.logo && <img src={t.logo} alt="" className="h-14 w-14 rounded-2xl border-4 border-bg-panel bg-bg-deep"/>}
              <p className="mt-3 truncate font-display text-sm font-bold uppercase text-white">{t.name}</p>
              <p className="text-xs text-ink-faint">{t.tag} - {t.country}</p>
              {t.slogan && <p className="mt-2 line-clamp-1 text-xs italic text-ink-muted">"{t.slogan}"</p>}
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>;
}
'@

# ============================================================
# TEAM DETAIL
# ============================================================
Write-File 'src/pages/TeamDetailPage.tsx' @'
import { useParams, Navigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';

export function TeamDetailPage() {
  const { id } = useParams<{ id:string }>();
  const { data: team, loading } = useAsync(() => id ? teamApi.get(id) : Promise.resolve(undefined), [id]);
  const { data: members } = useAsync(() => id ? teamApi.members(id) : Promise.resolve([]), [id]);

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!team) return <Navigate to="/404" replace/>;

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-deep">
      {team.banner && <img src={team.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent"/>
      <div className="relative flex flex-wrap items-end gap-5 p-6 sm:p-10">
        {team.logo && <img src={team.logo} alt="" className="h-20 w-20 rounded-3xl border-4 border-bg-panel bg-bg-deep sm:h-24 sm:w-24"/>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-400">{team.tag}</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{team.name}</h1>
          {team.slogan && <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>}
        </div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
        <CardBody>
          {!members?.length ? <EmptyState icon={Users} title="No approved members"/> : (
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
                  <Avatar src={m.user.avatar} name={m.user.fullName} size={40}/>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{m.user.fullName}</p>
                    <p className="text-xs text-ink-faint">@{m.user.username}</p>
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
      <Card>
        <CardHeader><CardTitle>Info</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <Row label="Country" value={team.country ?? '-'}/>
          <Row label="City" value={team.city ?? '-'}/>
          <Row label="Captain" value={members?.find(m => m.role === 'CAPTAIN')?.user.username ?? '-'}/>
        </CardBody>
      </Card>
    </div>
  </div>;
}

function Row({ label, value }: { label:string; value:string }) {
  return <div className="flex items-center justify-between border-b border-line pb-2 last:border-0">
    <span className="text-ink-faint">{label}</span>
    <span className="truncate text-white">{value}</span>
  </div>;
}
'@

# ============================================================
# TEAM CREATE
# ============================================================
Write-File 'src/pages/TeamCreatePage.tsx' @'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import { RequireAuth } from '@/components/common/require-auth';

export function TeamCreatePage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name:'', tag:'', slogan:'', description:'', country:'Uzbekistan', city:'Tashkent' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.name.length < 3 || form.tag.length < 2) {
      toast('WARNING', 'Validation', 'Name min 3 chars, tag min 2');
      return;
    }
    setBusy(true);
    try {
      const team = await teamApi.create({
        ...form,
        captainId: user.id,
        logo: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + form.tag + '-logo'
      });
      await refresh();
      toast('SUCCESS', 'Team created', team.name + ' is ready');
      navigate('/teams/' + team.id);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Create Team" subtitle="Start your squad and register for tournaments"/>
    <Card>
      <CardBody className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Team name" required>
            <Input value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} placeholder="ALONE GAMERS" required/>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tag" required hint="2-4 characters">
              <Input value={form.tag} onChange={e => setForm({ ...form, tag:e.target.value.toUpperCase() })} maxLength={4} placeholder="AG" required/>
            </Field>
            <Field label="Slogan">
              <Input value={form.slogan} onChange={e => setForm({ ...form, slogan:e.target.value })} placeholder="Never Give Up"/>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <Input value={form.country} onChange={e => setForm({ ...form, country:e.target.value })}/>
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={e => setForm({ ...form, city:e.target.value })}/>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Tell us about your team..."/>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={busy}><Shield size={14}/> Create team</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  </div>;
}
'@

# ============================================================
# TEAM JOIN
# ============================================================
Write-File 'src/pages/TeamJoinPage.tsx' @'
import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function TeamJoinPage() {
  const { code } = useParams<{ code:string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: team, loading } = useAsync(() => code ? teamApi.byInvite(code) : Promise.resolve(undefined), [code]);

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!team) return <div className="mx-auto max-w-lg">
    <EmptyState icon={Users} title="Invalid invite link" description="Ask your captain for a fresh invite code."/>
  </div>;

  const join = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await teamApi.join(team.id, user.id, code);
      toast('SUCCESS', 'Join request sent', 'Your captain will review it.');
      navigate('/teams/' + team.id);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    }
  };

  return <div className="mx-auto max-w-lg">
    <Card>
      <CardBody className="pt-6 text-center">
        {team.logo && <img src={team.logo} alt="" className="mx-auto h-20 w-20 rounded-2xl border border-line"/>}
        <p className="mt-4 text-xs font-mono uppercase tracking-wider text-brand-400">{team.tag}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">{team.name}</h1>
        {team.slogan && <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>}
        <p className="mt-4 text-sm text-ink-muted">You have been invited to join this team.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" onClick={join}>Join Team</Button>
          <Button size="lg" variant="ghost" onClick={() => navigate(-1)}>Decline</Button>
        </div>
      </CardBody>
    </Card>
  </div>;
}
'@

# ============================================================
# PROFILE
# ============================================================
Write-File 'src/pages/ProfilePage.tsx' @'
import { Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { formatDate } from '@/lib/utils';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);

  if (!user) return <div className="p-12 text-center text-ink-faint">Please login</div>;

  return <div>
    <PageHeader title="Profile" subtitle="Your player identity"/>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardBody className="pt-6 text-center">
          <Avatar src={user.avatar} name={user.fullName} size={96} className="mx-auto" ring/>
          <h2 className="mt-4 font-display text-xl font-bold text-white">{user.fullName}</h2>
          <p className="text-xs text-ink-faint">@{user.username}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1">
            {user.roles.map(r => (
              <span key={r} className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                {r}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <Row icon={Mail} label="Email" value={user.email}/>
          <Row icon={Phone} label="Phone" value={user.phone ?? '-'}/>
          <Row icon={MapPin} label="Location" value={[user.city, user.country].filter(Boolean).join(', ') || '-'}/>
          <div className="grid grid-cols-2 gap-4 pt-3">
            <Info label="PUBG nickname" value={user.pubgNickname ?? '-'}/>
            <Info label="PUBG ID" value={user.pubgId ?? '-'}/>
            <Info label="Joined" value={formatDate(user.createdAt)}/>
            <Info label="Current team" value={team?.name ?? 'No team'}/>
          </div>
        </CardBody>
      </Card>
    </div>
  </div>;
}

function Row({ icon:Icon, label, value }: { icon:typeof Mail; label:string; value:string }) {
  return <div className="flex items-center gap-3 border-b border-line pb-3 last:border-0">
    <Icon size={15} className="text-ink-faint"/>
    <span className="w-32 shrink-0 text-xs uppercase tracking-wider text-ink-faint">{label}</span>
    <span className="truncate text-white">{value}</span>
  </div>;
}

function Info({ label, value }: { label:string; value:string }) {
  return <div>
    <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
    <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
  </div>;
}
'@

# ============================================================
# DASHBOARD
# ============================================================
Write-File 'src/pages/DashboardPage.tsx' @'
import { Bell, Calendar, Swords, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi, teamApi, tournamentApi } from '@/services/api';
import { Avatar } from '@/components/ui/avatar';
import { relativeTime } from '@/lib/utils';
import { RequireAuth } from '@/components/common/require-auth';

export function DashboardPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: allT } = useAsync(() => tournamentApi.list(), []);
  const { data: notes } = useAsync(() => user ? notificationApi.forUser(user.id) : Promise.resolve([]), [user?.id]);

  const upcoming = (allT ?? []).filter(t => ['UPCOMING','REGISTRATION_OPEN','LIVE'].includes(t.status)).slice(0, 4);

  return <div>
    <PageHeader title={'Welcome back, ' + (user?.fullName.split(' ')[0] ?? '')} subtitle="Your esports command center"/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Trophy} label="Tournaments" value={allT?.length ?? 0}/>
      <StatCard icon={Swords} label="My team" value={team ? 1 : 0} tone="success"/>
      <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} tone="warning"/>
      <StatCard icon={Bell} label="Notifications" value={notes?.filter(n => !n.read).length ?? 0} tone="danger"/>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Upcoming Tournaments</CardTitle></CardHeader>
        <CardBody>
          {upcoming.length === 0 ? <EmptyState icon={Calendar} title="Nothing scheduled"/> : (
            <ul className="space-y-2">
              {upcoming.map(t => (
                <li key={t.id}>
                  <Link to={'/tournaments/' + t.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40">
                    {t.logo && <img src={t.logo} alt="" className="h-10 w-10 rounded-xl"/>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold uppercase text-white">{t.name}</p>
                      <p className="text-xs text-ink-faint">{t.status.replace(/_/g,' ')} - {t.maps.length} maps</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {!notes?.length && <p className="text-xs text-ink-faint">No notifications yet.</p>}
          {notes?.slice(0,6).map(n => (
            <div key={n.id} className="flex gap-2.5">
              <Avatar name={user?.fullName ?? ''} size={28}/>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white">{n.title}</p>
                <p className="text-[10px] text-ink-faint">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  </div>;
}
'@

# ============================================================
# LIVE PAGE
# ============================================================
Write-File 'src/pages/LivePage.tsx' @'
import { Radio } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';

export function LivePage() {
  const { data } = useAsync(() => tournamentApi.list(), []);
  const live = (data ?? []).filter(t => t.status === 'LIVE' || t.status === 'PAUSED');

  return <div>
    <PageHeader title="Live Now" subtitle="Watch ongoing tournaments"/>
    {live.length === 0
      ? <EmptyState icon={Radio} title="No live tournaments" description="Check back soon."/>
      : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {live.map(t => <TournamentCard key={t.id} tournament={t}/>)}
        </div>}
  </div>;
}
'@

# ============================================================
# LOGIN
# ============================================================
Write-File 'src/pages/LoginPage.tsx' @'
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const DEMO = [
  { label:'Superadmin', email:'superadmin@example.com' },
  { label:'Organizer', email:'organizer@example.com' },
  { label:'Host', email:'host@example.com' },
  { label:'Captain', email:'captain@example.com' }
];

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(id, pwd);
      toast('SUCCESS', 'Signed in', 'Welcome back!');
      const state = loc.state as { from?:string } | null;
      navigate(state?.from ?? '/dashboard', { replace:true });
    } catch (err) {
      toast('ERROR', 'Login failed', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  const quick = (email:string) => { setId(email); setPwd('ChangeMe123!'); };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={22} className="text-white"/>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-faint">Sign in to your Ranger account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Username or email" required>
            <Input value={id} onChange={e => setId(e.target.value)} required placeholder="captain@example.com"/>
          </Field>
          <Field label="Password" required>
            <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required placeholder="********"/>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
        </form>
        <div className="mt-4 flex justify-between text-xs">
          <Link to="/forgot-password" className="text-brand-400 hover:underline">Forgot password?</Link>
          <Link to="/register" className="text-brand-400 hover:underline">Create account</Link>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-bg-deep/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-warning">DEVELOPMENT ONLY - one-click login</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map(d => (
              <button key={d.email} type="button" onClick={() => quick(d.email)}
                className="rounded-lg border border-line bg-white/[.03] px-2 py-1.5 text-[11px] text-ink-muted transition hover:border-brand-600/40 hover:text-white">
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-faint">Password: <span className="font-mono">ChangeMe123!</span></p>
        </div>
      </CardBody>
    </Card>
  </div>;
}
'@

# ============================================================
# REGISTER
# ============================================================
Write-File 'src/pages/RegisterPage.tsx' @'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ fullName:'', username:'', email:'', phone:'', password:'', confirm:'' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) { toast('WARNING', 'Passwords do not match'); return; }
    if (f.password.length < 6) { toast('WARNING', 'Password too short', 'Minimum 6 characters'); return; }
    setBusy(true);
    try {
      await register({ fullName:f.fullName, username:f.username, email:f.email, phone:f.phone, password:f.password });
      toast('SUCCESS', 'Account created', 'Welcome to Ranger Esports!');
      navigate('/dashboard', { replace:true });
    } catch (err) {
      toast('ERROR', 'Registration failed', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={22} className="text-white"/>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-ink-faint">Join the Ranger community</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name" required>
            <Input value={f.fullName} onChange={e => setF({ ...f, fullName:e.target.value })} required/>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username" required>
              <Input value={f.username} onChange={e => setF({ ...f, username:e.target.value })} required/>
            </Field>
            <Field label="Phone" required>
              <Input value={f.phone} onChange={e => setF({ ...f, phone:e.target.value })} required/>
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" value={f.email} onChange={e => setF({ ...f, email:e.target.value })} required/>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Password" required>
              <Input type="password" value={f.password} onChange={e => setF({ ...f, password:e.target.value })} required/>
            </Field>
            <Field label="Confirm" required>
              <Input type="password" value={f.confirm} onChange={e => setF({ ...f, confirm:e.target.value })} required/>
            </Field>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </CardBody>
    </Card>
  </div>;
}
'@

# ============================================================
# FORGOT PASSWORD
# ============================================================
Write-File 'src/pages/ForgotPasswordPage.tsx' @'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { authApi } from '@/services/api';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.resetPassword(email, 'ChangeMe123!');
      setDone(true);
      toast('SUCCESS', 'Password reset', 'Demo: password changed to ChangeMe123!');
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <h1 className="text-center font-display text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-1 text-center text-sm text-ink-faint">Enter your email to reset</p>
        {done ? (
          <p className="mt-6 rounded-xl border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
            Password reset to ChangeMe123!
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>Reset password</Button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-ink-faint">
          <Link to="/login" className="text-brand-400 hover:underline">Back to login</Link>
        </p>
      </CardBody>
    </Card>
  </div>;
}
'@

# ============================================================
# 404 / 403
# ============================================================
Write-File 'src/pages/NotFoundPage.tsx' @'
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="font-display text-7xl font-bold text-brand-600/30">404</p>
    <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
    <p className="mt-2 max-w-sm text-sm text-ink-faint">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-6"><Button>Go home</Button></Link>
  </div>;
}
'@

Write-File 'src/pages/ForbiddenPage.tsx' @'
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="font-display text-7xl font-bold text-danger/30">403</p>
    <h1 className="mt-2 font-display text-2xl font-bold text-white">Access denied</h1>
    <p className="mt-2 max-w-sm text-sm text-ink-faint">You do not have permission to access this page.</p>
    <Link to="/dashboard" className="mt-6"><Button>Go to Dashboard</Button></Link>
  </div>;
}
'@

# ============================================================
# MY TEAM
# ============================================================
Write-File 'src/pages/MyTeamPage.tsx' @'
import { Link } from 'react-router-dom';
import { Copy, Swords, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { RequireAuth } from '@/components/common/require-auth';
import { Avatar } from '@/components/ui/avatar';

export function MyTeamPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: team, loading } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: members } = useAsync(() => team ? teamApi.members(team.id) : Promise.resolve([]), [team?.id]);

  const copyInvite = () => {
    if (!team) return;
    const link = window.location.origin + '/team/join/' + team.inviteCode;
    void navigator.clipboard.writeText(link);
    toast('SUCCESS', 'Invite link copied');
  };

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  if (!team) return <div>
    <PageHeader title="My Team"/>
    <EmptyState icon={Swords} title="You are not in a team yet"
      description="Create your own squad or join using an invite link."
      action={<Link to="/team/create"><Button><UserPlus size={14}/> Create team</Button></Link>}/>
  </div>;

  const captain = members?.find(m => m.role === 'CAPTAIN');

  return <div>
    <PageHeader title="My Team" subtitle={team.name + ' - ' + team.tag}/>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
        <CardBody>
          <ul className="space-y-2">
            {members?.map(m => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
                <Avatar src={m.user.avatar} name={m.user.fullName} size={40}/>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{m.user.fullName}</p>
                  <p className="text-xs text-ink-faint">@{m.user.username}</p>
                </div>
                <span className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Invite link</CardTitle></CardHeader>
          <CardBody>
            <p className="mb-2 break-all rounded-lg border border-line bg-bg-deep p-3 font-mono text-xs text-brand-400">
              {window.location.origin}/team/join/{team.inviteCode}
            </p>
            <Button variant="secondary" size="sm" className="w-full" onClick={copyInvite}>
              <Copy size={13}/> Copy link
            </Button>
          </CardBody>
        </Card>
        {captain && <Card>
          <CardHeader><CardTitle>Captain</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center gap-3">
              <Avatar src={captain.user.avatar} name={captain.user.fullName} size={40}/>
              <div>
                <p className="text-sm font-semibold text-white">{captain.user.fullName}</p>
                <p className="text-xs text-ink-faint">@{captain.user.username}</p>
              </div>
            </div>
          </CardBody>
        </Card>}
      </div>
    </div>
  </div>;
}
'@

# ============================================================
# ORGANIZER PAGES
# ============================================================
Write-File 'src/pages/organizer/OrganizerDashboard.tsx' @'
import { Trophy, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';
import { StatusBadge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils';

export function OrganizerDashboard() {
  return <RequireAuth permission="dashboard.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data } = useAsync(() => tournamentApi.list(), []);
  const mine = (data ?? []).filter(t => t.organizerId === user?.id);

  return <div>
    <PageHeader title="Organizer Dashboard" subtitle="Manage your tournaments"/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Trophy} label="Total" value={mine.length}/>
      <StatCard icon={Zap} label="Live" value={mine.filter(t => t.status === 'LIVE').length} tone="danger"/>
      <StatCard icon={Users} label="Teams" value={8} tone="success"/>
      <StatCard icon={Trophy} label="Prize pool" value={mine.reduce((s, t) => s + t.prizePool, 0)} tone="warning"/>
    </div>
    <Card className="mt-6">
      <CardHeader><CardTitle>My Tournaments</CardTitle></CardHeader>
      <CardBody>
        {mine.length === 0 ? <p className="text-sm text-ink-faint">No tournaments yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <tr><th className="py-2">Tournament</th><th className="py-2">Status</th><th className="py-2">Prize</th></tr>
              </thead>
              <tbody>
                {mine.map(t => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="py-2.5">
                      <Link to={'/tournaments/' + t.id} className="font-medium text-white hover:text-brand-400">{t.name}</Link>
                    </td>
                    <td className="py-2.5"><StatusBadge status={t.status}/></td>
                    <td className="py-2.5 font-mono text-ink-muted">{formatMoney(t.prizePool)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  </div>;
}
'@

Write-File 'src/pages/organizer/OrganizerTournaments.tsx' @'
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/badge';

export function OrganizerTournaments() {
  return <RequireAuth permission="tournaments.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data } = useAsync(() => tournamentApi.list(), []);
  const mine = (data ?? []).filter(t => t.organizerId === user?.id);

  return <div>
    <PageHeader title="My Tournaments" subtitle={mine.length + ' tournaments'}/>
    <Card><CardBody className="pt-6">
      <ul className="space-y-2">
        {mine.map(t => (
          <li key={t.id}>
            <Link to={'/tournaments/' + t.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40">
              {t.logo && <img src={t.logo} alt="" className="h-10 w-10 rounded-xl"/>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold uppercase text-white">{t.name}</p>
                <p className="text-xs text-ink-faint">{t.shortName}</p>
              </div>
              <StatusBadge status={t.status}/>
            </Link>
          </li>
        ))}
        {mine.length === 0 && <p className="text-sm text-ink-faint">No tournaments yet.</p>}
      </ul>
    </CardBody></Card>
  </div>;
}
'@

Write-File 'src/pages/organizer/OrganizerApplyPage.tsx' @'
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { organizerApi } from '@/services/api';

export function OrganizerApplyPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    organizationName:'', description:'', experience:'', previousTournaments:'',
    phone:'', email: user?.email ?? ''
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await organizerApi.apply({
        userId:user.id, fullName:user.fullName, ...f, socials:{}
      });
      setDone(true);
      toast('SUCCESS', 'Application submitted');
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Become an Organizer" subtitle="Host your own PUBG tournaments"/>
    <Card><CardBody className="pt-6">
      {done ? (
        <div className="py-8 text-center">
          <Building2 size={40} className="mx-auto text-brand-400"/>
          <p className="mt-3 font-display text-lg font-bold text-white">Application submitted</p>
          <p className="mt-1 text-sm text-ink-faint">You will be notified once reviewed.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Organization name" required>
            <Input value={f.organizationName} onChange={e => setF({ ...f, organizationName:e.target.value })} required/>
          </Field>
          <Field label="Description" required>
            <Textarea value={f.description} onChange={e => setF({ ...f, description:e.target.value })} required/>
          </Field>
          <Field label="Experience" required>
            <Textarea value={f.experience} onChange={e => setF({ ...f, experience:e.target.value })} required/>
          </Field>
          <Field label="Previous tournaments">
            <Input value={f.previousTournaments} onChange={e => setF({ ...f, previousTournaments:e.target.value })}/>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <Input value={f.phone} onChange={e => setF({ ...f, phone:e.target.value })} required/>
            </Field>
            <Field label="Email" required>
              <Input type="email" value={f.email} onChange={e => setF({ ...f, email:e.target.value })} required/>
            </Field>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Submit application</Button>
        </form>
      )}
    </CardBody></Card>
  </div>;
}
'@

# ============================================================
# ADMIN PAGES
# ============================================================
Write-File 'src/pages/admin/AdminDashboard.tsx' @'
import { BarChart3, LayoutDashboard, Trophy, Users } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { adminApi } from '@/services/api';
import { formatMoney } from '@/lib/utils';

const COLORS = ['#1473FF','#3D96FF','#22C55E','#F59E0B','#EF4444','#8B5CF6'];

export function AdminDashboard() {
  return <RequireAuth permission="dashboard.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, loading } = useAsync(() => adminApi.stats(), []);
  if (loading || !data) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  return <div>
    <PageHeader title="Admin Dashboard" subtitle="Platform overview"/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Total users" value={data.users}/>
      <StatCard icon={Users} label="Active users" value={data.activeUsers} tone="success"/>
      <StatCard icon={Trophy} label="Tournaments" value={data.tournaments}/>
      <StatCard icon={Trophy} label="Live" value={data.liveTournaments} tone="danger"/>
      <StatCard icon={LayoutDashboard} label="Teams" value={data.teams}/>
      <StatCard icon={Users} label="Organizers" value={data.organizers} tone="warning"/>
      <StatCard icon={Users} label="Hosts" value={data.hosts}/>
      <StatCard icon={BarChart3} label="Prize pool" value={data.prizePool} tone="warning"/>
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Role distribution</CardTitle></CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.roleDistribution} dataKey="value" nameKey="name" outerRadius={80}>
                {data.roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'#0B1324', border:'1px solid #16233C', borderRadius:12 }}/>
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name:'Live', v:data.liveTournaments },
              { name:'Finished', v:data.finishedTournaments },
              { name:'Matches', v:data.matches }
            ]}>
              <CartesianGrid stroke="#16233C" strokeDasharray="3 3"/>
              <XAxis dataKey="name" stroke="#64748B" fontSize={12}/>
              <YAxis stroke="#64748B" fontSize={12}/>
              <Tooltip contentStyle={{ background:'#0B1324', border:'1px solid #16233C', borderRadius:12 }}/>
              <Bar dataKey="v" fill="#1473FF" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
    <Card className="mt-6">
      <CardHeader><CardTitle>Total prize money</CardTitle></CardHeader>
      <CardBody>
        <p className="font-display text-3xl font-bold text-white">{formatMoney(data.prizePool)}</p>
        <p className="text-xs text-ink-faint">across {data.tournaments} tournaments</p>
      </CardBody>
    </Card>
  </div>;
}
'@

Write-File 'src/pages/admin/AdminUsers.tsx' @'
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { userApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

export function AdminUsers() {
  return <RequireAuth permission="users.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => userApi.list(), []);
  const { toast } = useToast();
  const users = data ?? [];

  const toggle = async (id:string, current:string) => {
    await userApi.setStatus(id, current === 'BANNED' ? 'ACTIVE' : 'BANNED');
    toast('SUCCESS', 'User status updated');
    void refetch();
  };

  return <div>
    <PageHeader title="Users" subtitle={users.length + ' registered users'}/>
    <Card><CardBody className="pt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="py-2">User</th>
              <th className="py-2">Roles</th>
              <th className="py-2">Status</th>
              <th className="py-2">Joined</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 30).map(u => (
              <tr key={u.id} className="border-t border-line">
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.avatar} name={u.fullName} size={32}/>
                    <div>
                      <p className="text-sm font-medium text-white">{u.fullName}</p>
                      <p className="text-xs text-ink-faint">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => (
                      <span key={r} className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5">
                  <span className={u.status === 'ACTIVE' ? 'text-success text-xs font-semibold' : 'text-danger text-xs font-semibold'}>
                    {u.status}
                  </span>
                </td>
                <td className="py-2.5 text-ink-faint text-xs">{formatDate(u.createdAt)}</td>
                <td className="py-2.5 text-right">
                  <Button size="sm" variant={u.status === 'BANNED' ? 'outline' : 'danger'} onClick={() => toggle(u.id, u.status)}>
                    {u.status === 'BANNED' ? 'Unban' : 'Ban'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardBody></Card>
  </div>;
}
'@

Write-File 'src/pages/admin/AdminRoles.tsx' @'
import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { roleApi } from '@/services/api';
import { PERMISSION_CATALOG } from '@/lib/permissions';
import { useToast } from '@/context/ToastContext';

export function AdminRoles() {
  return <RequireAuth permission="roles.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => roleApi.list(), []);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (p:string) => setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);

  const save = async () => {
    if (!name || !key) { toast('WARNING', 'Name and key required'); return; }
    try {
      await roleApi.create({ key, name, description:'Custom role', permissions:selected });
      toast('SUCCESS', 'Role created');
      setOpen(false);
      void refetch();
      setName(''); setKey(''); setSelected([]);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    }
  };

  return <div>
    <PageHeader title="Roles & Permissions" subtitle="Manage role definitions"
      action={<Button onClick={() => setOpen(true)}>New role</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(data ?? []).map(r => (
        <Card key={r.id}>
          <CardHeader>
            <div>
              <CardTitle>{r.name}</CardTitle>
              <p className="mt-1 font-mono text-[10px] text-ink-faint">{r.key}</p>
            </div>
            {r.system && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">SYSTEM</span>}
          </CardHeader>
          <CardBody>
            <p className="text-xs text-ink-muted">{r.description}</p>
            <p className="mt-3 text-xs text-ink-faint">{r.permissions.length} permissions</p>
          </CardBody>
        </Card>
      ))}
    </div>

    <Modal open={open} onClose={() => setOpen(false)} title="Create Role" className="sm:max-w-2xl"
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Role name" required>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Moderator"/>
          </Field>
          <Field label="Role key" required>
            <Input value={key} onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))} placeholder="MODERATOR"/>
          </Field>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-xl border border-line p-3">
          {PERMISSION_CATALOG.map(g => (
            <div key={g.group} className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{g.group}</p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {g.items.map(p => (
                  <label key={p.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/[.04]">
                    <input type="checkbox" checked={selected.includes(p.key)} onChange={() => toggle(p.key)}
                      className="h-3.5 w-3.5 rounded border-line bg-bg-deep"/>
                    <span className="text-ink-muted">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  </div>;
}
'@

Write-File 'src/pages/admin/AdminOrganizers.tsx' @'
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { organizerApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export function AdminOrganizers() {
  return <RequireAuth permission="organizer.approve"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => organizerApi.list(), []);
  const { user } = useAuth();
  const { toast } = useToast();
  const apps = data ?? [];

  const review = async (id:string, status:'APPROVED'|'REJECTED') => {
    if (!user) return;
    await organizerApi.review(id, status, user.id);
    toast('SUCCESS', 'Application ' + status.toLowerCase());
    void refetch();
  };

  return <div>
    <PageHeader title="Organizer Applications" subtitle={apps.length + ' applications'}/>
    {apps.length === 0 ? (
      <EmptyState icon={Building2} title="No applications" description="Applications will appear here."/>
    ) : (
      <div className="space-y-3">
        {apps.map(a => (
          <Card key={a.id}><CardBody className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-bold text-white">{a.organizationName}</p>
                <p className="text-xs text-ink-faint">{a.fullName} - {formatDate(a.createdAt)}</p>
              </div>
              <span className="rounded-full border border-line bg-white/[.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {a.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-xs text-ink-muted">{a.description}</p>
            {a.status === 'PENDING' && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => review(a.id, 'APPROVED')}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => review(a.id, 'REJECTED')}>Reject</Button>
              </div>
            )}
          </CardBody></Card>
        ))}
      </div>
    )}
  </div>;
}
'@

Write-File 'src/pages/admin/AdminAuditLogs.tsx' @'
import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { auditApi } from '@/services/api';
import { relativeTime } from '@/lib/utils';

export function AdminAuditLogs() {
  return <RequireAuth permission="audit.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data } = useAsync(() => auditApi.list(), []);
  const logs = data ?? [];

  return <div>
    <PageHeader title="Audit Logs" subtitle="Recent system activity"/>
    {logs.length === 0 ? (
      <EmptyState icon={ScrollText} title="No logs yet" description="Actions will appear here."/>
    ) : (
      <Card><CardBody className="pt-6">
        <ul className="space-y-2">
          {logs.map(l => (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
              <ScrollText size={16} className="text-brand-400"/>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">{l.actorName}</span> {l.action}
                  <span className="ml-1.5 font-mono text-xs text-ink-faint">{l.entity}#{l.entityId.slice(0,8)}</span>
                </p>
                <p className="text-[10px] text-ink-faint">{relativeTime(l.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardBody></Card>
    )}
  </div>;
}
'@

# ============================================================
# HOST PAGES
# ============================================================
Write-File 'src/pages/host/HostDashboard.tsx' @'
import { Gauge, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { matchApi, tournamentApi } from '@/services/api';
import { StatusBadge } from '@/components/ui/badge';
import { MAP_LABEL } from '@/lib/utils';

export function HostDashboard() {
  return <RequireAuth permission="dashboard.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data: allT } = useAsync(() => tournamentApi.list(), []);
  const assigned = (allT ?? []).filter(t => user && t.hostIds.includes(user.id));
  const first = assigned[0];

  const { data: matches } = useAsync(
    () => first ? matchApi.byTournament(first.id) : Promise.resolve([]),
    [first?.id]
  );

  return <div>
    <PageHeader title="Host Dashboard" subtitle="Manage your assigned matches"/>
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard icon={Trophy} label="Assigned" value={assigned.length}/>
      <StatCard icon={Gauge} label="Total matches" value={matches?.length ?? 0} tone="success"/>
      <StatCard icon={Gauge} label="Live matches" value={(matches ?? []).filter(m => m.status === 'LIVE').length} tone="danger"/>
    </div>
    <Card className="mt-6">
      <CardHeader><CardTitle>Assigned Tournaments</CardTitle></CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {assigned.map(t => (
            <li key={t.id}>
              <Link to={'/tournaments/' + t.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold uppercase text-white">{t.name}</p>
                  <p className="text-xs text-ink-faint">{t.shortName}</p>
                </div>
                <StatusBadge status={t.status}/>
              </Link>
            </li>
          ))}
          {assigned.length === 0 && <p className="text-sm text-ink-faint">No tournaments assigned yet.</p>}
        </ul>
      </CardBody>
    </Card>
    {matches && matches.length > 0 && (
      <Card className="mt-6">
        <CardHeader><CardTitle>Matches</CardTitle></CardHeader>
        <CardBody>
          <ul className="space-y-2">
            {matches.map(m => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
                <span className="rounded-lg bg-brand-600/20 px-2 py-1 font-mono text-xs font-bold text-brand-400">M{m.matchNumber}</span>
                <div className="flex-1"><p className="text-sm text-white">{MAP_LABEL[m.map]}</p></div>
                <StatusBadge status={m.status === 'LIVE' ? 'LIVE' : m.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING'}/>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    )}
  </div>;
}
'@

Write-File 'src/pages/host/HostTournaments.tsx' @'
import { HostDashboard } from './HostDashboard';
export function HostTournaments() { return <HostDashboard/>; }
'@

# ============================================================
# APP
# ============================================================
Write-File 'src/App.tsx' @'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/components/layout/app-shell';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { TeamCreatePage } from '@/pages/TeamCreatePage';
import { TeamJoinPage } from '@/pages/TeamJoinPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { LivePage } from '@/pages/LivePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { OrganizerTournaments } from '@/pages/organizer/OrganizerTournaments';
import { OrganizerApplyPage } from '@/pages/organizer/OrganizerApplyPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminRoles } from '@/pages/admin/AdminRoles';
import { AdminOrganizers } from '@/pages/admin/AdminOrganizers';
import { AdminAuditLogs } from '@/pages/admin/AdminAuditLogs';
import { HostDashboard } from '@/pages/host/HostDashboard';
import { HostTournaments } from '@/pages/host/HostTournaments';

export default function App() {
  return <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage/>}/>
          <Route path="register" element={<RegisterPage/>}/>
          <Route path="forgot-password" element={<ForgotPasswordPage/>}/>
          <Route path="reset-password" element={<Navigate to="/forgot-password" replace/>}/>

          <Route element={<AppShell/>}>
            <Route index element={<HomePage/>}/>
            <Route path="tournaments" element={<TournamentsPage/>}/>
            <Route path="tournaments/:id" element={<TournamentDetailPage/>}/>
            <Route path="leaderboard" element={<LeaderboardPage/>}/>
            <Route path="teams" element={<TeamsPage/>}/>
            <Route path="teams/:id" element={<TeamDetailPage/>}/>
            <Route path="team/create" element={<TeamCreatePage/>}/>
            <Route path="team/join/:code" element={<TeamJoinPage/>}/>
            <Route path="live" element={<LivePage/>}/>
            <Route path="profile" element={<ProfilePage/>}/>
            <Route path="dashboard" element={<DashboardPage/>}/>
            <Route path="my-team" element={<MyTeamPage/>}/>
            <Route path="organizer" element={<OrganizerDashboard/>}/>
            <Route path="organizer/tournaments" element={<OrganizerTournaments/>}/>
            <Route path="organizer/tournaments/create" element={<OrganizerTournaments/>}/>
            <Route path="organizer/hosts" element={<OrganizerDashboard/>}/>
            <Route path="organizer/apply" element={<OrganizerApplyPage/>}/>
            <Route path="host" element={<HostDashboard/>}/>
            <Route path="host/tournaments" element={<HostTournaments/>}/>
            <Route path="admin" element={<AdminDashboard/>}/>
            <Route path="admin/users" element={<AdminUsers/>}/>
            <Route path="admin/roles" element={<AdminRoles/>}/>
            <Route path="admin/organizers" element={<AdminOrganizers/>}/>
            <Route path="admin/audit-logs" element={<AdminAuditLogs/>}/>
            <Route path="admin/tournaments" element={<TournamentsPage/>}/>
            <Route path="admin/statistics" element={<AdminDashboard/>}/>
            <Route path="admin/settings" element={<AdminDashboard/>}/>
            <Route path="403" element={<ForbiddenPage/>}/>
            <Route path="404" element={<NotFoundPage/>}/>
            <Route path="*" element={<NotFoundPage/>}/>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>;
}
'@

Write-Host ""
Write-Host "[OK] Barcha fayllar tayyor!" -ForegroundColor Green
Write-Host ""
Write-Host "Endi ishga tushiring:" -ForegroundColor Yellow
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
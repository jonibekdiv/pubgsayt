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
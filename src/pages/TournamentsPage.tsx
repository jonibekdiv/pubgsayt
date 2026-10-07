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
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
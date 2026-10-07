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
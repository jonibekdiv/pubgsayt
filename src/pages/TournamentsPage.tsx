import { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/tournament-card';
import {
  TournamentFilters,
  DEFAULT_FILTERS,
  applyFilters,
  type FilterState,
} from '@/components/tournament/tournament-filters';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi, userApi } from '@/services/api';
import type { TournamentStatus } from '@/types';

const TABS: { id: string; label: string; statuses: TournamentStatus[] }[] = [
  { id: 'all', label: 'All', statuses: [] },
  { id: 'live', label: 'Live', statuses: ['LIVE', 'PAUSED'] },
  { id: 'open', label: 'Registration Open', statuses: ['REGISTRATION_OPEN'] },
  { id: 'upcoming', label: 'Upcoming', statuses: ['UPCOMING'] },
  { id: 'finished', label: 'Finished', statuses: ['FINISHED'] },
];

export function TournamentsPage() {
  const { data, loading } = useAsync(() => tournamentApi.list(), []);
  const { data: users } = useAsync(() => userApi.list(), []);

  const [filter, setFilter] = useState('all');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const all = data ?? [];

  // Organizer names map (for search)
  const organizerNames = useMemo(() => {
    const m = new Map<string, string>();
    (users ?? []).forEach(u => m.set(u.id, u.username + ' ' + u.fullName));
    return m;
  }, [users]);

  // Apply tab + advanced filters
  const activeTab = TABS.find(f => f.id === filter)!;

  const list = useMemo(() => {
    let result = all;
    if (activeTab.statuses.length > 0) {
      result = result.filter(t => activeTab.statuses.includes(t.status));
    }
    return applyFilters(result, filters, organizerNames);
  }, [all, activeTab, filters, organizerNames]);

  return (
    <div>
      <PageHeader
        title="Tournaments"
        subtitle="Browse, filter and join PUBG tournaments"
      />

      {/* Status tabs */}
      <Tabs
        items={TABS.map(f => ({
          id: f.id,
          label: f.label,
          count:
            f.id === 'all'
              ? all.length
              : all.filter(t => f.statuses.includes(t.status)).length,
        }))}
        value={filter}
        onChange={setFilter}
        className="mb-4"
      />

      {/* Advanced filters */}
      <TournamentFilters
        tournaments={all}
        filters={filters}
        onChange={setFilters}
        resultCount={list.length}
        totalCount={all.length}
      />

      {/* Results */}
      <div className="mt-4">
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No tournaments match"
            description={
              all.length === 0
                ? 'Check back soon or create your own organizer account.'
                : 'Try adjusting the filters or clearing the search.'
            }
            action={
              all.length > 0 && filters !== DEFAULT_FILTERS ? (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="rounded-lg border border-line bg-bg-deep/40 px-3 py-2 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-white"
                >
                  Clear all filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map(t => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
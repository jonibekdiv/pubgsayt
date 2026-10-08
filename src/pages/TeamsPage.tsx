import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { usePagination } from '@/hooks/usePagination';
import { teamApi } from '@/services/api';

const PER_PAGE = 12;

export function TeamsPage() {
  const { data, loading } = useAsync(() => teamApi.list(), []);
  const teams = data ?? [];
  const { page, setPage, pageItems, total } = usePagination(teams, PER_PAGE);

  return (
    <div>
      <PageHeader title="Teams" subtitle={total + ' registered teams'} />

      {loading ? (
        <CardGridSkeleton count={PER_PAGE} />
      ) : teams.length === 0 ? (
        <EmptyState icon={Users} title="No teams yet" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map(t => (
              <Link
                key={t.id}
                to={'/teams/' + t.id}
                className="surface overflow-hidden transition hover:border-brand-600/40"
              >
                <div className="h-20 bg-gradient-to-br from-brand-600/20 to-transparent" />
                <div className="-mt-8 px-4 pb-4">
                  {t.logo && (
                    <img
                      src={t.logo}
                      alt=""
                      className="h-14 w-14 rounded-2xl border-4 border-bg-panel bg-bg-deep"
                    />
                  )}
                  <p className="mt-3 truncate font-display text-sm font-bold uppercase text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {t.tag} · {t.country}
                  </p>
                  {t.slogan && (
                    <p className="mt-2 line-clamp-1 text-xs italic text-ink-muted">
                      "{t.slogan}"
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
            className="rounded-2xl border border-line bg-bg-panel/50 p-3"
          />
        </div>
      )}
    </div>
  );
}
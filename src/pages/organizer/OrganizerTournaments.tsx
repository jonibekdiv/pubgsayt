import { Link } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { tournamentApi } from '@/services/api';
import { formatMoney } from '@/lib/utils';

export function OrganizerTournaments() {
  return (
    <RequireAuth permission="tournaments.view">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, can } = useAuth();
  const { data, loading } = useAsync(() => tournamentApi.list(), []);
  const mine = (data ?? []).filter(t => t.organizerId === user?.id);

  return (
    <div>
      <PageHeader
        title="My Tournaments"
        subtitle={mine.length + ' tournaments'}
        action={
          can('tournaments.create') ? (
            <Link to="/organizer/tournaments/create">
              <Button>
                <Plus size={14} /> Create tournament
              </Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="p-12 text-center text-ink-faint">Loading...</div>
      ) : mine.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to get started."
          action={
            <Link to="/organizer/tournaments/create">
              <Button>
                <Plus size={14} /> Create tournament
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardBody className="pt-6">
            <ul className="space-y-2">
              {mine.map(t => (
                <li key={t.id}>
                  <Link
                    to={'/tournaments/' + t.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40"
                  >
                    {t.logo ? (
                      <img src={t.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-line" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                        <Trophy size={16} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold uppercase text-white">
                        {t.name}
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {t.shortName} · {t.maxTeams} teams · {formatMoney(t.prizePool)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
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
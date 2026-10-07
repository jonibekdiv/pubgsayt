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
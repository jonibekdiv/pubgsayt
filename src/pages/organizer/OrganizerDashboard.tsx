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
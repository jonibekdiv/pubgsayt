import { Bell, Calendar, Swords, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi, teamApi, tournamentApi } from '@/services/api';
import { Avatar } from '@/components/ui/avatar';
import { relativeTime } from '@/lib/utils';
import { RequireAuth } from '@/components/common/require-auth';

export function DashboardPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data: team } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: allT } = useAsync(() => tournamentApi.list(), []);
  const { data: notes } = useAsync(() => user ? notificationApi.forUser(user.id) : Promise.resolve([]), [user?.id]);

  const upcoming = (allT ?? []).filter(t => ['UPCOMING','REGISTRATION_OPEN','LIVE'].includes(t.status)).slice(0, 4);

  return <div>
    <PageHeader title={'Welcome back, ' + (user?.fullName.split(' ')[0] ?? '')} subtitle="Your esports command center"/>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Trophy} label="Tournaments" value={allT?.length ?? 0}/>
      <StatCard icon={Swords} label="My team" value={team ? 1 : 0} tone="success"/>
      <StatCard icon={Calendar} label="Upcoming" value={upcoming.length} tone="warning"/>
      <StatCard icon={Bell} label="Notifications" value={notes?.filter(n => !n.read).length ?? 0} tone="danger"/>
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Upcoming Tournaments</CardTitle></CardHeader>
        <CardBody>
          {upcoming.length === 0 ? <EmptyState icon={Calendar} title="Nothing scheduled"/> : (
            <ul className="space-y-2">
              {upcoming.map(t => (
                <li key={t.id}>
                  <Link to={'/tournaments/' + t.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3 transition hover:border-brand-600/40">
                    {t.logo && <img src={t.logo} alt="" className="h-10 w-10 rounded-xl"/>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold uppercase text-white">{t.name}</p>
                      <p className="text-xs text-ink-faint">{t.status.replace(/_/g,' ')} - {t.maps.length} maps</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {!notes?.length && <p className="text-xs text-ink-faint">No notifications yet.</p>}
          {notes?.slice(0,6).map(n => (
            <div key={n.id} className="flex gap-2.5">
              <Avatar name={user?.fullName ?? ''} size={28}/>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white">{n.title}</p>
                <p className="text-[10px] text-ink-faint">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  </div>;
}
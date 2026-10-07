import { useParams, Navigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';

export function TeamDetailPage() {
  const { id } = useParams<{ id:string }>();
  const { data: team, loading } = useAsync(() => id ? teamApi.get(id) : Promise.resolve(undefined), [id]);
  const { data: members } = useAsync(() => id ? teamApi.members(id) : Promise.resolve([]), [id]);

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!team) return <Navigate to="/404" replace/>;

  return <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-deep">
      {team.banner && <img src={team.banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent"/>
      <div className="relative flex flex-wrap items-end gap-5 p-6 sm:p-10">
        {team.logo && <img src={team.logo} alt="" className="h-20 w-20 rounded-3xl border-4 border-bg-panel bg-bg-deep sm:h-24 sm:w-24"/>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono uppercase tracking-wider text-brand-400">{team.tag}</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{team.name}</h1>
          {team.slogan && <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>}
        </div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
        <CardBody>
          {!members?.length ? <EmptyState icon={Users} title="No approved members"/> : (
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
                  <Avatar src={m.user.avatar} name={m.user.fullName} size={40}/>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{m.user.fullName}</p>
                    <p className="text-xs text-ink-faint">@{m.user.username}</p>
                  </div>
                  <span className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader><CardTitle>Info</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <Row label="Country" value={team.country ?? '-'}/>
          <Row label="City" value={team.city ?? '-'}/>
          <Row label="Captain" value={members?.find(m => m.role === 'CAPTAIN')?.user.username ?? '-'}/>
        </CardBody>
      </Card>
    </div>
  </div>;
}

function Row({ label, value }: { label:string; value:string }) {
  return <div className="flex items-center justify-between border-b border-line pb-2 last:border-0">
    <span className="text-ink-faint">{label}</span>
    <span className="truncate text-white">{value}</span>
  </div>;
}
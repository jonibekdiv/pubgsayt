import { Link } from 'react-router-dom';
import { Copy, Swords, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { RequireAuth } from '@/components/common/require-auth';
import { Avatar } from '@/components/ui/avatar';

export function MyTeamPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: team, loading } = useAsync(() => user ? teamApi.byUser(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: members } = useAsync(() => team ? teamApi.members(team.id) : Promise.resolve([]), [team?.id]);

  const copyInvite = () => {
    if (!team) return;
    const link = window.location.origin + '/team/join/' + team.inviteCode;
    void navigator.clipboard.writeText(link);
    toast('SUCCESS', 'Invite link copied');
  };

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  if (!team) return <div>
    <PageHeader title="My Team"/>
    <EmptyState icon={Swords} title="You are not in a team yet"
      description="Create your own squad or join using an invite link."
      action={<Link to="/team/create"><Button><UserPlus size={14}/> Create team</Button></Link>}/>
  </div>;

  const captain = members?.find(m => m.role === 'CAPTAIN');

  return <div>
    <PageHeader title="My Team" subtitle={team.name + ' - ' + team.tag}/>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
        <CardBody>
          <ul className="space-y-2">
            {members?.map(m => (
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
        </CardBody>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Invite link</CardTitle></CardHeader>
          <CardBody>
            <p className="mb-2 break-all rounded-lg border border-line bg-bg-deep p-3 font-mono text-xs text-brand-400">
              {window.location.origin}/team/join/{team.inviteCode}
            </p>
            <Button variant="secondary" size="sm" className="w-full" onClick={copyInvite}>
              <Copy size={13}/> Copy link
            </Button>
          </CardBody>
        </Card>
        {captain && <Card>
          <CardHeader><CardTitle>Captain</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center gap-3">
              <Avatar src={captain.user.avatar} name={captain.user.fullName} size={40}/>
              <div>
                <p className="text-sm font-semibold text-white">{captain.user.fullName}</p>
                <p className="text-xs text-ink-faint">@{captain.user.username}</p>
              </div>
            </div>
          </CardBody>
        </Card>}
      </div>
    </div>
  </div>;
}
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { userApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

export function AdminUsers() {
  return <RequireAuth permission="users.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => userApi.list(), []);
  const { toast } = useToast();
  const users = data ?? [];

  const toggle = async (id:string, current:string) => {
    await userApi.setStatus(id, current === 'BANNED' ? 'ACTIVE' : 'BANNED');
    toast('SUCCESS', 'User status updated');
    void refetch();
  };

  return <div>
    <PageHeader title="Users" subtitle={users.length + ' registered users'}/>
    <Card><CardBody className="pt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="py-2">User</th>
              <th className="py-2">Roles</th>
              <th className="py-2">Status</th>
              <th className="py-2">Joined</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 30).map(u => (
              <tr key={u.id} className="border-t border-line">
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.avatar} name={u.fullName} size={32}/>
                    <div>
                      <p className="text-sm font-medium text-white">{u.fullName}</p>
                      <p className="text-xs text-ink-faint">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => (
                      <span key={r} className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5">
                  <span className={u.status === 'ACTIVE' ? 'text-success text-xs font-semibold' : 'text-danger text-xs font-semibold'}>
                    {u.status}
                  </span>
                </td>
                <td className="py-2.5 text-ink-faint text-xs">{formatDate(u.createdAt)}</td>
                <td className="py-2.5 text-right">
                  <Button size="sm" variant={u.status === 'BANNED' ? 'outline' : 'danger'} onClick={() => toggle(u.id, u.status)}>
                    {u.status === 'BANNED' ? 'Unban' : 'Ban'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardBody></Card>
  </div>;
}
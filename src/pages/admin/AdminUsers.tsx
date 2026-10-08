import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExportCsvButton } from '@/components/common/export-csv-button';
import { Pagination } from '@/components/common/pagination';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { usePagination } from '@/hooks/usePagination';
import { userApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { formatDate, cn } from '@/lib/utils';
import { buildFilename, type CsvColumn } from '@/lib/csv';
import type { PublicUser } from '@/types';

const PER_PAGE = 20;

const CSV_COLUMNS: CsvColumn<PublicUser>[] = [
  { header: 'ID', key: 'id', value: u => u.id },
  { header: 'Full Name', key: 'fullName', value: u => u.fullName },
  { header: 'Username', key: 'username', value: u => u.username },
  { header: 'Email', key: 'email', value: u => u.email },
  { header: 'Phone', key: 'phone', value: u => u.phone ?? '' },
  { header: 'Country', key: 'country', value: u => u.country ?? '' },
  { header: 'City', key: 'city', value: u => u.city ?? '' },
  { header: 'PUBG Nickname', key: 'pubgNickname', value: u => u.pubgNickname ?? '' },
  { header: 'PUBG ID', key: 'pubgId', value: u => u.pubgId ?? '' },
  { header: 'Roles', key: 'roles', value: u => u.roles.join(' / ') },
  { header: 'Status', key: 'status', value: u => u.status },
  { header: 'Joined', key: 'createdAt', value: u => u.createdAt.slice(0, 10) },
];

export function AdminUsers() {
  return <RequireAuth permission="users.view"><Inner /></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => userApi.list(), []);
  const { toast } = useToast();
  const users = data ?? [];
  const { page, setPage, pageItems, total } = usePagination(users, PER_PAGE);

  const toggle = async (id: string, current: string) => {
    await userApi.setStatus(id, current === 'BANNED' ? 'ACTIVE' : 'BANNED');
    toast('SUCCESS', 'User status updated');
    void refetch();
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={total + ' registered users'}
        action={
          <ExportCsvButton
            rows={users}
            columns={CSV_COLUMNS}
            filename={buildFilename('users')}
            label="Export users"
          />
        }
      />
      <Card>
        <CardBody className="pt-6">
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
                {pageItems.map(u => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar} name={u.fullName} size={32} />
                        <div>
                          <p className="text-sm font-medium text-white">{u.fullName}</p>
                          <p className="text-xs text-ink-faint">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(r => (
                          <span
                            key={r}
                            className="rounded-full border border-brand-600/30 bg-brand-600/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          u.status === 'ACTIVE' ? 'text-success' : 'text-danger',
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-ink-faint">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant={u.status === 'BANNED' ? 'outline' : 'danger'}
                        onClick={() => toggle(u.id, u.status)}
                      >
                        {u.status === 'BANNED' ? 'Unban' : 'Ban'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
            className="mt-4"
          />
        </CardBody>
      </Card>
    </div>
  );
}
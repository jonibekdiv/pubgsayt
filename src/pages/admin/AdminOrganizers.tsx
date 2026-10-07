import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { organizerApi } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export function AdminOrganizers() {
  return <RequireAuth permission="organizer.approve"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => organizerApi.list(), []);
  const { user } = useAuth();
  const { toast } = useToast();
  const apps = data ?? [];

  const review = async (id:string, status:'APPROVED'|'REJECTED') => {
    if (!user) return;
    await organizerApi.review(id, status, user.id);
    toast('SUCCESS', 'Application ' + status.toLowerCase());
    void refetch();
  };

  return <div>
    <PageHeader title="Organizer Applications" subtitle={apps.length + ' applications'}/>
    {apps.length === 0 ? (
      <EmptyState icon={Building2} title="No applications" description="Applications will appear here."/>
    ) : (
      <div className="space-y-3">
        {apps.map(a => (
          <Card key={a.id}><CardBody className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-bold text-white">{a.organizationName}</p>
                <p className="text-xs text-ink-faint">{a.fullName} - {formatDate(a.createdAt)}</p>
              </div>
              <span className="rounded-full border border-line bg-white/[.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {a.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-xs text-ink-muted">{a.description}</p>
            {a.status === 'PENDING' && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => review(a.id, 'APPROVED')}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => review(a.id, 'REJECTED')}>Reject</Button>
              </div>
            )}
          </CardBody></Card>
        ))}
      </div>
    )}
  </div>;
}
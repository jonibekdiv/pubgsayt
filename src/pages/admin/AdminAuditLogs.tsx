import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { auditApi } from '@/services/api';
import { relativeTime } from '@/lib/utils';

export function AdminAuditLogs() {
  return <RequireAuth permission="audit.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data } = useAsync(() => auditApi.list(), []);
  const logs = data ?? [];

  return <div>
    <PageHeader title="Audit Logs" subtitle="Recent system activity"/>
    {logs.length === 0 ? (
      <EmptyState icon={ScrollText} title="No logs yet" description="Actions will appear here."/>
    ) : (
      <Card><CardBody className="pt-6">
        <ul className="space-y-2">
          {logs.map(l => (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
              <ScrollText size={16} className="text-brand-400"/>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">{l.actorName}</span> {l.action}
                  <span className="ml-1.5 font-mono text-xs text-ink-faint">{l.entity}#{l.entityId.slice(0,8)}</span>
                </p>
                <p className="text-[10px] text-ink-faint">{relativeTime(l.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardBody></Card>
    )}
  </div>;
}
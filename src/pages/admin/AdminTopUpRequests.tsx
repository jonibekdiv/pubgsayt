import { useState, useMemo } from 'react';
import {
  BadgeCheck, Check, CheckCircle2, Clock, Copy, CreditCard, Hash,
  Hourglass, Phone, Search, Shield, User as UserIcon, X, XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { topUpApi, userApi } from '@/services/api';
import { formatUZS } from '@/lib/wallet';
import { cn, formatDate, relativeTime } from '@/lib/utils';
import type { PublicUser, TopUpRequest, TopUpStatus } from '@/types';

const TABS: { id: string; label: string; statuses: TopUpStatus[] }[] = [
  { id: 'awaiting', label: 'Awaiting', statuses: ['AWAITING_CONFIRMATION'] },
  { id: 'pending', label: 'Pending', statuses: ['PENDING_PAYMENT'] },
  { id: 'approved', label: 'Approved', statuses: ['APPROVED'] },
  { id: 'rejected', label: 'Rejected', statuses: ['REJECTED', 'CANCELLED', 'EXPIRED'] },
  { id: 'all', label: 'All', statuses: [] },
];

export function AdminTopUpRequests() {
  return <RequireAuth permission='users.view'><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, refetch } = useAsync(() => topUpApi.listAll(), []);
  const { data: users } = useAsync(() => userApi.list(), []);
  const [tab, setTab] = useState('awaiting');
  const [query, setQuery] = useState('');
  const [rejecting, setRejecting] = useState<TopUpRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const userMap = useMemo(() => {
    const m = new Map<string, PublicUser>();
    (users ?? []).forEach(u => m.set(u.id, u));
    return m;
  }, [users]);

  const all = data ?? [];
  const activeTab = TABS.find(t => t.id === tab)!;
  const filtered = useMemo(() => {
    let list = activeTab.statuses.length === 0 ? all : all.filter(r => activeTab.statuses.includes(r.status));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r => {
        const u = userMap.get(r.userId);
        return (u?.username.toLowerCase().includes(q) || u?.fullName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
      });
    }
    return list;
  }, [all, activeTab, query, userMap]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    TABS.forEach(t => {
      c[t.id] = t.statuses.length === 0 ? all.length : all.filter(r => t.statuses.includes(r.status)).length;
    });
    return c;
  }, [all]);

  const approve = async (r: TopUpRequest) => {
    if (!user) return;
    if (!confirm('Approve ' + formatUZS(r.requestedAmount) + ' for ' + (userMap.get(r.userId)?.username ?? r.userId) + '?')) return;
    setBusy(true);
    try {
      await topUpApi.approve(r.id, user.id);
      toast('SUCCESS', 'Approved', '+' + formatUZS(r.requestedAmount) + ' credited');
      void refetch();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (!user || !rejecting) return;
    if (!rejectReason.trim()) {
      toast('WARNING', 'Reason required');
      return;
    }
    setBusy(true);
    try {
      await topUpApi.reject(rejecting.id, user.id, rejectReason);
      toast('SUCCESS', 'Rejected');
      setRejecting(null);
      setRejectReason('');
      void refetch();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title='Top-up requests' subtitle='Confirm user payments' />

      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='no-scrollbar flex flex-1 gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.03] p-1'>
          {TABS.map(t => {
            const active = t.id === tab;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('relative shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors', active ? 'bg-brand-600/25 text-white ring-1 ring-inset ring-brand-500/40' : 'text-ink-faint hover:text-ink-muted')}>
                {t.label}
                <span className='ml-1.5 rounded-full bg-white/10 px-1.5 py-px text-[10px] tabular-nums'>{counts[t.id] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div className='relative sm:w-72'>
          <Search size={14} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint' />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search user or ID' className='pl-9' />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title='No requests' description='Nothing to review in this tab.' />
      ) : (
        <Card>
          <CardHeader><CardTitle>{filtered.length} request{filtered.length === 1 ? '' : 's'}</CardTitle></CardHeader>
          <CardBody className='space-y-2 pt-0'>
            {filtered.map(r => {
              const u = userMap.get(r.userId);
              return (
                <RequestRow key={r.id} request={r} user={u} onApprove={() => approve(r)} onReject={() => setRejecting(r)} busy={busy} />
              );
            })}
          </CardBody>
        </Card>
      )}

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title='Reject top-up' description={rejecting ? formatUZS(rejecting.requestedAmount) + ' - ' + (userMap.get(rejecting.userId)?.username ?? '') : ''} footer={<><Button variant='ghost' onClick={() => setRejecting(null)}>Cancel</Button><Button variant='danger' onClick={confirmReject} loading={busy}>Reject</Button></>}>
        <div className='space-y-3'>
          <p className='text-sm text-ink-muted'>Provide a reason. The user will see this in their notifications.</p>
          <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder='e.g. Payment not received' />
          <div className='flex flex-wrap gap-2'>
            {['Payment not received', 'Amount mismatch', 'Duplicate request', 'Suspicious activity'].map(reason => (
              <button key={reason} onClick={() => setRejectReason(reason)} className='rounded-lg border border-line bg-bg-deep/40 px-2.5 py-1.5 text-[11px] text-ink-muted transition hover:border-brand-600/40 hover:text-white'>
                {reason}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RequestRow({ request, user, onApprove, onReject, busy }: { request: TopUpRequest; user?: PublicUser; onApprove: () => void; onReject: () => void; busy: boolean }) {
  const statusTone = {
    AWAITING_CONFIRMATION: 'border-brand-600/40 bg-brand-600/[.06]',
    PENDING_PAYMENT: 'border-warning/40 bg-warning/[.06]',
    APPROVED: 'border-success/40 bg-success/[.06]',
    REJECTED: 'border-danger/40 bg-danger/[.06]',
    CANCELLED: 'border-line bg-bg-deep/40',
    EXPIRED: 'border-line bg-bg-deep/40',
  }[request.status];

  const statusText = {
    AWAITING_CONFIRMATION: 'text-brand-400',
    PENDING_PAYMENT: 'text-warning',
    APPROVED: 'text-success',
    REJECTED: 'text-danger',
    CANCELLED: 'text-ink-faint',
    EXPIRED: 'text-ink-faint',
  }[request.status];

  const copy = (value: string) => { void navigator.clipboard.writeText(value); };

  return (
    <div className={cn('rounded-xl border p-3', statusTone)}>
      <div className='flex flex-wrap items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <p className='truncate font-display text-sm font-bold text-white'>{formatUZS(request.requestedAmount)}</p>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', statusText)}>{request.status.replace(/_/g, ' ')}</span>
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink-faint'>
            <span className='inline-flex items-center gap-1'><UserIcon size={10} /> {user?.fullName ?? 'Unknown'}</span>
            <span className='inline-flex items-center gap-1'><Hash size={10} /> {'#' + request.id.slice(-6).toUpperCase()}</span>
            <span className='inline-flex items-center gap-1'><Clock size={10} /> {relativeTime(request.paidAt ?? request.createdAt)}</span>
          </div>
          <div className='mt-2 flex flex-wrap gap-3 text-[11px]'>
            <button onClick={() => copy(String(request.uniqueAmount))} className='inline-flex items-center gap-1 rounded-md bg-bg-deep/60 px-2 py-1 text-ink-muted transition hover:text-white'>
              <Copy size={10} /> Unique: <span className='font-mono font-semibold'>{request.uniqueAmount.toLocaleString()}</span>
            </button>
            {request.paidAt && (
              <span className='inline-flex items-center gap-1 text-ink-faint'>
                <CheckCircle2 size={10} className='text-brand-400' /> Paid {relativeTime(request.paidAt)}
              </span>
            )}
            {request.confirmedAt && (
              <span className='inline-flex items-center gap-1 text-ink-faint'>
                <BadgeCheck size={10} /> Confirmed {relativeTime(request.confirmedAt)}
              </span>
            )}
          </div>
          {request.rejectedReason && (
            <p className='mt-2 rounded-lg bg-danger/10 px-2 py-1 text-[11px] text-danger'>Reason: {request.rejectedReason}</p>
          )}
        </div>

        {request.status === 'AWAITING_CONFIRMATION' && (
          <div className='flex shrink-0 gap-2'>
            <Button size='sm' variant='ghost' onClick={onReject} className='text-danger hover:bg-danger/10' disabled={busy}>
              <X size={13} /> Reject
            </Button>
            <Button size='sm' onClick={onApprove} disabled={busy}>
              <Check size={13} /> Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

void Shield;
void Phone;
void XCircle;
void Hourglass;
void formatDate;

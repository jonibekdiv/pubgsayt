import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi } from '@/services/api';
import { cn, relativeTime } from '@/lib/utils';
import type { NotificationType } from '@/types';

const ICONS: Record<NotificationType, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const TONES: Record<NotificationType, { bg: string; text: string; border: string; dot: string }> = {
  INFO: { bg: 'bg-brand-600/15', text: 'text-brand-400', border: 'border-brand-600/30', dot: 'bg-brand-500' },
  SUCCESS: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30', dot: 'bg-success' },
  WARNING: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30', dot: 'bg-warning' },
  ERROR: { bg: 'bg-danger/15', text: 'text-danger', border: 'border-danger/30', dot: 'bg-danger' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'INFO', label: 'Info' },
  { id: 'SUCCESS', label: 'Success' },
  { id: 'WARNING', label: 'Warning' },
  { id: 'ERROR', label: 'Error' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

export function NotificationsPage() {
  return <RequireAuth><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, refetch } = useAsync(
    () => user ? notificationApi.forUser(user.id) : Promise.resolve([]),
    [user?.id],
  );
  const [filter, setFilter] = useState<FilterId>('all');

  const items = data ?? [];

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter(n => !n.read);
    return items.filter(n => n.type === filter);
  }, [items, filter]);

  const unread = items.filter(n => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await notificationApi.markAllRead(user.id);
    toast('SUCCESS', 'All marked as read');
    void refetch();
  };

  const markOne = async (id: string) => {
    await notificationApi.markRead(id);
    void refetch();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? unread + ' unread' : 'All caught up'}
        action={
          unread > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck size={13} /> Mark all read
            </Button>
          ) : null
        }
      />

      {/* Filter chips */}
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5">
          {FILTERS.map(f => {
            const active = filter === f.id;
            const count =
              f.id === 'all' ? items.length :
              f.id === 'unread' ? unread :
              items.filter(n => n.type === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95',
                  active
                    ? 'border-brand-600/50 bg-brand-600/15 text-white'
                    : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white',
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className="rounded-full bg-white/10 px-1.5 py-px text-[10px] tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            filter === 'all'
              ? 'You will be notified about matches, registrations and results.'
              : 'Nothing in this category.'
          }
        />
      ) : (
        <Card>
          <CardBody className="space-y-1.5 pt-5">
            {filtered.map(n => {
              const Icon = ICONS[n.type];
              const tone = TONES[n.type];

              const body = (
                <>
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone.bg, tone.text)}>
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-faint/80">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', tone.dot)} />
                  )}
                </>
              );

              const className = cn(
                'flex items-start gap-3 rounded-xl border p-3 transition',
                !n.read
                  ? tone.border + ' ' + tone.bg + ' hover:brightness-110'
                  : 'border-line bg-bg-deep/40 hover:border-brand-600/30',
              );

              if (n.href) {
                return (
                  <Link
                    key={n.id}
                    to={n.href}
                    onClick={() => !n.read && markOne(n.id)}
                    className={cn(className, 'cursor-pointer')}
                  >
                    {body}
                  </Link>
                );
              }

              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markOne(n.id)}
                  className={cn(className, 'cursor-pointer')}
                >
                  {body}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
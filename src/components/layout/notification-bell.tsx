import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi } from '@/services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { relativeTime, cn } from '@/lib/utils';

const TONE: Record<string, string> = {
  INFO: 'bg-brand-600',
  SUCCESS: 'bg-success',
  WARNING: 'bg-warning',
  ERROR: 'bg-danger',
};

export function NotificationBell() {
  const { user } = useAuth();
  const { data, refetch } = useAsync(
    () => user ? notificationApi.forUser(user.id) : Promise.resolve([]),
    [user?.id],
  );
  const items = data ?? [];
  const unread = items.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-ink-faint transition active:scale-90 hover:bg-white/5 hover:text-white sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)]">
        <div className="flex items-center justify-between border-b border-white/[.06] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Notifications</p>
          {unread > 0 && user && (
            <button
              onClick={async () => { await notificationApi.markAllRead(user.id); void refetch(); }}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-500"
            >
              <CheckCheck size={11} /> Mark all
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-faint">No notifications</p>
          )}
          {items.slice(0, 12).map(n => (
            <div key={n.id} className={cn('flex gap-2.5 rounded-lg p-2.5', !n.read && 'bg-brand-600/[.06]')}>
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE[n.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{n.title}</p>
                {n.body && <p className="mt-0.5 truncate text-[11px] text-ink-faint">{n.body}</p>}
                <p className="mt-1 text-[10px] text-ink-faint/70">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

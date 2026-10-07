import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { useRealtime } from '@/hooks/useRealtime';
import { walletApi } from '@/services/api';
import { cn } from '@/lib/utils';

const POLL_MS = 20000;

function compact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return String(n);
}

export function WalletChip() {
  const { user } = useAuth();
  const { data: wallet, refetch } = useAsync(
    () => user ? walletApi.get(user.id) : Promise.resolve(undefined),
    [user?.id],
  );

  // Realtime — same tab
  useRealtime('wallet:update', (payload) => {
    if (payload.userId === user?.id) void refetch();
  }, [user?.id, refetch]);

  // Poll every 20s
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => { void refetch(); }, POLL_MS);
    return () => window.clearInterval(t);
  }, [user, refetch]);

  // Focus + cross-tab
  useEffect(() => {
    if (!user) return;
    const onFocus = () => { void refetch(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ranger.wallet.broadcast') void refetch();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [user, refetch]);

  if (!user) return null;

  const balance = wallet?.balance ?? 0;
  const isLow = balance < 10000;

  return (
    <Link
      to="/wallet"
      title={'Balance: ' + balance.toLocaleString() + ' UZS'}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-xl border transition active:scale-95 sm:gap-2 sm:px-3 sm:py-2',
        'px-2 py-1.5',
        isLow
          ? 'border-warning/40 bg-warning/[.06] hover:border-warning/60'
          : 'border-line bg-bg-deep/60 hover:border-brand-600/40',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-6 sm:w-6',
          isLow ? 'bg-warning/15 text-warning' : 'bg-brand-600/15 text-brand-400',
        )}
      >
        <WalletIcon size={12} />
      </span>

      {/* Compact balance on mobile, full on desktop */}
      <span className="text-xs font-bold tabular-nums text-white sm:hidden">
        {compact(balance)}
      </span>
      <span className="hidden text-xs font-bold tabular-nums text-white sm:inline">
        {balance.toLocaleString()}
      </span>

      <span className="hidden text-[10px] text-ink-faint sm:inline">UZS</span>

      <Plus size={11} className="hidden text-ink-faint sm:inline" />
    </Link>
  );
}

import { useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { useRealtime } from '@/hooks/useRealtime';
import { walletApi } from '@/services/api';
import { cn } from '@/lib/utils';

const POLL_MS = 20000;

export function WalletChip() {
  const { user } = useAuth();
  const { data: wallet, refetch } = useAsync(
    () => user ? walletApi.get(user.id) : Promise.resolve(undefined),
    [user?.id],
  );

  // Realtime: same-tab event
  useRealtime('wallet:update', (payload) => {
    if (payload.userId === user?.id) void refetch();
  }, [user?.id, refetch]);

  // Poll every 20s
  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => { void refetch(); }, POLL_MS);
    return () => window.clearInterval(t);
  }, [user, refetch]);

  // Refetch on window focus + cross-tab broadcast
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

  const balance = wallet?.balance ?? 0;
  const isLow = balance < 10000;

  if (!user) return null;

  return (
    <Link
      to="/wallet"
      className={cn(
        'hidden items-center gap-2 rounded-xl border px-3 py-2 transition sm:flex',
        isLow
          ? 'border-warning/40 bg-warning/[.06] hover:border-warning/60'
          : 'border-line bg-bg-deep/60 hover:border-brand-600/40',
      )}
      title="Wallet balance"
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-lg',
          isLow ? 'bg-warning/15 text-warning' : 'bg-brand-600/15 text-brand-400',
        )}
      >
        <WalletIcon size={12} />
      </span>
      <span className="text-xs font-bold tabular-nums text-white">
        {balance.toLocaleString()}
      </span>
      <span className="text-[10px] text-ink-faint">UZS</span>
      <Plus size={11} className="text-ink-faint" />
    </Link>
  );
}

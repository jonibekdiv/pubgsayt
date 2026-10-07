import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, Coins, History,
  Plus, Sparkles, TrendingDown, TrendingUp, Trophy, Wallet as WalletIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { topUpApi, walletApi } from '@/services/api';
import { formatUZS } from '@/lib/wallet';
import { cn, relativeTime } from '@/lib/utils';
import type { TopUpRequest, WalletTransaction } from '@/types';

export function WalletPage() {
  return <RequireAuth><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { data: wallet, loading } = useAsync(() => user ? walletApi.get(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: txs } = useAsync(() => user ? walletApi.transactions(user.id, 20) : Promise.resolve([]), [user?.id]);
  const { data: summary } = useAsync(() => user ? walletApi.summary(user.id) : Promise.resolve(undefined), [user?.id]);
  const { data: activeRequests } = useAsync(
    () => user ? topUpApi.listForUser(user.id).then(r => r.filter(x => x.status === 'PENDING_PAYMENT' || x.status === 'AWAITING_CONFIRMATION')) : Promise.resolve([]),
    [user?.id],
  );

  if (!user) return null;

  return (
    <div>
      <PageHeader title='Wallet' subtitle='Manage your balance and transactions' />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className='relative overflow-hidden rounded-3xl border border-brand-600/30 bg-gradient-to-br from-brand-700 via-brand-600 to-bg-deep p-6 shadow-[0_20px_60px_-15px_rgba(20,115,255,.5)] sm:p-8'
      >
        <div className='absolute inset-0 grid-lines opacity-30' />
        <div className='absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[.06] blur-3xl' />
        <div className='relative'>
          <div className='flex items-center gap-2'>
            <WalletIcon size={16} className='text-white/80' />
            <span className='text-[10px] font-bold uppercase tracking-[.24em] text-white/70'>Ranger Wallet</span>
          </div>
          <div className='mt-6'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-white/60'>Balance</p>
            <p className='mt-1 font-display text-4xl font-bold tabular-nums text-white sm:text-5xl'>{loading ? '-' : formatUZS(wallet?.balance ?? 0)}</p>
          </div>
          <div className='mt-8 flex flex-wrap gap-2'>
            <Link to='/wallet/topup'>
              <Button size='lg' className='bg-white text-brand-700 hover:bg-white/90'><Plus size={16} /> Top up</Button>
            </Link>
            <Button size='lg' variant='secondary' className='border-white/20 bg-white/10 text-white hover:bg-white/20' onClick={() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })}>
              <History size={16} /> History
            </Button>
          </div>
          <div className='mt-6 flex items-center gap-1.5 text-[11px] text-white/60'>
            <Sparkles size={11} />
            <span>Pay tournament fees instantly from your wallet</span>
          </div>
        </div>
      </motion.div>

      <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatMini label='Total in' value={formatUZS(summary?.totalIn ?? 0)} icon={TrendingUp} tone='success' />
        <StatMini label='Total out' value={formatUZS(summary?.totalOut ?? 0)} icon={TrendingDown} tone='danger' />
        <StatMini label='Prizes won' value={formatUZS(summary?.prizeWon ?? 0)} icon={Trophy} tone='warning' />
        <StatMini label='Pending' value={formatUZS(summary?.pendingTopUp ?? 0)} icon={Clock} tone='brand' />
      </div>

      {activeRequests && activeRequests.length > 0 && (
        <Card className='mt-4'>
          <CardHeader>
            <CardTitle>Active top-ups</CardTitle>
            <span className='text-[10px] font-bold uppercase tracking-wider text-warning'>{activeRequests.length}</span>
          </CardHeader>
          <CardBody className='space-y-2 pt-0'>
            {activeRequests.map(r => <ActiveRequestRow key={r.id} request={r} />)}
          </CardBody>
        </Card>
      )}

      <Card className='mt-4' id='history'>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <Coins size={14} className='text-ink-faint' />
        </CardHeader>
        <CardBody className='pt-0'>
          {!txs || txs.length === 0 ? (
            <p className='py-8 text-center text-xs text-ink-faint'>No transactions yet.</p>
          ) : (
            <ul className='space-y-1.5'>
              {txs.map(t => <TransactionRow key={t.id} tx={t} />)}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatMini({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Clock; tone: 'success' | 'danger' | 'warning' | 'brand' }) {
  const t = { success: 'text-success bg-success/10', danger: 'text-danger bg-danger/10', warning: 'text-warning bg-warning/10', brand: 'text-brand-400 bg-brand-600/10' }[tone];
  return (
    <div className='surface p-3'>
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t)}><Icon size={14} /></span>
      <p className='mt-2 font-display text-base font-bold tabular-nums text-white'>{value}</p>
      <p className='text-[10px] uppercase tracking-wider text-ink-faint'>{label}</p>
    </div>
  );
}

function ActiveRequestRow({ request }: { request: TopUpRequest }) {
  const isPending = request.status === 'PENDING_PAYMENT';
  return (
    <Link to='/wallet/topup' className={cn('flex items-center gap-3 rounded-xl border p-3 transition', isPending ? 'border-warning/40 bg-warning/[.06] hover:border-warning/60' : 'border-brand-600/40 bg-brand-600/[.06] hover:border-brand-600/60')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', isPending ? 'bg-warning/15 text-warning' : 'bg-brand-600/20 text-brand-400')}>
        {isPending ? <Clock size={14} /> : <Sparkles size={14} className='animate-pulse-live' />}
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-white'>{isPending ? 'Waiting for payment' : 'Awaiting confirmation'}</p>
        <p className='truncate text-[11px] text-ink-faint'>Send {formatUZS(request.uniqueAmount)} - {relativeTime(request.paidAt ?? request.createdAt)}</p>
      </div>
      <ChevronRight size={14} className='shrink-0 text-ink-faint' />
    </Link>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const positive = tx.amount > 0;
  const Icon = positive ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className='flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3'>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', positive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}>
        <Icon size={14} />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm text-white'>{tx.description}</p>
        <p className='truncate text-[11px] text-ink-faint'>{relativeTime(tx.createdAt)} - balance {formatUZS(tx.balanceAfter)}</p>
      </div>
      <span className={cn('shrink-0 font-mono text-sm font-bold tabular-nums', positive ? 'text-success' : 'text-danger')}>
        {positive ? '+' : ''}{formatUZS(tx.amount)}
      </span>
    </li>
  );
}

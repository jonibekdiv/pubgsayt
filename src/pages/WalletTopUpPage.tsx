import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, Clock, Copy, CreditCard,
  Hourglass, Phone, Send, Sparkles, Trash2, Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { paymentSettingsApi, topUpApi, walletApi } from '@/services/api';
import { formatUZS, activeCards } from '@/lib/wallet';
import { cn } from '@/lib/utils';
import type { PaymentCard, TopUpRequest } from '@/types';

const QUICK = [5000, 10000, 25000, 50000, 100000, 250000];

export function WalletTopUpPage() {
  return <RequireAuth><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useAsync(() => paymentSettingsApi.get(), []);
  const { data: requests, refetch } = useAsync(() => user ? topUpApi.listForUser(user.id) : Promise.resolve([]), [user?.id]);
  const { data: wallet, refetch: refetchWallet } = useAsync(() => user ? walletApi.get(user.id) : Promise.resolve(undefined), [user?.id]);

  const activeRequest = useMemo(
    () => requests?.find(r => r.status === 'PENDING_PAYMENT' || r.status === 'AWAITING_CONFIRMATION'),
    [requests],
  );

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user || !settings) return null;

  const start = async () => {
    const value = parseInt(amount, 10);
    if (!value || value < settings.minTopUp) {
      toast('WARNING', 'Invalid amount', 'Minimum ' + formatUZS(settings.minTopUp));
      return;
    }
    if (value > settings.maxTopUp) {
      toast('WARNING', 'Too large', 'Maximum ' + formatUZS(settings.maxTopUp));
      return;
    }
    setBusy(true);
    try {
      await topUpApi.create(user.id, value);
      toast('SUCCESS', 'Request created', 'Send the exact amount to the card below');
      setAmount('');
      void refetch();
      void refetchWallet();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='pb-16'>
      <div className='mb-4'>
        <Link to='/wallet' className='inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-brand-400'>
          <ArrowLeft size={13} /> Back to wallet
        </Link>
      </div>

      <PageHeader title='Top up wallet' subtitle={'Balance: ' + formatUZS(wallet?.balance ?? 0)} />

      <AnimatePresence mode='wait'>
        {activeRequest ? (
          <ActiveRequestView
            key={activeRequest.id}
            request={activeRequest}
            cards={activeCards(settings)}
            onPaid={() => { void refetch(); void refetchWallet(); }}
            onCancel={async () => {
              await topUpApi.cancel(activeRequest.id, user.id);
              void refetch();
            }}
          />
        ) : (
          <motion.div key='form' initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card>
              <CardHeader><CardTitle>Enter amount</CardTitle><Wallet size={14} className='text-brand-400' /></CardHeader>
              <CardBody className='space-y-4'>
                <Field label='Amount (UZS)' required hint={'Min ' + formatUZS(settings.minTopUp) + ' - Max ' + formatUZS(settings.maxTopUp)}>
                  <Input type='number' value={amount} onChange={e => setAmount(e.target.value)} placeholder='5000' className='h-14 text-2xl font-bold tabular-nums' inputMode='numeric' />
                </Field>
                <div className='flex flex-wrap gap-2'>
                  {QUICK.map(q => (
                    <button key={q} onClick={() => setAmount(String(q))} className={cn('rounded-xl border px-3 py-2 text-xs font-semibold transition', amount === String(q) ? 'border-brand-600/50 bg-brand-600/15 text-white' : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white')}>
                      {formatUZS(q)}
                    </button>
                  ))}
                </div>
                <div className='rounded-xl border border-line bg-bg-deep/40 p-3'>
                  <div className='flex items-start gap-2 text-[11px] leading-relaxed text-ink-faint'>
                    <Sparkles size={12} className='mt-0.5 shrink-0 text-brand-400' />
                    <div>
                      <p className='font-semibold text-ink-muted'>How it works</p>
                      <ol className='mt-1 list-inside list-decimal space-y-0.5'>
                        <li>Enter your desired amount</li>
                        <li>We generate a unique amount (5000 becomes 5001) so admin can match your transfer</li>
                        <li>Send that exact amount to the card shown</li>
                        <li>Click I paid - admin confirms within 5 minutes</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <Button size='lg' className='w-full' onClick={start} loading={busy} disabled={!amount}>
                  <Send size={14} /> Continue to payment
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveRequestView({ request, onPaid, onCancel, cards }: {
  request: TopUpRequest;
  onPaid: () => void;
  onCancel: () => void;
  cards: PaymentCard[];
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(request.expiresAt));

  useEffect(() => {
    if (request.status !== 'PENDING_PAYMENT') return;
    const t = window.setInterval(() => setSecondsLeft(calcSecondsLeft(request.expiresAt)), 1000);
    return () => window.clearInterval(t);
  }, [request.expiresAt, request.status]);

  const isPending = request.status === 'PENDING_PAYMENT';
  const expired = isPending && secondsLeft <= 0;

  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value.replace(/\s/g, ''));
    toast('SUCCESS', label + ' copied');
  };

  const markPaid = async () => {
    setBusy(true);
    try {
      await topUpApi.markPaid(request.id, request.userId);
      toast('SUCCESS', 'Sent to admin', 'Confirmation usually within 5 minutes');
      onPaid();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className='space-y-4'>
      <Card className={cn('overflow-hidden', isPending ? 'border-warning/40' : 'border-brand-600/40')}>
        <div className={cn('border-b px-5 py-4', isPending ? 'border-warning/30 bg-warning/[.06]' : 'border-brand-600/30 bg-brand-600/[.06]')}>
          <div className='flex items-center gap-2'>
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', isPending ? 'bg-warning/15 text-warning' : 'bg-brand-600/20 text-brand-400')}>
              {isPending ? <Clock size={15} /> : <Hourglass size={15} className='animate-pulse-live' />}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='font-display text-sm font-bold text-white'>{isPending ? 'Waiting for your payment' : 'Awaiting admin confirmation'}</p>
              <p className='text-[11px] text-ink-faint'>{isPending ? (expired ? 'Expired - please cancel and try again' : 'Expires in ' + formatTime(secondsLeft)) : 'Admin will confirm within 5 minutes'}</p>
            </div>
          </div>
        </div>
        <CardBody className='space-y-4 pt-5'>
          <div className='relative overflow-hidden rounded-2xl border border-brand-600/40 bg-gradient-to-br from-brand-700/40 to-bg-deep p-4'>
            <p className='text-[10px] font-bold uppercase tracking-[.2em] text-brand-300'>Send EXACTLY this amount</p>
            <div className='mt-2 flex items-baseline gap-2'>
              <span className='font-mono text-3xl font-bold tabular-nums text-white'>{request.uniqueAmount.toLocaleString()}</span>
              <span className='text-sm font-semibold text-brand-300'>UZS</span>
              <button onClick={() => copy(String(request.uniqueAmount), 'Amount')} className='ml-auto rounded-lg p-2 text-brand-300 transition hover:bg-white/10 hover:text-white' aria-label='Copy amount'>
                <Copy size={14} />
              </button>
            </div>
            <p className='mt-1.5 text-[11px] text-brand-200/70'>Unique amount helps admin identify your transfer</p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <DetailRow icon={CreditCard} label='Card number' value={request.cardNumber} onCopy={() => copy(request.cardNumber, 'Card number')} />
            <DetailRow icon={Phone} label='Phone number' value={request.phoneNumber} onCopy={() => copy(request.phoneNumber, 'Phone')} />
            <DetailRow icon={CheckCircle2} label='Card holder' value={request.cardHolder} />
            <DetailRow icon={Clock} label='Request ID' value={'#' + request.id.slice(-6).toUpperCase()} />
          </div>

          {isPending && !expired && (
            <>
              <div className='rounded-xl border border-line bg-bg-deep/40 p-3'>
                <p className='text-[11px] leading-relaxed text-ink-faint'>
                  <AlertCircle size={11} className='mr-1 inline text-warning' />
                  After making the transfer, click I paid. Admin will verify your payment and credit your wallet.
                </p>
              </div>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Button variant='ghost' onClick={onCancel} disabled={busy} className='text-danger hover:bg-danger/10'>
                  <Trash2 size={13} /> Cancel request
                </Button>
                <Button size='lg' onClick={markPaid} loading={busy} className='flex-1'>
                  <Check size={14} /> I paid - send to admin
                </Button>
              </div>
            </>
          )}

          {expired && (
            <div className='rounded-xl border border-danger/40 bg-danger/[.06] p-3'>
              <p className='text-xs font-semibold text-danger'>Request expired</p>
              <p className='mt-1 text-[11px] text-danger/80'>Cancel and create a new top-up request.</p>
              <Button variant='ghost' size='sm' onClick={onCancel} className='mt-2 text-danger hover:bg-danger/10'>Cancel</Button>
            </div>
          )}

          {!isPending && (
            <div className='rounded-xl border border-brand-600/30 bg-brand-600/[.06] p-3'>
              <p className='text-xs font-semibold text-brand-300'>Payment received</p>
              <p className='mt-1 text-[11px] text-brand-200/80'>Admin will credit {formatUZS(request.requestedAmount)} after verification.</p>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

function DetailRow({ icon: Icon, label, value, onCopy }: { icon: typeof Clock; label: string; value: string; onCopy?: () => void }) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3'>
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[.04] text-brand-400'><Icon size={14} /></span>
      <div className='min-w-0 flex-1'>
        <p className='text-[10px] uppercase tracking-wider text-ink-faint'>{label}</p>
        <p className='truncate font-mono text-sm font-semibold text-white'>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className='shrink-0 rounded-lg p-2 text-ink-faint transition hover:bg-white/5 hover:text-white' aria-label={'Copy ' + label}>
          <Copy size={13} />
        </button>
      )}
    </div>
  );
}

function CardRow({ card, onCopy }: {
  card: PaymentCard;
  onCopy: (v: string, l: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-600/40 bg-gradient-to-br from-brand-700/30 to-bg-deep p-3">
      {card.label && (
        <span className="absolute right-2 top-2 rounded-full bg-brand-600/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-200">
          {card.label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-brand-300">
          <CreditCard size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">Card number</p>
          <p className="truncate font-mono text-sm font-bold text-white">{card.cardNumber}</p>
        </div>
        <button
          onClick={() => onCopy(card.cardNumber, 'Card number')}
          className="shrink-0 rounded-lg p-2 text-brand-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Copy card number"
        >
          <Copy size={13} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-ink-faint">Holder</p>
          <p className="truncate font-mono text-xs font-semibold text-white">{card.cardHolder}</p>
        </div>
        <div className="flex items-center justify-end gap-1">
          <p className="truncate font-mono text-xs text-white">{card.phoneNumber}</p>
          <button
            onClick={() => onCopy(card.phoneNumber, 'Phone')}
            className="rounded-lg p-1 text-brand-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Copy phone"
          >
            <Copy size={11} />
          </button>
        </div>
      </div>
      {card.bankName && (
        <p className="mt-2 text-[10px] uppercase tracking-wider text-brand-200/70">{card.bankName}</p>
      )}
    </div>
  );
}

function calcSecondsLeft(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

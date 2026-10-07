import { useState } from 'react';
import {
  Banknote, Check, Copy, CreditCard, Edit3, Eye, EyeOff, Phone, Plus,
  Power, Save, ShieldCheck, Sparkles, Trash2, User as UserIcon, X,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { paymentSettingsApi } from '@/services/api';
import { formatUZS } from '@/lib/wallet';
import { cn, relativeTime } from '@/lib/utils';
import type { PaymentCard } from '@/types';

export function AdminPaymentSettings() {
  return <RequireAuth permission="settings.manage"><Inner /></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, refetch } = useAsync(() => paymentSettingsApi.get(), []);

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<PaymentCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [bounds, setBounds] = useState({ minTopUp: 1000, maxTopUp: 10000000 });
  const [boundsLoaded, setBoundsLoaded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<PaymentCard | null>(null);

  if (!user) return null;

  if (data && !boundsLoaded) {
    setBounds({ minTopUp: data.minTopUp, maxTopUp: data.maxTopUp });
    setBoundsLoaded(true);
  }

  const saveBounds = async () => {
    setBusy(true);
    try {
      await paymentSettingsApi.updateBounds(bounds.minTopUp, bounds.maxTopUp, user.id);
      toast('SUCCESS', 'Limits updated');
      void refetch();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (card: PaymentCard) => {
    try {
      await paymentSettingsApi.toggleCard(card.id, user.id);
      toast('SUCCESS', card.isActive ? 'Card disabled' : 'Card enabled');
      void refetch();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const doRemove = async () => {
    if (!confirmRemove) return;
    setBusy(true);
    try {
      await paymentSettingsApi.removeCard(confirmRemove.id, user.id);
      toast('SUCCESS', 'Card removed');
      setConfirmRemove(null);
      void refetch();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="p-12 text-center text-ink-faint">Loading...</div>;

  const activeCount = data.cards.filter(c => c.isActive).length;

  return (
    <div className="pb-16">
      <PageHeader
        title="Payment settings"
        subtitle={data.cards.length + ' card' + (data.cards.length === 1 ? '' : 's') + ' - ' + activeCount + ' active'}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={14} /> Add card
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {data.cards.length === 0 ? (
            <Card>
              <CardBody className="pt-8 text-center">
                <CreditCard size={32} className="mx-auto text-ink-faint" />
                <p className="mt-3 text-sm text-ink-muted">No cards configured</p>
                <Button onClick={() => setCreating(true)} className="mt-4">
                  <Plus size={14} /> Add first card
                </Button>
              </CardBody>
            </Card>
          ) : (
            data.cards.map(card => (
              <CardCard
                key={card.id}
                card={card}
                onEdit={() => setEditing(card)}
                onToggle={() => toggle(card)}
                onRemove={() => setConfirmRemove(card)}
              />
            ))
          )}

          <Card>
            <CardHeader>
              <CardTitle>Top-up limits</CardTitle>
              <Banknote size={14} className="text-warning" />
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Minimum top-up" hint="In UZS">
                  <Input
                    type="number"
                    value={bounds.minTopUp}
                    onChange={e => setBounds({ ...bounds, minTopUp: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </Field>
                <Field label="Maximum top-up" hint="In UZS">
                  <Input
                    type="number"
                    value={bounds.maxTopUp}
                    onChange={e => setBounds({ ...bounds, maxTopUp: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                  />
                </Field>
              </div>
              <Button onClick={saveBounds} loading={busy}>
                <Save size={14} /> Save limits
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>How it works</CardTitle></CardHeader>
            <CardBody className="space-y-3 text-xs text-ink-muted">
              <p className="flex items-start gap-2">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-success" />
                <span>Add multiple cards. Users see all active cards on the top-up page.</span>
              </p>
              <p className="flex items-start gap-2">
                <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-400" />
                <span>Unique amounts (5000 becomes 5001) help you match transfers automatically.</span>
              </p>
              <p className="mt-2 border-t border-line pt-2 text-[10px] text-ink-faint">
                Last updated: {relativeTime(data.updatedAt)}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <CardForm
        open={creating || !!editing}
        card={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={async (values) => {
          setBusy(true);
          try {
            if (editing) {
              await paymentSettingsApi.updateCard(editing.id, values, user.id);
              toast('SUCCESS', 'Card updated');
            } else {
              await paymentSettingsApi.addCard(values, user.id);
              toast('SUCCESS', 'Card added');
            }
            setCreating(false);
            setEditing(null);
            void refetch();
          } catch (e) {
            toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
      />

      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove card"
        description={confirmRemove ? confirmRemove.cardNumber : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={doRemove} loading={busy}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to remove this card? Users with pending top-ups will keep seeing the old card.
        </p>
      </Modal>
    </div>
  );
}

function CardCard({ card, onEdit, onToggle, onRemove }: {
  card: PaymentCard;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const [showNumber, setShowNumber] = useState(false);

  const copy = (v: string) => { void navigator.clipboard.writeText(v); };
  const masked = card.cardNumber.replace(/\d(?=\d{4})/g, '*');

  return (
    <Card className={cn(!card.isActive && 'opacity-70')}>
      <CardBody className="pt-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            card.isActive ? 'bg-brand-600/20 text-brand-400' : 'bg-white/[.04] text-ink-faint',
          )}>
            <CreditCard size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-base font-bold text-white">
                {showNumber ? card.cardNumber : masked}
              </p>
              <button
                onClick={() => setShowNumber(!showNumber)}
                className="rounded-lg p-1 text-ink-faint transition hover:bg-white/5 hover:text-white"
                aria-label="Toggle visibility"
              >
                {showNumber ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => copy(card.cardNumber)}
                className="rounded-lg p-1 text-ink-faint transition hover:bg-white/5 hover:text-white"
                aria-label="Copy"
              >
                <Copy size={13} />
              </button>
              {card.label && (
                <span className="rounded-full bg-brand-600/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {card.label}
                </span>
              )}
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                card.isActive ? 'bg-success/15 text-success' : 'bg-white/[.05] text-ink-faint',
              )}>
                {card.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-faint">
              <span className="flex items-center gap-1"><UserIcon size={11} /> {card.cardHolder}</span>
              <span className="flex items-center gap-1"><Phone size={11} /> {card.phoneNumber}</span>
              {card.bankName && <span className="flex items-center gap-1"><Banknote size={11} /> {card.bankName}</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" variant="primary" onClick={onEdit} className="flex-1 sm:flex-none">
            <Edit3 size={13} /> Edit card
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onToggle}
            className="flex-1 sm:flex-none"
          >
            {card.isActive ? <><Power size={13} /> Disable</> : <><Check size={13} /> Enable</>}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="flex-1 text-danger hover:bg-danger/10 sm:flex-none"
          >
            <Trash2 size={13} /> Remove
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function CardForm({ open, card, onClose, onSave, busy }: {
  open: boolean;
  card: PaymentCard | null;
  onClose: () => void;
  onSave: (values: Omit<PaymentCard, 'id' | 'createdAt'>) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState({
    cardNumber: '', cardHolder: '', phoneNumber: '', bankName: '', label: '', isActive: true,
  });

  // Reset form when opening
  if (open && !card && form.cardNumber === '' && form.cardHolder === '') {
    // fresh - nothing to do
  }

  // Load card values when editing opens
  if (open && card && form.cardNumber !== card.cardNumber) {
    setForm({
      cardNumber: card.cardNumber,
      cardHolder: card.cardHolder,
      phoneNumber: card.phoneNumber,
      bankName: card.bankName,
      label: card.label ?? '',
      isActive: card.isActive,
    });
  }

  // Reset after closing
  if (!open && (form.cardNumber !== '' || form.cardHolder !== '')) {
    setForm({ cardNumber: '', cardHolder: '', phoneNumber: '', bankName: '', label: '', isActive: true });
  }

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const submit = () => {
    if (!form.cardNumber.trim() || !form.cardHolder.trim() || !form.phoneNumber.trim()) return;
    onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card ? 'Edit card' : 'Add new card'}
      description="This card will be shown to users on the top-up page"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}><X size={13} /> Cancel</Button>
          <Button
            onClick={submit}
            loading={busy}
            disabled={!form.cardNumber || !form.cardHolder || !form.phoneNumber}
          >
            <Save size={13} /> {card ? 'Save changes' : 'Add card'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Card number" required>
          <Input
            value={form.cardNumber}
            onChange={e => set('cardNumber', e.target.value)}
            placeholder="8600 1234 5678 9012"
            className="font-mono"
          />
        </Field>
        <Field label="Card holder" required>
          <Input
            value={form.cardHolder}
            onChange={e => set('cardHolder', e.target.value)}
            placeholder="RANGER ESPORTS"
          />
        </Field>
        <Field label="Phone number" required>
          <Input
            value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </Field>
        <Field label="Bank / provider">
          <Input
            value={form.bankName}
            onChange={e => set('bankName', e.target.value)}
            placeholder="Click / Payme / Uzum"
          />
        </Field>
        <Field label="Label" hint="Optional, e.g. Main, Backup">
          <Input
            value={form.label}
            onChange={e => set('label', e.target.value)}
            placeholder="Main card"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg-deep/40 p-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-line bg-bg-deep"
          />
          <span className="text-xs text-ink-muted">Active (visible to users on top-up page)</span>
        </label>
      </div>
    </Modal>
  );
}

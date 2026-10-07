import type { PaymentCard, PaymentSettings, TopUpRequest } from '@/types';

export const TOPUP_WINDOW_MINUTES = 15;
export const DELTA_RANGE = 99;

export function generateUniqueAmount(requested: number, active: TopUpRequest[]): number {
  const taken = new Set(
    active
      .filter(r => r.status === 'PENDING_PAYMENT' || r.status === 'AWAITING_CONFIRMATION')
      .map(r => r.uniqueAmount),
  );
  for (let d = 1; d <= DELTA_RANGE; d++) {
    if (!taken.has(requested + d)) return requested + d;
  }
  return requested + Math.floor(Math.random() * 900) + 100;
}

export const formatUZS = (n: number): string =>
  new Intl.NumberFormat('en-US').format(Math.round(n)) + ' UZS';

export const DEFAULT_CARD: PaymentCard = {
  id: 'card_default',
  cardNumber: '8600 1234 5678 9012',
  cardHolder: 'RANGER ESPORTS',
  phoneNumber: '+998 90 123 45 67',
  bankName: 'Click / Payme / Uzum',
  label: 'Main card',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_PAYMENT_SETTINGS: Omit<PaymentSettings, 'updatedAt' | 'updatedBy'> = {
  cards: [DEFAULT_CARD],
  minTopUp: 1000,
  maxTopUp: 10000000,
};

export function activeCards(settings: PaymentSettings): PaymentCard[] {
  return (settings.cards ?? []).filter(c => c.isActive);
}

export function pickPrimaryCard(settings: PaymentSettings): PaymentCard | undefined {
  const active = activeCards(settings);
  return active[0];
}

export function isTopUpExpired(r: TopUpRequest): boolean {
  if (r.status !== 'PENDING_PAYMENT') return false;
  return new Date(r.expiresAt).getTime() < Date.now();
}

import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn, formatNumber } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, tone = 'brand', className }:
  { icon:LucideIcon; label:string; value:number; tone?:'brand'|'success'|'warning'|'danger'; className?:string }) {
  const d = useCountUp(value);
  const t = {
    brand:'text-brand-400 bg-brand-600/10',
    success:'text-success bg-success/10',
    warning:'text-warning bg-warning/10',
    danger:'text-danger bg-danger/10'
  }[tone];

  return <div className={cn('surface p-4 hover:border-brand-600/30 transition-colors', className)}>
    <div className="flex items-center gap-3">
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t)}><Icon size={17}/></span>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
    </div>
    <p className="mt-3 font-display text-2xl font-bold tabular-nums text-white">{formatNumber(d)}</p>
  </div>;
}
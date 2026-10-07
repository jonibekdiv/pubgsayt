import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem { id:string; label:string; count?:number }

export function Tabs({ items, value, onChange, className }:
  { items:TabItem[]; value:string; onChange:(id:string)=>void; className?:string }) {
  return <div role="tablist" className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.03] p-1 backdrop-blur-xl', className)}>
    {items.map(item => {
      const active = item.id === value;
      return <button key={item.id} role="tab" aria-selected={active} onClick={() => onChange(item.id)}
        className={cn('relative shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm',
          active ? 'text-white' : 'text-ink-faint hover:text-ink-muted')}>
        {active && <motion.span layoutId="tab-pill" transition={{ type:'spring', stiffness:480, damping:38 }}
          className="absolute inset-0 rounded-xl bg-brand-600/25 ring-1 ring-inset ring-brand-500/40"/>}
        <span className="relative flex items-center gap-1.5">
          {item.label}
          {item.count !== undefined && <span className="rounded-full bg-white/10 px-1.5 py-px text-[10px] tabular-nums">{item.count}</span>}
        </span>
      </button>;
    })}
  </div>;
}
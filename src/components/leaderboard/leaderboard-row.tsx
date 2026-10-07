import { motion } from 'framer-motion';
import type { LeaderboardRow } from '@/types';
import { cn } from '@/lib/utils';

const RANK: Record<number,string> = {
  1:'bg-gradient-to-br from-amber-400 to-amber-600 text-black',
  2:'bg-gradient-to-br from-slate-200 to-slate-400 text-black',
  3:'bg-gradient-to-br from-orange-400 to-orange-700 text-black'
};

export function LeaderboardRowItem({ row, index }: { row:LeaderboardRow; index:number }) {
  const top3 = row.rank <= 3;
  return (
    <motion.div
      layout
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: Math.min(index*0.015, 0.3), duration:0.25 }}
      className={cn(
        'group relative flex w-full items-stretch overflow-hidden rounded-xl border transition-colors',
        top3
          ? 'border-brand-600/35 bg-gradient-to-r from-brand-600/[.14] via-bg-panel to-bg-panel'
          : 'border-line bg-bg-panel/70 hover:border-brand-600/25'
      )}
    >
      <div className={cn(
        'flex min-h-[52px] w-9 shrink-0 items-center justify-center font-display text-xs font-bold tabular-nums sm:w-12 sm:text-base',
        RANK[row.rank] ?? 'bg-brand-600/85 text-white'
      )}>
        {String(row.rank).padStart(2, '0')}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1.5 py-2.5 pl-1.5 pr-1 sm:gap-2.5 sm:pl-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-bg-deep sm:h-8 sm:w-8 sm:rounded-lg">
          {row.teamLogo
            ? <img src={row.teamLogo} alt="" className="h-full w-full object-cover" loading="lazy"/>
            : <span className="font-display text-[9px] font-bold text-brand-400 sm:text-[10px]">{row.teamTag.slice(0,3)}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[11px] font-semibold uppercase tracking-wide text-white sm:text-sm">
            {row.teamName}
          </p>
          <p className="truncate text-[9px] font-medium text-ink-faint sm:text-[11px]">| {row.teamTag.toLowerCase()}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-stretch">
        <Cell label="CD" value={row.cd}/>
        <Cell label="PP" value={row.pp}/>
        <Cell label="KP" value={row.kp}/>
        <Cell label="TP" value={row.tp} emphasis/>
      </div>
    </motion.div>
  );
}

function Cell({ label, value, emphasis }: { label:string; value:number; emphasis?:boolean }) {
  return (
    <div className={cn(
      'flex w-10 flex-col items-center justify-center border-l border-white/[.06] py-1.5 sm:w-14',
      emphasis && 'bg-brand-600/25'
    )}>
      <span className="text-[8px] font-semibold uppercase tracking-wider text-ink-faint sm:text-[9px]">{label}</span>
      <span className={cn(
        'font-mono text-[11px] font-bold tabular-nums sm:text-base',
        emphasis ? 'text-white' : 'text-ink-muted'
      )}>
        {String(value).padStart(2, '0')}
      </span>
    </div>
  );
}
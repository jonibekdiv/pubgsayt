import { Crown } from 'lucide-react';
import type { LeaderboardRow } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

export function LeaderboardPodium({ rows }: { rows:LeaderboardRow[] }) {
  if (rows.length < 3) return null;
  const [first, second, third] = rows as [LeaderboardRow, LeaderboardRow, LeaderboardRow];
  const order = [second, first, third];
  const heights = ['h-20 sm:h-24','h-24 sm:h-32','h-16 sm:h-20'];
  const medals = ['#CBD5E1','#FBBF24','#FB923C'];

  return (
    <div className="grid w-full min-w-0 grid-cols-3 items-end gap-2 sm:gap-4">
      {order.map((row, i) => (
        <div key={row.teamId} className="flex min-w-0 flex-col items-center">
          {i === 1 && <Crown size={16} className="mb-1.5 text-amber-400 sm:mb-2 sm:h-5 sm:w-5"/>}
          <div className="mb-1.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-bg-deep sm:mb-2 sm:h-12 sm:w-12 sm:rounded-xl">
            {row.teamLogo
              ? <img src={row.teamLogo} alt="" className="h-full w-full object-cover"/>
              : <span className="font-display text-[10px] font-bold text-brand-400 sm:text-xs">{row.teamTag}</span>}
          </div>
          <p className="mb-1.5 line-clamp-1 w-full px-0.5 text-center font-display text-[9px] font-semibold uppercase text-white sm:mb-2 sm:text-xs">
            {row.teamName}
          </p>
          <div
            className={cn('flex w-full flex-col items-center justify-center rounded-t-lg border-t-2 sm:rounded-t-xl', heights[i])}
            style={{ borderColor:medals[i], backgroundImage:'linear-gradient(to bottom, ' + medals[i] + '22, transparent)' }}
          >
            <span className="font-mono text-sm font-bold tabular-nums text-white sm:text-lg">{formatNumber(row.tp)}</span>
            <span className="text-[8px] uppercase tracking-wider text-ink-faint sm:text-[10px]">pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
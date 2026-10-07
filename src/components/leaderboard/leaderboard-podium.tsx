import { Crown } from 'lucide-react';
import type { LeaderboardRow } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

export function LeaderboardPodium({ rows }: { rows:LeaderboardRow[] }) {
  if (rows.length < 3) return null;
  const [first, second, third] = rows as [LeaderboardRow, LeaderboardRow, LeaderboardRow];
  const order = [second, first, third];
  const heights = ['h-24','h-32','h-20'];
  const medals = ['#CBD5E1','#FBBF24','#FB923C'];

  return <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
    {order.map((row, i) => (
      <div key={row.teamId} className="flex flex-col items-center">
        {i === 1 && <Crown size={20} className="mb-2 text-amber-400"/>}
        <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-bg-deep">
          {row.teamLogo
            ? <img src={row.teamLogo} alt="" className="h-full w-full object-cover"/>
            : <span className="font-display text-xs font-bold text-brand-400">{row.teamTag}</span>}
        </div>
        <p className="mb-2 line-clamp-1 text-center font-display text-xs font-semibold uppercase text-white">{row.teamName}</p>
        <div className={cn('flex w-full flex-col items-center justify-center rounded-t-xl border-t-2', heights[i])}
          style={{ borderColor:medals[i], backgroundImage:'linear-gradient(to bottom, ' + medals[i] + '22, transparent)' }}>
          <span className="font-mono text-lg font-bold tabular-nums text-white">{formatNumber(row.tp)}</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">points</span>
        </div>
      </div>
    ))}
  </div>;
}
import { motion } from 'framer-motion';
import { Radio, Trophy } from 'lucide-react';
import type { LeaderboardRow } from '@/types';
import { LeaderboardRowItem } from './leaderboard-row';
import { LeaderboardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export function LeaderboardTable({ rows, loading, live, compact }:
  { rows:LeaderboardRow[]; loading?:boolean; live?:boolean; lastUpdated?:string; compact?:boolean }) {
  if (loading) return <LeaderboardSkeleton rows={10}/>;
  if (!rows.length) return <EmptyState icon={Trophy} title="No standings yet" description="The leaderboard appears once results are published."/>;

  const split = compact ? rows.length : Math.ceil(rows.length/2);
  const left = rows.slice(0, split);
  const right = rows.slice(split);

  return <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {live && <span className="flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-danger">
          <Radio size={11} className="animate-pulse-live"/> Live
        </span>}
        <span className="text-xs text-ink-faint">{rows.length} teams</span>
      </div>
    </div>
    <div className={compact ? 'space-y-2' : 'grid gap-x-4 gap-y-2 xl:grid-cols-2'}>
      <motion.div layout className="space-y-2">
        {left.map((r, i) => <LeaderboardRowItem key={r.teamId} row={r} index={i}/>)}
      </motion.div>
      {right.length > 0 && <motion.div layout className="space-y-2">
        {right.map((r, i) => <LeaderboardRowItem key={r.teamId} row={r} index={left.length+i}/>)}
      </motion.div>}
    </div>
  </div>;
}
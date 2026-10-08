import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Achievement } from '@/lib/achievements';
import { tierStyle } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface Props {
  achievements: Achievement[];
  compact?: boolean;
}

export function AchievementsGrid({ achievements, compact }: Props) {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  const ordered = [...unlocked, ...locked];

  if (ordered.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Achievements
        </p>
        <p className="text-xs text-ink-faint">
          <span className="font-bold text-brand-400">{unlocked.length}</span>
          {' / '}
          {achievements.length}
        </p>
      </div>

      <div
        className={cn(
          'grid gap-2.5 sm:gap-3',
          compact
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
        )}
      >
        {ordered.map((a, i) => (
          <AchievementCard key={a.id} achievement={a} index={i} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement: a,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const tier = tierStyle(a.tier);
  const Icon = a.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-3 transition',
        a.unlocked
          ? cn(tier.border, tier.bg, 'shadow-lg')
          : 'border-line bg-bg-deep/40 opacity-70',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            a.unlocked
              ? cn(tier.bg, tier.text, 'ring-2', tier.ring)
              : 'bg-white/[.04] text-ink-faint',
          )}
        >
          {a.unlocked ? <Icon size={18} /> : <Lock size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-display text-xs font-bold uppercase tracking-wider',
              a.unlocked ? 'text-white' : 'text-ink-faint',
            )}
          >
            {a.name}
          </p>
          <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
            {a.tier}
          </p>
        </div>
      </div>

      <p
        className={cn(
          'mt-2 line-clamp-2 text-[11px] leading-relaxed',
          a.unlocked ? 'text-ink-muted' : 'text-ink-faint',
        )}
      >
        {a.description}
      </p>

      {!a.unlocked && (
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-ink-faint">
            <span>Progress</span>
            <span className="font-mono tabular-nums">
              {a.current} / {a.target}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: a.progress * 100 + '%' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn('h-full rounded-full', tier.text.replace('text-', 'bg-'))}
            />
          </div>
        </div>
      )}

      {a.unlocked && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', tier.text.replace('text-', 'bg-'))}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-success">
            Unlocked
          </span>
        </div>
      )}
    </motion.div>
  );
}
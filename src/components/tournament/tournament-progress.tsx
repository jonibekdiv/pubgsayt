import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Radio, X } from 'lucide-react';
import type { Stage, Tournament } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  tournament: Tournament;
  /** Optional: which stages are completed */
  completedStageIds?: string[];
  /** Optional: active stage */
  activeStageId?: string;
}

const STAGE_STATUS_STYLE = {
  FINISHED: {
    bg: 'bg-success/15',
    border: 'border-success/40',
    text: 'text-success',
    icon: Check,
  },
  LIVE: {
    bg: 'bg-danger/15',
    border: 'border-danger/40',
    text: 'text-danger',
    icon: Radio,
  },
  UPCOMING: {
    bg: 'bg-white/[.04]',
    border: 'border-line',
    text: 'text-ink-faint',
    icon: Clock,
  },
} as const;

export function TournamentProgress({ tournament, completedStageIds, activeStageId }: Props) {
  const stages = [...tournament.stages].sort((a, b) => a.order - b.order);
  if (stages.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Tournament Progress
        </p>
        <p className="text-[11px] text-ink-faint">
          {stages.filter(s => s.status === 'FINISHED').length} / {stages.length} completed
        </p>
      </div>

      {/* Horizontal scroll on mobile, wrap on desktop */}
      <div className="no-scrollbar -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-stretch gap-2 sm:min-w-0 sm:flex-wrap sm:gap-3">
          {stages.map((stage, idx) => {
            const isCompleted = completedStageIds?.includes(stage.id) || stage.status === 'FINISHED';
            const isActive = activeStageId === stage.id || stage.status === 'LIVE';
            const statusKey: keyof typeof STAGE_STATUS_STYLE = isCompleted
              ? 'FINISHED'
              : isActive
                ? 'LIVE'
                : 'UPCOMING';
            const style = STAGE_STATUS_STYLE[statusKey];
            const Icon = style.icon;

            return (
              <div key={stage.id} className="flex items-center gap-2 sm:gap-3">
                <StageCard
                  stage={stage}
                  status={statusKey}
                  style={style}
                  Icon={Icon}
                  stageNumber={idx + 1}
                  totalStages={stages.length}
                />
                {idx < stages.length - 1 && (
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-ink-faint/40"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <SummaryStats stages={stages} />
    </div>
  );
}

function StageCard({
  stage,
  status,
  style,
  Icon,
  stageNumber,
  totalStages,
}: {
  stage: Stage;
  status: 'FINISHED' | 'LIVE' | 'UPCOMING';
  style: typeof STAGE_STATUS_STYLE['FINISHED'];
  Icon: typeof Check;
  stageNumber: number;
  totalStages: number;
}) {
  return (
    <div
      className={cn(
        'flex min-w-[180px] flex-col gap-2 rounded-2xl border p-3 transition sm:min-w-[200px]',
        style.border,
        style.bg,
        status === 'LIVE' && 'ring-2 ring-danger/30',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            style.bg,
            style.text,
          )}
        >
          <Icon size={14} className={status === 'LIVE' ? 'animate-pulse-live' : ''} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Stage {stageNumber} / {totalStages}
          </p>
          <p className={cn('truncate font-display text-sm font-bold', style.text)}>
            {stage.name}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-faint">
        <span>
          <span className="font-semibold text-ink-muted">{stage.teamCount}</span> teams
        </span>
        <span>
          <span className="font-semibold text-ink-muted">{stage.matchCount}</span> matches
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {stage.maps.slice(0, 4).map((m, i) => (
          <span
            key={i}
            className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-faint"
          >
            {m.slice(0, 3)}
          </span>
        ))}
      </div>

      {stage.qualificationCount && stage.qualificationCount > 0 && (
        <div className="flex items-center gap-1 rounded-lg bg-brand-600/10 px-2 py-1">
          <span className="text-[9px] uppercase tracking-wider text-brand-400">
            Top {stage.qualificationCount} advance
          </span>
        </div>
      )}

      {status === 'FINISHED' && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-success">
          <Check size={10} /> Completed
        </div>
      )}
      {status === 'LIVE' && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-danger">
          <Radio size={10} className="animate-pulse-live" /> Live now
        </div>
      )}
      {status === 'UPCOMING' && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
          <Clock size={10} /> Not started
        </div>
      )}
    </div>
  );
}

function SummaryStats({ stages }: { stages: Stage[] }) {
  const totalTeams = stages.reduce((sum, s) => sum + s.teamCount, 0);
  const totalMatches = stages.reduce((sum, s) => sum + s.matchCount, 0);
  const finished = stages.filter(s => s.status === 'FINISHED').length;
  const live = stages.filter(s => s.status === 'LIVE').length;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MiniStat label="Stages" value={stages.length} />
      <MiniStat label="Matches" value={totalMatches} />
      <MiniStat label="Completed" value={finished} tone="success" />
      <MiniStat label="Live" value={live} tone="danger" />
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'danger';
}) {
  return (
    <div className="surface p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-display text-lg font-bold tabular-nums',
          tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
void Link;
void X;
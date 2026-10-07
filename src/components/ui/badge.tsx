import type { HTMLAttributes } from 'react';
import type { TournamentStatus } from '@/types';
import { cn } from '@/lib/utils';

type Tone = 'brand'|'success'|'warning'|'danger'|'muted'|'live';

const TONES: Record<Tone,string> = {
  brand:'bg-brand-600/15 text-brand-400 border-brand-600/30',
  success:'bg-success/12 text-success border-success/30',
  warning:'bg-warning/12 text-warning border-warning/30',
  danger:'bg-danger/12 text-danger border-danger/30',
  muted:'bg-white/[.05] text-ink-faint border-white/[.08]',
  live:'bg-danger/15 text-danger border-danger/40'
};

export function Badge({ tone='muted', className, ...p }: HTMLAttributes<HTMLSpanElement> & { tone?:Tone }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider', TONES[tone], className)} {...p}/>;
}

const ST: Record<TournamentStatus,Tone> = {
  DRAFT:'muted',
  REGISTRATION_OPEN:'success',
  REGISTRATION_CLOSED:'warning',
  UPCOMING:'brand',
  LIVE:'live',
  PAUSED:'warning',
  FINISHED:'muted',
  CANCELLED:'danger'
};
const SL: Record<TournamentStatus,string> = {
  DRAFT:'Draft',
  REGISTRATION_OPEN:'Registration Open',
  REGISTRATION_CLOSED:'Registration Closed',
  UPCOMING:'Upcoming',
  LIVE:'Live',
  PAUSED:'Paused',
  FINISHED:'Finished',
  CANCELLED:'Cancelled'
};

export function StatusBadge({ status, className }: { status:TournamentStatus; className?:string }) {
  return <Badge tone={ST[status]} className={className}>
    {status === 'LIVE' && <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse-live" aria-hidden/>}
    {SL[status]}
  </Badge>;
}
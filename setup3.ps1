# ============================================================
#  RANGER ESPORTS - setup3.ps1 (UI + layout)
#  Ishga tushirish: powershell -ExecutionPolicy Bypass -File setup3.ps1
#  MUHIM: faylni UTF-8 encoding bilan saqlang (BOMsiz)
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "==> setup3: UI + layout..." -ForegroundColor Cyan

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if ($parent -and -not (Test-Path $parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  [+] $RelPath" -ForegroundColor DarkGray
}

Write-File 'src/components/ui/button.tsx' @'
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type V = 'primary'|'secondary'|'ghost'|'danger'|'outline';
type S = 'sm'|'md'|'lg'|'icon';

const VR: Record<V,string> = {
  primary:'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
  secondary:'bg-white/[.06] text-white hover:bg-white/[.11] border border-white/[.08]',
  ghost:'text-ink-muted hover:bg-white/[.06] hover:text-white',
  danger:'bg-danger/90 text-white hover:bg-danger',
  outline:'border border-brand-600/60 text-brand-400 hover:bg-brand-600/10'
};
const SR: Record<S,string> = {
  sm:'h-8 px-3 text-xs gap-1.5',
  md:'h-10 px-4 text-sm gap-2',
  lg:'h-12 px-6 text-sm gap-2',
  icon:'h-10 w-10'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: V;
  size?: S;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='primary', size='md', loading, disabled, children, ...p }, ref) => (
    <button ref={ref} disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center rounded-xl font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-45 active:scale-[.985]', VR[variant], SR[size], className)} {...p}>
      {loading && <Loader2 className="animate-spin" size={14} />}{children}
    </button>
  )
);
Button.displayName = 'Button';
'@

Write-File 'src/components/ui/card.tsx' @'
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { glass?: boolean }>(
  ({ className, glass, ...p }, ref) => (
    <div ref={ref} className={cn('rounded-2xl border transition-colors',
      glass ? 'glass' : 'border-line bg-bg-panel/70 backdrop-blur-sm', className)} {...p}/>
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('flex items-center justify-between gap-3 px-5 py-4', className)} {...p}/>;

export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) =>
  <h3 className={cn('font-display text-sm font-semibold uppercase tracking-wider text-white', className)} {...p}/>;

export const CardBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('px-5 pb-5', className)} {...p}/>;
'@

Write-File 'src/components/ui/badge.tsx' @'
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
'@

Write-File 'src/components/ui/input.tsx' @'
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const BASE = 'w-full rounded-xl border border-line bg-bg-deep/60 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-faint/70 transition focus:border-brand-600/70 focus:bg-bg-deep focus:outline-none focus:ring-2 focus:ring-brand-600/25';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(BASE, className)} {...p}/>
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cn(BASE, 'min-h-28 resize-y', className)} {...p}/>
);
Textarea.displayName = 'Textarea';

export function Field({ label, hint, error, required, children }:
  { label:string; hint?:string; error?:string; required?:boolean; children:ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-muted">
        {label}{required && <span className="text-danger">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span>
             : hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
'@

Write-File 'src/components/ui/skeleton.tsx' @'
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?:string }) {
  return <div className={cn('relative overflow-hidden rounded-lg bg-white/[.05]', className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[.07] to-transparent"/>
  </div>;
}

export function LeaderboardSkeleton({ rows = 8 }: { rows?:number }) {
  return <div className="space-y-2">
    {Array.from({ length:rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg"/>
        <Skeleton className="h-9 flex-1"/>
        <Skeleton className="h-9 w-16"/>
      </div>
    ))}
  </div>;
}

export function CardGridSkeleton({ count = 6 }: { count?:number }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length:count }).map((_, i) => (
      <div key={i} className="surface overflow-hidden">
        <Skeleton className="h-36 w-full rounded-none"/>
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-2/3"/>
          <Skeleton className="h-3 w-1/3"/>
        </div>
      </div>
    ))}
  </div>;
}
'@

Write-File 'src/components/ui/empty-state.tsx' @'
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, description, action }:
  { icon:LucideIcon; title:string; description?:string; action?:ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-400">
      <Icon size={24}/>
    </div>
    <p className="font-display text-base font-semibold text-white">{title}</p>
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-faint">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>;
}
'@

Write-File 'src/components/ui/avatar.tsx' @'
import { cn, initials } from '@/lib/utils';

export function Avatar({ src, name, size = 36, className, ring }:
  { src?:string; name:string; size?:number; className?:string; ring?:boolean }) {
  return <span style={{ width:size, height:size }}
    className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600/20 text-brand-400',
      ring && 'ring-2 ring-brand-600/40', className)}>
    {src
      ? <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy"/>
      : <span className="font-display text-xs font-bold">{initials(name)}</span>}
  </span>;
}
'@

Write-File 'src/components/ui/tabs.tsx' @'
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
'@

Write-File 'src/components/ui/modal.tsx' @'
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Modal({ open, onClose, title, description, children, footer, className }:
  { open:boolean; onClose:()=>void; title:string; description?:string;
    children:ReactNode; footer?:ReactNode; className?:string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e:KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>
        <motion.div role="dialog" aria-modal="true" aria-label={title}
          initial={{ opacity:0, y:40, scale:.98 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:24, scale:.98 }} transition={{ type:'spring', stiffness:400, damping:34 }}
          className={cn('glass-strong relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl sm:max-w-lg sm:rounded-3xl', className)}>
          <div className="flex items-start justify-between gap-4 border-b border-white/[.07] px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">{title}</h2>
              {description && <p className="mt-0.5 text-xs text-ink-faint">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close"
              className="rounded-lg p-1.5 text-ink-faint hover:bg-white/5 hover:text-white">
              <X size={16}/>
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-white/[.07] px-5 py-4">{footer}</div>}
        </motion.div>
      </div>
    )}
  </AnimatePresence>;
}
'@

Write-File 'src/components/ui/stat-card.tsx' @'
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
'@

Write-File 'src/components/ui/dropdown.tsx' @'
import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const Ctx = createContext<{ open:boolean; setOpen:(v:boolean)=>void } | null>(null);

export function DropdownMenu({ children }: { children:ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e:MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return <Ctx.Provider value={{ open, setOpen }}>
    <div ref={ref} className="relative">{children}</div>
  </Ctx.Provider>;
}

export function DropdownMenuTrigger({ children }: { children:ReactNode; asChild?:boolean }) {
  const ctx = useContext(Ctx)!;
  return <div onClick={() => ctx.setOpen(!ctx.open)}>{children}</div>;
}

export function DropdownMenuContent({ children, align='start', className }:
  { children:ReactNode; align?:'start'|'end'; className?:string }) {
  const ctx = useContext(Ctx)!;
  return <AnimatePresence>
    {ctx.open && (
      <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
        className={cn('absolute top-[calc(100%+6px)] z-50 min-w-44 overflow-hidden rounded-xl border border-white/[.08] bg-bg-panel/95 p-1 shadow-glass backdrop-blur-xl',
          align === 'end' ? 'right-0' : 'left-0', className)}>
        {children}
      </motion.div>
    )}
  </AnimatePresence>;
}

export function DropdownMenuItem({ children, onClick, danger, className }:
  { children:ReactNode; onClick?:()=>void; danger?:boolean; className?:string }) {
  const ctx = useContext(Ctx)!;
  return <button onClick={() => { onClick?.(); ctx.setOpen(false); }}
    className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
      danger ? 'text-danger hover:bg-danger/10' : 'text-ink-muted hover:bg-white/[.06] hover:text-white', className)}>
    {children}
  </button>;
}
'@

Write-File 'src/components/common/page-header.tsx' @'
import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?:ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>}
    </div>
    {action}
  </div>;
}
'@

Write-File 'src/components/common/require-auth.tsx' @'
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

export function RequireAuth({ children, permission }:
  { children:ReactNode; permission?:string | string[] }) {
  const { user, loading, can } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace/>;
  if (permission && !can(permission)) return <Navigate to="/403" replace/>;
  return <>{children}</>;
}
'@

Write-File 'src/components/common/youtube-embed.tsx' @'
import { extractYouTubeId } from '@/lib/utils';

export function YouTubeEmbed({ url, title }: { url:string; title?:string }) {
  const id = extractYouTubeId(url);
  if (!id) return <div className="flex aspect-video items-center justify-center rounded-2xl border border-line bg-bg-panel text-sm text-ink-faint">Invalid YouTube URL</div>;
  return <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black">
    <iframe src={'https://www.youtube.com/embed/' + id} title={title ?? 'YouTube'}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen loading="lazy"/>
  </div>;
}
'@

Write-File 'src/components/leaderboard/leaderboard-row.tsx' @'
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
  return <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
    transition={{ delay: Math.min(index*0.015, 0.3), duration:0.25 }}
    className={cn('group relative flex items-center gap-2 overflow-hidden rounded-xl border transition-colors sm:gap-3',
      top3 ? 'border-brand-600/35 bg-gradient-to-r from-brand-600/[.14] via-bg-panel to-bg-panel'
           : 'border-line bg-bg-panel/70 hover:border-brand-600/25')}>
    <div className={cn('flex h-full min-h-[52px] w-11 shrink-0 items-center justify-center font-display text-sm font-bold tabular-nums sm:w-12 sm:text-base',
      RANK[row.rank] ?? 'bg-brand-600/85 text-white')}>
      {String(row.rank).padStart(2, '0')}
    </div>
    <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-bg-deep">
        {row.teamLogo
          ? <img src={row.teamLogo} alt="" className="h-full w-full object-cover" loading="lazy"/>
          : <span className="font-display text-[10px] font-bold text-brand-400">{row.teamTag.slice(0,3)}</span>}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-[13px] font-semibold uppercase tracking-wide text-white sm:text-sm">
          {row.teamName}
          <span className="ml-1.5 text-[11px] font-medium normal-case text-ink-faint">| {row.teamTag.toLowerCase()}</span>
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-stretch">
      <Cell label="CD" value={row.cd}/>
      <Cell label="PP" value={row.pp}/>
      <Cell label="KP" value={row.kp}/>
      <Cell label="TP" value={row.tp} emphasis/>
    </div>
  </motion.div>;
}

function Cell({ label, value, emphasis }: { label:string; value:number; emphasis?:boolean }) {
  return <div className={cn('flex w-12 flex-col items-center justify-center border-l border-white/[.06] py-1.5 sm:w-14',
    emphasis && 'bg-brand-600/25')}>
    <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
    <span className={cn('font-mono text-sm font-bold tabular-nums sm:text-base',
      emphasis ? 'text-white' : 'text-ink-muted')}>
      {String(value).padStart(2, '0')}
    </span>
  </div>;
}
'@

Write-File 'src/components/leaderboard/leaderboard-table.tsx' @'
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
'@

Write-File 'src/components/leaderboard/leaderboard-podium.tsx' @'
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
'@

Write-File 'src/components/tournament/tournament-card.tsx' @'
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Map, Trophy, Users } from 'lucide-react';
import type { Tournament } from '@/types';
import { StatusBadge } from '@/components/ui/badge';
import { MAP_LABEL, formatDate, formatMoney } from '@/lib/utils';

export function TournamentCard({ tournament: t }: { tournament:Tournament }) {
  return <motion.div whileHover={{ y:-4 }} transition={{ type:'spring', stiffness:400, damping:28 }}>
    <Link to={'/tournaments/' + t.id} className="group block surface overflow-hidden transition-colors hover:border-brand-600/40">
      <div className="relative h-36 overflow-hidden bg-bg-deep">
        {t.banner && <img src={t.banner} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-panel via-bg-panel/40 to-transparent"/>
        <div className="absolute left-3 top-3"><StatusBadge status={t.status}/></div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {t.logo && <img src={t.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-line bg-bg-deep object-cover"/>}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold uppercase tracking-wide text-white">{t.name}</p>
            <p className="text-xs text-ink-faint">{t.shortName}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Trophy size={13} className="text-brand-400"/> {formatMoney(t.prizePool)}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} className="text-brand-400"/> {formatDate(t.startDate)}</span>
          <span className="flex items-center gap-1.5"><Users size={13} className="text-brand-400"/> {t.maxTeams} teams</span>
          <span className="flex items-center gap-1.5 truncate"><Map size={13} className="text-brand-400"/> {t.maps.slice(0,2).map(m => MAP_LABEL[m]).join(', ')}</span>
        </div>
      </div>
    </Link>
  </motion.div>;
}
'@

Write-File 'src/components/layout/nav-config.ts' @'
import { BarChart3, Gauge, LayoutDashboard, ListOrdered, Radio, ScrollText, Settings, Shield, Swords, Trophy, User, UserCog, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem { label:string; to:string; icon:LucideIcon; permission?:string; exact?:boolean }

export const PLAYER_NAV: NavItem[] = [
  { label:'Dashboard', to:'/dashboard', icon:LayoutDashboard, permission:'dashboard.view' },
  { label:'Tournaments', to:'/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Live', to:'/live', icon:Radio },
  { label:'Teams', to:'/teams', icon:Users },
  { label:'Leaderboard', to:'/leaderboard', icon:ListOrdered, permission:'leaderboard.view' },
  { label:'My Team', to:'/my-team', icon:Swords },
  { label:'Profile', to:'/profile', icon:User }
];

export const ORGANIZER_NAV: NavItem[] = [
  { label:'Overview', to:'/organizer', icon:Gauge, permission:'dashboard.view', exact:true },
  { label:'Tournaments', to:'/organizer/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Hosts', to:'/organizer/hosts', icon:UserCog, permission:'hosts.manage' }
];

export const HOST_NAV: NavItem[] = [
  { label:'Overview', to:'/host', icon:Gauge, permission:'dashboard.view', exact:true },
  { label:'Assigned', to:'/host/tournaments', icon:Trophy, permission:'tournaments.view' }
];

export const ADMIN_NAV: NavItem[] = [
  { label:'Dashboard', to:'/admin', icon:LayoutDashboard, permission:'dashboard.view', exact:true },
  { label:'Users', to:'/admin/users', icon:Users, permission:'users.view' },
  { label:'Roles', to:'/admin/roles', icon:Shield, permission:'roles.view' },
  { label:'Organizers', to:'/admin/organizers', icon:UserCog, permission:'organizer.approve' },
  { label:'Tournaments', to:'/admin/tournaments', icon:Trophy, permission:'tournaments.view' },
  { label:'Statistics', to:'/admin/statistics', icon:BarChart3, permission:'statistics.view' },
  { label:'Audit Logs', to:'/admin/audit-logs', icon:ScrollText, permission:'audit.view' },
  { label:'Settings', to:'/admin/settings', icon:Settings, permission:'settings.manage' }
];
'@

Write-File 'src/components/layout/sidebar.tsx' @'
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV, HOST_NAV, ORGANIZER_NAV, PLAYER_NAV, type NavItem } from './nav-config';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user, can } = useAuth();
  const groups: { title:string; items:NavItem[] }[] = [
    { title:'Play', items:PLAYER_NAV },
    ...(user && can('hosts.manage') ? [{ title:'Organizer', items:ORGANIZER_NAV }] : []),
    ...(user && (can('scores.enter') || can('matches.edit')) && !can('hosts.manage')
      ? [{ title:'Host', items:HOST_NAV }] : []),
    ...(user && can('users.view') ? [{ title:'Administration', items:ADMIN_NAV }] : [])
  ];
  const visible = (i:NavItem) => !i.permission || can(i.permission);

  return <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-bg-deep/70 backdrop-blur-xl lg:flex">
    <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
        <Zap size={18} className="text-white"/>
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-wide text-white">RANGER</p>
        <p className="text-[10px] uppercase tracking-[.18em] text-brand-400">Esports</p>
      </div>
    </div>
    <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map(g => {
        const items = g.items.filter(visible);
        if (!items.length) return null;
        return <div key={g.title}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint/70">{g.title}</p>
          <ul className="space-y-0.5">
            {items.map(i => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.exact}
                  className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-ink-faint hover:bg-white/[.04] hover:text-ink-muted')}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="sidebar-active" transition={{ type:'spring', stiffness:480, damping:38 }}
                        className="absolute inset-0 rounded-xl bg-brand-600/18 ring-1 ring-inset ring-brand-500/35"/>}
                      <i.icon size={17} className="relative shrink-0"/>
                      <span className="relative">{i.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>;
      })}
    </nav>
  </aside>;
}
'@

Write-File 'src/components/layout/mobile-nav.tsx' @'
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Radio, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to:'/dashboard', label:'Home', icon:LayoutDashboard },
  { to:'/tournaments', label:'Events', icon:Trophy },
  { to:'/live', label:'Live', icon:Radio },
  { to:'/leaderboard', label:'Ranks', icon:ListOrdered },
  { to:'/profile', label:'Me', icon:User }
];

export function MobileNav() {
  return <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg-deep/90 backdrop-blur-xl lg:hidden">
    <ul className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map(i => (
        <li key={i.to} className="flex-1">
          <NavLink to={i.to}
            className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
              isActive ? 'text-brand-400' : 'text-ink-faint')}>
            <i.icon size={20}/>{i.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>;
}
'@

Write-File 'src/components/layout/app-shell.tsx' @'
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

export function AppShell() {
  return <div className="flex min-h-screen">
    <Sidebar/>
    <div className="flex min-w-0 flex-1 flex-col">
      <Topbar/>
      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
        <Outlet/>
      </main>
    </div>
    <MobileNav/>
  </div>;
}
'@

Write-File 'src/components/layout/topbar.tsx' @'
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  return <header className="sticky top-0 z-40 border-b border-line bg-bg-base/75 backdrop-blur-xl">
    <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <span className="font-display text-sm font-bold tracking-wide text-white">RANGER</span>
      </Link>
      <button onClick={() => setSearchOpen(true)}
        className="ml-auto hidden h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-bg-deep/60 px-3.5 text-sm text-ink-faint transition hover:border-brand-600/40 sm:flex lg:ml-0">
        <Search size={15}/><span>Search...</span>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => setSearchOpen(true)} aria-label="Search"
          className="rounded-xl p-2.5 text-ink-faint hover:bg-white/5 hover:text-white sm:hidden">
          <Search size={18}/>
        </button>
        {user ? (
          <>
            <NotificationBell/>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="flex items-center gap-2 rounded-xl border border-line bg-bg-deep/60 p-1 pr-3 transition hover:border-brand-600/40">
                  <Avatar src={user.avatar} name={user.fullName} size={30}/>
                  <span className="hidden text-xs font-semibold text-white sm:block">{user.username}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}><User size={15}/> Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}><Menu size={15}/> Dashboard</DropdownMenuItem>
                <DropdownMenuItem danger onClick={() => { logout(); navigate('/'); }}>
                  <LogOut size={15}/> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Register</Button>
          </div>
        )}
      </div>
    </div>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)}/>
  </header>;
}
'@

Write-File 'src/components/layout/global-search.tsx' @'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Trophy, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { searchApi } from '@/services/api';
import type { SearchResults } from '@/types';

const EMPTY: SearchResults = { users:[], teams:[], tournaments:[] };

export function GlobalSearch({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const navigate = useNavigate();

  useEffect(() => { if (!open) { setQ(''); setRes(EMPTY); } }, [open]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setRes(EMPTY); return; }
      setRes(await searchApi.query(q));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (p:string) => { navigate(p); onClose(); };
  const has = res.users.length + res.teams.length + res.tournaments.length > 0;

  return <Modal open={open} onClose={onClose} title="Search" description="Find users, teams, tournaments">
    <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type at least 2 characters..." className="mb-4"/>
    <div className="max-h-80 space-y-4 overflow-y-auto">
      {!has && q.length >= 2 && <p className="py-6 text-center text-sm text-ink-faint">
        <Search size={16} className="mx-auto mb-2 opacity-50"/>No results
      </p>}
      <Section icon={Trophy} title="Tournaments"
        items={res.tournaments.map(t => ({ key:t.id, label:t.name, sub:t.shortName, path:'/tournaments/' + t.id }))}
        onSelect={go}/>
      <Section icon={Users} title="Teams"
        items={res.teams.map(t => ({ key:t.id, label:t.name, sub:t.tag, path:'/teams/' + t.id }))}
        onSelect={go}/>
      <Section icon={Shield} title="Users"
        items={res.users.map(u => ({ key:u.id, label:u.fullName, sub:'@' + u.username, path:'/profile' }))}
        onSelect={go}/>
    </div>
  </Modal>;
}

function Section({ icon:Icon, title, items, onSelect }:
  { icon:typeof Search; title:string; items:{key:string;label:string;sub?:string;path:string}[]; onSelect:(p:string)=>void }) {
  if (!items.length) return null;
  return <div>
    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint">
      <Icon size={11}/> {title}
    </p>
    <ul className="space-y-0.5">
      {items.map(i => (
        <li key={i.key}>
          <button onClick={() => onSelect(i.path)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-white/[.06]">
            <span className="truncate text-sm text-white">{i.label}</span>
            {i.sub && <span className="ml-2 shrink-0 text-xs text-ink-faint">{i.sub}</span>}
          </button>
        </li>
      ))}
    </ul>
  </div>;
}
'@

Write-File 'src/components/layout/notification-bell.tsx' @'
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { notificationApi } from '@/services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { relativeTime, cn } from '@/lib/utils';

const TONE: Record<string,string> = {
  INFO:'bg-brand-600',
  SUCCESS:'bg-success',
  WARNING:'bg-warning',
  ERROR:'bg-danger'
};

export function NotificationBell() {
  const { user } = useAuth();
  const { data, refetch } = useAsync(() => user ? notificationApi.forUser(user.id) : Promise.resolve([]), [user?.id]);
  const items = data ?? [];
  const unread = items.filter(n => !n.read).length;

  return <DropdownMenu>
    <DropdownMenuTrigger>
      <button className="relative rounded-xl p-2.5 text-ink-faint transition hover:bg-white/5 hover:text-white" aria-label="Notifications">
        <Bell size={18}/>
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between border-b border-white/[.06] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Notifications</p>
        {unread > 0 && user && <button onClick={async () => { await notificationApi.markAllRead(user.id); void refetch(); }}
          className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-500">
          <CheckCheck size={11}/> Mark all
        </button>}
      </div>
      <div className="max-h-80 overflow-y-auto p-1">
        {items.length === 0 && <p className="px-3 py-6 text-center text-xs text-ink-faint">No notifications</p>}
        {items.slice(0,12).map(n => (
          <div key={n.id} className={cn('flex gap-2.5 rounded-lg p-2.5', !n.read && 'bg-brand-600/[.06]')}>
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE[n.type])}/>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">{n.title}</p>
              {n.body && <p className="mt-0.5 truncate text-[11px] text-ink-faint">{n.body}</p>}
              <p className="mt-1 text-[10px] text-ink-faint/70">{relativeTime(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>;
}
'@

Write-Host ""
Write-Host "[OK] setup3 tayyor. Endi setup3b.ps1 ni yarating." -ForegroundColor Green
Write-Host "     '3b' deb yozing - davom ettiraman." -ForegroundColor Green
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
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
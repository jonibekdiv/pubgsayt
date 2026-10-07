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
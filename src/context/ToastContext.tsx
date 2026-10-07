import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Kind = 'INFO'|'SUCCESS'|'WARNING'|'ERROR';
interface T { id:number; kind:Kind; title:string; body?:string }
const Ctx = createContext<{ toast:(k:Kind, t:string, b?:string) => void } | null>(null);
const I = { INFO:Info, SUCCESS:CheckCircle2, WARNING:AlertTriangle, ERROR:XCircle };
const TONE: Record<Kind,string> = { INFO:'text-brand-400', SUCCESS:'text-success', WARNING:'text-warning', ERROR:'text-danger' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<T[]>([]);
  const toast = useCallback((kind: Kind, title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-3), { id, kind, title, body }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-6">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = I[t.kind];
            return (
              <motion.div key={t.id} layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:24 }}
                transition={{ type:'spring', stiffness:420, damping:32 }}
                className="glass-strong flex items-start gap-3 rounded-2xl p-3.5">
                <Icon className={TONE[t.kind]} size={18} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-xs text-ink-faint">{t.body}</p>}
                </div>
                <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} aria-label="Dismiss">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
export function useToast() { const c = useContext(Ctx); if (!c) throw new Error('useToast outside'); return c; }
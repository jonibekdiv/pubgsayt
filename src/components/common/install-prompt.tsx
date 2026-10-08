import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'ranger.pwa.dismissed';
const DISMISS_TTL_DAYS = 14;

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Skip if recently dismissed
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        const age = Date.now() - ts;
        if (age < DISMISS_TTL_DAYS * 86400000) return;
      }
    } catch { /* ignore */ }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Show after 15s on the page
      setTimeout(() => setVisible(true), 15000);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
    } finally {
      setBusy(false);
      setDeferred(null);
    }
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch { /* ignore */ }
  };

  if (!deferred) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-sm rounded-2xl border border-brand-600/40 bg-gradient-to-br from-brand-700/40 via-bg-panel to-bg-panel p-4 shadow-[0_20px_60px_-15px_rgba(20,115,255,.5)] backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400">
              <Smartphone size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-white">
                Install Ranger Esports
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                Faster access, offline support, and instant notifications.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={install} loading={busy} className="flex-1">
                  <Download size={12} /> Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismiss}
                  className="flex-1 text-ink-faint hover:text-white"
                >
                  Not now
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="shrink-0 rounded-lg p-1 text-ink-faint transition hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
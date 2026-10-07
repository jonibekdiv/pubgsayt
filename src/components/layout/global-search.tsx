import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, Search, Shield, Sparkles, TrendingUp, Trophy, Users, X } from 'lucide-react';
import { searchApi } from '@/services/api';
import type { SearchResults } from '@/types';

const EMPTY: SearchResults = { users: [], teams: [], tournaments: [] };
const RECENT_KEY = 'ranger.recent-searches';

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!open) {
      setQ('');
      setRes(EMPTY);
      setLoading(false);
    } else {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) { setRes(EMPTY); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchApi.query(q);
        setRes(r);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const saveRecent = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...recent.filter(r => r !== clean)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const go = (path: string, label?: string) => {
    if (label) saveRecent(label);
    navigate(path);
    onClose();
  };

  const hasResults = res.users.length + res.teams.length + res.tournaments.length > 0;
  const showRecent = !q.trim() && recent.length > 0;
  const showTrending = !q.trim() && recent.length === 0;
  const showHint = q.trim().length > 0 && q.trim().length < 2;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
            className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-bg-base sm:h-auto sm:max-h-[min(640px,85vh)] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-white/[.08] sm:bg-bg-panel sm:shadow-[0_24px_80px_-12px_rgba(0,0,0,.7)]"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="relative shrink-0 border-b border-line">
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />

              <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                <motion.span
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400"
                >
                  <Search size={17} />
                </motion.span>

                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search teams, tournaments, users..."
                  className="flex-1 min-w-0 bg-transparent text-base text-white placeholder:text-ink-faint focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="search"
                />

                {q && (
                  <motion.button
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => { setQ(''); inputRef.current?.focus(); }}
                    aria-label="Clear"
                    className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-white/[.06] hover:text-white"
                  >
                    <X size={15} />
                  </motion.button>
                )}

                <button
                  onClick={onClose}
                  className="hidden shrink-0 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-white/[.08] hover:text-white sm:block"
                >
                  Close
                </button>

                <button
                  onClick={onClose}
                  aria-label="Close search"
                  className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-white/[.06] hover:text-white sm:hidden"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3">
              {showRecent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Header icon={Clock} title="Recent searches" />
                  <div className="space-y-0.5">
                    {recent.map(term => (
                      <button
                        key={term}
                        onClick={() => setQ(term)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[.05]"
                      >
                        <Clock size={14} className="shrink-0 text-ink-faint" />
                        <span className="truncate text-sm text-ink-muted">{term}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium text-ink-faint transition hover:bg-white/[.04] hover:text-ink-muted"
                    >
                      Clear recent
                    </button>
                  </div>
                </motion.div>
              )}

              {showTrending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Header icon={TrendingUp} title="Try searching" />
                  <div className="space-y-0.5">
                    {['RANGER SCRIMS', 'ALONE GAMERS', 'ALCATRAZ', 'Erangel'].map((term, i) => (
                      <motion.button
                        key={term}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.03 }}
                        onClick={() => setQ(term)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[.05]"
                      >
                        <Sparkles size={14} className="shrink-0 text-brand-400/70" />
                        <span className="truncate text-sm text-ink-muted">{term}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {showHint && (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.04] text-ink-faint">
                    <Search size={22} />
                  </div>
                  <p className="mt-4 text-sm text-ink-faint">Keep typing...</p>
                </div>
              )}

              {q.trim().length >= 2 && loading && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                      className="h-12 rounded-xl bg-white/[.04]"
                    />
                  ))}
                </div>
              )}

              {q.trim().length >= 2 && !loading && !hasResults && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center px-4 py-16 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.04]">
                    <Search size={22} className="text-ink-faint" />
                  </div>
                  <p className="mt-4 font-display text-base font-semibold text-white">
                    No results for "{q}"
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-ink-faint">
                    Try a different team name, tournament or username.
                  </p>
                </motion.div>
              )}

              {q.trim().length >= 2 && !loading && hasResults && (
                <div className="space-y-3">
                  <ResultSection
                    title="Tournaments"
                    icon={Trophy}
                    query={q}
                    items={res.tournaments.map(t => ({
                      key: t.id,
                      label: t.name,
                      sub: t.shortName,
                      path: `/tournaments/${t.id}`,
                      image: t.logo,
                    }))}
                    onSelect={go}
                  />
                  <ResultSection
                    title="Teams"
                    icon={Users}
                    query={q}
                    items={res.teams.map(t => ({
                      key: t.id,
                      label: t.name,
                      sub: `[${t.tag}]`,
                      path: `/teams/${t.id}`,
                      image: t.logo,
                    }))}
                    onSelect={go}
                  />
                  <ResultSection
                    title="Users"
                    icon={Shield}
                    query={q}
                    items={res.users.map(u => ({
                      key: u.id,
                      label: u.fullName,
                      sub: `@${u.username}`,
                      path: '/profile',
                      image: u.avatar,
                    }))}
                    onSelect={go}
                  />
                </div>
              )}
            </div>

            <div className="hidden shrink-0 items-center justify-between border-t border-line px-4 py-2.5 sm:flex">
              <div className="flex items-center gap-3 text-[10px] text-ink-faint">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white/[.04] px-1.5 py-0.5 font-mono text-[9px]">Esc</kbd>
                  to close
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-line bg-white/[.04] px-1.5 py-0.5 font-mono text-[9px]">Enter</kbd>
                  to open
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint/60">Ranger Esports</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Header({ icon: Icon, title }: { icon: typeof Search; title: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <Icon size={11} className="text-ink-faint" />
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint">{title}</p>
    </div>
  );
}

interface ResultItem {
  key: string;
  label: string;
  sub?: string;
  path: string;
  image?: string;
}

function ResultSection({
  title, icon: Icon, items, onSelect, query,
}: {
  title: string;
  icon: typeof Search;
  items: ResultItem[];
  onSelect: (path: string, label?: string) => void;
  query: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Icon size={11} className="text-ink-faint" />
        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint">{title}</p>
        <span className="text-[10px] text-ink-faint/60">- {items.length}</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <motion.button
            key={item.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
            onClick={() => onSelect(item.path, item.label)}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[.05]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-bg-deep">
              {item.image ? (
                <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Icon size={14} className="text-brand-400" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                <Highlight text={item.label} query={query} />
              </p>
              {item.sub && (
                <p className="truncate text-[11px] text-ink-faint">
                  <Highlight text={item.sub} query={query} />
                </p>
              )}
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 text-ink-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const term = query.trim().toLowerCase();
  if (!term) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-600/30 px-0.5 text-brand-400">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}
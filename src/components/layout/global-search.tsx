import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Clock, Command, CornerDownLeft, Hash, Search, Shield,
  Sparkles, Trash2, TrendingUp, Trophy, Users, X,
} from 'lucide-react';
import { searchApi } from '@/services/api';
import { cn, initials } from '@/lib/utils';
import type { SearchResults } from '@/types';

const EMPTY: SearchResults = { users: [], teams: [], tournaments: [] };
const RECENT_KEY = 'ranger.recent-searches';
const MAX_RECENT = 5;

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  /* Load recent searches */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  /* Focus + reset on open */
  useEffect(() => {
    if (!open) {
      setQ('');
      setRes(EMPTY);
      setLoading(false);
      setActiveIndex(-1);
    } else {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Lock body scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Debounced search */
  useEffect(() => {
    if (q.trim().length < 2) {
      setRes(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchApi.query(q);
        setRes(r);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  /* Flatten results for keyboard nav */
  const flatResults = [
    ...res.tournaments.map(t => ({ type: 'tournament' as const, id: t.id, label: t.name, path: `/tournaments/${t.id}` })),
    ...res.teams.map(t => ({ type: 'team' as const, id: t.id, label: t.name, path: `/teams/${t.id}` })),
    ...res.users.map(u => ({ type: 'user' as const, id: u.id, label: u.fullName, path: '/profile' })),
  ];

  /* Keyboard navigation */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = flatResults[activeIndex];
        if (item) { saveRecent(item.label); navigate(item.path); onClose(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, activeIndex, flatResults.length]);

  const saveRecent = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...recent.filter(r => r !== clean)].slice(0, MAX_RECENT);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  const go = (path: string, label?: string) => {
    if (label) saveRecent(label);
    navigate(path);
    onClose();
  };

  const total = res.users.length + res.teams.length + res.tournaments.length;
  const hasResults = total > 0;
  const showRecent = !q.trim() && recent.length > 0;
  const showSuggestions = !q.trim() && recent.length === 0;
  const showHint = q.trim().length > 0 && q.trim().length < 2;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[10vh] sm:p-6 sm:pt-[12vh]">
          {/* Backdrop — simple, click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseDown={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            aria-label="Close search"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[.08] bg-bg-panel/95 shadow-[0_28px_90px_-16px_rgba(0,0,0,.8)] backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            {/* Top gradient line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

            {/* Search input */}
            <div className="relative flex items-center gap-3 border-b border-white/[.06] px-4 py-4 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-400">
                <Search size={16} />
              </span>

              <input
                ref={inputRef}
                value={q}
                onChange={e => { setQ(e.target.value); setActiveIndex(-1); }}
                placeholder="Search teams, tournaments, players..."
                className="flex-1 min-w-0 bg-transparent text-base font-medium text-white placeholder:text-ink-faint/70 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
              />

              {q ? (
                <motion.button
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => { setQ(''); inputRef.current?.focus(); }}
                  className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white"
                  aria-label="Clear"
                >
                  <X size={15} />
                </motion.button>
              ) : (
                <span className="hidden shrink-0 items-center gap-1 sm:flex">
                  <kbd className="rounded-md border border-line bg-white/[.04] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-faint">
                    ESC
                  </kbd>
                </span>
              )}
            </div>

            {/* Body */}
            <div className="no-scrollbar max-h-[60vh] flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:max-h-[55vh] sm:px-3 sm:py-3">
              {/* Recent */}
              {showRecent && (
                <div>
                  <Header
                    icon={Clock}
                    label="Recent searches"
                    action={
                      <button
                        onClick={clearRecent}
                        className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint transition hover:text-danger"
                      >
                        <Trash2 size={10} /> Clear
                      </button>
                    }
                  />
                  <div className="space-y-0.5">
                    {recent.map(term => (
                      <button
                        key={term}
                        onClick={() => setQ(term)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[.04]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[.03] text-ink-faint transition group-hover:bg-brand-600/15 group-hover:text-brand-400">
                          <Clock size={13} />
                        </span>
                        <span className="flex-1 truncate text-sm text-ink-muted group-hover:text-white">
                          {term}
                        </span>
                        <ArrowRight
                          size={13}
                          className="shrink-0 text-ink-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && (
                <div>
                  <Header icon={TrendingUp} label="Try searching" />
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {[
                      { term: 'RANGER SCRIMS', icon: Trophy },
                      { term: 'ALONE GAMERS', icon: Users },
                      { term: 'Erangel', icon: Hash },
                      { term: 'Live', icon: Sparkles },
                    ].map(({ term, icon: Icon }, i) => (
                      <motion.button
                        key={term}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 + i * 0.03 }}
                        onClick={() => setQ(term)}
                        className="group flex items-center gap-2.5 rounded-xl border border-line bg-bg-deep/40 px-3 py-2.5 text-left transition hover:border-brand-600/40 hover:bg-bg-deep/60"
                      >
                        <Icon size={13} className="shrink-0 text-brand-400" />
                        <span className="flex-1 truncate text-sm text-ink-muted group-hover:text-white">
                          {term}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint */}
              {showHint && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.04] text-ink-faint">
                    <Search size={22} />
                  </div>
                  <p className="mt-4 text-sm text-ink-faint">
                    Type at least 2 characters
                  </p>
                </div>
              )}

              {/* Loading */}
              {loading && q.trim().length >= 2 && (
                <div className="space-y-2 p-1">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.65, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                      className="h-12 rounded-xl bg-white/[.04]"
                    />
                  ))}
                </div>
              )}

              {/* Empty */}
              {!loading && q.trim().length >= 2 && !hasResults && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-14 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.04]">
                    <Search size={22} className="text-ink-faint" />
                  </div>
                  <p className="mt-4 font-display text-base font-semibold text-white">
                    No results for "{q}"
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-ink-faint">
                    Try a different team, tournament or username.
                  </p>
                </motion.div>
              )}

              {/* Results */}
              {!loading && q.trim().length >= 2 && hasResults && (
                <div className="space-y-3">
                  {res.tournaments.length > 0 && (
                    <Section icon={Trophy} label="Tournaments" count={res.tournaments.length}>
                      {res.tournaments.map((t, i) => (
                        <ResultRow
                          key={t.id}
                          index={i}
                          active={activeIndex === i}
                          onClick={() => go(`/tournaments/${t.id}`, t.name)}
                          title={t.name}
                          subtitle={t.shortName}
                          badge={t.status}
                          image={t.logo}
                          query={q}
                        />
                      ))}
                    </Section>
                  )}

                  {res.teams.length > 0 && (
                    <Section icon={Users} label="Teams" count={res.teams.length}>
                      {res.teams.map((t, i) => (
                        <ResultRow
                          key={t.id}
                          index={res.tournaments.length + i}
                          active={activeIndex === res.tournaments.length + i}
                          onClick={() => go(`/teams/${t.id}`, t.name)}
                          title={t.name}
                          subtitle={t.tag}
                          image={t.logo}
                          query={q}
                        />
                      ))}
                    </Section>
                  )}

                  {res.users.length > 0 && (
                    <Section icon={Shield} label="Players" count={res.users.length}>
                      {res.users.map((u, i) => (
                        <ResultRow
                          key={u.id}
                          index={res.tournaments.length + res.teams.length + i}
                          active={activeIndex === res.tournaments.length + res.teams.length + i}
                          onClick={() => go('/profile', u.fullName)}
                          title={u.fullName}
                          subtitle={'@' + u.username}
                          avatarSrc={u.avatar}
                          query={q}
                        />
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/[.06] px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-3 text-[10px] text-ink-faint">
                <span className="hidden items-center gap-1.5 sm:flex">
                  <KeyHint>↑</KeyHint>
                  <KeyHint>↓</KeyHint>
                  <span>navigate</span>
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <KeyHint icon={CornerDownLeft} />
                  <span>open</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <KeyHint>esc</KeyHint>
                  <span>close</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-ink-faint/60">
                <span className="hidden sm:inline">Ranger Esports</span>
                <Command size={10} className="sm:hidden" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Helpers ── */

function Header({
  icon: Icon,
  label,
  action,
}: {
  icon: typeof Search;
  label: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-ink-faint" />
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-ink-faint">
          {label}
        </p>
      </div>
      {action}
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: typeof Trophy;
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Icon size={11} className="text-ink-faint" />
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-ink-faint">
          {label}
        </p>
        <span className="rounded-full bg-white/[.05] px-1.5 py-px text-[9px] font-semibold text-ink-faint">
          {count}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({
  title,
  subtitle,
  image,
  avatarSrc,
  badge,
  onClick,
  active,
  index,
  query,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  avatarSrc?: string;
  badge?: string;
  onClick: () => void;
  active?: boolean;
  index: number;
  query: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.15) }}
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
        active
          ? 'bg-brand-600/15 ring-1 ring-inset ring-brand-500/40'
          : 'hover:bg-white/[.04]',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-bg-deep">
        {avatarSrc || image ? (
          <img
            src={avatarSrc ?? image}
            alt=""
            className={cn('h-full w-full object-cover', avatarSrc && 'rounded-full')}
          />
        ) : (
          <span className="font-display text-[10px] font-bold text-brand-400">
            {initials(title)}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          <Highlight text={title} query={query} />
        </p>
        {subtitle && (
          <p className="truncate text-[11px] text-ink-faint">
            <Highlight text={subtitle} query={query} />
          </p>
        )}
      </div>

      {badge && (
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
            badge === 'LIVE' && 'bg-danger/15 text-danger',
            badge === 'FINISHED' && 'bg-white/[.05] text-ink-faint',
            badge === 'UPCOMING' && 'bg-brand-600/15 text-brand-400',
          )}
        >
          {badge}
        </span>
      )}

      <ArrowRight
        size={13}
        className="shrink-0 text-ink-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </motion.button>
  );
}

function KeyHint({ children, icon: Icon }: { children?: ReactNode; icon?: typeof Command }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-white/[.04] px-1.5 font-mono text-[9px] font-bold text-ink-faint">
      {Icon ? <Icon size={10} /> : children}
    </kbd>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim().toLowerCase();
  if (!term) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-600/30 px-0.5 font-semibold text-brand-300">
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}
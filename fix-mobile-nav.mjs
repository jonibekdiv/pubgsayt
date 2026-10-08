import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const write = (r, c) => { fs.writeFileSync(path.join(ROOT, r), c, 'utf-8'); console.log('  [OK] ' + r); };

// ============================================================
// MobileNav — REMOVED (return null instead of bottom bar)
// ============================================================
write('src/components/layout/mobile-nav.tsx', `// Mobile bottom nav has been removed.
// Navigation is now handled by a slide-out sidebar on mobile.
export function MobileNav() {
  return null;
}
`);

// ============================================================
// Sidebar — slide-out drawer on mobile
// ============================================================
write('src/components/layout/sidebar.tsx', `import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV, HOST_NAV, ORGANIZER_NAV, PLAYER_NAV, type NavItem } from './nav-config';
import { cn } from '@/lib/utils';
import { usePendingCount } from './my-team-badge';

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const { user, can } = useAuth();
  const pendingCount = usePendingCount();
  const location = useLocation();

  // Close on route change (mobile)
  useEffect(() => {
    if (mobileOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, onClose]);

  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Play', items: PLAYER_NAV },
    ...(user && can('hosts.manage') ? [{ title: 'Organizer', items: ORGANIZER_NAV }] : []),
    ...(user && (can('scores.enter') || can('matches.edit')) && !can('hosts.manage')
      ? [{ title: 'Host', items: HOST_NAV }] : []),
    ...(user && can('users.view') ? [{ title: 'Administration', items: ADMIN_NAV }] : []),
  ];
  const visible = (i: NavItem) => !i.permission || can(i.permission);

  const content = (
    <div className="flex h-full w-full flex-col bg-bg-deep/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
          <Zap size={18} className="text-white" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold tracking-wide text-white">RANGER</p>
          <p className="text-[10px] uppercase tracking-[.18em] text-brand-400">Esports</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map(g => {
          const items = g.items.filter(visible);
          if (!items.length) return null;
          return (
            <div key={g.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint/70">
                {g.title}
              </p>
              <ul className="space-y-0.5">
                {items.map(i => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      end={i.exact}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive ? 'text-white' : 'text-ink-faint hover:bg-white/[.04] hover:text-ink-muted',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                              className="absolute inset-0 rounded-xl bg-brand-600/18 ring-1 ring-inset ring-brand-500/35"
                            />
                          )}
                          <i.icon size={17} className="relative shrink-0" />
                          <span className="relative flex items-center gap-1.5">
                            {i.label}
                            {i.to === '/my-team' && pendingCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-black">
                                {pendingCount > 9 ? '9+' : pendingCount}
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="relative h-full w-[280px] max-w-[85vw] border-r border-line shadow-2xl"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
`);

// ============================================================
// AppShell — manage mobile menu state
// ============================================================
write('src/components/layout/app-shell.tsx', `import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-3 pb-8 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`);

// ============================================================
// Topbar — hamburger menu button
// ============================================================
let topbar = fs.readFileSync(path.join(ROOT, 'src/components/layout/topbar.tsx'), 'utf-8');

if (!topbar.includes('onMenuClick')) {
  // Add prop
  topbar = topbar.replace(
    /export function Topbar\(\) \{/,
    `interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {`,
  );

  // Replace mobile logo with hamburger
  topbar = topbar.replace(
    /<Link to="\/" className="flex shrink-0 items-center gap-2 lg:hidden">[\s\S]*?<\/Link>/,
    `<button
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition active:scale-90 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span className="font-display text-sm font-bold tracking-wide text-white">
            RANGER
          </span>
        </Link>`,
  );

  // Ensure Menu icon imported
  if (!topbar.includes('MenuIcon')) {
    topbar = topbar.replace(
      /import \{ LogOut, Menu, Search, User, Wallet \} from 'lucide-react';/,
      `import { LogOut, Menu as MenuIcon, Search, User, Wallet } from 'lucide-react';`,
    );
  }

  fs.writeFileSync(path.join(ROOT, 'src/components/layout/topbar.tsx'), topbar, 'utf-8');
  console.log('  [OK] src/components/layout/topbar.tsx (hamburger)');
} else {
  console.log('  [SKIP] topbar.tsx allaqachon yangilangan');
}

console.log('');
console.log('=============================================');
console.log(' TAYYOR!');
console.log('=============================================');
console.log('');
console.log('Serverni qayta ishga tushiring:');
console.log('');
console.log('  1. Ctrl+C bosing');
console.log('  2. npm run dev');
console.log('  3. Brauzerda Ctrl+Shift+R');
console.log('');
console.log('Endi mobilda:');
console.log('  - Pastdagi nav YOQ');
console.log('  - Tepada chapda HAMBURGER menu');
console.log('  - Bosilsa chapdan slide-out sidebar');
console.log('  - Sahifa butun ekran (full width)');
console.log('');
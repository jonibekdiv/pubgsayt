import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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

  // Escape + body lock
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, onClose]);

  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Play', items: PLAYER_NAV },
    ...(user && can('hosts.manage') ? [{ title: 'Organizer', items: ORGANIZER_NAV }] : []),
    ...(user && (can('scores.enter') || can('matches.edit')) && !can('hosts.manage')
      ? [{ title: 'Host', items: HOST_NAV }]
      : []),
    ...(user && can('users.view') ? [{ title: 'Administration', items: ADMIN_NAV }] : []),
  ];

  const visible = (i: NavItem) => !i.permission || can(i.permission);

  const renderNav = (inDrawer: boolean) => (
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
                    onClick={inDrawer ? onClose : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive ? 'text-white bg-brand-600/18 ring-1 ring-inset ring-brand-500/35' : 'text-ink-faint hover:bg-white/[.04] hover:text-ink-muted',
                      )
                    }
                  >
                    <i.icon size={17} className="shrink-0" />
                    <span className="flex items-center gap-1.5">
                      {i.label}
                      {i.to === '/my-team' && pendingCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-black">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-bg-deep/70 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={18} className="text-white" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-wide text-white">RANGER</p>
            <p className="text-[10px] uppercase tracking-[.18em] text-brand-400">Esports</p>
          </div>
        </div>
        {renderNav(false)}
      </aside>

      {/* Mobile backdrop — CSS transition only, no animation library */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Mobile drawer — CSS transform only */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[60] flex h-full w-[280px] max-w-[85vw] flex-col border-r border-line bg-bg-deep shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!mobileOpen}
      >
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
            className="ml-auto rounded-lg p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {renderNav(true)}
      </aside>
    </>
  );
}
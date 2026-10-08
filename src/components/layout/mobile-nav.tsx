import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Radio, Swords, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/tournaments', label: 'Events', icon: Trophy },
  { to: '/live', label: 'Live', icon: Radio },
  { to: '/leaderboard', label: 'Ranks', icon: ListOrdered },
  { to: '/my-team', label: 'My Team', icon: Swords },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-bg-deep/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(i => (
          <li key={i.to} className="flex-1">
            <NavLink
              to={i.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                  isActive ? 'text-brand-400' : 'text-ink-faint',
                )
              }
            >
              <i.icon size={19} />
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
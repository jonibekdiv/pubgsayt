import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV, HOST_NAV, ORGANIZER_NAV, PLAYER_NAV, type NavItem } from './nav-config';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user, can } = useAuth();
  const groups: { title:string; items:NavItem[] }[] = [
    { title:'Play', items:PLAYER_NAV },
    ...(user && can('hosts.manage') ? [{ title:'Organizer', items:ORGANIZER_NAV }] : []),
    ...(user && (can('scores.enter') || can('matches.edit')) && !can('hosts.manage')
      ? [{ title:'Host', items:HOST_NAV }] : []),
    ...(user && can('users.view') ? [{ title:'Administration', items:ADMIN_NAV }] : [])
  ];
  const visible = (i:NavItem) => !i.permission || can(i.permission);

  return <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-bg-deep/70 backdrop-blur-xl lg:flex">
    <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
        <Zap size={18} className="text-white"/>
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-wide text-white">RANGER</p>
        <p className="text-[10px] uppercase tracking-[.18em] text-brand-400">Esports</p>
      </div>
    </div>
    <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map(g => {
        const items = g.items.filter(visible);
        if (!items.length) return null;
        return <div key={g.title}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint/70">{g.title}</p>
          <ul className="space-y-0.5">
            {items.map(i => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.exact}
                  className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-ink-faint hover:bg-white/[.04] hover:text-ink-muted')}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="sidebar-active" transition={{ type:'spring', stiffness:480, damping:38 }}
                        className="absolute inset-0 rounded-xl bg-brand-600/18 ring-1 ring-inset ring-brand-500/35"/>}
                      <i.icon size={17} className="relative shrink-0"/>
                      <span className="relative">{i.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>;
      })}
    </nav>
  </aside>;
}
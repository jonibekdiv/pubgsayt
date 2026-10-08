import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ============================================================
// 1. mobile-nav.tsx — replace "Me" with "My Team"
// ============================================================
fs.writeFileSync(path.join(ROOT, 'src/components/layout/mobile-nav.tsx'), `import { NavLink } from 'react-router-dom';
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
`);

console.log('  [OK] src/components/layout/mobile-nav.tsx (Me -> My Team)');

// ============================================================
// 2. app-shell.tsx — add bottom padding for bottom nav + mount MobileNav
// ============================================================
fs.writeFileSync(path.join(ROOT, 'src/components/layout/app-shell.tsx'), `import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-3 pb-24 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
`);

console.log('  [OK] src/components/layout/app-shell.tsx (MobileNav qaytarildi)');

// ============================================================
// 3. sidebar.tsx — verify it shows ALL role sections correctly
// ============================================================
const sidebarPath = path.join(ROOT, 'src/components/layout/sidebar.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf-8');

// Ensure groups include ALL sections (Play, Organizer, Host, Administration)
if (!sidebar.includes("title: 'Organizer'")) {
  console.log('  [WARN] sidebar.tsx da Organizer section yoq - qolda tekshirilsin');
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
console.log('  - Bottom nav: Home / Events / Live / Ranks / My Team');
console.log('  - Chap tepada HAMBURGER -> toliq sidebar (barcha rollar)');
console.log('');
`);

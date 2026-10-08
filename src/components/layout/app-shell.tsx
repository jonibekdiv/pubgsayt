import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';
import { InstallPrompt } from '@/components/common/install-prompt';
import { useMatchReminders } from '@/hooks/useMatchReminders';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Background: check upcoming matches every minute
  useMatchReminders();

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-3 pb-24 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <InstallPrompt />
    </div>
  );
}
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

export function AppShell() {
  return <div className="flex min-h-screen">
    <Sidebar/>
    <div className="flex min-w-0 flex-1 flex-col">
      <Topbar/>
      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
        <Outlet/>
      </main>
    </div>
    <MobileNav/>
  </div>;
}
import fs from 'node:fs';

const content = `import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, User, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { WalletChip } from './wallet-chip';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg-base/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
        {/* Hamburger menu (mobile only) */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition active:scale-90 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span className="font-display text-sm font-bold tracking-wide text-white">
            RANGER
          </span>
        </Link>

        {/* Desktop search bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group ml-auto hidden h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-bg-deep/60 px-3.5 text-sm text-ink-faint transition hover:border-brand-600/40 hover:text-ink-muted sm:flex lg:ml-0"
        >
          <Search size={15} className="transition group-hover:text-brand-400" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded-md border border-line bg-white/[.04] px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            Cmd+K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-faint transition active:scale-90 hover:bg-white/5 hover:text-white sm:hidden"
          >
            <Search size={18} />
          </button>

          {user ? (
            <>
              <WalletChip />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-2 rounded-xl border border-line bg-bg-deep/60 p-0.5 pr-2 transition hover:border-brand-600/40 sm:p-1 sm:pr-3">
                    <Avatar src={user.avatar} name={user.fullName} size={28} />
                    <span className="hidden text-xs font-semibold text-white sm:block">
                      {user.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="border-b border-white/[.06] px-3 py-2.5 sm:hidden">
                    <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="truncate text-[10px] text-ink-faint">@{user.username}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User size={15} /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')}>
                    <Wallet size={15} /> Wallet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <Menu size={15} /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem danger onClick={() => { logout(); navigate('/'); }}>
                    <LogOut size={15} /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="h-8 px-3 text-xs sm:h-9 sm:px-4"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="h-8 px-3 text-xs sm:h-9 sm:px-4"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
`;

fs.writeFileSync('src/components/layout/topbar.tsx', content, 'utf-8');
console.log('  [OK] src/components/layout/topbar.tsx qayta yozildi');
console.log('');
console.log('Endi serverni qayta ishga tushiring:');
console.log('  Ctrl+C -> npm run dev');
console.log('');
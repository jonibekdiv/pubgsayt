import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, User, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
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
        {/* Mobile hamburger */}
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

        {/* Desktop search — premium redesign */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group relative ml-auto hidden h-11 w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-bg-deep/80 to-bg-deep/40 px-4 text-sm text-ink-faint shadow-sm backdrop-blur transition-all hover:border-brand-600/50 hover:shadow-[0_0_0_4px_rgba(30,136,255,.08),0_8px_24px_-8px_rgba(30,136,255,.3)] sm:flex lg:ml-0"
        >
          {/* Animated gradient ring (visible on hover) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(120px 60px at 20% 50%, rgba(30,136,255,.18), transparent 70%)',
            }}
          />

          {/* Search icon with ring */}
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/[.04] text-ink-faint transition-all group-hover:bg-brand-600/20 group-hover:text-brand-400">
            <Search size={14} />
          </span>

          {/* Text */}
          <span className="relative flex-1 truncate text-left text-[13px] font-medium tracking-tight text-ink-faint transition-colors group-hover:text-ink-muted">
            Search teams, tournaments, players…
          </span>

          {/* Kbd badge */}
          <kbd className="relative hidden items-center gap-0.5 rounded-lg border border-line bg-white/[.05] px-2 py-1 font-mono text-[10px] font-semibold text-ink-faint transition group-hover:border-brand-600/40 group-hover:text-brand-300 sm:inline-flex">
            <span className="text-[11px]">⌘</span>
            <span>K</span>
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
                  <button className="group flex items-center gap-2 rounded-xl border border-line bg-bg-deep/60 p-0.5 pr-2 transition hover:border-brand-600/40 sm:p-1 sm:pr-3">
                    <span className="relative">
                      <Avatar src={user.avatar} name={user.fullName} size={28} />
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-base bg-success"
                      />
                    </span>
                    <span className="hidden text-xs font-semibold text-white sm:block">
                      {user.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="border-b border-white/[.06] px-3 py-2.5 sm:hidden">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.fullName}
                    </p>
                    <p className="truncate text-[10px] text-ink-faint">
                      @{user.username}
                    </p>
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
                  <DropdownMenuItem
                    danger
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
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
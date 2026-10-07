import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { WalletChip } from './wallet-chip';

export function Topbar() {
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
    <header className='sticky top-0 z-40 border-b border-line bg-bg-base/75 backdrop-blur-xl'>
      <div className='flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8'>
        <Link to='/' className='flex items-center gap-2 lg:hidden'>
          <span className='font-display text-sm font-bold tracking-wide text-white'>RANGER</span>
        </Link>

        <button
          onClick={() => setSearchOpen(true)}
          className='group ml-auto hidden h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-bg-deep/60 px-3.5 text-sm text-ink-faint transition hover:border-brand-600/40 hover:text-ink-muted sm:flex lg:ml-0'
        >
          <Search size={15} className='transition group-hover:text-brand-400' />
          <span className='flex-1 text-left'>Search...</span>
          <kbd className='rounded-md border border-line bg-white/[.04] px-1.5 py-0.5 font-mono text-[10px] text-ink-faint'>
            {'Cmd+K'}
          </kbd>
        </button>

        <div className='ml-auto flex items-center gap-2'>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label='Search'
            className='rounded-xl p-2.5 text-ink-faint transition hover:bg-white/5 hover:text-white sm:hidden'
          >
            <Search size={18} />
          </button>

          {user ? (
            <>
              <WalletChip />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className='flex items-center gap-2 rounded-xl border border-line bg-bg-deep/60 p-1 pr-3 transition hover:border-brand-600/40'>
                    <Avatar src={user.avatar} name={user.fullName} size={30} />
                    <span className='hidden text-xs font-semibold text-white sm:block'>{user.username}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User size={15} /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')}>
                    <Menu size={15} /> Wallet
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
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm' onClick={() => navigate('/login')}>Login</Button>
              <Button size='sm' onClick={() => navigate('/register')}>Register</Button>
            </div>
          )}
        </div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teamApi } from '@/services/api';

const POLL_MS = 20000;

export function usePendingCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const check = async () => {
      try {
        const team = await teamApi.byUser(user.id);
        if (!team || team.captainId !== user.id) {
          if (!cancelled) setCount(0);
          return;
        }
        const members = await teamApi.members(team.id);
        const pending = members.filter(m => m.status === 'PENDING').length;
        if (!cancelled) setCount(pending);
      } catch {
        if (!cancelled) setCount(0);
      }
    };

    void check();
    const t = window.setInterval(check, POLL_MS);
    const onFocus = () => { void check(); };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  return count;
}

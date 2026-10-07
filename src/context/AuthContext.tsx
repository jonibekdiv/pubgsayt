import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser, Role, Session } from '@/types';
import { authApi, ensureDb, roleApi, userApi } from '@/services/api';
import { permissionsForRoles } from '@/lib/permissions';

const SK = 'ranger.session';
interface AuthValue {
  user: PublicUser | null; roles: Role[]; permissions: string[]; loading: boolean;
  login: (id: string, pwd: string) => Promise<void>;
  register: (i: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => void; refresh: () => Promise<void>; can: (p: string | string[]) => boolean;
}
const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // self-heal: ensureDb migrates old DBs automatically
      ensureDb();
      setRoles(await roleApi.list());
      try {
        const raw = localStorage.getItem(SK); if (!raw) return;
        const s: Session = JSON.parse(raw);
        const me = await userApi.me(s.userId);
        if (me.status === 'BANNED') { localStorage.removeItem(SK); return; }
        setUser(me);
      } catch { localStorage.removeItem(SK); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (id: string, pwd: string) => {
    const s = await authApi.login(id, pwd);
    localStorage.setItem(SK, JSON.stringify(s));
    setUser(await userApi.me(s.userId));
  }, []);
  const register = useCallback(async (i: Parameters<typeof authApi.register>[0]) => {
    const s = await authApi.register(i);
    localStorage.setItem(SK, JSON.stringify(s));
    setUser(await userApi.me(s.userId));
  }, []);
  const logout = useCallback(() => { localStorage.removeItem(SK); setUser(null); }, []);

  const permissions = useMemo(() => user ? permissionsForRoles(roles, user.roles) : [], [user, roles]);
  const can = useCallback((p: string | string[]) => {
    const list = Array.isArray(p) ? p : [p];
    return list.some(x => permissions.includes(x));
  }, [permissions]);

  const value: AuthValue = { user, roles, permissions, loading, login, register, logout,
    refresh: async () => { if (user) setUser(await userApi.me(user.id)); }, can };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const c = useContext(Ctx); if (!c) throw new Error('useAuth outside AuthProvider'); return c;
}
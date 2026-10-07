import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';

export function RequireAuth({ children, permission }:
  { children:ReactNode; permission?:string | string[] }) {
  const { user, loading, can } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace/>;
  if (permission && !can(permission)) return <Navigate to="/403" replace/>;
  return <>{children}</>;
}
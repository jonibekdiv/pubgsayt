import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
export const formatMoney = (n: number, c = 'UZS') => `${formatNumber(n)} ${c}`;
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
export const relativeTime = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
export const extractYouTubeId = (url: string): string | null => {
  const pats = [/(?:youtube\.com\/watch\?v=)([\w-]{11})/, /(?:youtu\.be\/)([\w-]{11})/, /(?:youtube\.com\/live\/)([\w-]{11})/, /(?:youtube\.com\/embed\/)([\w-]{11})/];
  for (const p of pats) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
};
export const initials = (n: string) => n.split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('');
export const MAP_LABEL: Record<string,string> = { ERANGEL:'Erangel', MIRAMAR:'Miramar', RONDO:'Rondo', SANHOK:'Sanhok' };
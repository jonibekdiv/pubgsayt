import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, description, action }:
  { icon:LucideIcon; title:string; description?:string; action?:ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-400">
      <Icon size={24}/>
    </div>
    <p className="font-display text-base font-semibold text-white">{title}</p>
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-faint">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>;
}
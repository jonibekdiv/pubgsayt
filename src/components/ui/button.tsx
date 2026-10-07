import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type V = 'primary'|'secondary'|'ghost'|'danger'|'outline';
type S = 'sm'|'md'|'lg'|'icon';

const VR: Record<V,string> = {
  primary:'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
  secondary:'bg-white/[.06] text-white hover:bg-white/[.11] border border-white/[.08]',
  ghost:'text-ink-muted hover:bg-white/[.06] hover:text-white',
  danger:'bg-danger/90 text-white hover:bg-danger',
  outline:'border border-brand-600/60 text-brand-400 hover:bg-brand-600/10'
};
const SR: Record<S,string> = {
  sm:'h-8 px-3 text-xs gap-1.5',
  md:'h-10 px-4 text-sm gap-2',
  lg:'h-12 px-6 text-sm gap-2',
  icon:'h-10 w-10'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: V;
  size?: S;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='primary', size='md', loading, disabled, children, ...p }, ref) => (
    <button ref={ref} disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center rounded-xl font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-45 active:scale-[.985]', VR[variant], SR[size], className)} {...p}>
      {loading && <Loader2 className="animate-spin" size={14} />}{children}
    </button>
  )
);
Button.displayName = 'Button';
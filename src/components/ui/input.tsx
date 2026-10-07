import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const BASE = 'w-full rounded-xl border border-line bg-bg-deep/60 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-faint/70 transition focus:border-brand-600/70 focus:bg-bg-deep focus:outline-none focus:ring-2 focus:ring-brand-600/25';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(BASE, className)} {...p}/>
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cn(BASE, 'min-h-28 resize-y', className)} {...p}/>
);
Textarea.displayName = 'Textarea';

export function Field({ label, hint, error, required, children }:
  { label:string; hint?:string; error?:string; required?:boolean; children:ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-muted">
        {label}{required && <span className="text-danger">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span>
             : hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
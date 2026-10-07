import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { glass?: boolean }>(
  ({ className, glass, ...p }, ref) => (
    <div ref={ref} className={cn('rounded-2xl border transition-colors',
      glass ? 'glass' : 'border-line bg-bg-panel/70 backdrop-blur-sm', className)} {...p}/>
  )
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('flex items-center justify-between gap-3 px-5 py-4', className)} {...p}/>;

export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) =>
  <h3 className={cn('font-display text-sm font-semibold uppercase tracking-wider text-white', className)} {...p}/>;

export const CardBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('px-5 pb-5', className)} {...p}/>;
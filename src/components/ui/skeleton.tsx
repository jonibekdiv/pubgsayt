import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?:string }) {
  return <div className={cn('relative overflow-hidden rounded-lg bg-white/[.05]', className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[.07] to-transparent"/>
  </div>;
}

export function LeaderboardSkeleton({ rows = 8 }: { rows?:number }) {
  return <div className="space-y-2">
    {Array.from({ length:rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg"/>
        <Skeleton className="h-9 flex-1"/>
        <Skeleton className="h-9 w-16"/>
      </div>
    ))}
  </div>;
}

export function CardGridSkeleton({ count = 6 }: { count?:number }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length:count }).map((_, i) => (
      <div key={i} className="surface overflow-hidden">
        <Skeleton className="h-36 w-full rounded-none"/>
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-2/3"/>
          <Skeleton className="h-3 w-1/3"/>
        </div>
      </div>
    ))}
  </div>;
}
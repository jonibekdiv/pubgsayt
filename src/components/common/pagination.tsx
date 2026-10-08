import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, perPage, onPageChange, className }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);

  const go = (p: number) => {
    onPageChange(Math.max(1, Math.min(totalPages, p)));
    // Scroll to top on mobile for better UX
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Visible page numbers
  const pages: (number | '...')[] = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i);
    } else if (
      pages[pages.length - 1] !== '...' &&
      (i === 2 || i === totalPages - 1 || Math.abs(i - page) === 2)
    ) {
      pages.push('...');
    }
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-between gap-3 sm:flex-row',
      className,
    )}>
      {/* Info */}
      <p className="text-xs text-ink-faint">
        Showing <span className="font-semibold text-ink-muted">{start}</span>
        {'–'}
        <span className="font-semibold text-ink-muted">{end}</span>
        {' of '}
        <span className="font-semibold text-ink-muted">{total}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg-deep/40 text-ink-faint transition hover:border-brand-600/40 hover:text-white disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-faint"
          aria-label="First page"
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg-deep/40 text-ink-faint transition hover:border-brand-600/40 hover:text-white disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Pages — hidden on mobile */}
        <div className="hidden items-center gap-0.5 sm:flex">
          {pages.map((p, i) =>
            p === '...' ? (
              <span
                key={'dot-' + i}
                className="flex h-8 w-8 items-center justify-center text-xs text-ink-faint"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => go(p)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums transition',
                  p === page
                    ? 'border-brand-600/50 bg-brand-600/15 text-white'
                    : 'border-line bg-bg-deep/40 text-ink-faint hover:border-brand-600/40 hover:text-white',
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Mobile: just current/total */}
        <span className="text-xs font-semibold text-ink-muted sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg-deep/40 text-ink-faint transition hover:border-brand-600/40 hover:text-white disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={13} />
        </button>
        <button
          onClick={() => go(totalPages)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg-deep/40 text-ink-faint transition hover:border-brand-600/40 hover:text-white disabled:opacity-30"
          aria-label="Last page"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}
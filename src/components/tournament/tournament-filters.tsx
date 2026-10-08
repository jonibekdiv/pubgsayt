import { useState, useMemo } from 'react';
import {
  Calendar, Check, ChevronDown, Filter, Map as MapIcon, RotateCcw, Search, Trophy, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MAP_LABEL, cn, formatMoney } from '@/lib/utils';
import type { PubgMap, Tournament, TournamentStatus } from '@/types';

export interface FilterState {
  search: string;
  statuses: TournamentStatus[];
  maps: PubgMap[];
  dateRange: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'UPCOMING' | 'PAST';
  prizeRange: 'ALL' | 'FREE' | 'LOW' | 'MID' | 'HIGH';
  isPaid: 'ALL' | 'FREE' | 'PAID';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  statuses: [],
  maps: [],
  dateRange: 'ALL',
  prizeRange: 'ALL',
  isPaid: 'ALL',
};

const STATUS_OPTIONS: { id: TournamentStatus; label: string; tone: string }[] = [
  { id: 'LIVE', label: 'Live', tone: 'text-danger' },
  { id: 'REGISTRATION_OPEN', label: 'Registration Open', tone: 'text-success' },
  { id: 'UPCOMING', label: 'Upcoming', tone: 'text-brand-400' },
  { id: 'FINISHED', label: 'Finished', tone: 'text-ink-faint' },
  { id: 'CANCELLED', label: 'Cancelled', tone: 'text-danger' },
];

const MAP_OPTIONS: PubgMap[] = ['ERANGEL', 'MIRAMAR', 'RONDO', 'SANHOK'];

const DATE_OPTIONS: { id: FilterState['dateRange']; label: string }[] = [
  { id: 'ALL', label: 'All time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'WEEK', label: 'This week' },
  { id: 'MONTH', label: 'This month' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'PAST', label: 'Past' },
];

const PRIZE_OPTIONS: { id: FilterState['prizeRange']; label: string }[] = [
  { id: 'ALL', label: 'Any prize' },
  { id: 'FREE', label: 'No prize' },
  { id: 'LOW', label: '< 1M UZS' },
  { id: 'MID', label: '1M – 5M UZS' },
  { id: 'HIGH', label: '> 5M UZS' },
];

const PAID_OPTIONS: { id: FilterState['isPaid']; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'FREE', label: 'Free entry' },
  { id: 'PAID', label: 'Paid entry' },
];

interface Props {
  tournaments: Tournament[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
  totalCount: number;
}

export function TournamentFilters({ filters, onChange, resultCount, totalCount }: Props) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.search) n++;
    n += filters.statuses.length;
    n += filters.maps.length;
    if (filters.dateRange !== 'ALL') n++;
    if (filters.prizeRange !== 'ALL') n++;
    if (filters.isPaid !== 'ALL') n++;
    return n;
  }, [filters]);

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleStatus = (s: TournamentStatus) => {
    update(
      'statuses',
      filters.statuses.includes(s)
        ? filters.statuses.filter(x => x !== s)
        : [...filters.statuses, s],
    );
  };

  const toggleMap = (m: PubgMap) => {
    update(
      'maps',
      filters.maps.includes(m)
        ? filters.maps.filter(x => x !== m)
        : [...filters.maps, m],
    );
  };

  const reset = () => onChange(DEFAULT_FILTERS);

  return (
    <div className="rounded-2xl border border-line bg-bg-panel/60 backdrop-blur-sm">
      {/* Search + toggle */}
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={filters.search}
            onChange={e => update('search', e.target.value)}
            placeholder="Search tournaments by name or organizer..."
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              onClick={() => update('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={expanded || activeCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setExpanded(v => !v)}
            className="relative"
          >
            <Filter size={13} />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
                {activeCount}
              </span>
            )}
            <ChevronDown
              size={12}
              className={cn('transition', expanded && 'rotate-180')}
            />
          </Button>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-3 py-2">
          {filters.statuses.map(s => (
            <Chip key={s} label={s.replace(/_/g, ' ')} onRemove={() => toggleStatus(s)} />
          ))}
          {filters.maps.map(m => (
            <Chip key={m} label={MAP_LABEL[m]} onRemove={() => toggleMap(m)} />
          ))}
          {filters.dateRange !== 'ALL' && (
            <Chip
              label={DATE_OPTIONS.find(d => d.id === filters.dateRange)?.label ?? ''}
              onRemove={() => update('dateRange', 'ALL')}
            />
          )}
          {filters.prizeRange !== 'ALL' && (
            <Chip
              label={PRIZE_OPTIONS.find(p => p.id === filters.prizeRange)?.label ?? ''}
              onRemove={() => update('prizeRange', 'ALL')}
            />
          )}
          {filters.isPaid !== 'ALL' && (
            <Chip
              label={PAID_OPTIONS.find(p => p.id === filters.isPaid)?.label ?? ''}
              onRemove={() => update('isPaid', 'ALL')}
            />
          )}
        </div>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="space-y-4 border-t border-line p-3 sm:p-4">
          {/* Status */}
          <Section title="Status" icon={Trophy}>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(s => {
                const active = filters.statuses.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStatus(s.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
                      active
                        ? 'border-brand-600/50 bg-brand-600/15 text-white'
                        : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white',
                    )}
                  >
                    {active && <Check size={10} />}
                    <span className={active ? '' : s.tone}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Maps */}
          <Section title="Maps" icon={MapIcon}>
            <div className="flex flex-wrap gap-1.5">
              {MAP_OPTIONS.map(m => {
                const active = filters.maps.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleMap(m)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
                      active
                        ? 'border-brand-600/50 bg-brand-600/15 text-white'
                        : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white',
                    )}
                  >
                    {active && <Check size={10} />}
                    {MAP_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Date */}
          <Section title="Date" icon={Calendar}>
            <div className="flex flex-wrap gap-1.5">
              {DATE_OPTIONS.map(d => (
                <PillButton
                  key={d.id}
                  active={filters.dateRange === d.id}
                  onClick={() => update('dateRange', d.id)}
                >
                  {d.label}
                </PillButton>
              ))}
            </div>
          </Section>

          {/* Prize pool */}
          <Section title="Prize pool" icon={Trophy}>
            <div className="flex flex-wrap gap-1.5">
              {PRIZE_OPTIONS.map(p => (
                <PillButton
                  key={p.id}
                  active={filters.prizeRange === p.id}
                  onClick={() => update('prizeRange', p.id)}
                >
                  {p.label}
                </PillButton>
              ))}
            </div>
          </Section>

          {/* Entry type */}
          <Section title="Entry" icon={Trophy}>
            <div className="flex flex-wrap gap-1.5">
              {PAID_OPTIONS.map(p => (
                <PillButton
                  key={p.id}
                  active={filters.isPaid === p.id}
                  onClick={() => update('isPaid', p.id)}
                >
                  {p.label}
                </PillButton>
              ))}
            </div>
          </Section>

          {/* Result count */}
          <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
            <p className="text-ink-faint">
              Showing{' '}
              <span className="font-bold text-brand-400">{resultCount}</span>
              {' of '}
              <span className="font-semibold text-ink-muted">{totalCount}</span>{' '}
              tournaments
            </p>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-500"
              >
                <RotateCcw size={10} /> Reset all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Trophy;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-ink-faint">
        <Icon size={11} /> {title}
      </p>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
        active
          ? 'border-brand-600/50 bg-brand-600/15 text-white'
          : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-600/30 bg-brand-600/10 pl-2.5 pr-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 transition hover:bg-brand-600/30"
        aria-label={'Remove ' + label}
      >
        <X size={10} />
      </button>
    </span>
  );
}

/* ── Filtering logic ── */

export function applyFilters(
  tournaments: Tournament[],
  filters: FilterState,
  organizerNames: Map<string, string> = new Map(),
): Tournament[] {
  const now = Date.now();
  const dayMs = 86400000;
  const search = filters.search.trim().toLowerCase();

  return tournaments.filter(t => {
    // Search
    if (search) {
      const orgName = organizerNames.get(t.organizerId) ?? '';
      const hay =
        t.name.toLowerCase() +
        ' ' +
        t.shortName.toLowerCase() +
        ' ' +
        orgName.toLowerCase();
      if (!hay.includes(search)) return false;
    }

    // Status
    if (filters.statuses.length > 0 && !filters.statuses.includes(t.status)) {
      return false;
    }

    // Maps
    if (filters.maps.length > 0) {
      const hasMap = filters.maps.some(m => t.maps.includes(m));
      if (!hasMap) return false;
    }

    // Date
    const start = new Date(t.startDate).getTime();
    const end = new Date(t.endDate).getTime();
    if (filters.dateRange === 'TODAY') {
      const dayStart = new Date().setHours(0, 0, 0, 0);
      const dayEnd = dayStart + dayMs;
      if (end < dayStart || start > dayEnd) return false;
    } else if (filters.dateRange === 'WEEK') {
      if (end < now || start > now + 7 * dayMs) return false;
    } else if (filters.dateRange === 'MONTH') {
      if (end < now || start > now + 30 * dayMs) return false;
    } else if (filters.dateRange === 'UPCOMING') {
      if (start < now) return false;
    } else if (filters.dateRange === 'PAST') {
      if (end >= now) return false;
    }

    // Prize pool
    if (filters.prizeRange === 'FREE' && t.prizePool !== 0) return false;
    if (filters.prizeRange === 'LOW' && t.prizePool >= 1000000) return false;
    if (
      filters.prizeRange === 'MID' &&
      (t.prizePool < 1000000 || t.prizePool > 5000000)
    ) {
      return false;
    }
    if (filters.prizeRange === 'HIGH' && t.prizePool <= 5000000) return false;

    // Entry
    if (filters.isPaid === 'FREE' && t.isPaid) return false;
    if (filters.isPaid === 'PAID' && !t.isPaid) return false;

    return true;
  });
}

void formatMoney;
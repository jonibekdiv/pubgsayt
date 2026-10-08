import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Key, Lock } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { matchApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Props {
  matchId: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED';
}

export function MatchCredentials({ matchId, status }: Props) {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, loading } = useAsync(
    () => user ? matchApi.credentialsFor(matchId, user.id) : Promise.resolve(undefined),
    [matchId, user?.id],
  );

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-white/[.04]" />;
  }

  if (!data?.authorized) {
    return (
      <div className="rounded-xl border border-line bg-bg-deep/40 p-3">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <Lock size={13} />
          <span>{data?.reason ?? 'Not authorized'}</span>
        </div>
      </div>
    );
  }

  if (!data.lobbyId && !data.lobbyPassword) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/[.06] p-3">
        <p className="text-xs text-warning">
          Credentials not published yet. Check back closer to start time.
        </p>
      </div>
    );
  }

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  const isLive = status === 'LIVE';

  return (
    <div className={cn(
      'rounded-xl border p-3 transition',
      isLive
        ? 'border-danger/40 bg-danger/[.06]'
        : 'border-success/30 bg-success/[.04]',
    )}>
      <div className="mb-2 flex items-center gap-2">
        <Key size={12} className={isLive ? 'text-danger' : 'text-success'} />
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-wider',
          isLive ? 'text-danger' : 'text-success',
        )}>
          Lobby credentials
        </p>
        {isLive && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-danger">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" />
            LIVE
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => data.lobbyId && copy(data.lobbyId, 'id')}
          className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-deep/60 px-3 py-2 text-left transition hover:border-brand-600/40 active:scale-[.98]"
        >
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-ink-faint">Lobby ID</p>
            <p className="truncate font-mono text-sm font-bold text-white">
              {data.lobbyId ?? '—'}
            </p>
          </div>
          {copied === 'id'
            ? <Check size={13} className="shrink-0 text-success" />
            : <Copy size={13} className="shrink-0 text-ink-faint" />}
        </button>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-deep/60 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider text-ink-faint">Password</p>
            <p className="truncate font-mono text-sm font-bold text-white">
              {showPassword ? (data.lobbyPassword ?? '—') : '••••••••'}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="rounded-md p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white"
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => data.lobbyPassword && copy(data.lobbyPassword, 'pwd')}
              className="rounded-md p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-white"
              aria-label="Copy password"
            >
              {copied === 'pwd'
                ? <Check size={13} className="text-success" />
                : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-ink-faint">
        Do not share. Leaking credentials disqualifies your team.
      </p>
    </div>
  );
}
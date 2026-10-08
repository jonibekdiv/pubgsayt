import { useEffect, useCallback } from 'react';
import { realtime } from '@/lib/realtime';

const POLL_MS = 15000;

/**
 * Auto-refreshes a callback on:
 * - Same-tab realtime event (host publishes score)
 * - Cross-tab BroadcastChannel (another tab publishes)
 * - Window focus (user returns to tab)
 * - Window visibility change (mobile)
 * - Every 15s polling
 */
export function useLeaderboardAutoRefresh(
  tournamentId: string | undefined,
  refetch: () => void | Promise<void>,
): void {
  const trigger = useCallback(() => {
    void refetch();
  }, [refetch]);

  // 1. Same-tab realtime bus
  useEffect(() => {
    if (!tournamentId) return;
    const unsubscribe = realtime.on('leaderboard:update', (payload) => {
      if (payload.tournamentId === tournamentId) trigger();
    });
    return unsubscribe;
  }, [tournamentId, trigger]);

  // 2. Cross-tab BroadcastChannel
  useEffect(() => {
    if (!tournamentId) return;
    if (typeof BroadcastChannel === 'undefined') return;

    const bc = new BroadcastChannel('ranger-leaderboard');
    bc.onmessage = (event) => {
      if (event.data?.tournamentId === tournamentId) trigger();
    };
    return () => bc.close();
  }, [tournamentId, trigger]);

  // 3. Focus + visibility change
  useEffect(() => {
    if (!tournamentId) return;
    const onFocus = () => trigger();
    const onVisible = () => {
      if (document.visibilityState === 'visible') trigger();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tournamentId, trigger]);

  // 4. Polling every 15s
  useEffect(() => {
    if (!tournamentId) return;
    const t = window.setInterval(trigger, POLL_MS);
    return () => window.clearInterval(t);
  }, [tournamentId, trigger]);
}

/**
 * Broadcast a leaderboard update to all tabs (call from host when publishing).
 */
export function broadcastLeaderboardUpdate(tournamentId: string): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const bc = new BroadcastChannel('ranger-leaderboard');
  bc.postMessage({ tournamentId });
  bc.close();
}
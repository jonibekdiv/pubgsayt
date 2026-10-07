import { useEffect } from 'react';
import { realtime, type EventMap } from '@/lib/realtime';

export function useRealtime<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const unsubscribe = realtime.on(event, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

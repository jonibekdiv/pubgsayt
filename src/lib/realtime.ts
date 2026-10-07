type EventMap = {
  'leaderboard:update': { tournamentId: string };
  'match:update': { matchId: string };
  'notification': { userId: string };
  'tournament:update': { tournamentId: string };
  'wallet:update': { userId: string };
};

export type { EventMap };

type Handler<K extends keyof EventMap> = (p: EventMap[K]) => void;

class RealtimeBus {
  private handlers = new Map<string, Set<Handler<never>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as Handler<never>);
    this.handlers.set(event, set);
    return () => {
      set.delete(handler as Handler<never>);
    };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers.get(event)?.forEach(h => (h as Handler<K>)(payload));
  }
}

export const realtime = new RealtimeBus();

type EventMap = {
  'leaderboard:update': { tournamentId:string };
  'match:update': { matchId:string };
  'notification': { userId:string };
  'tournament:update': { tournamentId:string };
};
type Handler<K extends keyof EventMap> = (p: EventMap[K]) => void;

class RealtimeBus {
  private h = new Map<string, Set<Handler<never>>>();
  on<K extends keyof EventMap>(e: K, fn: Handler<K>): () => void {
    const s = this.h.get(e) ?? new Set();
    s.add(fn as Handler<never>); this.h.set(e, s);
    return () => { s.delete(fn as Handler<never>); };
  }
  emit<K extends keyof EventMap>(e: K, p: EventMap[K]): void {
    this.h.get(e)?.forEach(fn => (fn as Handler<K>)(p));
  }
}
export const realtime = new RealtimeBus();
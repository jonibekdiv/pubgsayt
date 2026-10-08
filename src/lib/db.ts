import type {
  AuditLog, ChatMessage, Match, MatchTeamResult, Notification, OrganizerApplication, PaymentSettings,
  Role, ScoreCorrection, ScoringRule, Stream, Team, TeamMember, TopUpRequest, Tournament,
  TournamentPlayer, TournamentTeam, User, Wallet, WalletTransaction,
} from '@/types';

export interface Database {
  version: number;
  users: User[];
  roles: Role[];
  teams: Team[];
  teamMembers: TeamMember[];
  applications: OrganizerApplication[];
  tournaments: Tournament[];
  tournamentTeams: TournamentTeam[];
  tournamentPlayers: TournamentPlayer[];
  matches: Match[];
  results: MatchTeamResult[];
  scoringRules: ScoringRule[];
  streams: Stream[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  scoreCorrections: ScoreCorrection[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  topUpRequests: TopUpRequest[];
  paymentSettings: PaymentSettings;
}

export const CURRENT_DB_VERSION = 2;
const KEY = 'ranger.esports.db.v3';
let cache: Database | null = null;

/** Auto-remove obsolete DB keys so new schema loads cleanly. */
(function cleanupOldVersions(): void {
  try {
    const obsolete = [
      'ranger.esports.db.v1',
      'ranger.esports.db.v2',
    ];
    for (const k of obsolete) {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    }
  } catch { /* SSR / private mode */ }
})();

export function load(): Database | null {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    cache = JSON.parse(raw) as Database;
    return cache;
  } catch {
    return null;
  }
}

export function save(db: Database): void {
  cache = db;
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function reset(): void {
  cache = null;
  localStorage.removeItem(KEY);
  localStorage.removeItem('ranger.esports.db.v1');
}

export function tx<T>(fn: (db: Database) => T): T {
  const db = load();
  if (!db) throw new Error('DB not initialised');
  const snapshot = structuredClone(db);
  try {
    const result = fn(db);
    save(db);
    return result;
  } catch (err) {
    save(snapshot);
    throw err;
  }
}

export const uid = (prefix = 'id'): string =>
  prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const inviteCode = (): string =>
  Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
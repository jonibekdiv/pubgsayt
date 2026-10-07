import type { AuditLog, Match, MatchTeamResult, Notification, OrganizerApplication, Role, ScoringRule, Stream, Team, TeamMember, Tournament, TournamentPlayer, TournamentTeam, User } from '@/types';

export interface Database {
  version:number; users:User[]; roles:Role[]; teams:Team[]; teamMembers:TeamMember[];
  applications:OrganizerApplication[]; tournaments:Tournament[];
  tournamentTeams:TournamentTeam[]; tournamentPlayers:TournamentPlayer[];
  matches:Match[]; results:MatchTeamResult[]; scoringRules:ScoringRule[];
  streams:Stream[]; notifications:Notification[]; auditLogs:AuditLog[];
}

const KEY = 'ranger.esports.db.v1';
let cache: Database | null = null;

export function load(): Database | null {
  if (cache) return cache;
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; cache = JSON.parse(raw); return cache; }
  catch { return null; }
}
export function save(db: Database): void { cache = db; localStorage.setItem(KEY, JSON.stringify(db)); }
export function reset(): void { cache = null; localStorage.removeItem(KEY); }

export function tx<T>(fn: (db: Database) => T): T {
  const db = load(); if (!db) throw new Error('DB not initialised');
  const snap = structuredClone(db);
  try { const r = fn(db); save(db); return r; }
  catch (e) { save(snap); throw e; }
}
export const uid = (p = 'id'): string => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
export const inviteCode = (): string => Array.from({ length:8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
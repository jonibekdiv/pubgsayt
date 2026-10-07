import type {
  AuditLog, LeaderboardRow, Match, MatchTeamResult, Notification,
  OrganizerApplication, PaymentSettings, PublicUser, Role, ScoringRule, Session, Stream, TopUpRequest,
  Team, TeamMember, Tournament, TournamentTeam, User, Wallet, WalletTransaction,
} from '@/types';
import { load, reset, save, tx, uid, inviteCode as genInvite, CURRENT_DB_VERSION } from '@/lib/db';
import { buildSeedDatabase } from '@/lib/seed';
import { hashPassword, verifyPassword } from '@/lib/security';
import { aggregateLeaderboard, calculateMatchScore } from '@/lib/scoring';
import {
  generateUniqueAmount,
  TOPUP_WINDOW_MINUTES,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_CARD,
  pickPrimaryCard,
} from '@/lib/wallet';
import { realtime } from '@/lib/realtime';

export function ensureDb(): void {
  const d = load();
  if (!d) { save(buildSeedDatabase()); return; }
  ensureWalletFields(d);
  save(d);
}

const delay = <T,>(v: T, ms = 60): Promise<T> => new Promise(r => setTimeout(() => r(v), ms));
export class ApiError extends Error { constructor(m: string, readonly code = 400) { super(m); } }

const strip = (u: User): PublicUser => { const { passwordHash: _p, ...rest } = u; return rest; };
const db = () => { const d = load(); if (!d) throw new ApiError('DB unavailable', 500); return d; };

function ensureWalletFields(d: ReturnType<typeof db>): void {
  if (!Array.isArray(d.wallets)) d.wallets = [];
  if (!Array.isArray(d.walletTransactions)) d.walletTransactions = [];
  if (!Array.isArray(d.topUpRequests)) d.topUpRequests = [];
  if (!Array.isArray(d.scoreCorrections)) d.scoreCorrections = [];

  // Migration: old PaymentSettings (flat card fields) -> new (cards array)
  const ps: unknown = d.paymentSettings;
  const isOldFormat = ps && typeof ps === 'object' && !Array.isArray((ps as PaymentSettings).cards);
  if (!ps || isOldFormat) {
    const old = ps as Partial<PaymentSettings> & {
      cardNumber?: string; cardHolder?: string; phoneNumber?: string; bankName?: string;
    };
    const firstCard = {
      id: DEFAULT_CARD.id,
      cardNumber: old?.cardNumber || DEFAULT_CARD.cardNumber,
      cardHolder: old?.cardHolder || DEFAULT_CARD.cardHolder,
      phoneNumber: old?.phoneNumber || DEFAULT_CARD.phoneNumber,
      bankName: old?.bankName || DEFAULT_CARD.bankName,
      label: 'Main card',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    d.paymentSettings = {
      cards: [firstCard],
      minTopUp: old?.minTopUp ?? 1000,
      maxTopUp: old?.maxTopUp ?? 10000000,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }
  if (d.paymentSettings.minTopUp === 5000) d.paymentSettings.minTopUp = 1000;
}

function audit(actorId: string, action: string, entity: string, entityId: string, oldValue?: unknown, newValue?: unknown) {
  const d = db();
  const actor = d.users.find(u => u.id === actorId);
  d.auditLogs.unshift({
    id: uid('audit'), actorId, actorName: actor?.fullName ?? 'System',
    action, entity, entityId, oldValue, newValue, createdAt: new Date().toISOString(),
  });
  if (d.auditLogs.length > 500) d.auditLogs.length = 500;
  save(d);
}

function notify(userId: string, type: Notification['type'], title: string, body?: string, href?: string) {
  const d = db();
  d.notifications.unshift({
    id: uid('ntf'), userId, type, title, body, href, read: false,
    createdAt: new Date().toISOString(),
  });
  save(d);
}

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў AUTH Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export interface CreateTournamentInput {
  name: string;
  shortName: string;
  description: string;
  rules: string;
  organizerId: string;
  adminLink: string;
  banner?: string;
  logo?: string;
  maps: Array<'ERANGEL'|'MIRAMAR'|'RONDO'|'SANHOK'>;
  maxTeams: number;
  rosterRules: { minPlayers:number; maxPlayers:number; minClanTags:number; minAccountLevel:number };
  isPaid: boolean;
  entryFee: number;
  prizePool: number;
  prizeDistribution: Array<{ place:number; amount:number }>;
  registrationOpen: string;
  registrationClose: string;
  startDate: string;
  endDate: string;
  timezone: string;
  currentStreamUrl?: string;
  hostIds: string[];
  stages: Array<{
    name: string;
    order: number;
    date: string;
    startTime: string;
    endTime?: string;
    teamCount: number;
    matchCount: number;
    maps: Array<'ERANGEL'|'MIRAMAR'|'RONDO'|'SANHOK'>;
    qualificationRules?: string;
    qualificationCount?: number;
  }>;
}

export const authApi = {
  async register(i: { fullName:string; username:string; email:string; phone:string; password:string; avatar?:string }): Promise<Session> {
    return tx(d => {
      if (d.users.some(u => u.username.toLowerCase() === i.username.toLowerCase())) throw new ApiError('Username already taken');
      if (d.users.some(u => u.email.toLowerCase() === i.email.toLowerCase())) throw new ApiError('Email already registered');
      const u: User = {
        id: uid('user'), fullName: i.fullName, username: i.username, email: i.email,
        phone: i.phone, passwordHash: hashPassword(i.password), avatar: i.avatar,
        socials: {}, roles: ['PLAYER'], status: 'ACTIVE', createdAt: new Date().toISOString(),
      };
      d.users.push(u);
      audit(u.id, 'registered', 'User', u.id);
      return delay({ userId: u.id, issuedAt: new Date().toISOString() });
    });
  },

  async login(identifier: string, pwd: string): Promise<Session> {
    const d = db();
    const u = d.users.find(x =>
      x.username.toLowerCase() === identifier.toLowerCase() ||
      x.email.toLowerCase() === identifier.toLowerCase()
    );
    if (!u || !verifyPassword(pwd, u.passwordHash)) throw new ApiError('Invalid credentials', 401);
    if (u.status === 'BANNED') throw new ApiError('Account suspended', 403);
    audit(u.id, 'logged in', 'User', u.id);
    return delay({ userId: u.id, issuedAt: new Date().toISOString() });
  },

  async resetPassword(email: string, pwd: string) {
    return tx(d => {
      const u = d.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new ApiError('No account with that email', 404);
      u.passwordHash = hashPassword(pwd);
      return delay({ ok: true as const });
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў USERS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const userApi = {
  async me(id: string): Promise<PublicUser> {
    const u = db().users.find(x => x.id === id);
    if (!u) throw new ApiError('User not found', 404);
    return delay(strip(u));
  },
  async list(): Promise<PublicUser[]> { return delay(db().users.map(strip)); },
  async update(id: string, patch: Partial<PublicUser>): Promise<PublicUser> {
    return tx(d => {
      const u = d.users.find(x => x.id === id);
      if (!u) throw new ApiError('Not found', 404);
      Object.assign(u, patch);
      return delay(strip(u));
    });
  },
  async setStatus(id: string, status: User['status']): Promise<void> {
    return tx(d => {
      const u = d.users.find(x => x.id === id);
      if (!u) throw new ApiError('Not found', 404);
      u.status = status;
      audit(id, 'set status ' + status, 'User', id);
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў ROLES Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const roleApi = {
  async list(): Promise<Role[]> { return delay(db().roles); },
  async create(i: Omit<Role, 'id' | 'createdAt' | 'system'>): Promise<Role> {
    return tx(d => {
      if (d.roles.some(r => r.key === i.key)) throw new ApiError('Role key exists');
      const r: Role = { ...i, id: uid('role'), system: false, createdAt: new Date().toISOString() };
      d.roles.push(r);
      return delay(r);
    });
  },
  async remove(id: string): Promise<void> {
    return tx(d => {
      const r = d.roles.find(x => x.id === id);
      if (!r) throw new ApiError('Not found', 404);
      if (r.system) throw new ApiError('System roles cannot be deleted', 403);
      d.roles = d.roles.filter(x => x.id !== id);
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў TEAMS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const teamApi = {
  async list(): Promise<Team[]> { return delay(db().teams); },
  async get(id: string) { return delay(db().teams.find(t => t.id === id)); },
  async byInvite(code: string) { return delay(db().teams.find(t => t.inviteCode.toUpperCase() === code.toUpperCase())); },

  async members(teamId: string) {
    const d = db();
    return delay(d.teamMembers.filter(m => m.teamId === teamId)
      .map(m => ({ ...m, user: strip(d.users.find(u => u.id === m.userId)!) }))
      .filter(m => m.user));
  },

  async create(i: { name:string; tag:string; slogan?:string; description?:string; logo?:string; banner?:string; country?:string; city?:string; socials?:Team['socials']; captainId:string }): Promise<Team> {
    return tx(d => {
      if (d.teams.some(t => t.tag.toLowerCase() === i.tag.toLowerCase())) throw new ApiError('Tag already in use');
      const t: Team = {
        id: uid('team'), inviteCode: genInvite(), requiresApproval: true,
        createdAt: new Date().toISOString(), ...i, socials: i.socials ?? {},
      };
      d.teams.push(t);
      d.teamMembers.push({
        id: uid('tm'), teamId: t.id, userId: i.captainId,
        role: 'CAPTAIN', status: 'APPROVED', joinedAt: t.createdAt,
      });
      const cap = d.users.find(u => u.id === i.captainId);
      if (cap && !cap.roles.includes('TEAM_CAPTAIN')) cap.roles.push('TEAM_CAPTAIN');
      audit(i.captainId, 'created team', 'Team', t.id);
      return delay(t);
    });
  },

  async join(teamId: string, userId: string, code?: string): Promise<TeamMember> {
    return tx(d => {
      const team = d.teams.find(t => t.id === teamId);
      if (!team) throw new ApiError('Team not found', 404);
      if (code && team.inviteCode.toUpperCase() !== code.toUpperCase()) throw new ApiError('Invalid invite', 403);
      if (d.teamMembers.some(m => m.teamId === teamId && m.userId === userId)) throw new ApiError('Already a member');
      const m: TeamMember = {
        id: uid('tm'), teamId, userId, role: 'PLAYER',
        status: team.requiresApproval ? 'PENDING' : 'APPROVED',
        joinedAt: new Date().toISOString(),
      };
      d.teamMembers.push(m);
      return delay(m);
    });
  },

  async reviewMember(mid: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    return tx(d => {
      const m = d.teamMembers.find(x => x.id === mid);
      if (!m) throw new ApiError('Not found', 404);
      m.status = status;
    });
  },

  async byUser(userId: string) {
    const d = db();
    const m = d.teamMembers.find(x => x.userId === userId && x.status === 'APPROVED');
    return delay(m ? d.teams.find(t => t.id === m.teamId) : undefined);
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў TOURNAMENTS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const tournamentApi = {
  async list(): Promise<Tournament[]> { return delay(db().tournaments); },
  async get(id: string) { return delay(db().tournaments.find(t => t.id === id)); },
  async create(input: CreateTournamentInput, status: Tournament['status'] = 'DRAFT'): Promise<Tournament> {
    return tx(d => {
      if (d.tournaments.some(t => t.name.toLowerCase() === input.name.toLowerCase()))
        throw new ApiError('Tournament name already exists');

      const id = uid('t');
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const nowIso = new Date().toISOString();

      const stages = input.stages.map((s, i) => ({
        id: id + '_s' + (i + 1),
        tournamentId: id,
        name: s.name,
        order: s.order,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        teamCount: s.teamCount,
        matchCount: s.matchCount,
        maps: s.maps,
        qualificationRules: s.qualificationRules,
        qualificationCount: s.qualificationCount,
        status: 'UPCOMING' as const,
        carryPoints: false,
      }));

      const tournament: Tournament = {
        id, slug,
        name: input.name,
        shortName: input.shortName,
        description: input.description,
        rules: input.rules,
        organizerId: input.organizerId,
        adminLink: input.adminLink,
        banner: input.banner,
        logo: input.logo,
        maps: input.maps,
        stages,
        scoringRuleId: 'sr_' + id,
        tieBreakers: [
          { type: 'WINS', order: 1 },
          { type: 'TOTAL_KILLS', order: 2 },
          { type: 'LAST_MATCH_PLACEMENT', order: 3 },
        ],
        rosterRules: input.rosterRules,
        prizePool: input.prizePool,
        prizeDistribution: input.prizeDistribution,
        isPaid: input.isPaid,
        entryFee: input.isPaid ? input.entryFee : 0,
        registrationOpen: input.registrationOpen,
        registrationClose: input.registrationClose,
        startDate: input.startDate,
        endDate: input.endDate,
        status,
        maxTeams: input.maxTeams,
        timezone: input.timezone,
        hostIds: input.hostIds,
        currentStreamUrl: input.currentStreamUrl,
        streamHistory: input.currentStreamUrl
          ? [{ url: input.currentStreamUrl, updatedBy: input.organizerId, updatedAt: nowIso }]
          : [],
        stageCarryMode: 'RESET_POINTS_FOR_NEXT_STAGE',
        createdAt: nowIso,
      };

      d.tournaments.push(tournament);

      d.scoringRules.push({
        id: 'sr_' + id,
        tournamentId: id,
        name: 'PUBG Default',
        killPoints: 1,
        placementPoints: { 1:10, 2:6, 3:5, 4:4, 5:3, 6:2, 7:1, 8:1 },
      });

      for (const stage of stages) {
        if (stage.matchCount <= 0) continue;
        for (let i = 0; i < stage.matchCount; i++) {
          const map = stage.maps[i % stage.maps.length] ?? stage.maps[0];
          if (!map) continue;
          d.matches.push({
            id: uid('m'),
            tournamentId: id,
            stageId: stage.id,
            matchNumber: i + 1,
            map,
            startTime: stage.date + 'T' + stage.startTime + ':00.000Z',
            hostId: input.hostIds[0],
            status: 'UPCOMING',
            resultsStatus: 'DRAFT',
          });
        }
      }

      audit(input.organizerId, status === 'DRAFT' ? 'created draft tournament' : 'published tournament', 'Tournament', id);
      return delay(tournament);
    });
  },

  async updateStatus(tid: string, status: Tournament['status'], actorId: string) {
    return tx(d => {
      const t = d.tournaments.find(x => x.id === tid);
      if (!t) throw new ApiError('Not found', 404);
      const old = t.status;
      t.status = status;
      audit(actorId, 'changed tournament status to ' + status, 'Tournament', tid, { status: old }, { status });
    });
  },


  async registerTeam(tid: string, teamId: string, actorId: string): Promise<TournamentTeam> {
    return tx(d => {
      const t = d.tournaments.find(x => x.id === tid);
      if (!t) throw new ApiError('Tournament not found', 404);
      if (!['REGISTRATION_OPEN', 'UPCOMING', 'LIVE'].includes(t.status)) throw new ApiError('Registration not open');
      if (new Date(t.registrationClose).getTime() < Date.now()) throw new ApiError('Registration deadline passed');

      const team = d.teams.find(x => x.id === teamId);
      if (!team) throw new ApiError('Team not found', 404);
      if (team.captainId !== actorId) throw new ApiError('Only the team captain can register', 403);

      const members = d.teamMembers.filter(m => m.teamId === teamId && m.status === 'APPROVED');
      if (members.length < t.rosterRules.minPlayers)
        throw new ApiError('Team needs at least ' + t.rosterRules.minPlayers + ' approved players');

      const clanTagCount = members.filter(m => {
        const u = d.users.find(x => x.id === m.userId);
        return u?.pubgNickname && u.pubgNickname.toUpperCase().includes(team.tag.toUpperCase());
      }).length;
      if (clanTagCount < t.rosterRules.minClanTags)
        throw new ApiError('Team needs at least ' + t.rosterRules.minClanTags + ' clan tags');

      if (d.tournamentTeams.some(x => x.tournamentId === tid && x.teamId === teamId))
        throw new ApiError('Team is already registered');

      const active = d.tournamentTeams.filter(x => x.tournamentId === tid && x.status === 'ACTIVE');
      if (active.length >= t.maxTeams) throw new ApiError('No slots available');

      const used = new Set(active.map(x => x.slot));
      const slot = Array.from({ length: t.maxTeams }, (_, i) => i + 1).find(s => !used.has(s))!;

      const tt: TournamentTeam = {
        id: uid('tt'), tournamentId: tid, teamId, slot,
        registeredAt: new Date().toISOString(), registeredBy: actorId, status: 'ACTIVE',
      };
      d.tournamentTeams.push(tt);

      if (active.length + 1 >= t.maxTeams) t.status = 'REGISTRATION_CLOSED';
      audit(actorId, 'registered team for tournament', 'TournamentTeam', tt.id);
      return delay(tt);
    });
  },

  async registeredTeams(tid: string) {
    const d = db();
    return delay(
      d.tournamentTeams
        .filter(x => x.tournamentId === tid)
        .sort((a, b) => a.slot - b.slot)
        .map(x => ({ ...x, team: d.teams.find(t => t.id === x.teamId)! }))
        .filter(x => x.team),
    );
  },

  async disqualifyTeam(ttId: string, reason: string, actorId: string) {
    return tx(d => {
      const tt = d.tournamentTeams.find(x => x.id === ttId);
      if (!tt) throw new ApiError('Not found', 404);
      tt.status = 'DISQUALIFIED';
      tt.dqReason = reason;
      audit(actorId, 'disqualified team', 'TournamentTeam', ttId, undefined, { reason });
    });
  },

  async leaderboard(tid: string, stageId?: string): Promise<LeaderboardRow[]> {
    const d = db();
    const t = d.tournaments.find(x => x.id === tid);
    if (!t) return delay([]);
    return delay(aggregateLeaderboard({
      tournamentId: tid,
      stageId,
      results: d.results,
      tournamentTeams: d.tournamentTeams,
      teams: d.teams,
      tieBreakers: t.tieBreakers,
    }));
  },

  async scoringRule(tid: string): Promise<ScoringRule | undefined> {
    return delay(db().scoringRules.find(r => r.tournamentId === tid));
  },

  async updateStream(tid: string, url: string, actorId: string) {
    return tx(d => {
      const t = d.tournaments.find(x => x.id === tid);
      if (!t) throw new ApiError('Not found', 404);
      const old = t.currentStreamUrl;
      t.currentStreamUrl = url;
      t.streamHistory.unshift({ url, updatedBy: actorId, updatedAt: new Date().toISOString() });
      if (t.streamHistory.length > 50) t.streamHistory.length = 50;
      audit(actorId, 'updated stream URL', 'Tournament', tid, { url: old }, { url });
    });
  },

  async finish(tid: string, actorId: string) {
    return tx(d => {
      const t = d.tournaments.find(x => x.id === tid);
      if (!t) throw new ApiError('Not found', 404);
      t.status = 'FINISHED';
      audit(actorId, 'finished tournament', 'Tournament', tid);
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў MATCHES Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const matchApi = {
  async byTournament(tid: string): Promise<Match[]> {
    return delay(db().matches.filter(m => m.tournamentId === tid).sort((a, b) => a.matchNumber - b.matchNumber));
  },
  async byStage(stageId: string): Promise<Match[]> {
    return delay(db().matches.filter(m => m.stageId === stageId).sort((a, b) => a.matchNumber - b.matchNumber));
  },
  async get(id: string) { return delay(db().matches.find(m => m.id === id)); },

  async results(mid: string): Promise<MatchTeamResult[]> {
    return delay(db().results.filter(r => r.matchId === mid));
  },

  async submitScores(
    matchId: string,
    actorId: string,
    entries: Array<{ teamId: string; placement: number; kills: number; bonus: number; penalty: number }>,
    mode: 'DRAFT' | 'SUBMIT' = 'SUBMIT',
  ) {
    return tx(d => {
      const match = d.matches.find(m => m.id === matchId);
      if (!match) throw new ApiError('Match not found', 404);
      const rule = d.scoringRules.find(r => r.tournamentId === match.tournamentId);
      if (!rule) throw new ApiError('Scoring rule missing', 500);

      const placements = entries.map(e => e.placement).filter(p => p > 0);
      const dupes = placements.filter((p, i) => placements.indexOf(p) !== i);
      if (dupes.length > 0) throw new ApiError('Duplicate placements detected: ' + [...new Set(dupes)].join(', '));

      for (const e of entries) {
        if (e.kills < 0) throw new ApiError('Kills cannot be negative');
        if (e.placement < 0 || e.placement > 32) throw new ApiError('Invalid placement for team');
      }

      for (const e of entries) {
        const score = calculateMatchScore(
          { placement: e.placement, kills: e.kills, bonus: e.bonus, penalty: e.penalty },
          rule,
        );
        const existing = d.results.find(r => r.matchId === matchId && r.teamId === e.teamId);
        if (existing && existing.status === 'PUBLISHED') {
          throw new ApiError('Cannot edit published scores. Request a correction instead.');
        }
        const nextStatus = mode === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
        if (existing) {
          Object.assign(existing, {
            placement: e.placement,
            kills: e.kills,
            bonus: e.bonus,
            penalty: e.penalty,
            placementPoints: score.placementPoints,
            killPoints: score.killPoints,
            totalPoints: score.totalPoints,
            enteredBy: actorId,
            enteredAt: new Date().toISOString(),
            status: nextStatus,
          });
        } else {
          d.results.push({
            id: uid('res'),
            matchId,
            tournamentId: match.tournamentId,
            stageId: match.stageId,
            teamId: e.teamId,
            placement: e.placement,
            kills: e.kills,
            bonus: e.bonus,
            penalty: e.penalty,
            placementPoints: score.placementPoints,
            killPoints: score.killPoints,
            totalPoints: score.totalPoints,
            enteredBy: actorId,
            enteredAt: new Date().toISOString(),
            status: nextStatus,
          });
        }
      }

      match.resultsStatus = mode === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
      audit(actorId, mode === 'DRAFT' ? 'saved draft scores' : 'submitted match scores', 'Match', matchId);
    });
  },

  async publishResults(matchId: string, actorId: string) {
    return tx(d => {
      const match = d.matches.find(m => m.id === matchId);
      if (!match) throw new ApiError('Match not found', 404);
      const results = d.results.filter(r => r.matchId === matchId);
      if (!results.length) throw new ApiError('No scores to publish');
      results.forEach(r => { r.status = 'PUBLISHED'; });
      match.resultsStatus = 'PUBLISHED';
      match.status = 'FINISHED';
      audit(actorId, 'published match results', 'Match', matchId);

      const t = d.tournaments.find(x => x.id === match.tournamentId);
      if (t) {
        const teams = d.tournamentTeams.filter(tt => tt.tournamentId === t.id);
        teams.forEach(tt => {
          const team = d.teams.find(x => x.id === tt.teamId);
          if (team) notify(team.captainId, 'INFO', 'New results published', t.name, '/tournaments/' + t.id);
        });
      }
    });
  },

  async setStatus(matchId: string, status: Match['status'], actorId: string) {
    return tx(d => {
      const m = d.matches.find(x => x.id === matchId);
      if (!m) throw new ApiError('Not found', 404);
      const old = m.status;
      m.status = status;
      audit(actorId, 'set match status to ' + status, 'Match', matchId, { status: old }, { status });
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў STREAMS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const streamApi = {
  async byTournament(tid: string): Promise<Stream[]> {
    return delay(db().streams.filter(s => s.tournamentId === tid));
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў ORGANIZER APPLICATIONS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const organizerApi = {
  async apply(i: Omit<OrganizerApplication, 'id' | 'status' | 'createdAt'>): Promise<OrganizerApplication> {
    return tx(d => {
      if (d.applications.some(a => a.userId === i.userId && a.status === 'PENDING')) throw new ApiError('Pending application exists');
      const a: OrganizerApplication = {
        ...i, id: uid('app'), status: 'PENDING', createdAt: new Date().toISOString(),
      };
      d.applications.push(a);
      return delay(a);
    });
  },
  async list(): Promise<OrganizerApplication[]> { return delay(db().applications); },
  async review(id: string, status: OrganizerApplication['status'], reviewerId: string, note?: string) {
    return tx(d => {
      const a = d.applications.find(x => x.id === id);
      if (!a) throw new ApiError('Not found', 404);
      a.status = status;
      a.reviewNote = note;
      a.reviewedBy = reviewerId;
      a.reviewedAt = new Date().toISOString();
      if (status === 'APPROVED') {
        const u = d.users.find(x => x.id === a.userId);
        if (u && !u.roles.includes('ORGANIZER')) u.roles.push('ORGANIZER');
        notify(a.userId, 'SUCCESS', 'Organizer approved', 'You can now create tournaments.', '/organizer');
      }
      return delay(a);
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў NOTIFICATIONS Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const notificationApi = {
  async forUser(userId: string): Promise<Notification[]> {
    return delay(db().notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async markAllRead(userId: string): Promise<void> {
    return tx(d => { d.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; }); });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў AUDIT Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const auditApi = {
  async list(): Promise<AuditLog[]> { return delay(db().auditLogs); },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў SEARCH Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const searchApi = {
  async query(q: string): Promise<{ users:PublicUser[]; teams:Team[]; tournaments:Tournament[] }> {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return delay({ users: [], teams: [], tournaments: [] });
    const d = db();
    return delay({
      users: d.users.filter(u =>
        u.username.toLowerCase().includes(t) || u.fullName.toLowerCase().includes(t)
      ).slice(0, 5).map(strip),
      teams: d.teams.filter(x =>
        x.name.toLowerCase().includes(t) || x.tag.toLowerCase().includes(t)
      ).slice(0, 5),
      tournaments: d.tournaments.filter(x =>
        x.name.toLowerCase().includes(t)
      ).slice(0, 5),
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў ADMIN Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const adminApi = {
  async stats() {
    const d = db();
    ensureWalletFields(d);
    const byStatus = (s: Tournament['status']) => d.tournaments.filter(t => t.status === s).length;
    return delay({
      users: d.users.length,
      activeUsers: d.users.filter(u => u.status === 'ACTIVE').length,
      teams: d.teams.length,
      organizers: d.users.filter(u => u.roles.includes('ORGANIZER')).length,
      hosts: d.users.filter(u => u.roles.includes('HOST')).length,
      tournaments: d.tournaments.length,
      liveTournaments: byStatus('LIVE'),
      finishedTournaments: byStatus('FINISHED'),
      matches: d.matches.length,
      prizePool: d.tournaments.reduce((s, t) => s + t.prizePool, 0),
      revenue: d.tournaments.reduce((s, t) =>
        s + (t.isPaid ? t.entryFee * d.tournamentTeams.filter(x => x.tournamentId === t.id).length : 0), 0),
      roleDistribution: d.roles
        .map(r => ({ name: r.name, value: d.users.filter(u => u.roles.includes(r.key)).length }))
        .filter(x => x.value > 0),
    });
  },
};

/* Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў SYSTEM Р В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ўР В Р вЂ Р Р†Р вЂљРЎС›Р РЋРІР‚в„ў */
export const systemApi = {
  reset: () => { reset(); ensureDb(); },
  seed: () => { save(buildSeedDatabase()); },
};

/* ---------- WALLET ---------- */
export const walletApi = {
  async get(userId: string): Promise<Wallet> {
    return tx(d => {
      ensureWalletFields(d);
      let w = d.wallets.find(x => x.userId === userId);
      if (!w) {
        w = { userId, balance: 0, currency: 'UZS', updatedAt: new Date().toISOString() };
        d.wallets.push(w);
      }
      return delay({ ...w });
    });
  },

  async transactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    ensureWalletFields(db());
    return delay(
      db().walletTransactions
        .filter(t => t.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    );
  },

  async summary(userId: string) {
    ensureWalletFields(db());
    const txs = db().walletTransactions.filter(t => t.userId === userId);
    const totalIn = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalOut = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const prizeWon = txs.filter(t => t.type === 'PRIZE_WIN').reduce((s, t) => s + t.amount, 0);
    const pendingTopUp = db().topUpRequests
      .filter(r => r.userId === userId && (r.status === 'PENDING_PAYMENT' || r.status === 'AWAITING_CONFIRMATION'))
      .reduce((s, r) => s + r.requestedAmount, 0);
    return delay({ totalIn, totalOut, prizeWon, pendingTopUp });
  },

  async adminAdjust(userId: string, amount: number, reason: string, adminId: string) {
    return tx(d => {
      ensureWalletFields(d);
      let w = d.wallets.find(x => x.userId === userId);
      if (!w) {
        w = { userId, balance: 0, currency: 'UZS', updatedAt: new Date().toISOString() };
        d.wallets.push(w);
      }
      w.balance += amount;
      w.updatedAt = new Date().toISOString();
      d.walletTransactions.unshift({
        id: uid('wtx'),
        userId,
        type: 'ADMIN_ADJUST',
        amount,
        balanceAfter: w.balance,
        description: reason,
        createdAt: new Date().toISOString(),
      });
      audit(adminId, 'adjusted wallet', 'Wallet', userId, undefined, { amount, reason });
      realtime.emit('wallet:update', { userId });
      notify(userId, amount > 0 ? 'SUCCESS' : 'WARNING', amount > 0 ? 'Wallet credited' : 'Wallet debited', (amount > 0 ? '+' : '') + amount + ' UZS - ' + reason, '/wallet');
    });
  },
};

/* ---------- TOP-UP ---------- */
export const topUpApi = {
  async create(userId: string, requestedAmount: number): Promise<TopUpRequest> {
    return tx(d => {
      ensureWalletFields(d);
      const settings = d.paymentSettings;
      if (requestedAmount < settings.minTopUp) {
        throw new ApiError('Minimum top-up is ' + settings.minTopUp + ' UZS');
      }
      if (requestedAmount > settings.maxTopUp) {
        throw new ApiError('Maximum top-up is ' + settings.maxTopUp + ' UZS');
      }

      const active = d.topUpRequests.filter(
        r => r.userId === userId && (r.status === 'PENDING_PAYMENT' || r.status === 'AWAITING_CONFIRMATION'),
      );
      if (active.length >= 3) throw new ApiError('You already have 3 active top-up requests');

      const allActive = d.topUpRequests.filter(
        r => r.status === 'PENDING_PAYMENT' || r.status === 'AWAITING_CONFIRMATION',
      );
      const uniqueAmount = generateUniqueAmount(requestedAmount, allActive);

      const primary = pickPrimaryCard(settings);
      if (!primary) throw new ApiError('No active payment card configured. Contact admin.');

      const nowMs = Date.now();
      const req: TopUpRequest = {
        id: uid('topup'),
        userId,
        requestedAmount,
        uniqueAmount,
        status: 'PENDING_PAYMENT',
        cardId: primary.id,
        cardNumber: primary.cardNumber,
        cardHolder: primary.cardHolder,
        phoneNumber: primary.phoneNumber,
        bankName: primary.bankName,
        createdAt: new Date(nowMs).toISOString(),
        expiresAt: new Date(nowMs + TOPUP_WINDOW_MINUTES * 60000).toISOString(),
      };
      d.topUpRequests.unshift(req);
      audit(userId, 'created top-up request', 'TopUpRequest', req.id);
      return delay({ ...req });
    });
  },

  async listForUser(userId: string): Promise<TopUpRequest[]> {
    ensureWalletFields(db());
    return delay(db().topUpRequests.filter(r => r.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async listAll(): Promise<TopUpRequest[]> {
    ensureWalletFields(db());
    return delay([...db().topUpRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async markPaid(requestId: string, userId: string) {
    return tx(d => {
      ensureWalletFields(d);
      const r = d.topUpRequests.find(x => x.id === requestId);
      if (!r) throw new ApiError('Request not found', 404);
      if (r.userId !== userId) throw new ApiError('Not your request', 403);
      if (r.status !== 'PENDING_PAYMENT') throw new ApiError('Request cannot be marked as paid');
      r.status = 'AWAITING_CONFIRMATION';
      r.paidAt = new Date().toISOString();
      audit(userId, 'marked top-up as paid', 'TopUpRequest', r.id);
      d.users.filter(u => u.roles.includes('ADMIN') || u.roles.includes('SUPERADMIN')).forEach(a =>
        notify(a.id, 'INFO', 'New top-up awaiting confirmation', r.uniqueAmount + ' UZS', '/admin/topup-requests'));
    });
  },

  async approve(requestId: string, adminId: string) {
    return tx(d => {
      ensureWalletFields(d);
      const r = d.topUpRequests.find(x => x.id === requestId);
      if (!r) throw new ApiError('Request not found', 404);
      if (r.status !== 'AWAITING_CONFIRMATION') throw new ApiError('Request not awaiting confirmation');

      let w = d.wallets.find(x => x.userId === r.userId);
      if (!w) {
        w = { userId: r.userId, balance: 0, currency: 'UZS', updatedAt: new Date().toISOString() };
        d.wallets.push(w);
      }
      w.balance += r.requestedAmount;
      w.updatedAt = new Date().toISOString();

      d.walletTransactions.unshift({
        id: uid('wtx'),
        userId: r.userId,
        type: 'TOP_UP',
        amount: r.requestedAmount,
        balanceAfter: w.balance,
        description: 'Wallet top-up #' + r.id.slice(-6).toUpperCase(),
        refId: r.id,
        createdAt: new Date().toISOString(),
      });

      r.status = 'APPROVED';
      r.confirmedAt = new Date().toISOString();
      r.confirmedBy = adminId;

      audit(adminId, 'approved top-up', 'TopUpRequest', r.id, undefined, { amount: r.requestedAmount });
      realtime.emit('wallet:update', { userId: r.userId });
      notify(r.userId, 'SUCCESS', 'Wallet credited', '+' + r.requestedAmount + ' UZS', '/wallet');
    });
  },

  async reject(requestId: string, adminId: string, reason: string) {
    return tx(d => {
      ensureWalletFields(d);
      const r = d.topUpRequests.find(x => x.id === requestId);
      if (!r) throw new ApiError('Request not found', 404);
      r.status = 'REJECTED';
      r.rejectedReason = reason;
      r.confirmedAt = new Date().toISOString();
      r.confirmedBy = adminId;
      audit(adminId, 'rejected top-up', 'TopUpRequest', r.id, undefined, { reason });
      realtime.emit('wallet:update', { userId: r.userId });
      notify(r.userId, 'ERROR', 'Top-up rejected', reason, '/wallet');
    });
  },

  async cancel(requestId: string, userId: string) {
    return tx(d => {
      ensureWalletFields(d);
      const r = d.topUpRequests.find(x => x.id === requestId);
      if (!r) throw new ApiError('Not found', 404);
      if (r.userId !== userId) throw new ApiError('Not your request', 403);
      if (r.status !== 'PENDING_PAYMENT') throw new ApiError('Cannot cancel');
      r.status = 'CANCELLED';
    });
  },

  async stats() {
    const d = db();
    const today = new Date().toISOString().slice(0, 10);
    return delay({
      awaiting: d.topUpRequests.filter(r => r.status === 'AWAITING_CONFIRMATION').length,
      pending: d.topUpRequests.filter(r => r.status === 'PENDING_PAYMENT').length,
      approvedToday: d.topUpRequests.filter(r => r.status === 'APPROVED' && r.confirmedAt && r.confirmedAt.startsWith(today)).length,
      rejectedToday: d.topUpRequests.filter(r => r.status === 'REJECTED' && r.confirmedAt && r.confirmedAt.startsWith(today)).length,
    });
  },
};

/* ---------- PAYMENT SETTINGS ---------- */
export const paymentSettingsApi = {
  async get(): Promise<PaymentSettings> {
    return tx(d => {
      ensureWalletFields(d);
      return delay({ ...d.paymentSettings });
    });
  },

  async updateBounds(minTopUp: number, maxTopUp: number, adminId: string): Promise<PaymentSettings> {
    return tx(d => {
      ensureWalletFields(d);
      if (minTopUp < 0 || maxTopUp <= minTopUp) throw new ApiError('Invalid range');
      d.paymentSettings.minTopUp = minTopUp;
      d.paymentSettings.maxTopUp = maxTopUp;
      d.paymentSettings.updatedAt = new Date().toISOString();
      d.paymentSettings.updatedBy = adminId;
      audit(adminId, 'updated payment bounds', 'PaymentSettings', 'global');
      return delay({ ...d.paymentSettings });
    });
  },

  async addCard(input: Omit<PaymentCard, 'id' | 'createdAt'>, adminId: string): Promise<PaymentCard> {
    return tx(d => {
      ensureWalletFields(d);
      if (!input.cardNumber.trim()) throw new ApiError('Card number required');
      const card: PaymentCard = {
        ...input,
        id: 'card_' + Date.now().toString(36),
        createdAt: new Date().toISOString(),
      };
      d.paymentSettings.cards.push(card);
      d.paymentSettings.updatedAt = new Date().toISOString();
      d.paymentSettings.updatedBy = adminId;
      audit(adminId, 'added payment card', 'PaymentCard', card.id);
      return delay(card);
    });
  },

  async updateCard(cardId: string, patch: Partial<PaymentCard>, adminId: string): Promise<PaymentCard> {
    return tx(d => {
      ensureWalletFields(d);
      const c = d.paymentSettings.cards.find(x => x.id === cardId);
      if (!c) throw new ApiError('Card not found', 404);
      Object.assign(c, patch);
      d.paymentSettings.updatedAt = new Date().toISOString();
      d.paymentSettings.updatedBy = adminId;
      audit(adminId, 'updated payment card', 'PaymentCard', cardId);
      return delay(c);
    });
  },

  async removeCard(cardId: string, adminId: string): Promise<void> {
    return tx(d => {
      ensureWalletFields(d);
      if (d.paymentSettings.cards.length <= 1) throw new ApiError('At least one card required');
      d.paymentSettings.cards = d.paymentSettings.cards.filter(c => c.id !== cardId);
      d.paymentSettings.updatedAt = new Date().toISOString();
      d.paymentSettings.updatedBy = adminId;
      audit(adminId, 'removed payment card', 'PaymentCard', cardId);
    });
  },

  async toggleCard(cardId: string, adminId: string): Promise<PaymentCard> {
    return tx(d => {
      ensureWalletFields(d);
      const c = d.paymentSettings.cards.find(x => x.id === cardId);
      if (!c) throw new ApiError('Card not found', 404);
      c.isActive = !c.isActive;
      d.paymentSettings.updatedAt = new Date().toISOString();
      d.paymentSettings.updatedBy = adminId;
      return delay(c);
    });
  },
};

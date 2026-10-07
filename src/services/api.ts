import type { AuditLog, LeaderboardRow, Match, MatchTeamResult, Notification, OrganizerApplication, PublicUser, Role, ScoringRule, Session, Stream, Team, TeamMember, Tournament, TournamentTeam, User } from '@/types';
import { load, reset, save, tx, uid, inviteCode as genInvite } from '@/lib/db';
import { buildSeedDatabase } from '@/lib/seed';
import { hashPassword, verifyPassword } from '@/lib/security';

export function ensureDb(): void { if (!load()) save(buildSeedDatabase()); }

const delay = <T,>(v: T, ms = 80): Promise<T> => new Promise(r => setTimeout(() => r(v), ms));
export class ApiError extends Error { constructor(m: string, readonly code = 400) { super(m); } }
const strip = (u: User): PublicUser => { const { passwordHash: _p, ...rest } = u; return rest; };
const db = () => { const d = load(); if (!d) throw new ApiError('DB unavailable', 500); return d; };

function audit(actorId: string, action: string, entity: string, entityId: string) {
  const d = db();
  const actor = d.users.find(u => u.id === actorId);
  d.auditLogs.unshift({ id:uid('audit'), actorId, actorName:actor?.fullName ?? 'System',
    action, entity, entityId, createdAt:new Date().toISOString() });
  if (d.auditLogs.length > 500) d.auditLogs.length = 500;
  save(d);
}

export const authApi = {
  async register(i: { fullName:string; username:string; email:string; phone:string; password:string; avatar?:string }): Promise<Session> {
    return tx(d => {
      if (d.users.some(u => u.username.toLowerCase() === i.username.toLowerCase())) throw new ApiError('Username already taken');
      if (d.users.some(u => u.email.toLowerCase() === i.email.toLowerCase())) throw new ApiError('Email already registered');
      const u: User = { id:uid('user'), fullName:i.fullName, username:i.username, email:i.email,
        phone:i.phone, passwordHash:hashPassword(i.password), avatar:i.avatar,
        socials:{}, roles:['PLAYER'], status:'ACTIVE', createdAt:new Date().toISOString() };
      d.users.push(u); audit(u.id, 'registered', 'User', u.id);
      return delay({ userId:u.id, issuedAt:new Date().toISOString() });
    });
  },
  async login(id: string, pwd: string): Promise<Session> {
    const d = db();
    const u = d.users.find(x => x.username.toLowerCase() === id.toLowerCase() || x.email.toLowerCase() === id.toLowerCase());
    if (!u || !verifyPassword(pwd, u.passwordHash)) throw new ApiError('Invalid credentials', 401);
    if (u.status === 'BANNED') throw new ApiError('Account suspended', 403);
    audit(u.id, 'logged in', 'User', u.id);
    return delay({ userId:u.id, issuedAt:new Date().toISOString() });
  },
  async resetPassword(email: string, pwd: string) {
    return tx(d => {
      const u = d.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new ApiError('No account with that email', 404);
      u.passwordHash = hashPassword(pwd); return delay({ ok:true as const });
    });
  },
};

export const userApi = {
  async me(id: string): Promise<PublicUser> {
    const u = db().users.find(x => x.id === id);
    if (!u) throw new ApiError('User not found', 404);
    return delay(strip(u));
  },
  async list(): Promise<PublicUser[]> { return delay(db().users.map(strip)); },
  async update(id: string, patch: Partial<PublicUser>): Promise<PublicUser> {
    return tx(d => { const u = d.users.find(x => x.id === id); if (!u) throw new ApiError('Not found', 404); Object.assign(u, patch); return delay(strip(u)); });
  },
  async setStatus(id: string, status: User['status']): Promise<void> {
    return tx(d => { const u = d.users.find(x => x.id === id); if (!u) throw new ApiError('Not found', 404); u.status = status; audit(id, `set ${status}`, 'User', id); });
  },
};

export const roleApi = {
  async list(): Promise<Role[]> { return delay(db().roles); },
  async create(i: Omit<Role,'id'|'createdAt'|'system'>): Promise<Role> {
    return tx(d => {
      if (d.roles.some(r => r.key === i.key)) throw new ApiError('Role key exists');
      const r: Role = { ...i, id:uid('role'), system:false, createdAt:new Date().toISOString() };
      d.roles.push(r); return delay(r);
    });
  },
  async remove(id: string): Promise<void> {
    return tx(d => {
      const r = d.roles.find(x => x.id === id); if (!r) throw new ApiError('Not found', 404);
      if (r.system) throw new ApiError('System roles cannot be deleted', 403);
      d.roles = d.roles.filter(x => x.id !== id);
    });
  },
};

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
      const t: Team = { id:uid('team'), inviteCode:genInvite(), requiresApproval:true, createdAt:new Date().toISOString(), ...i };
      d.teams.push(t);
      d.teamMembers.push({ id:uid('tm'), teamId:t.id, userId:i.captainId, role:'CAPTAIN', status:'APPROVED', joinedAt:t.createdAt });
      const cap = d.users.find(u => u.id === i.captainId);
      if (cap && !cap.roles.includes('TEAM_CAPTAIN')) cap.roles.push('TEAM_CAPTAIN');
      audit(i.captainId, 'created team', 'Team', t.id);
      return delay(t);
    });
  },
  async join(teamId: string, userId: string, code?: string): Promise<TeamMember> {
    return tx(d => {
      const team = d.teams.find(t => t.id === teamId); if (!team) throw new ApiError('Team not found', 404);
      if (code && team.inviteCode.toUpperCase() !== code.toUpperCase()) throw new ApiError('Invalid invite', 403);
      if (d.teamMembers.some(m => m.teamId === teamId && m.userId === userId)) throw new ApiError('Already a member');
      const m: TeamMember = { id:uid('tm'), teamId, userId, role:'PLAYER', status: team.requiresApproval ? 'PENDING' : 'APPROVED', joinedAt:new Date().toISOString() };
      d.teamMembers.push(m);
      return delay(m);
    });
  },
  async reviewMember(mid: string, status: 'APPROVED'|'REJECTED'): Promise<void> {
    return tx(d => { const m = d.teamMembers.find(x => x.id === mid); if (!m) throw new ApiError('Not found', 404); m.status = status; });
  },
  async removeMember(mid: string): Promise<void> {
    return tx(d => { d.teamMembers = d.teamMembers.filter(m => m.id !== mid); });
  },
  async byUser(userId: string) {
    const d = db();
    const m = d.teamMembers.find(x => x.userId === userId && x.status === 'APPROVED');
    return delay(m ? d.teams.find(t => t.id === m.teamId) : undefined);
  },
};

export const tournamentApi = {
  async list(): Promise<Tournament[]> { return delay(db().tournaments); },
  async get(id: string) { return delay(db().tournaments.find(t => t.id === id)); },
  async create(i: Omit<Tournament,'id'|'createdAt'|'slug'>): Promise<Tournament> {
    return tx(d => {
      const id = uid('t');
      const slug = i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const t: Tournament = { ...i, id, slug, createdAt:new Date().toISOString() };
      d.tournaments.push(t);
      d.scoringRules.push({ id:`sr_${id}`, tournamentId:id, name:'PUBG Standard', killPoints:1,
        placementPoints:{ 1:10, 2:6, 3:5, 4:4, 5:3, 6:2, 7:2, 8:1, 9:1, 10:1 } });
      return delay(t);
    });
  },
  async registerTeam(tid: string, teamId: string, actorId: string): Promise<TournamentTeam> {
    return tx(d => {
      const t = d.tournaments.find(x => x.id === tid); if (!t) throw new ApiError('Tournament not found', 404);
      if (!['REGISTRATION_OPEN','UPCOMING','LIVE'].includes(t.status)) throw new ApiError('Registration not open');
      const team = d.teams.find(x => x.id === teamId); if (!team) throw new ApiError('Team not found', 404);
      if (team.captainId !== actorId) throw new ApiError('Only the captain can register', 403);
      const members = d.teamMembers.filter(m => m.teamId === teamId && m.status === 'APPROVED');
      if (members.length < t.minTeamSize) throw new ApiError(`Team needs ${t.minTeamSize}+ approved players`);
      if (d.tournamentTeams.some(x => x.tournamentId === tid && x.teamId === teamId)) throw new ApiError('Already registered');
      const active = d.tournamentTeams.filter(x => x.tournamentId === tid);
      if (active.length >= t.maxTeams) throw new ApiError('No slots available');
      const used = new Set(active.map(x => x.slot));
      const slot = Array.from({ length:t.maxTeams }, (_,i) => i+1).find(s => !used.has(s))!;
      const tt: TournamentTeam = { id:uid('tt'), tournamentId:tid, teamId, slot,
        registeredAt:new Date().toISOString(), registeredBy:actorId, status:'ACTIVE' };
      d.tournamentTeams.push(tt);
      for (const m of members) d.tournamentPlayers.push({ id:uid('tp'), tournamentId:tid, teamId, userId:m.userId, role:m.role, createdAt:tt.registeredAt });
      return delay(tt);
    });
  },
  async registeredTeams(tid: string) {
    const d = db();
    return delay(d.tournamentTeams.filter(x => x.tournamentId === tid).sort((a,b) => a.slot - b.slot)
      .map(x => ({ ...x, team: d.teams.find(t => t.id === x.teamId)! })).filter(x => x.team));
  },
  async leaderboard(tid: string): Promise<LeaderboardRow[]> {
    const d = db();
    const rule = d.scoringRules.find(r => r.tournamentId === tid);
    if (!rule) return delay([]);
    const tts = d.tournamentTeams.filter(x => x.tournamentId === tid);
    const acc = new Map<string, { cd:number; pp:number; kp:number; bonus:number; penalty:number }>();
    for (const r of d.results) {
      if (r.tournamentId !== tid) continue;
      if (r.status !== 'PUBLISHED' && r.status !== 'APPROVED') continue;
      const e = acc.get(r.teamId) ?? { cd:0, pp:0, kp:0, bonus:0, penalty:0 };
      e.cd += 1;
      e.pp += rule.placementPoints[r.placement] ?? 0;
      e.kp += r.kills * rule.killPoints;
      e.bonus += r.bonus; e.penalty += r.penalty;
      acc.set(r.teamId, e);
    }
    const rows: LeaderboardRow[] = tts.map(tt => {
      const team = d.teams.find(t => t.id === tt.teamId);
      const e = acc.get(tt.teamId) ?? { cd:0, pp:0, kp:0, bonus:0, penalty:0 };
      return { rank:0, teamId:tt.teamId, teamName:team?.name ?? 'Unknown', teamTag:team?.tag ?? 'вЂ”',
        teamLogo:team?.logo, cd:e.cd, pp:e.pp, kp:e.kp, tp:e.pp + e.kp + e.bonus - e.penalty };
    });
    rows.sort((a,b) => b.tp - a.tp || b.kp - a.kp || b.pp - a.pp || a.teamName.localeCompare(b.teamName));
    rows.forEach((r,i) => { r.rank = i+1; });
    return delay(rows);
  },
};

export const matchApi = {
  async byTournament(tid: string): Promise<Match[]> {
    return delay(db().matches.filter(m => m.tournamentId === tid).sort((a,b) => a.matchNumber - b.matchNumber));
  },
  async results(mid: string): Promise<MatchTeamResult[]> { return delay(db().results.filter(r => r.matchId === mid)); },
};

export const streamApi = {
  async byTournament(tid: string): Promise<Stream[]> { return delay(db().streams.filter(s => s.tournamentId === tid)); },
};

export const organizerApi = {
  async apply(i: Omit<OrganizerApplication,'id'|'status'|'createdAt'>): Promise<OrganizerApplication> {
    return tx(d => {
      if (d.applications.some(a => a.userId === i.userId && a.status === 'PENDING')) throw new ApiError('Pending application exists');
      const a: OrganizerApplication = { ...i, id:uid('app'), status:'PENDING', createdAt:new Date().toISOString() };
      d.applications.push(a); return delay(a);
    });
  },
  async list(): Promise<OrganizerApplication[]> { return delay(db().applications); },
  async review(id: string, status: OrganizerApplication['status'], reviewerId: string, note?: string) {
    return tx(d => {
      const a = d.applications.find(x => x.id === id); if (!a) throw new ApiError('Not found', 404);
      a.status = status; a.reviewNote = note; a.reviewedBy = reviewerId; a.reviewedAt = new Date().toISOString();
      if (status === 'APPROVED') {
        const u = d.users.find(x => x.id === a.userId);
        if (u && !u.roles.includes('ORGANIZER')) u.roles.push('ORGANIZER');
      }
      return delay(a);
    });
  },
};

export const notificationApi = {
  async forUser(userId: string): Promise<Notification[]> {
    return delay(db().notifications.filter(n => n.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async markAllRead(userId: string): Promise<void> {
    return tx(d => { d.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; }); });
  },
};

export const auditApi = { async list(): Promise<AuditLog[]> { return delay(db().auditLogs); } };

export const searchApi = {
  async query(q: string): Promise<{ users:PublicUser[]; teams:Team[]; tournaments:Tournament[] }> {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return delay({ users:[], teams:[], tournaments:[] });
    const d = db();
    return delay({
      users: d.users.filter(u => u.username.toLowerCase().includes(t) || u.fullName.toLowerCase().includes(t)).slice(0,5).map(strip),
      teams: d.teams.filter(x => x.name.toLowerCase().includes(t) || x.tag.toLowerCase().includes(t)).slice(0,5),
      tournaments: d.tournaments.filter(x => x.name.toLowerCase().includes(t)).slice(0,5),
    });
  },
};

export const adminApi = {
  async stats() {
    const d = db();
    const byStatus = (s: Tournament['status']) => d.tournaments.filter(t => t.status === s).length;
    return delay({
      users:d.users.length, activeUsers:d.users.filter(u => u.status === 'ACTIVE').length,
      teams:d.teams.length,
      organizers:d.users.filter(u => u.roles.includes('ORGANIZER')).length,
      hosts:d.users.filter(u => u.roles.includes('HOST')).length,
      tournaments:d.tournaments.length,
      liveTournaments:byStatus('LIVE'), finishedTournaments:byStatus('FINISHED'),
      matches:d.matches.length,
      prizePool:d.tournaments.reduce((s,t) => s + t.prizePool, 0),
      roleDistribution: d.roles.map(r => ({ name:r.name, value:d.users.filter(u => u.roles.includes(r.key)).length })).filter(x => x.value > 0),
    });
  },
};

export const systemApi = {
  reset: () => { reset(); ensureDb(); },
  seed: () => { save(buildSeedDatabase()); },
};
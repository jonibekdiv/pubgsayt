# ============================================================
#  RANGER ESPORTS — setup2.ps1 (barcha src fayllari)
#  Ishga tushirish: powershell -ExecutionPolicy Bypass -File setup2.ps1
# ============================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "`n==> src fayllari yaratilmoqda...`n" -ForegroundColor Cyan

function Write-File {
  param([string]$RelPath, [string]$Content)
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  [+] $RelPath" -ForegroundColor DarkGray
}

# ============ main.tsx ============
Write-File 'src/main.tsx' @'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
'@

# ============ types ============
Write-File 'src/types/index.ts' @'
export type RoleKey = 'SUPERADMIN'|'ADMIN'|'ORGANIZER'|'HOST'|'TEAM_CAPTAIN'|'PLAYER'|(string & {});

export interface Role { id:string; key:RoleKey; name:string; description:string; permissions:string[]; system:boolean; createdAt:string; }

export interface User {
  id:string; fullName:string; username:string; email:string; phone?:string;
  passwordHash:string; avatar?:string; country?:string; city?:string;
  pubgNickname?:string; pubgId?:string;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord'|'website',string>>;
  roles:RoleKey[]; status:'ACTIVE'|'BANNED'|'PENDING'; createdAt:string;
}
export type PublicUser = Omit<User,'passwordHash'>;

export type TeamMemberRole = 'CAPTAIN'|'PLAYER'|'SUBSTITUTE';
export type MemberStatus = 'APPROVED'|'PENDING'|'REJECTED';

export interface Team {
  id:string; name:string; tag:string; slogan?:string; description?:string;
  logo?:string; banner?:string; country?:string; city?:string;
  captainId:string; inviteCode:string; requiresApproval:boolean;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord',string>>;
  createdAt:string;
}
export interface TeamMember { id:string; teamId:string; userId:string; role:TeamMemberRole; status:MemberStatus; joinedAt:string; }

export type ApplicationStatus = 'PENDING'|'APPROVED'|'REJECTED'|'INFO_REQUESTED';
export interface OrganizerApplication {
  id:string; userId:string; fullName:string; organizationName:string;
  description:string; experience:string; previousTournaments?:string;
  phone:string; email:string;
  socials:Partial<Record<'telegram'|'instagram'|'youtube'|'tiktok'|'discord'|'website',string>>;
  status:ApplicationStatus; reviewNote?:string; reviewedBy?:string;
  createdAt:string; reviewedAt?:string;
}

export type TournamentStatus = 'DRAFT'|'REGISTRATION_OPEN'|'REGISTRATION_CLOSED'|'UPCOMING'|'LIVE'|'PAUSED'|'FINISHED'|'CANCELLED';
export type PubgMap = 'ERANGEL'|'MIRAMAR'|'RONDO'|'SANHOK';

export interface Stage {
  id:string; tournamentId:string; name:string; order:number;
  date:string; startTime:string; endTime?:string;
  teamCount:number; matchCount:number; maps:PubgMap[];
  qualificationRules?:string; status:'UPCOMING'|'LIVE'|'FINISHED';
}
export interface PrizeSlot { place:number; amount:number; label?:string }
export interface ScoringRule { id:string; tournamentId:string; name:string; placementPoints:Record<number,number>; killPoints:number; }

export interface Tournament {
  id:string; name:string; shortName:string; slug:string;
  logo?:string; banner?:string; description:string; rules:string;
  organizerId:string; contactInfo?:string;
  maps:PubgMap[]; stages:Stage[]; scoringRuleId:string;
  prizePool:number; prizeDistribution:PrizeSlot[];
  registrationOpen:string; registrationClose:string;
  startDate:string; endDate:string;
  status:TournamentStatus; maxTeams:number; minTeamSize:number;
  timezone:string; hostIds:string[]; createdAt:string;
}
export interface TournamentTeam {
  id:string; tournamentId:string; teamId:string; slot:number;
  registeredAt:string; registeredBy:string; status:'ACTIVE'|'DISQUALIFIED'|'WITHDRAWN';
}
export interface TournamentPlayer { id:string; tournamentId:string; teamId:string; userId:string; role:TeamMemberRole; createdAt:string; }

export type MatchStatus = 'UPCOMING'|'LIVE'|'FINISHED';
export interface Match {
  id:string; tournamentId:string; stageId:string; matchNumber:number;
  map:PubgMap; startTime:string; lobbyId?:string; lobbyPassword?:string;
  hostId?:string; status:MatchStatus;
  resultsStatus:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
}
export interface MatchTeamResult {
  id:string; matchId:string; tournamentId:string; teamId:string;
  placement:number; kills:number; bonus:number; penalty:number;
  enteredBy:string; enteredAt:string;
  status:'DRAFT'|'SUBMITTED'|'APPROVED'|'PUBLISHED';
}
export interface LeaderboardRow {
  rank:number; teamId:string; teamName:string; teamTag:string; teamLogo?:string;
  cd:number; pp:number; kp:number; tp:number;
}
export interface Stream { id:string; tournamentId:string; label:string; youtubeUrl:string; isPrimary:boolean; }
export type NotificationType = 'INFO'|'SUCCESS'|'WARNING'|'ERROR';
export interface Notification { id:string; userId:string; type:NotificationType; title:string; body?:string; href?:string; read:boolean; createdAt:string; }
export interface AuditLog { id:string; actorId:string; actorName:string; action:string; entity:string; entityId:string; meta?:Record<string,unknown>; createdAt:string; }
export interface Session { userId:string; issuedAt:string; }
export interface SearchResults { users:PublicUser[]; teams:Team[]; tournaments:Tournament[]; }
'@

# ============ lib/utils ============
Write-File 'src/lib/utils.ts' @'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n);
export const formatMoney = (n: number, c = 'UZS') => `${formatNumber(n)} ${c}`;
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
export const relativeTime = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
export const extractYouTubeId = (url: string): string | null => {
  const pats = [/(?:youtube\.com\/watch\?v=)([\w-]{11})/, /(?:youtu\.be\/)([\w-]{11})/, /(?:youtube\.com\/live\/)([\w-]{11})/, /(?:youtube\.com\/embed\/)([\w-]{11})/];
  for (const p of pats) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
};
export const initials = (n: string) => n.split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join('');
export const MAP_LABEL: Record<string,string> = { ERANGEL:'Erangel', MIRAMAR:'Miramar', RONDO:'Rondo', SANHOK:'Sanhok' };
'@

# ============ lib/security ============
Write-File 'src/lib/security.ts' @'
export function hashPassword(plain: string): string {
  let h = 0x811c9dc5;
  const s = `ranger::${plain}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return `dev1$${(h >>> 0).toString(16).padStart(8, '0')}`;
}
export const verifyPassword = (p: string, h: string) => hashPassword(p) === h;
'@

# ============ lib/permissions ============
Write-File 'src/lib/permissions.ts' @'
import type { Role, RoleKey } from '@/types';

export const PERMISSION_CATALOG = [
  { group:'Dashboard', items:[{ key:'dashboard.view', label:'View dashboard' }] },
  { group:'Users', items:[
    { key:'users.view', label:'View' },{ key:'users.create', label:'Create' },
    { key:'users.edit', label:'Edit' },{ key:'users.delete', label:'Delete' },{ key:'users.ban', label:'Ban' }]},
  { group:'Roles', items:[
    { key:'roles.view', label:'View' },{ key:'roles.create', label:'Create' },
    { key:'roles.edit', label:'Edit' },{ key:'roles.delete', label:'Delete' }]},
  { group:'Tournaments', items:[
    { key:'tournaments.view', label:'View' },{ key:'tournaments.create', label:'Create' },
    { key:'tournaments.edit', label:'Edit' },{ key:'tournaments.delete', label:'Delete' },
    { key:'tournaments.publish', label:'Publish' },{ key:'tournaments.start', label:'Start' },
    { key:'tournaments.stop', label:'Stop' },{ key:'tournaments.register', label:'Register' }]},
  { group:'Teams', items:[
    { key:'teams.create', label:'Create' },{ key:'teams.edit', label:'Edit' },
    { key:'teams.delete', label:'Delete' },{ key:'teams.manage_members', label:'Manage members' },
    { key:'teams.register_tournament', label:'Register tournament' }]},
  { group:'Organizers & Hosts', items:[
    { key:'organizer.apply', label:'Apply' },{ key:'organizer.approve', label:'Approve' },
    { key:'hosts.assign', label:'Assign' },{ key:'hosts.manage', label:'Manage' }]},
  { group:'Matches & Scores', items:[
    { key:'matches.create', label:'Create' },{ key:'matches.edit', label:'Edit' },
    { key:'scores.enter', label:'Enter' },{ key:'scores.edit', label:'Edit' },
    { key:'leaderboard.view', label:'View leaderboard' }]},
  { group:'Platform', items:[
    { key:'stream.manage', label:'Streams' },{ key:'statistics.view', label:'Stats' },
    { key:'settings.manage', label:'Settings' },{ key:'audit.view', label:'Audit' }]},
] as const;

const ALL = PERMISSION_CATALOG.flatMap(g => g.items.map(i => i.key)) as string[];

export const SYSTEM_ROLES: Record<string,{ name:string; description:string; permissions:string[] }> = {
  SUPERADMIN: { name:'Superadmin', description:'Unrestricted', permissions:ALL },
  ADMIN: { name:'Admin', description:'Administration',
    permissions: ALL.filter(p => !['roles.delete','settings.manage'].includes(p)) },
  ORGANIZER: { name:'Organizer', description:'Manages own tournaments', permissions:[
    'dashboard.view','tournaments.view','tournaments.create','tournaments.edit','tournaments.publish',
    'tournaments.start','tournaments.stop','matches.create','matches.edit','scores.enter','scores.edit',
    'hosts.assign','hosts.manage','stream.manage','leaderboard.view','teams.manage_members','statistics.view'] },
  HOST: { name:'Host', description:'Runs matches', permissions:[
    'dashboard.view','tournaments.view','matches.edit','scores.enter','leaderboard.view'] },
  TEAM_CAPTAIN: { name:'Team Captain', description:'Manages team', permissions:[
    'dashboard.view','tournaments.view','tournaments.register','teams.create','teams.edit',
    'teams.manage_members','teams.register_tournament','leaderboard.view','organizer.apply'] },
  PLAYER: { name:'Player', description:'Plays', permissions:[
    'dashboard.view','tournaments.view','leaderboard.view','teams.create','organizer.apply'] },
};

export const can = (perms: string[] | undefined, needed: string | string[]): boolean => {
  if (!perms?.length) return false;
  if (perms.includes('*')) return true;
  const list = Array.isArray(needed) ? needed : [needed];
  return list.some(p => perms.includes(p));
};

export const permissionsForRoles = (roles: Role[], keys: RoleKey[]): string[] => {
  const s = new Set<string>();
  roles.filter(r => keys.includes(r.key)).forEach(r => r.permissions.forEach(p => s.add(p)));
  return [...s];
};
'@

# ============ lib/db ============
Write-File 'src/lib/db.ts' @'
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
'@

# ============ lib/realtime ============
Write-File 'src/lib/realtime.ts' @'
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
'@

# ============ lib/seed ============
Write-File 'src/lib/seed.ts' @'
import type { Database, Match, MatchTeamResult, PubgMap, Role, ScoringRule, Stage, Team, TeamMember, Tournament, TournamentTeam, User } from '@/types';
import { hashPassword } from './security';
import { SYSTEM_ROLES } from './permissions';
import { inviteCode, uid } from './db';

const now = Date.now();
const iso = (d = 0, h = 12) => new Date(now + d*86400000).toISOString().slice(0,10) + `T${String(h).padStart(2,'0')}:00:00.000Z`;
const AV = (s: string) => `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${s}`;

function buildRoles(): Role[] {
  return Object.entries(SYSTEM_ROLES).map(([key, def]) => ({
    id:`role_${key.toLowerCase()}`, key, name:def.name, description:def.description,
    permissions:def.permissions, system:true, createdAt:iso(-90),
  }));
}

function buildUsers(): User[] {
  const base = (u: string, n: string, r: string[], e?: string): User => ({
    id:`user_${u}`, fullName:n, username:u, email: e ?? `${u}@example.com`,
    phone:'+998 90 000 00 00', passwordHash:hashPassword('ChangeMe123!'), avatar:AV(u),
    country:'Uzbekistan', city:'Tashkent', pubgNickname:u.toUpperCase(),
    pubgId:`51${Math.floor(1000000+Math.random()*8999999)}`,
    socials:{ telegram:`https://t.me/${u}` }, roles:r, status:'ACTIVE', createdAt:iso(-60),
  });
  return [
    base('superadmin','Ranger Superadmin',['SUPERADMIN','PLAYER'],'superadmin@example.com'),
    base('admin','Platform Admin',['ADMIN','PLAYER'],'admin@example.com'),
    base('organizer','Ranger Organizer',['ORGANIZER','TEAM_CAPTAIN','PLAYER'],'organizer@example.com'),
    base('host','Match Host',['HOST','PLAYER'],'host@example.com'),
    base('captain','Alone Captain',['TEAM_CAPTAIN','PLAYER'],'captain@example.com'),
    base('player','Solo Player',['PLAYER'],'player@example.com'),
    ...Array.from({ length:22 }, (_, i) => base(`player${i+1}`, `Demo Player ${i+1}`, ['PLAYER'])),
  ];
}

const TEAM_DEFS: [string,string,string?][] = [
  ['ALONE GAMERS','AG','Never Give Up'],['DEADLY SQUADES','DS','Deadly by name'],
  ['TEST ACADEMY','TA'],['KoKandSquad','KKS'],['SW Esports','SW'],['Venus esports','VEN'],
  ['TEST TEAM','TT'],['ABDURASHIT MAXLUQ','AM'],['AGRESSIA TEAM','AGR'],['FLOW ESPORTS','FLW'],
  ['BLOOD BROTHERS','BB'],['UP ESPORTS','UP'],['WYNEX TEAM','WYX'],['BANI XAZRAJ','XS'],
  ['712 ESPORTS','712'],['VORTEX KINGS','VK'],['star ESPORTS','STR'],['ALCATRAZ','ALC'],
  ['MG FORCE','MGF'],['BACK ESPORTS','BCK'],['kengash','KNG'],['IQ GAMING','IQ'],
  ['FREELA','FRL'],['PUNITTVE','PNT'],
];

function buildTeams(users: User[]): { teams:Team[]; members:TeamMember[] } {
  const teams: Team[] = []; const members: TeamMember[] = [];
  const players = users.filter(u => u.username.startsWith('player'));
  TEAM_DEFS.forEach(([name, tag, slogan], i) => {
    const captain = i === 0 ? users.find(u => u.username === 'captain')! : players[i % players.length]!;
    const id = `team_${i+1}`;
    teams.push({
      id, name, tag, slogan, description:`${name} — competitive PUBG roster.`,
      logo:AV(`${tag}-logo`), banner:`https://picsum.photos/seed/${tag}/1200/400`,
      country:'Uzbekistan', city:'Tashkent', captainId:captain.id,
      inviteCode:inviteCode(), requiresApproval:true,
      socials:{ telegram:`https://t.me/${tag.toLowerCase()}` }, createdAt:iso(-45+i),
    });
    members.push({ id:uid('tm'), teamId:id, userId:captain.id, role:'CAPTAIN', status:'APPROVED', joinedAt:iso(-45+i) });
    for (let k = 0; k < 3; k++) {
      const m = players[(i*3 + k + 5) % players.length]!;
      if (m.id === captain.id) continue;
      members.push({ id:uid('tm'), teamId:id, userId:m.id, role:k===2?'SUBSTITUTE':'PLAYER', status:'APPROVED', joinedAt:iso(-40+i) });
    }
  });
  return { teams, members };
}

function buildScoringRule(tid: string): ScoringRule {
  return { id:`sr_${tid}`, tournamentId:tid, name:'PUBG Standard', killPoints:1,
    placementPoints:{ 1:10, 2:6, 3:5, 4:4, 5:3, 6:2, 7:2, 8:1, 9:1, 10:1 } };
}

const MAPS: PubgMap[] = ['ERANGEL','MIRAMAR','RONDO','ERANGEL'];

function buildTournament(orgId: string, hostId: string): Tournament {
  const id = 't_ranger_scrims';
  const stages: Stage[] = [
    { id:`${id}_s1`, tournamentId:id, name:'Qualifier', order:1,
      date:iso(-3,15), startTime:'15:00', endTime:'18:00',
      teamCount:32, matchCount:3, maps:['ERANGEL','MIRAMAR','RONDO'],
      qualificationRules:'Top 20 advance.', status:'FINISHED' },
    { id:`${id}_s2`, tournamentId:id, name:'Grand Final', order:2,
      date:iso(0,15), startTime:'15:00', endTime:'19:00',
      teamCount:20, matchCount:4, maps:MAPS,
      qualificationRules:'Chicken dinner + placement.', status:'LIVE' },
  ];
  return {
    id, name:'RANGER SCRIMS', shortName:'RS', slug:'ranger-scrims',
    logo:AV('ranger-logo'), banner:'https://picsum.photos/seed/ranger-scrims/1920/720',
    description:'Flagship weekly PUBG scrim circuit. 20 invited squads, four maps, one champion.',
    rules:'1. All players must use registered PUBG ID.\n2. No teaming/hacking/emulator.\n3. Lobby credentials are confidential.\n4. Host decision final.\n5. Join lobby 10 min before start.',
    organizerId:orgId, contactInfo:'@ranger_support',
    maps:MAPS, stages, scoringRuleId:`sr_${id}`,
    prizePool:10_000_000,
    prizeDistribution:[{ place:1, amount:5_000_000 },{ place:2, amount:2_500_000 },{ place:3, amount:1_500_000 },{ place:4, amount:1_000_000 }],
    registrationOpen:iso(-10,9), registrationClose:iso(-1,23),
    startDate:iso(-3,15), endDate:iso(0,19),
    status:'LIVE', maxTeams:20, minTeamSize:4, timezone:'Asia/Tashkent',
    hostIds:[hostId], createdAt:iso(-12),
  };
}

function buildMatches(t: Tournament): Match[] {
  const st = t.stages.find(s => s.order === 2)!;
  return MAPS.map((map, i) => ({
    id:`${t.id}_m${i+1}`, tournamentId:t.id, stageId:st.id, matchNumber:i+1, map,
    startTime:iso(0, 15+i),
    lobbyId: i<2 ? `RNG-${1000+i}` : undefined,
    lobbyPassword: i<2 ? `pass${i+1}${Math.floor(Math.random()*900+100)}` : undefined,
    hostId:t.hostIds[0], status: i<2 ? 'FINISHED' : i===2 ? 'LIVE' : 'UPCOMING',
    resultsStatus: i<2 ? 'PUBLISHED' : 'DRAFT',
  }));
}

const STANDINGS: [string, number, number, number][] = [
  ['ALCATRAZ',2,27,67],['MG FORCE',1,26,32],['BACK ESPORTS',1,23,35],['kengash',1,24,28],
  ['IQ GAMING',6,32,6],['FREELA',4,22,4],['PUNITTVE',15,9,15],['WANTEY HOJI',4,18,4],
  ['HANAFI OLD',3,16,3],['Top family',6,12,6],['Cold Squad',3,12,3],['Red Vortex',8,6,8],
  ['ALONE GAMERS',0,14,0],['SMEEK FAMILY',5,7,5],['M4',1,11,1],['Re2 ESP',2,8,2],
  ['DARVESH',0,8,0],['The ORIGINAL',2,4,2],['UPS',0,6,0],['TheWarriorTeam',1,4,1],
  ['RICH TEAM',0,5,0],['ASTEMUS GROUP',0,3,0],['FORWARD ONLY',0,3,0],['KAMI AEI',0,0,0],
];

function buildResults(t: Tournament, teams: Team[], matches: Match[]): { results:MatchTeamResult[]; tournamentTeams:TournamentTeam[] } {
  const results: MatchTeamResult[] = []; const tournamentTeams: TournamentTeam[] = [];
  const byName = new Map(teams.map(tm => [tm.name.toUpperCase(), tm]));
  const parts: Team[] = [];
  for (const [name] of STANDINGS) {
    const m = byName.get(name.toUpperCase()) ?? teams.find(tm => tm.name.toUpperCase().startsWith(name.toUpperCase().slice(0, 4)));
    if (m && !parts.includes(m)) parts.push(m);
  }
  for (const tm of teams) { if (parts.length >= 20) break; if (!parts.includes(tm)) parts.push(tm); }

  parts.slice(0, t.maxTeams).forEach((team, i) => {
    tournamentTeams.push({ id:uid('tt'), tournamentId:t.id, teamId:team.id, slot:i+1,
      registeredAt:t.registrationOpen, registeredBy:team.captainId, status:'ACTIVE' });
  });

  const finished = matches.filter(m => m.status === 'FINISHED');
  const row = new Map(STANDINGS.map(([n,cd,pp,kp]) => [n.toUpperCase(), { cd, pp, kp }]));
  finished.forEach((match, mi) => {
    parts.slice(0, t.maxTeams).forEach((team, idx) => {
      const r = row.get(team.name.toUpperCase());
      if (!r) return;
      const share = Math.max(1, r.cd || finished.length);
      results.push({ id:uid('res'), matchId:match.id, tournamentId:t.id, teamId:team.id,
        placement:Math.min(idx+1+mi*2, t.maxTeams),
        kills:Math.round(r.kp/share), bonus:0, penalty:0,
        enteredBy:t.hostIds[0]!, enteredAt:match.startTime, status:'PUBLISHED' });
    });
  });
  return { results, tournamentTeams };
}

export function buildSeedDatabase(): Database {
  const roles = buildRoles();
  const users = buildUsers();
  const { teams, members } = buildTeams(users);
  const org = users.find(u => u.username === 'organizer')!;
  const host = users.find(u => u.username === 'host')!;
  const t = buildTournament(org.id, host.id);
  const matches = buildMatches(t);
  const { results, tournamentTeams } = buildResults(t, teams, matches);
  const tournamentPlayers = tournamentTeams.flatMap(tt =>
    members.filter(m => m.teamId === tt.teamId && m.status === 'APPROVED')
      .map(m => ({ id:uid('tp'), tournamentId:t.id, teamId:tt.teamId, userId:m.userId, role:m.role, createdAt:tt.registeredAt })));

  return {
    version:1, users, roles, teams, teamMembers:members, applications:[],
    tournaments:[t], tournamentTeams, tournamentPlayers, matches, results,
    scoringRules:[buildScoringRule(t.id)],
    streams:[
      { id:uid('stream'), tournamentId:t.id, label:'Main Stream', youtubeUrl:'https://www.youtube.com/watch?v=jfKfPfyJRdk', isPrimary:true },
      { id:uid('stream'), tournamentId:t.id, label:'Observer POV', youtubeUrl:'https://www.youtube.com/watch?v=5qap5aO4i9A', isPrimary:false },
    ],
    notifications: users.slice(0, 6).map((u, i) => ({
      id:uid('ntf'), userId:u.id,
      type:([ 'INFO','SUCCESS','WARNING' ] as const)[i % 3]!,
      title:['Welcome to Ranger Esports','Your team has been registered','Match starts in 30 minutes'][i % 3]!,
      body:'RANGER SCRIMS · Grand Final', href:'/tournaments/t_ranger_scrims',
      read:i > 2, createdAt:new Date(now - i*3600000).toISOString(),
    })),
    auditLogs:[],
  };
}
'@

# ============ services/api ============
Write-File 'src/services/api.ts' @'
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
      return { rank:0, teamId:tt.teamId, teamName:team?.name ?? 'Unknown', teamTag:team?.tag ?? '—',
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
'@

# ============ hooks ============
Write-File 'src/hooks/useAsync.ts' @'
import { useCallback, useEffect, useRef, useState } from 'react';
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await fn(); if (mounted.current) setData(r); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Error'); }
    finally { if (mounted.current) setLoading(false); }
  }, deps);
  useEffect(() => { mounted.current = true; void run(); return () => { mounted.current = false; }; }, [run]);
  return { data, loading, error, refetch: run };
}
'@

Write-File 'src/hooks/useCountUp.ts' @'
import { useEffect, useState } from 'react';
export function useCountUp(target: number, duration = 800): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const s = performance.now();
    const tick = (n: number) => {
      const p = Math.min((n - s) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
'@

# ============ contexts ============
Write-File 'src/context/AuthContext.tsx' @'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PublicUser, Role, Session } from '@/types';
import { authApi, ensureDb, roleApi, userApi } from '@/services/api';
import { permissionsForRoles } from '@/lib/permissions';

const SK = 'ranger.session';
interface AuthValue {
  user: PublicUser | null; roles: Role[]; permissions: string[]; loading: boolean;
  login: (id: string, pwd: string) => Promise<void>;
  register: (i: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => void; refresh: () => Promise<void>; can: (p: string | string[]) => boolean;
}
const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      ensureDb();
      setRoles(await roleApi.list());
      try {
        const raw = localStorage.getItem(SK); if (!raw) return;
        const s: Session = JSON.parse(raw);
        const me = await userApi.me(s.userId);
        if (me.status === 'BANNED') { localStorage.removeItem(SK); return; }
        setUser(me);
      } catch { localStorage.removeItem(SK); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (id: string, pwd: string) => {
    const s = await authApi.login(id, pwd);
    localStorage.setItem(SK, JSON.stringify(s));
    setUser(await userApi.me(s.userId));
  }, []);
  const register = useCallback(async (i: Parameters<typeof authApi.register>[0]) => {
    const s = await authApi.register(i);
    localStorage.setItem(SK, JSON.stringify(s));
    setUser(await userApi.me(s.userId));
  }, []);
  const logout = useCallback(() => { localStorage.removeItem(SK); setUser(null); }, []);

  const permissions = useMemo(() => user ? permissionsForRoles(roles, user.roles) : [], [user, roles]);
  const can = useCallback((p: string | string[]) => {
    const list = Array.isArray(p) ? p : [p];
    return list.some(x => permissions.includes(x));
  }, [permissions]);

  const value: AuthValue = { user, roles, permissions, loading, login, register, logout,
    refresh: async () => { if (user) setUser(await userApi.me(user.id)); }, can };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const c = useContext(Ctx); if (!c) throw new Error('useAuth outside AuthProvider'); return c;
}
'@

Write-File 'src/context/ToastContext.tsx' @'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Kind = 'INFO'|'SUCCESS'|'WARNING'|'ERROR';
interface T { id:number; kind:Kind; title:string; body?:string }
const Ctx = createContext<{ toast:(k:Kind, t:string, b?:string) => void } | null>(null);
const I = { INFO:Info, SUCCESS:CheckCircle2, WARNING:AlertTriangle, ERROR:XCircle };
const TONE: Record<Kind,string> = { INFO:'text-brand-400', SUCCESS:'text-success', WARNING:'text-warning', ERROR:'text-danger' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<T[]>([]);
  const toast = useCallback((kind: Kind, title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-3), { id, kind, title, body }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-6">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = I[t.kind];
            return (
              <motion.div key={t.id} layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:24 }}
                transition={{ type:'spring', stiffness:420, damping:32 }}
                className="glass-strong flex items-start gap-3 rounded-2xl p-3.5">
                <Icon className={TONE[t.kind]} size={18} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-xs text-ink-faint">{t.body}</p>}
                </div>
                <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} aria-label="Dismiss">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
export function useToast() { const c = useContext(Ctx); if (!c) throw new Error('useToast outside'); return c; }
'@

Write-Host ""
Write-Host "[OK] Core yaratildi. Endi setup3.ps1 kerak (UI, layout, pages, App.tsx)." -ForegroundColor Green
Write-Host ""
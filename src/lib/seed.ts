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
      id, name, tag, slogan, description:`${name} вЂ” competitive PUBG roster.`,
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
      body:'RANGER SCRIMS В· Grand Final', href:'/tournaments/t_ranger_scrims',
      read:i > 2, createdAt:new Date(now - i*3600000).toISOString(),
    })),
    auditLogs:[],
  };
}
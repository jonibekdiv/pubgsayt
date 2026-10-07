import type {
  Database, Match, MatchTeamResult, PubgMap, Role, ScoringRule, Stage,
  Team, TeamMember, Tournament, TournamentTeam, User,
} from '@/types';
import type { Database as DB } from '@/lib/db';
import { hashPassword } from './security';
import { SYSTEM_ROLES } from './permissions';
import { inviteCode, uid, CURRENT_DB_VERSION } from './db';
import { calculateMatchScore, DEFAULT_PLACEMENT_POINTS, DEFAULT_TIE_BREAKERS } from './scoring';

const now = Date.now();
const iso = (d = 0, h = 12) =>
  new Date(now + d * 86400000).toISOString().slice(0, 10) +
  'T' + String(h).padStart(2, '0') + ':00:00.000Z';
const AV = (s: string) => 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + s;

function buildRoles(): Role[] {
  return Object.entries(SYSTEM_ROLES).map(([key, def]) => ({
    id: 'role_' + key.toLowerCase(),
    key,
    name: def.name,
    description: def.description,
    permissions: def.permissions,
    system: true,
    createdAt: iso(-90),
  }));
}

function buildUsers(): User[] {
  const base = (u: string, n: string, r: string[], e?: string): User => ({
    id: 'user_' + u,
    fullName: n,
    username: u,
    email: e ?? (u + '@example.com'),
    phone: '+998 90 000 00 00',
    passwordHash: hashPassword('ChangeMe123!'),
    avatar: AV(u),
    country: 'Uzbekistan',
    city: 'Tashkent',
    pubgNickname: u.toUpperCase(),
    pubgId: '51' + Math.floor(1000000 + Math.random() * 8999999),
    socials: { telegram: 'https://t.me/' + u },
    roles: r,
    status: 'ACTIVE',
    createdAt: iso(-60),
  });
  return [
    base('superadmin', 'Ranger Superadmin', ['SUPERADMIN', 'PLAYER'], 'superadmin@example.com'),
    base('admin', 'Platform Admin', ['ADMIN', 'PLAYER'], 'admin@example.com'),
    base('organizer', 'Ranger Organizer', ['ORGANIZER', 'TEAM_CAPTAIN', 'PLAYER'], 'organizer@example.com'),
    base('host', 'Match Host', ['HOST', 'PLAYER'], 'host@example.com'),
    base('captain', 'Alone Captain', ['TEAM_CAPTAIN', 'PLAYER'], 'captain@example.com'),
    base('player', 'Solo Player', ['PLAYER'], 'player@example.com'),
    ...Array.from({ length: 22 }, (_, i) => base('player' + (i + 1), 'Demo Player ' + (i + 1), ['PLAYER'])),
  ];
}

const TEAM_DEFS: [string, string, string?][] = [
  ['ALONE GAMERS', 'AG', 'Never Give Up'],
  ['DEADLY SQUADES', 'DS', 'Deadly by name'],
  ['TEST ACADEMY', 'TA'],
  ['KoKandSquad', 'KKS'],
  ['SW Esports', 'SW'],
  ['Venus esports', 'VEN'],
  ['TEST TEAM', 'TT'],
  ['ABDURASHIT MAXLUQ', 'AM'],
  ['AGRESSIA TEAM', 'AGR'],
  ['FLOW ESPORTS', 'FLW'],
  ['BLOOD BROTHERS', 'BB'],
  ['UP ESPORTS', 'UP'],
  ['WYNEX TEAM', 'WYX'],
  ['BANI XAZRAJ', 'XS'],
  ['712 ESPORTS', '712'],
  ['VORTEX KINGS', 'VK'],
  ['star ESPORTS', 'STR'],
  ['ALCATRAZ', 'ALC'],
  ['MG FORCE', 'MGF'],
  ['BACK ESPORTS', 'BCK'],
  ['kengash', 'KNG'],
  ['IQ GAMING', 'IQ'],
  ['FREELA', 'FRL'],
  ['PUNITTVE', 'PNT'],
];

function buildTeams(users: User[]): { teams: Team[]; members: TeamMember[] } {
  const teams: Team[] = [];
  const members: TeamMember[] = [];
  const players = users.filter(u => u.username.startsWith('player'));

  TEAM_DEFS.forEach(([name, tag, slogan], i) => {
    const captain = i === 0 ? users.find(u => u.username === 'captain')! : players[i % players.length]!;
    const id = 'team_' + (i + 1);
    teams.push({
      id, name, tag, slogan,
      description: name + ' - competitive PUBG roster.',
      logo: AV(tag + '-logo'),
      banner: 'https://picsum.photos/seed/' + tag + '/1200/400',
      country: 'Uzbekistan',
      city: 'Tashkent',
      captainId: captain.id,
      inviteCode: inviteCode(),
      requiresApproval: true,
      socials: { telegram: 'https://t.me/' + tag.toLowerCase() },
      createdAt: iso(-45 + i),
    });
    members.push({
      id: uid('tm'), teamId: id, userId: captain.id,
      role: 'CAPTAIN', status: 'APPROVED', joinedAt: iso(-45 + i),
    });
    for (let k = 0; k < 3; k++) {
      const m = players[(i * 3 + k + 5) % players.length]!;
      if (m.id === captain.id) continue;
      members.push({
        id: uid('tm'), teamId: id, userId: m.id,
        role: k === 2 ? 'SUBSTITUTE' : 'PLAYER',
        status: 'APPROVED', joinedAt: iso(-40 + i),
      });
    }
  });
  return { teams, members };
}

function buildScoringRule(tid: string): ScoringRule {
  return {
    id: 'sr_' + tid,
    tournamentId: tid,
    name: 'PUBG Default',
    killPoints: 1,
    placementPoints: { ...DEFAULT_PLACEMENT_POINTS },
  };
}

const MAPS: PubgMap[] = ['ERANGEL', 'MIRAMAR', 'RONDO', 'ERANGEL'];

function buildTournament(orgId: string, hostId: string): Tournament {
  const id = 't_ranger_scrims';
  const stages: Stage[] = [
    {
      id: id + '_s1', tournamentId: id, name: 'Qualifier', order: 1,
      date: iso(-3, 15), startTime: '15:00', endTime: '18:00',
      teamCount: 32, matchCount: 3,
      maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
      qualificationRules: 'Top 20 advance to Grand Final.',
      qualificationCount: 20,
      status: 'FINISHED', carryPoints: false,
    },
    {
      id: id + '_s2', tournamentId: id, name: 'Grand Final', order: 2,
      date: iso(0, 15), startTime: '15:00', endTime: '19:00',
      teamCount: 20, matchCount: 4, maps: MAPS,
      qualificationRules: 'Chicken dinner + placement points.',
      qualificationCount: 1,
      status: 'LIVE', carryPoints: false,
    },
  ];

  return {
    id, name: 'RANGER SCRIMS', shortName: 'RS', slug: 'ranger-scrims',
    logo: AV('ranger-logo'),
    banner: 'https://picsum.photos/seed/ranger-scrims/1920/720',
    description: 'Flagship weekly PUBG scrim circuit. 20 invited squads, four maps, one champion.',
    rules: 'Organizers reserve all rights. Full regulation available in the Rules tab.',
    organizerId: orgId,
    adminLink: 'https://t.me/ranger_support',
    maps: MAPS,
    stages,
    scoringRuleId: 'sr_' + id,
    tieBreakers: [...DEFAULT_TIE_BREAKERS],
    rosterRules: { minPlayers: 4, maxPlayers: 6, minClanTags: 3, minAccountLevel: 35 },
    prizePool: 1000000,
    prizeDistribution: [
      { place: 1, amount: 500000 },
      { place: 2, amount: 300000 },
      { place: 3, amount: 200000 },
    ],
    isPaid: true,
    entryFee: 50000,
    registrationOpen: iso(-10, 9),
    registrationClose: iso(-1, 23),
    startDate: iso(-3, 15),
    endDate: iso(0, 19),
    status: 'LIVE',
    maxTeams: 20,
    timezone: 'Asia/Tashkent',
    hostIds: [hostId],
    currentStreamUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    streamHistory: [
      { url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', updatedBy: orgId, updatedAt: iso(0, 15) },
    ],
    stageCarryMode: 'RESET_POINTS_FOR_NEXT_STAGE',
    createdAt: iso(-12),
  };
}

function buildMatches(t: Tournament): Match[] {
  const final = t.stages.find(s => s.order === 2)!;
  return MAPS.map((map, i) => ({
    id: t.id + '_m' + (i + 1),
    tournamentId: t.id,
    stageId: final.id,
    matchNumber: i + 1,
    map,
    startTime: iso(0, 15 + i),
    lobbyId: i < 2 ? 'RNG-' + (1000 + i) : undefined,
    lobbyPassword: i < 2 ? 'pass' + (i + 1) + Math.floor(Math.random() * 900 + 100) : undefined,
    hostId: t.hostIds[0],
    status: (i < 2 ? 'FINISHED' : i === 2 ? 'LIVE' : 'UPCOMING') as Match['status'],
    resultsStatus: (i < 2 ? 'PUBLISHED' : 'DRAFT') as Match['resultsStatus'],
  }));
}

const STANDINGS: [string, number, number, number][] = [
  ['ALCATRAZ', 2, 27, 67], ['MG FORCE', 1, 26, 32], ['BACK ESPORTS', 1, 23, 35],
  ['kengash', 1, 24, 28], ['IQ GAMING', 6, 32, 6], ['FREELA', 4, 22, 4],
  ['PUNITTVE', 15, 9, 15], ['WANTEY HOJI', 4, 18, 4], ['HANAFI OLD', 3, 16, 3],
  ['Top family', 6, 12, 6], ['Cold Squad', 3, 12, 3], ['Red Vortex', 8, 6, 8],
  ['ALONE GAMERS', 0, 14, 0], ['SMEEK FAMILY', 5, 7, 5], ['M4', 1, 11, 1],
  ['Re2 ESP', 2, 8, 2], ['DARVESH', 0, 8, 0], ['The ORIGINAL', 2, 4, 2],
  ['UPS', 0, 6, 0], ['TheWarriorTeam', 1, 4, 1], ['RICH TEAM', 0, 5, 0],
  ['ASTEMUS GROUP', 0, 3, 0], ['FORWARD ONLY', 0, 3, 0], ['KAMI AEI', 0, 0, 0],
];

function buildTournamentData(
  t: Tournament, teams: Team[], matches: Match[],
): { tournamentTeams: TournamentTeam[]; results: MatchTeamResult[] } {
  const tournamentTeams: TournamentTeam[] = [];
  const results: MatchTeamResult[] = [];
  const byName = new Map(teams.map(tm => [tm.name.toUpperCase(), tm]));

  const participants: Team[] = [];
  for (const [name] of STANDINGS) {
    const m = byName.get(name.toUpperCase()) ??
      teams.find(tm => tm.name.toUpperCase().startsWith(name.toUpperCase().slice(0, 4)));
    if (m && !participants.includes(m)) participants.push(m);
  }
  for (const tm of teams) {
    if (participants.length >= t.maxTeams) break;
    if (!participants.includes(tm)) participants.push(tm);
  }

  participants.slice(0, t.maxTeams).forEach((team, i) => {
    tournamentTeams.push({
      id: uid('tt'), tournamentId: t.id, teamId: team.id, slot: i + 1,
      registeredAt: t.registrationOpen, registeredBy: team.captainId, status: 'ACTIVE',
    });
  });

  const rule = buildScoringRule(t.id);
  const finished = matches.filter(m => m.status === 'FINISHED');
  const row = new Map(STANDINGS.map(([n, cd, pp, kp]) => [n.toUpperCase(), { cd, pp, kp }]));

  finished.forEach((match, mi) => {
    const order = [...participants].slice(0, t.maxTeams);
    order.forEach((team, idx) => {
      const r = row.get(team.name.toUpperCase());
      const share = Math.max(1, r?.cd || finished.length);
      const placement = Math.min(idx + 1 + mi * 2, t.maxTeams);
      const kills = r ? Math.round(r.kp / share) : Math.max(0, 8 - Math.floor(idx / 3));
      const score = calculateMatchScore({ placement, kills, bonus: 0, penalty: 0 }, rule);
      results.push({
        id: uid('res'), matchId: match.id, tournamentId: t.id, stageId: match.stageId, teamId: team.id,
        placement, kills, bonus: 0, penalty: 0,
        placementPoints: score.placementPoints, killPoints: score.killPoints, totalPoints: score.totalPoints,
        enteredBy: t.hostIds[0]!, enteredAt: match.startTime, status: 'PUBLISHED',
      });
    });
  });

  return { tournamentTeams, results };
}

export function buildSeedDatabase(): DB {
  const roles = buildRoles();
  const users = buildUsers();
  const { teams, members } = buildTeams(users);

  const org = users.find(u => u.username === 'organizer')!;
  const host = users.find(u => u.username === 'host')!;

  const tournament = buildTournament(org.id, host.id);
  const matches = buildMatches(tournament);
  const { tournamentTeams, results } = buildTournamentData(tournament, teams, matches);

  const tournamentPlayers = tournamentTeams.flatMap(tt =>
    members
      .filter(m => m.teamId === tt.teamId && m.status === 'APPROVED')
      .map(m => ({
        id: uid('tp'), tournamentId: tournament.id, teamId: tt.teamId,
        userId: m.userId, role: m.role, createdAt: tt.registeredAt,
      })),
  );

  return {
    version: CURRENT_DB_VERSION,
    users, roles, teams, teamMembers: members,
    applications: [],
    tournaments: [tournament],
    tournamentTeams, tournamentPlayers, matches, results,
    scoringRules: [buildScoringRule(tournament.id)],
    streams: [
      {
        id: uid('stream'), tournamentId: tournament.id, label: 'Main Stream',
        youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', isPrimary: true,
      },
      {
        id: uid('stream'), tournamentId: tournament.id, label: 'Observer POV',
        youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A', isPrimary: false,
      },
    ],
    notifications: users.slice(0, 6).map((u, i) => ({
      id: uid('ntf'), userId: u.id,
      type: (['INFO', 'SUCCESS', 'WARNING'] as const)[i % 3]!,
      title: ['Welcome to Ranger Esports', 'Your team has been registered', 'Match starts in 30 minutes'][i % 3]!,
      body: 'RANGER SCRIMS - Grand Final',
      href: '/tournaments/t_ranger_scrims',
      read: i > 2,
      createdAt: new Date(now - i * 3600000).toISOString(),
    })),
    auditLogs: [],
    scoreCorrections: [],
    wallets: [
      { userId: 'user_captain',    balance: 500000,  currency: 'UZS', updatedAt: iso(0) },
      { userId: 'user_player',     balance: 100000,  currency: 'UZS', updatedAt: iso(0) },
      { userId: 'user_host',       balance: 100000,  currency: 'UZS', updatedAt: iso(0) },
      { userId: 'user_organizer',  balance: 1000000, currency: 'UZS', updatedAt: iso(0) },
      { userId: 'user_admin',      balance: 0,       currency: 'UZS', updatedAt: iso(0) },
      { userId: 'user_superadmin', balance: 0,       currency: 'UZS', updatedAt: iso(0) },
    ],
    walletTransactions: [],
    topUpRequests: [],
    paymentSettings: {
      cards: [
        {
          id: 'card_main',
          cardNumber: '8600 1234 5678 9012',
          cardHolder: 'RANGER ESPORTS',
          phoneNumber: '+998 90 123 45 67',
          bankName: 'Click / Payme / Uzum',
          label: 'Main card',
          isActive: true,
          createdAt: iso(0),
        },
        {
          id: 'card_backup',
          cardNumber: '9860 9876 5432 1098',
          cardHolder: 'RANGER ESPORTS',
          phoneNumber: '+998 91 987 65 43',
          bankName: 'Uzum Bank',
          label: 'Backup card',
          isActive: true,
          createdAt: iso(-1),
        },
      ],
      minTopUp: 1000,
      maxTopUp: 10000000,
      updatedAt: iso(0),
      updatedBy: 'user_superadmin',
    },
  };
}
import type { MatchTeamResult, Team, Tournament, User } from '@/types';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string;
  tournaments: number;
  matches: number;
  wins: number;
  top3: number;
  totalKills: number;
  totalPoints: number;
  bestPlacement: number;
  winRate: number;
  avgPlacement: number;
}

export interface PlayerStanding {
  userId: string;
  userName: string;
  userAvatar?: string;
  teamName?: string;
  matches: number;
  kills: number;
  avgKills: number;
}

export interface TournamentStanding {
  tournamentId: string;
  name: string;
  shortName: string;
  logo?: string;
  status: string;
  teams: number;
  matches: number;
  prizePool: number;
  startDate: string;
}

export interface GlobalStats {
  totalUsers: number;
  totalTeams: number;
  totalTournaments: number;
  totalMatches: number;
  totalPrizePool: number;
  totalKills: number;
  liveTournaments: number;
  finishedTournaments: number;
}

/**
 * Compute global platform stats
 */
export function computeGlobalStats(
  users: User[],
  teams: Team[],
  tournaments: Tournament[],
  results: MatchTeamResult[],
): GlobalStats {
  const publishedResults = results.filter(
    r => r.status === 'PUBLISHED' || r.status === 'APPROVED',
  );

  return {
    totalUsers: users.length,
    totalTeams: teams.length,
    totalTournaments: tournaments.length,
    totalMatches: new Set(publishedResults.map(r => r.matchId)).size,
    totalPrizePool: tournaments.reduce((s, t) => s + t.prizePool, 0),
    totalKills: publishedResults.reduce((s, r) => s + r.kills, 0),
    liveTournaments: tournaments.filter(t => t.status === 'LIVE').length,
    finishedTournaments: tournaments.filter(t => t.status === 'FINISHED').length,
  };
}

/**
 * Compute per-team standings across all tournaments
 */
export function computeTeamStandings(
  teams: Team[],
  tournaments: Tournament[],
  results: MatchTeamResult[],
): TeamStanding[] {
  const publishedResults = results.filter(
    r => r.status === 'PUBLISHED' || r.status === 'APPROVED',
  );

  const byTeam = new Map<string, MatchTeamResult[]>();
  for (const r of publishedResults) {
    const list = byTeam.get(r.teamId) ?? [];
    list.push(r);
    byTeam.set(r.teamId, list);
  }

  const rows: TeamStanding[] = [];
  for (const team of teams) {
    const list = byTeam.get(team.id) ?? [];
    if (list.length === 0) continue;

    const tournamentIds = new Set(list.map(r => r.tournamentId));
    const matches = list.length;
    const wins = list.filter(r => r.placement === 1).length;
    const top3 = list.filter(r => r.placement <= 3).length;
    const totalKills = list.reduce((s, r) => s + r.kills, 0);
    const totalPoints = list.reduce((s, r) => s + r.totalPoints, 0);
    const bestPlacement = matches > 0 ? Math.min(...list.map(r => r.placement)) : 0;
    const avgPlacement = matches > 0
      ? list.reduce((s, r) => s + r.placement, 0) / matches
      : 0;

    rows.push({
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      teamLogo: team.logo,
      tournaments: tournamentIds.size,
      matches,
      wins,
      top3,
      totalKills,
      totalPoints,
      bestPlacement,
      winRate: matches > 0 ? (wins / matches) * 100 : 0,
      avgPlacement,
    });
  }

  // Sort by total points desc, then kills
  rows.sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills);
  return rows;
}

/**
 * Compute per-player kill standings
 */
export function computePlayerStandings(
  users: User[],
  teams: Team[],
  results: MatchTeamResult[],
): PlayerStanding[] {
  const publishedResults = results.filter(
    r => r.status === 'PUBLISHED' || r.status === 'APPROVED',
  );

  // Aggregate kills per team per match, then split evenly among team members
  // NOTE: This is an approximation since we don't have per-player kill data
  const teamKills = new Map<string, { kills: number; matches: Set<string> }>();
  for (const r of publishedResults) {
    const e = teamKills.get(r.teamId) ?? { kills: 0, matches: new Set<string>() };
    e.kills += r.kills;
    e.matches.add(r.matchId);
    teamKills.set(r.teamId, e);
  }

  // Get team → members mapping from teamMembers is not available here
  // So we approximate: only captain is credited
  const rows: PlayerStanding[] = [];
  for (const team of teams) {
    const data = teamKills.get(team.id);
    if (!data) continue;

    const captain = users.find(u => u.id === team.captainId);
    if (!captain) continue;

    rows.push({
      userId: captain.id,
      userName: captain.fullName,
      userAvatar: captain.avatar,
      teamName: team.name,
      matches: data.matches.size,
      kills: data.kills,
      avgKills: data.matches.size > 0 ? data.kills / data.matches.size : 0,
    });
  }

  rows.sort((a, b) => b.kills - a.kills || b.matches - a.matches);
  return rows;
}

/**
 * Tournament list summary
 */
export function computeTournamentStandings(
  tournaments: Tournament[],
  results: MatchTeamResult[],
): TournamentStanding[] {
  const publishedResults = results.filter(
    r => r.status === 'PUBLISHED' || r.status === 'APPROVED',
  );

  return tournaments
    .map(t => {
      const tResults = publishedResults.filter(r => r.tournamentId === t.id);
      return {
        tournamentId: t.id,
        name: t.name,
        shortName: t.shortName,
        logo: t.logo,
        status: t.status,
        teams: t.maxTeams,
        matches: new Set(tResults.map(r => r.matchId)).size,
        prizePool: t.prizePool,
        startDate: t.startDate,
      };
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}
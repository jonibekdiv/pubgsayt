import type { LucideIcon } from 'lucide-react';
import {
  Award, Crosshair, Crown, Flame, Medal, Shield, Sparkles,
  Star, Swords, Target, Trophy, Zap,
} from 'lucide-react';
import type { MatchTeamResult, Team, Tournament, User, Wallet } from '@/types';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGENDARY';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: AchievementTier;
  /** Progress 0..1 */
  progress: number;
  /** Current / target */
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AchievementInput {
  user: User;
  team?: Team;
  tournaments: Tournament[];
  matches: number;
  wins: number;
  totalKills: number;
  totalPoints: number;
  bestPlacement: number;
  wallet?: Wallet;
}

const TIER_COLORS: Record<AchievementTier, { border: string; bg: string; text: string; ring: string }> = {
  BRONZE: {
    border: 'border-amber-700/40',
    bg: 'bg-amber-900/15',
    text: 'text-amber-500',
    ring: 'ring-amber-700/30',
  },
  SILVER: {
    border: 'border-slate-400/40',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    ring: 'ring-slate-400/30',
  },
  GOLD: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/12',
    text: 'text-yellow-400',
    ring: 'ring-yellow-500/40',
  },
  LEGENDARY: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/12',
    text: 'text-purple-400',
    ring: 'ring-purple-500/40',
  },
};

export function tierStyle(tier: AchievementTier) {
  return TIER_COLORS[tier];
}

interface Def {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tier: AchievementTier;
  target: number;
  /** Extract current value */
  value: (i: AchievementInput) => number;
  /** Optional unlock timestamp — approximate */
  unlockDate?: (i: AchievementInput) => string | undefined;
}

const DEFS: Def[] = [
  /* ── Registration ── */
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Join the platform',
    icon: Sparkles,
    tier: 'BRONZE',
    target: 1,
    value: () => 1,
  },
  {
    id: 'profile-pro',
    name: 'Profile Pro',
    description: 'Complete your profile with avatar and bio',
    icon: Star,
    tier: 'BRONZE',
    target: 3,
    value: (i) => {
      let score = 0;
      if (i.user.avatar) score++;
      if (i.user.bio) score++;
      if (i.user.pubgNickname) score++;
      if (i.user.phone) score++;
      return Math.min(score, 3);
    },
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Link 3 social accounts',
    icon: Star,
    tier: 'SILVER',
    target: 3,
    value: (i) => Object.keys(i.user.socials ?? {}).length,
  },

  /* ── Team ── */
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Join or create a team',
    icon: Swords,
    tier: 'BRONZE',
    target: 1,
    value: (i) => (i.team ? 1 : 0),
  },
  {
    id: 'captain',
    name: 'Captain',
    description: 'Become a team captain',
    icon: Crown,
    tier: 'SILVER',
    target: 1,
    value: (i) => (i.team && i.team.captainId === i.user.id ? 1 : 0),
  },

  /* ── Tournaments ── */
  {
    id: 'debut',
    name: 'Debut',
    description: 'Play your first match',
    icon: Trophy,
    tier: 'BRONZE',
    target: 1,
    value: (i) => i.matches,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Play 10 matches',
    icon: Shield,
    tier: 'SILVER',
    target: 10,
    value: (i) => i.matches,
  },
  {
    id: 'grinder',
    name: 'Grinder',
    description: 'Play 50 matches',
    icon: Flame,
    tier: 'GOLD',
    target: 50,
    value: (i) => i.matches,
  },

  /* ── Wins ── */
  {
    id: 'first-blood',
    name: 'First Victory',
    description: 'Win your first match',
    icon: Medal,
    tier: 'BRONZE',
    target: 1,
    value: (i) => i.wins,
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Win 5 matches',
    icon: Trophy,
    tier: 'GOLD',
    target: 5,
    value: (i) => i.wins,
  },
  {
    id: 'dominator',
    name: 'Dominator',
    description: 'Win 20 matches',
    icon: Crown,
    tier: 'LEGENDARY',
    target: 20,
    value: (i) => i.wins,
  },

  /* ── Kills ── */
  {
    id: 'hunter',
    name: 'Hunter',
    description: 'Get 10 kills',
    icon: Crosshair,
    tier: 'BRONZE',
    target: 10,
    value: (i) => i.totalKills,
  },
  {
    id: 'marksman',
    name: 'Marksman',
    description: 'Get 50 kills',
    icon: Target,
    tier: 'SILVER',
    target: 50,
    value: (i) => i.totalKills,
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Get 100 kills',
    icon: Crosshair,
    tier: 'GOLD',
    target: 100,
    value: (i) => i.totalKills,
  },
  {
    id: 'legend-killer',
    name: 'Legend Killer',
    description: 'Get 500 kills',
    icon: Zap,
    tier: 'LEGENDARY',
    target: 500,
    value: (i) => i.totalKills,
  },

  /* ── Top placements ── */
  {
    id: 'top10',
    name: 'Top 10',
    description: 'Finish in top 10',
    icon: Award,
    tier: 'BRONZE',
    target: 1,
    value: (i) => (i.bestPlacement > 0 && i.bestPlacement <= 10 ? 1 : 0),
  },
  {
    id: 'podium',
    name: 'Podium',
    description: 'Reach top 3 in a match',
    icon: Medal,
    tier: 'SILVER',
    target: 1,
    value: (i) => (i.bestPlacement > 0 && i.bestPlacement <= 3 ? 1 : 0),
  },

  /* ── Points ── */
  {
    id: 'scorer',
    name: 'Scorer',
    description: 'Earn 100 total points',
    icon: Trophy,
    tier: 'SILVER',
    target: 100,
    value: (i) => i.totalPoints,
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Earn 500 total points',
    icon: Crown,
    tier: 'GOLD',
    target: 500,
    value: (i) => i.totalPoints,
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    description: 'Earn 2000 total points',
    icon: Crown,
    tier: 'LEGENDARY',
    target: 2000,
    value: (i) => i.totalPoints,
  },
];

export function computeAchievements(input: AchievementInput): Achievement[] {
  return DEFS.map(def => {
    const current = def.value(input);
    const progress = Math.min(1, current / def.target);
    const unlocked = current >= def.target;
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      tier: def.tier,
      progress,
      current,
      target: def.target,
      unlocked,
    };
  });
}

export function computePlayerStats(
  userId: string,
  team: Team | undefined,
  allResults: MatchTeamResult[],
  allTournaments: Tournament[],
): {
  matches: number;
  wins: number;
  totalKills: number;
  totalPoints: number;
  bestPlacement: number;
} {
  if (!team) {
    return { matches: 0, wins: 0, totalKills: 0, totalPoints: 0, bestPlacement: 0 };
  }

  const teamResults = allResults.filter(
    r =>
      r.teamId === team.id &&
      (r.status === 'PUBLISHED' || r.status === 'APPROVED'),
  );

  const matches = teamResults.length;
  const wins = teamResults.filter(r => r.placement === 1).length;
  const totalKills = teamResults.reduce((s, r) => s + r.kills, 0);
  const totalPoints = teamResults.reduce((s, r) => s + r.totalPoints, 0);
  const bestPlacement = matches > 0 ? Math.min(...teamResults.map(r => r.placement)) : 0;

  return { matches, wins, totalKills, totalPoints, bestPlacement };
}

void tournaments_placeholder;
function tournaments_placeholder() {}
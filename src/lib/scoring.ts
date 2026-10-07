import type { LeaderboardRow, MatchTeamResult, ScoringRule, Team, TieBreakRule, TournamentTeam } from '@/types';

export const DEFAULT_PLACEMENT_POINTS: Record<number, number> = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
};

export const DEFAULT_TIE_BREAKERS: TieBreakRule[] = [
  { type: 'WINS', order: 1 },
  { type: 'TOTAL_KILLS', order: 2 },
  { type: 'LAST_MATCH_PLACEMENT', order: 3 },
];

export const DEFAULT_RULES_TEMPLATE = `РџСЂР°РІР° РѕСЂРіР°РЅРёР·Р°С‚РѕСЂРѕРІ:

- РћСЂРіР°РЅРёР·Р°С‚РѕСЂС‹ С‚СѓСЂРЅРёСЂР° РёРјРµСЋС‚ РїСЂР°РІРѕ РЅРµ РґРѕРїСѓСЃРєР°С‚СЊ РєРѕРјР°РЅРґСѓ Рє СѓС‡Р°СЃС‚РёСЋ Р±РµР· РѕР±СЉСЏСЃРЅРµРЅРёСЏ РїСЂРёС‡РёРЅС‹.
- РђРґРјРёРЅРёСЃС‚СЂР°С†РёСЏ С‚СѓСЂРЅРёСЂР° РёРјРµРµС‚ РїСЂР°РІРѕ РґРёСЃРєРІР°Р»РёС„РёС†РёСЂРѕРІР°С‚СЊ РєРѕРјР°РЅРґСѓ РёР»Рё СЃРЅСЏС‚СЊ РѕС‡РєРё Р·Р° РЅРµСЃРѕР±Р»СЋРґРµРЅРёРµ СЂРµРіР»Р°РјРµРЅС‚Р° Р±РµР· РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ.
- РћСЂРіР°РЅРёР·Р°С‚РѕСЂС‹ С‚СѓСЂРЅРёСЂР° РёРјРµСЋС‚ РїРѕР»РЅРѕРµ РїСЂР°РІРѕ РёР·РјРµРЅСЏС‚СЊ, РґРѕРїРѕР»РЅСЏС‚СЊ СЂРµРіР»Р°РјРµРЅС‚ Рё СЂР°СЃРїРёСЃР°РЅРёРµ С‚СѓСЂРЅРёСЂР°.
- Р’СЃРµ РѕРєРѕРЅС‡Р°С‚РµР»СЊРЅС‹Рµ СЂРµС€РµРЅРёСЏ РІ РєРѕРЅС„Р»РёРєС‚РЅС‹С… СЃРёС‚СѓР°С†РёСЏС… РїСЂРёРЅРёРјР°СЋС‚ РіР»Р°РІРЅС‹Рµ РѕСЂРіР°РЅРёР·Р°С‚РѕСЂС‹.

Р”РѕРїСѓСЃРє Рє СѓС‡Р°СЃС‚РёСЋ:

- РљРѕРјР°РЅРґР° РґРѕР»Р¶РЅР° СЃРѕСЃС‚РѕСЏС‚СЊ РЅРµ РјРµРЅРµРµ, С‡РµРј РёР· 4 СѓС‡Р°СЃС‚РЅРёРєРѕРІ (РјР°РєСЃРёРјСѓРј 6).
- РћР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РЅР°Р»РёС‡РёРµ РјРёРЅРёРјСѓРј 3 РєР»Р°РЅ-С‚РµРіРѕРІ РІ СЂРѕСЃС‚РµСЂРµ РїСЂРё СЂРµРіРёСЃС‚СЂР°С†РёРё.
- РњРёРЅРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ РєР»Р°РЅ-С‚РµРіРѕРІ РІ Р»РѕР±Р±Рё - 3.
- 18-20 РєРѕРјР°РЅРґ РІ РѕРґРЅРѕР№ РіСЂСѓРїРїРµ.
- Рљ С‚СѓСЂРЅРёСЂСѓ РґРѕРїСѓСЃРєР°СЋС‚СЃСЏ РёРіСЂРѕРєРё СЃ СѓСЂРѕРІРЅРµРј Р°РєРєР°СѓРЅС‚Р° РЅРµ РЅРёР¶Рµ 35.
- Рљ СѓС‡Р°СЃС‚РёСЋ РґРѕРїСѓСЃРєР°СЋС‚СЃСЏ РёРіСЂРѕРєРё, РёСЃРїРѕР»СЊР·СѓСЋС‰РёРµ С‚РµР»РµС„РѕРЅС‹.

РћР±С‰РёРµ РїСЂР°РІРёР»Р°:

- РџСЂРµРґСЃС‚Р°РІРёС‚РµР»СЊ РєРѕРјР°РЅРґС‹ Рё РёРіСЂРѕРєРё РґРѕР»Р¶РЅС‹ СЏРІР»СЏС‚СЊСЃСЏ РіСЂР°Р¶РґР°РЅР°РјРё РѕРґРЅРѕР№ РёР»Рё РЅРµСЃРєРѕР»СЊРєРёС… СЃС‚СЂР°РЅ РЎРќР“.
- РРіСЂРѕРєР°Рј СЂР°Р·СЂРµС€Р°РµС‚СЃСЏ РІРµСЃС‚Рё С‚СЂР°РЅСЃР»СЏС†РёСЋ СЃ Р·Р°РґРµСЂР¶РєРѕР№ РѕС‚ С‚СЂРµС… РјРёРЅСѓС‚.
- РљРѕРјР°РЅРґР° РѕР±СЏР·СѓРµС‚СЃСЏ РґРµР»Р°С‚СЊ Р·Р°РїРёСЃСЊ РІСЃРµС… РёРіСЂ.
- РЎР»РѕС‚ Р·Р°РєСЂРµРїР»РµРЅ Р·Р° РєРѕРјР°РЅРґРѕР№.
- РЎРѕ СЃС‚Р°РґРёРё РїРѕР»СѓС„РёРЅР°Р»Р° СЂРµРЅРµР№Рј Р·Р°РїСЂРµС‰РµРЅ.

Р—Р°РїСЂРµС‰РµРЅРѕ:

- РўРёРјРјРёРЅРі
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ СЃС‚РѕСЂРѕРЅРЅРµРіРѕ РџРћ
- РџРµСЂРµРґР°С‡Р° ID Рё РїР°СЂРѕР»СЏ РѕС‚ Р»РѕР±Р±Рё
- РќРµСѓРІР°Р¶РёС‚РµР»СЊРЅРѕРµ РѕС‚РЅРѕС€РµРЅРёРµ
- Р—Р°РјРµРЅР° РёРіСЂРѕРєРѕРІ РЅРµ РёР· РєРѕРјР°РЅРґС‹
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РѕС€РёР±РѕРє РёРіСЂС‹
- РќРµСЃРїРѕСЂС‚РёРІРЅРѕРµ РїРѕРІРµРґРµРЅРёРµ
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ СЂР°РєРµС‚РЅРёС†
- РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РїР°СЂР°С€СЋС‚Р°

РџСЂРёР·РѕРІРѕР№ С„РѕРЅРґ РѕРїР»Р°С‡РёРІР°РµС‚СЃСЏ РїРѕСЃР»Рµ РѕРєРѕРЅС‡Р°РЅРёСЏ РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РІ С‚РµС‡РµРЅРёРµ 15 СЂР°Р±РѕС‡РёС… РґРЅРµР№.
РљРѕРјРёСЃСЃРёРё РїРµСЂРµРІРѕРґР° РІС‹С‡РёС‚С‹РІР°СЋС‚СЃСЏ СЃ РїСЂРёР·РѕРІРѕРіРѕ С„РѕРЅРґР°.`;

export interface ScoreInput {
  placement: number;
  kills: number;
  bonus?: number;
  penalty?: number;
}

export interface ScoreOutput {
  placementPoints: number;
  killPoints: number;
  bonus: number;
  penalty: number;
  totalPoints: number;
}

export function calculateMatchScore(input: ScoreInput, rule: ScoringRule): ScoreOutput {
  const placementPoints = rule.placementPoints[input.placement] ?? 0;
  const killPoints = Math.max(0, input.kills) * rule.killPoints;
  const bonus = Math.max(0, input.bonus ?? 0);
  const penalty = Math.max(0, input.penalty ?? 0);
  return {
    placementPoints,
    killPoints,
    bonus,
    penalty,
    totalPoints: placementPoints + killPoints + bonus - penalty,
  };
}

interface AggregateOptions {
  tournamentId: string;
  stageId?: string;
  results: MatchTeamResult[];
  tournamentTeams: TournamentTeam[];
  teams: Team[];
  tieBreakers: TieBreakRule[];
}

export function aggregateLeaderboard(opts: AggregateOptions): LeaderboardRow[] {
  const { tournamentId, stageId, results, tournamentTeams, teams, tieBreakers } = opts;

  const scoped = results.filter(r => {
    if (r.tournamentId !== tournamentId) return false;
    if (stageId && r.stageId !== stageId) return false;
    return r.status === 'PUBLISHED' || r.status === 'APPROVED';
  });

  const teamMap = new Map<string, Team>(teams.map(t => [t.id, t]));
  const agg = new Map<string, {
    cd: number; pp: number; kp: number; tp: number;
    wins: number; bestPlacement: number; totalKills: number;
  }>();

  for (const tt of tournamentTeams) {
    if (tt.tournamentId !== tournamentId) continue;
    agg.set(tt.teamId, { cd: 0, pp: 0, kp: 0, tp: 0, wins: 0, bestPlacement: 999, totalKills: 0 });
  }

  for (const r of scoped) {
    const e = agg.get(r.teamId);
    if (!e) continue;
    e.cd += 1;
    e.pp += r.placementPoints;
    e.kp += r.killPoints;
    e.tp += r.totalPoints;
    e.totalKills += r.kills;
    if (r.placement === 1) e.wins += 1;
    if (r.placement < e.bestPlacement) e.bestPlacement = r.placement;
  }

  const rows: LeaderboardRow[] = [];
  for (const tt of tournamentTeams) {
    if (tt.tournamentId !== tournamentId) continue;
    const team = teamMap.get(tt.teamId);
    if (!team) continue;
    const e = agg.get(tt.teamId)!;
    rows.push({
      rank: 0,
      teamId: tt.teamId,
      teamName: team.name,
      teamTag: team.tag,
      teamLogo: team.logo,
      cd: e.cd, pp: e.pp, kp: e.kp, tp: e.tp,
      wins: e.wins,
      bestPlacement: e.bestPlacement === 999 ? 0 : e.bestPlacement,
      totalKills: e.totalKills,
      status: tt.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : 'ACTIVE',
    });
  }

  const tb = [...tieBreakers].sort((a, b) => a.order - b.order);
  rows.sort((a, b) => {
    if (b.tp !== a.tp) return b.tp - a.tp;
    for (const t of tb) {
      switch (t.type) {
        case 'WINS': if (b.wins !== a.wins) return b.wins - a.wins; break;
        case 'TOTAL_KILLS': if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills; break;
        case 'TOTAL_PLACEMENT_POINTS': if (b.pp !== a.pp) return b.pp - a.pp; break;
        case 'BEST_PLACEMENT': {
          const aB = a.bestPlacement || 999;
          const bB = b.bestPlacement || 999;
          if (aB !== bB) return aB - bB;
          break;
        }
        case 'LAST_MATCH_PLACEMENT': {
          const aL = scoped.filter(r => r.teamId === a.teamId).sort((x, y) => y.enteredAt.localeCompare(x.enteredAt))[0]?.placement ?? 999;
          const bL = scoped.filter(r => r.teamId === b.teamId).sort((x, y) => y.enteredAt.localeCompare(x.enteredAt))[0]?.placement ?? 999;
          if (aL !== bL) return aL - bL;
          break;
        }
      }
    }
    return a.teamName.localeCompare(b.teamName);
  });

  const active = rows.filter(r => r.status === 'ACTIVE');
  const dq = rows.filter(r => r.status === 'DISQUALIFIED');
  const ordered = [...active, ...dq];
  ordered.forEach((r, i) => { r.rank = i + 1; });
  return ordered;
}
import { load, save } from '@/lib/db';
import type { Notification } from '@/types';

const REMINDER_STORAGE_KEY = 'ranger.match-reminders';
const REMINDER_WINDOW_MIN = 30;

interface ReminderState {
  /** Map of matchId → timestamp when reminder was sent */
  sent: Record<string, number>;
}

function loadState(): ReminderState {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return { sent: {} };
    return JSON.parse(raw) as ReminderState;
  } catch {
    return { sent: {} };
  }
}

function saveState(state: ReminderState): void {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function addNotification(userId: string, n: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): void {
  const d = load();
  if (!d) return;
  d.notifications.unshift({
    id: 'ntf_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    read: false,
    createdAt: new Date().toISOString(),
  });
  save(d);
}

/**
 * Check for upcoming matches and send reminders.
 * Runs every 60 seconds via setInterval.
 *
 * Returns number of reminders sent (for stats).
 */
export function checkMatchReminders(): number {
  const d = load();
  if (!d) return 0;

  const now = Date.now();
  const state = loadState();
  let sent = 0;

  for (const match of d.matches) {
    // Only upcoming matches
    if (match.status !== 'UPCOMING') continue;

    const matchTime = new Date(match.startTime).getTime();
    const diffMin = (matchTime - now) / 60000;

    // Within reminder window (0..30 min from now)?
    if (diffMin > REMINDER_WINDOW_MIN || diffMin < 0) continue;

    // Already sent?
    if (state.sent[match.id]) continue;

    // Find tournament
    const tournament = d.tournaments.find(t => t.id === match.tournamentId);
    if (!tournament) continue;

    // Find registered teams
    const registeredTeams = d.tournamentTeams.filter(
      tt => tt.tournamentId === match.tournamentId && tt.status === 'ACTIVE',
    );

    // Send to all approved members of all registered teams
    const notifiedUsers = new Set<string>();
    for (const tt of registeredTeams) {
      const team = d.teams.find(x => x.id === tt.teamId);
      if (!team) continue;

      // Notify captain
      if (!notifiedUsers.has(team.captainId)) {
        addNotification(team.captainId, {
          type: 'WARNING',
          title: 'Match starts in ' + Math.round(diffMin) + ' minutes',
          body: tournament.name + ' · Match ' + match.matchNumber + ' · ' + match.map,
          href: '/tournaments/' + tournament.id,
        });
        notifiedUsers.add(team.captainId);
      }

      // Notify members (if allowed)
      const members = d.teamMembers.filter(
        m => m.teamId === team.id && m.status === 'APPROVED',
      );
      for (const member of members) {
        if (notifiedUsers.has(member.userId)) continue;
        addNotification(member.userId, {
          type: 'INFO',
          title: 'Match starts in ' + Math.round(diffMin) + ' minutes',
          body: tournament.name + ' · Match ' + match.matchNumber + ' · ' + match.map,
          href: '/tournaments/' + tournament.id,
        });
        notifiedUsers.add(member.userId);
      }
    }

    // Mark as sent
    state.sent[match.id] = now;
    sent++;
  }

  // Cleanup old entries (>7 days)
  const weekAgo = now - 7 * 86400000;
  for (const [matchId, ts] of Object.entries(state.sent)) {
    if (ts < weekAgo) delete state.sent[matchId];
  }

  if (sent > 0) saveState(state);
  return sent;
}

/**
 * Cleanup reminder state (call when matches change).
 */
export function resetMatchReminder(matchId: string): void {
  const state = loadState();
  delete state.sent[matchId];
  saveState(state);
}

/**
 * Get count of reminders that will fire soon (for UI hint).
 */
export function getUpcomingMatchCount(userId: string): number {
  const d = load();
  if (!d) return 0;

  const now = Date.now();
  const windowEnd = now + REMINDER_WINDOW_MIN * 60000;

  // Find user's team
  const member = d.teamMembers.find(
    m => m.userId === userId && m.status === 'APPROVED',
  );
  if (!member) return 0;

  const myTournaments = d.tournamentTeams.filter(
    tt => tt.teamId === member.teamId && tt.status === 'ACTIVE',
  );
  const myTournamentIds = new Set(myTournaments.map(tt => tt.tournamentId));

  return d.matches.filter(m => {
    if (m.status !== 'UPCOMING') return false;
    if (!myTournamentIds.has(m.tournamentId)) return false;
    const t = new Date(m.startTime).getTime();
    return t >= now && t <= windowEnd;
  }).length;
}

export const REMINDER_WINDOW_MINUTES = REMINDER_WINDOW_MIN;
import { useEffect } from 'react';
import { checkMatchReminders } from '@/lib/match-reminders';

const CHECK_INTERVAL_MS = 60000; // 1 minute

/**
 * Background job: checks for upcoming matches every minute.
 * Mount once at app root (App.tsx or AppShell).
 */
export function useMatchReminders(): void {
  useEffect(() => {
    // First check after 10s (allow app to settle)
    const initialTimer = window.setTimeout(() => {
      checkMatchReminders();
    }, 10000);

    // Then check every minute
    const interval = window.setInterval(() => {
      checkMatchReminders();
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);
}
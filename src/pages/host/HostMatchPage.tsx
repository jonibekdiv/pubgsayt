import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Check, ChevronDown, Eye, EyeOff, Key, Loader2, Lock, Minus, Plus,
  Save, Send, Trophy, Unlock, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { matchApi, tournamentApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MAP_LABEL, cn } from '@/lib/utils';
import { calculateMatchScore } from '@/lib/scoring';
import type { MatchTeamResult, ScoringRule, TournamentTeam } from '@/types';

interface Row {
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string;
  slot: number;
  placement: number;
  kills: number;
  bonus: number;
  penalty: number;
}

const DRAFT_KEY_PREFIX = 'ranger.host.draft.';

export function HostMatchPage() {
  return (
    <RequireAuth permission="scores.enter">
      <HostMatchInner />
    </RequireAuth>
  );
}

function HostMatchInner() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user, can } = useAuth();
  const { toast } = useToast();

  const { data: match, loading: matchLoading } = useAsync(
    () => matchId ? matchApi.get(matchId) : Promise.resolve(undefined),
    [matchId],
  );
  const { data: tournament } = useAsync(
    () => match ? tournamentApi.get(match.tournamentId) : Promise.resolve(undefined),
    [match?.tournamentId],
  );
  const { data: rule } = useAsync(
    () => match ? tournamentApi.scoringRule(match.tournamentId) : Promise.resolve(undefined),
    [match?.tournamentId],
  );
  const { data: teams } = useAsync(
    () => match ? tournamentApi.registeredTeams(match.tournamentId) : Promise.resolve([]),
    [match?.tournamentId],
  );
  const { data: existingResults } = useAsync(
    () => matchId ? matchApi.results(matchId) : Promise.resolve([]),
    [matchId],
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [lobbyVisible, setLobbyVisible] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const autosaveTimer = useRef<number | null>(null);

  const isHost = !!user && !!match && (match.hostId === user.id || can('hosts.manage'));
  const resultsPublished = match?.resultsStatus === 'PUBLISHED';

  useEffect(() => {
    if (initialized) return;
    if (!teams || !existingResults || !rule) return;

    const draft = matchId ? localStorage.getItem(DRAFT_KEY_PREFIX + matchId) : null;
    const useDraft = draft && !resultsPublished;

    if (useDraft) {
      try {
        const parsed = JSON.parse(draft) as Row[];
        const valid = parsed.filter(r => teams.some(t => t.teamId === r.teamId));
        if (valid.length === teams.length) {
          setRows(valid);
          setInitialized(true);
          return;
        }
      } catch { /* fall through */ }
    }

    const next: Row[] = teams.map(t => {
      const existing = existingResults.find(r => r.teamId === t.teamId);
      return {
        teamId: t.teamId,
        teamName: t.team.name,
        teamTag: t.team.tag,
        teamLogo: t.team.logo,
        slot: t.slot,
        placement: existing?.placement ?? 0,
        kills: existing?.kills ?? 0,
        bonus: existing?.bonus ?? 0,
        penalty: existing?.penalty ?? 0,
      };
    });
    setRows(next);
    setInitialized(true);
  }, [teams, existingResults, rule, matchId, resultsPublished, initialized]);

  const totals = useMemo(() => {
    if (!rule) return null;
    return rows.map(r => ({
      ...r,
      ...calculateMatchScore(
        { placement: r.placement, kills: r.kills, bonus: r.bonus, penalty: r.penalty },
        rule,
      ),
    }));
  }, [rows, rule]);

  const updateRow = useCallback((teamId: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => r.teamId === teamId ? { ...r, ...patch } : r));
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!dirty || !matchId) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY_PREFIX + matchId, JSON.stringify(rows));
    }, 500);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [rows, dirty, matchId]);

  if (matchLoading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!match) return <Navigate to="/404" replace />;
  if (!isHost) return (
    <EmptyState
      icon={Lock}
      title="Not assigned to you"
      description="You are not a host for this match. Ask the organizer to assign you."
    />
  );
  if (!tournament || !rule || !totals) return <div className="p-12 text-center text-ink-faint">Loading data...</div>;

  const validationErrors: string[] = [];
  const placements = totals.map(r => r.placement).filter(p => p > 0);
  const dupes = placements.filter((p, i) => placements.indexOf(p) !== i);
  if (dupes.length > 0) validationErrors.push('Duplicate placements: ' + [...new Set(dupes)].join(', '));
  totals.forEach(r => { if (r.kills < 0) validationErrors.push(r.teamName + ': negative kills'); });

  const allFilled = totals.every(r => r.placement > 0);

  const doSave = async (mode: 'DRAFT' | 'SUBMIT') => {
    if (!user || !matchId) return;
    if (mode === 'SUBMIT' && validationErrors.length) {
      toast('ERROR', 'Fix validation errors first', validationErrors[0]);
      return;
    }
    if (mode === 'SUBMIT' && !allFilled) {
      toast('WARNING', 'Fill all placements before submitting');
      return;
    }
    setBusy(true);
    try {
      await matchApi.submitScores(
        matchId,
        user.id,
        totals.map(r => ({
          teamId: r.teamId,
          placement: r.placement,
          kills: r.kills,
          bonus: r.bonus,
          penalty: r.penalty,
        })),
        mode,
      );
      if (mode === 'DRAFT') {
        localStorage.setItem(DRAFT_KEY_PREFIX + matchId, JSON.stringify(rows));
        toast('SUCCESS', 'Draft saved');
      } else {
        localStorage.removeItem(DRAFT_KEY_PREFIX + matchId);
        toast('SUCCESS', 'Scores submitted', 'Now publish to update the leaderboard.');
      }
      setDirty(false);
    } catch (e) {
      toast('ERROR', 'Save failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const doPublish = async () => {
    if (!user || !matchId) return;
    if (!confirm('Publish results? This will update the public leaderboard and cannot be undone without a correction.')) return;
    setBusy(true);
    try {
      await matchApi.publishResults(matchId, user.id);
      toast('SUCCESS', 'Results published', 'Leaderboard updated.');
      localStorage.removeItem(DRAFT_KEY_PREFIX + matchId);
    } catch (e) {
      toast('ERROR', 'Publish failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'CANCELLED') => {
    if (!user) return;
    await matchApi.setStatus(match.id, status, user.id);
    toast('SUCCESS', 'Match status: ' + status);
  };

  return (
    <div className="pb-32">
      <div className="mb-4">
        <Link to="/host" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-brand-400">
          <ArrowLeft size={13} /> Back to host dashboard
        </Link>
      </div>

      <PageHeader
        title={'Match ' + match.matchNumber + ' - ' + MAP_LABEL[match.map]}
        subtitle={tournament.name}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status === 'LIVE' ? 'LIVE' : match.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING'} />
            {match.resultsStatus !== 'DRAFT' && (
              <span className="rounded-full border border-line bg-white/[.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                {match.resultsStatus}
              </span>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="lg:order-1 order-2">
          <CardHeader>
            <CardTitle>Score Entry</CardTitle>
            {dirty && <span className="text-[10px] font-semibold uppercase tracking-wider text-warning">Unsaved</span>}
          </CardHeader>
          <CardBody className="pt-0">
            {!totals.length ? (
              <EmptyState icon={Trophy} title="No teams registered" />
            ) : (
              <div className="space-y-2">
                <div className="hidden grid-cols-[40px_1fr_60px_70px_60px_60px_60px] gap-2 px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint md:grid">
                  <span>#</span>
                  <span>Team</span>
                  <span>Place</span>
                  <span>Kills</span>
                  <span>Bonus</span>
                  <span>Penalty</span>
                  <span className="text-right">Total</span>
                </div>

                {totals.map((r, idx) => (
                  <div
                    key={r.teamId}
                    className={cn(
                      'flex flex-wrap items-center gap-2 rounded-xl border p-2.5 md:grid md:grid-cols-[40px_1fr_60px_70px_60px_60px_60px] md:gap-2',
                      r.placement === 1
                        ? 'border-amber-500/40 bg-amber-500/[.06]'
                        : r.placement > 0 && r.placement <= 3
                          ? 'border-brand-600/30 bg-brand-600/[.06]'
                          : 'border-line bg-bg-deep/40',
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 font-mono text-xs font-bold text-brand-400 md:h-auto md:w-auto md:rounded-none md:bg-transparent">
                      {String(r.slot).padStart(2, '0')}
                    </span>

                    <div className="flex min-w-0 flex-1 items-center gap-2 md:min-w-0">
                      {r.teamLogo && <img src={r.teamLogo} alt="" className="h-7 w-7 shrink-0 rounded-md border border-line" />}
                      <div className="min-w-0">
                        <p className="truncate font-display text-xs font-semibold uppercase text-white md:text-sm">{r.teamName}</p>
                        <p className="truncate text-[10px] text-ink-faint">{r.teamTag}</p>
                      </div>
                    </div>

                    <NumberInput
                      value={r.placement}
                      onChange={v => updateRow(r.teamId, { placement: v })}
                      min={0}
                      max={99}
                      disabled={resultsPublished}
                      label="Place"
                    />

                    <NumberInput
                      value={r.kills}
                      onChange={v => updateRow(r.teamId, { kills: v })}
                      min={0}
                      max={99}
                      disabled={resultsPublished}
                      label="Kills"
                    />

                    <NumberInput
                      value={r.bonus}
                      onChange={v => updateRow(r.teamId, { bonus: v })}
                      min={0}
                      max={99}
                      disabled={resultsPublished}
                      label="Bonus"
                    />

                    <NumberInput
                      value={r.penalty}
                      onChange={v => updateRow(r.teamId, { penalty: v })}
                      min={0}
                      max={99}
                      disabled={resultsPublished}
                      label="Penalty"
                    />

                    <div className="flex flex-col items-end justify-center md:text-right">
                      <span className="font-mono text-sm font-bold tabular-nums text-white md:text-base">
                        {r.totalPoints}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-ink-faint md:hidden">
                        {r.placementPoints}P + {r.killPoints}K
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-4 rounded-xl border border-danger/40 bg-danger/[.08] p-3">
                <p className="text-xs font-semibold text-danger">Validation errors:</p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-danger/90">
                  {validationErrors.map((e, i) => <li key={i}>- {e}</li>)}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4 lg:order-2 order-1">
          <Card>
            <CardHeader><CardTitle>Lobby Credentials</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Lobby ID</span>
                <span className="font-mono text-sm font-semibold text-white">
                  {match.lobbyId ?? 'вЂ”'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-faint">Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-white">
                    {lobbyVisible ? (match.lobbyPassword ?? 'вЂ”') : 'вЂўвЂўвЂўвЂўвЂўвЂўвЂў'}
                  </span>
                  <button
                    onClick={() => setLobbyVisible(v => !v)}
                    className="rounded-lg p-1 text-ink-faint hover:bg-white/5 hover:text-white"
                    aria-label="Toggle password"
                  >
                    {lobbyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <p className="rounded-lg border border-line bg-bg-deep/60 p-2.5 text-[10px] leading-relaxed text-ink-faint">
                Only registered participants, hosts and organizers can see these credentials.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Match Status</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {(['UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  disabled={match.status === s}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left text-xs font-semibold transition',
                    match.status === s
                      ? 'border-brand-600/50 bg-brand-600/15 text-white'
                      : 'border-line bg-bg-deep/40 text-ink-muted hover:border-brand-600/30 hover:text-white',
                  )}
                >
                  {s}
                </button>
              ))}
            </CardBody>
          </Card>

          {match.resultsStatus === 'PUBLISHED' && (
            <Card>
              <CardBody className="pt-5">
                <div className="flex items-start gap-2 text-xs text-success">
                  <Check size={14} className="mt-0.5 shrink-0" />
                  <p>Results published. To edit scores, request a correction from the organizer.</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-bg-base/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
              {totals.length} teams В· {totals.filter(r => r.placement > 0).length} scored
            </p>
            {!allFilled && (
              <p className="truncate text-[11px] text-warning">Not all placements filled</p>
            )}
          </div>
          {!resultsPublished && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => doSave('DRAFT')}
                loading={busy}
                className="hidden sm:inline-flex"
              >
                <Save size={13} /> Save draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => doSave('SUBMIT')}
                loading={busy}
                disabled={validationErrors.length > 0}
              >
                <Send size={13} /> Submit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={doPublish}
                disabled={!allFilled || validationErrors.length > 0}
                loading={busy}
                className="hidden sm:inline-flex"
              >
                <Zap size={13} /> Publish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, disabled, label }: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  label: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-line bg-bg-base/60 md:min-w-0">
      <button
        onClick={dec}
        disabled={disabled}
        aria-label={'Decrease ' + label}
        className="flex h-9 w-8 shrink-0 items-center justify-center rounded-l-lg text-ink-faint transition hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        value={value || ''}
        onChange={e => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0);
        }}
        disabled={disabled}
        inputMode="numeric"
        aria-label={label}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-center font-mono text-sm font-bold text-white tabular-nums focus:outline-none focus:ring-0 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={inc}
        disabled={disabled}
        aria-label={'Increase ' + label}
        className="flex h-9 w-8 shrink-0 items-center justify-center rounded-r-lg text-ink-faint transition hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
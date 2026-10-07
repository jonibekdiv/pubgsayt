import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Coins, Info, Map as MapIcon, Plus, Save,
  Shield, Sparkles, Trash2, Trophy, Users, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { tournamentApi, type CreateTournamentInput } from '@/services/api';
import { MAP_LABEL, cn, formatMoney } from '@/lib/utils';
import { DEFAULT_RULES_TEMPLATE } from '@/lib/scoring';
import type { PubgMap, Tournament } from '@/types';

const MAPS: PubgMap[] = ['ERANGEL', 'MIRAMAR', 'RONDO', 'SANHOK'];

const STEPS = [
  { id: 'basic', label: 'Basic', icon: Info },
  { id: 'format', label: 'Format', icon: Users },
  { id: 'finance', label: 'Finance', icon: Coins },
  { id: 'maps', label: 'Maps & Stages', icon: MapIcon },
  { id: 'rules', label: 'Rules & Contact', icon: Shield },
] as const;

interface StageInput {
  name: string;
  order: number;
  date: string;
  startTime: string;
  endTime: string;
  teamCount: number;
  matchCount: number;
  maps: PubgMap[];
  qualificationRules: string;
  qualificationCount: number;
}

interface PrizeInput { place: number; amount: number }

interface FormState {
  name: string;
  shortName: string;
  description: string;
  rules: string;
  adminLink: string;
  banner: string;
  logo: string;
  maxTeams: number;
  minPlayers: number;
  maxPlayers: number;
  minClanTags: number;
  minAccountLevel: number;
  isPaid: boolean;
  entryFee: number;
  prizePool: number;
  prizeDistribution: PrizeInput[];
  maps: PubgMap[];
  registrationOpen: string;
  registrationClose: string;
  startDate: string;
  endDate: string;
  currentStreamUrl: string;
  stages: StageInput[];
  hostIds: string[];
}

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const initialForm = (): FormState => ({
  name: '',
  shortName: '',
  description: '',
  rules: DEFAULT_RULES_TEMPLATE,
  adminLink: '',
  banner: '',
  logo: '',
  maxTeams: 20,
  minPlayers: 4,
  maxPlayers: 6,
  minClanTags: 3,
  minAccountLevel: 35,
  isPaid: false,
  entryFee: 0,
  prizePool: 1000000,
  prizeDistribution: [
    { place: 1, amount: 500000 },
    { place: 2, amount: 300000 },
    { place: 3, amount: 200000 },
  ],
  maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
  registrationOpen: today(),
  registrationClose: plusDays(7),
  startDate: plusDays(10),
  endDate: plusDays(10),
  currentStreamUrl: '',
  stages: [
    {
      name: 'Grand Final',
      order: 1,
      date: plusDays(10),
      startTime: '15:00',
      endTime: '19:00',
      teamCount: 20,
      matchCount: 4,
      maps: ['ERANGEL', 'MIRAMAR', 'RONDO', 'ERANGEL'],
      qualificationRules: '',
      qualificationCount: 0,
    },
  ],
  hostIds: [],
});

export function OrganizerTournamentCreate() {
  return (
    <RequireAuth permission="tournaments.create">
      <Wizard />
    </RequireAuth>
  );
}

function Wizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validation = useMemo(() => validate(form, step), [form, step]);
  const canNext = validation.length === 0;

  const handleNext = () => {
    if (!canNext) {
      toast('WARNING', 'Please fix the errors', validation[0]);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreate = async (status: Tournament['status']) => {
    if (!user) return;
    // Validate all steps
    for (let i = 0; i < STEPS.length; i++) {
      const errs = validate(form, i);
      if (errs.length > 0) {
        setStep(i);
        toast('ERROR', 'Please fix errors', errs[0]);
        return;
      }
    }

    setBusy(true);
    try {
      const input: CreateTournamentInput = {
        name: form.name,
        shortName: form.shortName || form.name.slice(0, 4).toUpperCase(),
        description: form.description,
        rules: form.rules,
        organizerId: user.id,
        adminLink: form.adminLink,
        banner: form.banner || undefined,
        logo: form.logo || undefined,
        maps: form.maps,
        maxTeams: form.maxTeams,
        rosterRules: {
          minPlayers: form.minPlayers,
          maxPlayers: form.maxPlayers,
          minClanTags: form.minClanTags,
          minAccountLevel: form.minAccountLevel,
        },
        isPaid: form.isPaid,
        entryFee: form.isPaid ? form.entryFee : 0,
        prizePool: form.prizePool,
        prizeDistribution: form.prizeDistribution,
        registrationOpen: form.registrationOpen + 'T00:00:00.000Z',
        registrationClose: form.registrationClose + 'T23:59:59.000Z',
        startDate: form.startDate + 'T00:00:00.000Z',
        endDate: form.endDate + 'T23:59:59.000Z',
        timezone: 'Asia/Tashkent',
        currentStreamUrl: form.currentStreamUrl || undefined,
        hostIds: form.hostIds,
        stages: form.stages.map(s => ({
          name: s.name,
          order: s.order,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime || undefined,
          teamCount: s.teamCount,
          matchCount: s.matchCount,
          maps: s.maps,
          qualificationRules: s.qualificationRules || undefined,
          qualificationCount: s.qualificationCount || undefined,
        })),
      };

      const created = await tournamentApi.create(input, status);
      toast('SUCCESS', status === 'DRAFT' ? 'Draft saved' : 'Tournament published',
        created.name + ' has been created.');
      navigate('/tournaments/' + created.id);
    } catch (e) {
      toast('ERROR', 'Creation failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-32">
      <PageHeader
        title="Create Tournament"
        subtitle="Multi-step wizard В· Save as draft or publish"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/organizer/tournaments')}>
            <ArrowLeft size={13} /> Cancel
          </Button>
        }
      />

      {/* Step indicator */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/[.07] bg-white/[.03] p-1 backdrop-blur-xl">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4',
                active ? 'bg-brand-600/25 text-white ring-1 ring-inset ring-brand-500/40'
                  : done ? 'text-brand-400 hover:bg-white/[.04]'
                  : 'text-ink-faint hover:bg-white/[.04] hover:text-ink-muted',
              )}
            >
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                active ? 'bg-brand-600 text-white'
                  : done ? 'bg-brand-600/30 text-brand-400'
                  : 'bg-white/[.06] text-ink-faint',
              )}>
                {done ? <Check size={10} /> : i + 1}
              </span>
              <s.icon size={12} className="hidden sm:block" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].label}</CardTitle>
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">
            Step {step + 1} of {STEPS.length}
          </span>
        </CardHeader>
        <CardBody className="pt-2">
          {step === 0 && <BasicStep form={form} set={set} />}
          {step === 1 && <FormatStep form={form} set={set} />}
          {step === 2 && <FinanceStep form={form} set={set} />}
          {step === 3 && <MapsStagesStep form={form} set={set} />}
          {step === 4 && <RulesContactStep form={form} set={set} />}

          {validation.length > 0 && (
            <div className="mt-4 rounded-xl border border-warning/40 bg-warning/[.08] p-3">
              <p className="text-xs font-semibold text-warning">Please fix:</p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-warning/90">
                {validation.map((e, i) => <li key={i}>- {e}</li>)}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-bg-base/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ArrowLeft size={13} /> Back
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
              {form.name || 'Untitled tournament'}
            </p>
          </div>

          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="sm" onClick={handleNext} disabled={!canNext}>
              Next <ArrowRight size={13} />
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCreate('DRAFT')}
                loading={busy}
                className="hidden sm:inline-flex"
              >
                <Save size={13} /> Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCreate('REGISTRATION_OPEN')}
                loading={busy}
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

/* в”Ђв”Ђв”Ђ Steps в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function BasicStep({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Tournament name" required hint="e.g. RANGER SCRIMS">
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="RANGER SCRIMS"
            />
          </Field>
        </div>
        <Field label="Short name" hint="2-6 characters">
          <Input
            value={form.shortName}
            onChange={e => set('shortName', e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="RS"
          />
        </Field>
      </div>

      <Field label="Description" required hint="What is this tournament about?">
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Flagship weekly PUBG scrim circuit..."
          rows={4}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Banner URL" hint="Optional - 1920x720 recommended">
          <Input
            value={form.banner}
            onChange={e => set('banner', e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Logo URL" hint="Optional - square image">
          <Input
            value={form.logo}
            onChange={e => set('logo', e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>

      {(form.banner || form.logo) && (
        <div className="rounded-xl border border-line bg-bg-deep/40 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-ink-faint">Preview</p>
          <div className="relative h-32 overflow-hidden rounded-lg bg-bg-deep">
            {form.banner && <img src={form.banner} alt="" className="h-full w-full object-cover" />}
            {form.logo && (
              <img src={form.logo} alt="" className="absolute bottom-2 left-2 h-12 w-12 rounded-lg border-2 border-bg-panel bg-bg-deep" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormatStep({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Maximum teams" required hint="2-100">
          <Input
            type="number"
            value={form.maxTeams}
            onChange={e => set('maxTeams', parseInt(e.target.value, 10) || 0)}
            min={2}
            max={100}
          />
        </Field>
        <Field label="Minimum account level" hint="PUBG account level requirement">
          <Input
            type="number"
            value={form.minAccountLevel}
            onChange={e => set('minAccountLevel', parseInt(e.target.value, 10) || 0)}
            min={1}
            max={80}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min players per team" required>
          <Input
            type="number"
            value={form.minPlayers}
            onChange={e => set('minPlayers', parseInt(e.target.value, 10) || 0)}
            min={1}
            max={10}
          />
        </Field>
        <Field label="Max players per team" required>
          <Input
            type="number"
            value={form.maxPlayers}
            onChange={e => set('maxPlayers', parseInt(e.target.value, 10) || 0)}
            min={1}
            max={10}
          />
        </Field>
        <Field label="Min clan tags" hint="PUBG nickname must contain team tag">
          <Input
            type="number"
            value={form.minClanTags}
            onChange={e => set('minClanTags', parseInt(e.target.value, 10) || 0)}
            min={0}
            max={10}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Registration opens" required>
          <Input
            type="date"
            value={form.registrationOpen}
            onChange={e => set('registrationOpen', e.target.value)}
          />
        </Field>
        <Field label="Registration closes" required>
          <Input
            type="date"
            value={form.registrationClose}
            onChange={e => set('registrationClose', e.target.value)}
          />
        </Field>
        <Field label="Timezone">
          <Input
            value="Asia/Tashkent (UTC+5)"
            disabled
            className="text-ink-faint"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tournament starts" required>
          <Input
            type="date"
            value={form.startDate}
            onChange={e => set('startDate', e.target.value)}
          />
        </Field>
        <Field label="Tournament ends" required>
          <Input
            type="date"
            value={form.endDate}
            onChange={e => set('endDate', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function FinanceStep({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const distTotal = form.prizeDistribution.reduce((s, p) => s + p.amount, 0);

  const setPrize = (idx: number, patch: Partial<PrizeInput>) => {
    const next = [...form.prizeDistribution];
    next[idx] = { ...next[idx], ...patch };
    set('prizeDistribution', next);
  };

  const addPrize = () => set('prizeDistribution', [
    ...form.prizeDistribution,
    { place: form.prizeDistribution.length + 1, amount: 0 },
  ]);

  const removePrize = (idx: number) => set('prizeDistribution',
    form.prizeDistribution.filter((_, i) => i !== idx)
      .map((p, i) => ({ ...p, place: i + 1 })));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-deep/40 p-3">
        <button
          onClick={() => set('isPaid', false)}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition',
            !form.isPaid ? 'border-brand-600/50 bg-brand-600/15 text-white' : 'border-line bg-bg-deep/40 text-ink-muted hover:text-white',
          )}
        >
          FREE
        </button>
        <button
          onClick={() => set('isPaid', true)}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition',
            form.isPaid ? 'border-brand-600/50 bg-brand-600/15 text-white' : 'border-line bg-bg-deep/40 text-ink-muted hover:text-white',
          )}
        >
          PAID
        </button>
      </div>

      {form.isPaid && (
        <Field label="Entry fee per team slot" hint="Amount in UZS">
          <Input
            type="number"
            value={form.entryFee}
            onChange={e => set('entryFee', parseInt(e.target.value, 10) || 0)}
            min={0}
          />
        </Field>
      )}

      <Field label="Prize pool" required hint="Total prize amount in UZS">
        <Input
          type="number"
          value={form.prizePool}
          onChange={e => set('prizePool', parseInt(e.target.value, 10) || 0)}
          min={0}
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-ink-muted">Prize distribution</p>
          <Button variant="ghost" size="sm" onClick={addPrize}>
            <Plus size={12} /> Add place
          </Button>
        </div>

        <div className="space-y-2">
          {form.prizeDistribution.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 font-display text-sm font-bold text-brand-400">
                #{p.place}
              </span>
              <Input
                type="number"
                value={p.amount}
                onChange={e => setPrize(i, { amount: parseInt(e.target.value, 10) || 0 })}
                min={0}
              />
              <button
                onClick={() => removePrize(i)}
                className="shrink-0 rounded-lg border border-line bg-bg-deep/40 p-2.5 text-ink-faint transition hover:border-danger/40 hover:text-danger"
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-bg-deep/40 p-3">
          <span className="text-xs text-ink-faint">Distribution total</span>
          <span className={cn(
            'font-mono text-sm font-semibold tabular-nums',
            distTotal === form.prizePool ? 'text-success'
              : distTotal > form.prizePool ? 'text-danger'
              : 'text-warning',
          )}>
            {formatMoney(distTotal)}
          </span>
        </div>
        {distTotal > form.prizePool && (
          <p className="mt-2 text-[11px] text-danger">
            Distribution exceeds prize pool by {formatMoney(distTotal - form.prizePool)}
          </p>
        )}
      </div>
    </div>
  );
}

function MapsStagesStep({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const toggleMap = (m: PubgMap) => {
    if (form.maps.includes(m)) {
      set('maps', form.maps.filter(x => x !== m));
    } else {
      set('maps', [...form.maps, m]);
    }
  };

  const updateStage = (idx: number, patch: Partial<StageInput>) => {
    const next = [...form.stages];
    next[idx] = { ...next[idx], ...patch };
    set('stages', next);
  };

  const toggleStageMap = (idx: number, m: PubgMap) => {
    const stage = form.stages[idx];
    const next = stage.maps.includes(m)
      ? stage.maps.filter(x => x !== m)
      : [...stage.maps, m];
    updateStage(idx, { maps: next });
  };

  const addStage = () => {
    set('stages', [
      ...form.stages,
      {
        name: 'Stage ' + (form.stages.length + 1),
        order: form.stages.length + 1,
        date: form.startDate,
        startTime: '15:00',
        endTime: '19:00',
        teamCount: form.maxTeams,
        matchCount: 3,
        maps: ['ERANGEL'],
        qualificationRules: '',
        qualificationCount: 0,
      },
    ]);
  };

  const removeStage = (idx: number) => set('stages',
    form.stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-ink-muted">Tournament maps</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MAPS.map(m => {
            const active = form.maps.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMap(m)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-xs font-semibold transition',
                  active ? 'border-brand-600/50 bg-brand-600/15 text-white' : 'border-line bg-bg-deep/40 text-ink-muted hover:text-white',
                )}
              >
                {active && <Check size={11} className="mr-1 inline" />}
                {MAP_LABEL[m]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-ink-muted">Stages ({form.stages.length})</p>
          <Button variant="ghost" size="sm" onClick={addStage}>
            <Plus size={12} /> Add stage
          </Button>
        </div>

        <div className="space-y-3">
          {form.stages.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-line bg-bg-deep/40 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600/20 font-mono text-xs font-bold text-brand-400">
                  {idx + 1}
                </span>
                <Input
                  value={s.name}
                  onChange={e => updateStage(idx, { name: e.target.value })}
                  placeholder={'Stage ' + (idx + 1)}
                  className="flex-1"
                />
                {form.stages.length > 1 && (
                  <button
                    onClick={() => removeStage(idx)}
                    className="shrink-0 rounded-lg border border-line bg-bg-deep/40 p-2 text-ink-faint transition hover:border-danger/40 hover:text-danger"
                    aria-label="Remove stage"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Date">
                  <Input
                    type="date"
                    value={s.date}
                    onChange={e => updateStage(idx, { date: e.target.value })}
                  />
                </Field>
                <Field label="Start time">
                  <Input
                    type="time"
                    value={s.startTime}
                    onChange={e => updateStage(idx, { startTime: e.target.value })}
                  />
                </Field>
                <Field label="End time">
                  <Input
                    type="time"
                    value={s.endTime}
                    onChange={e => updateStage(idx, { endTime: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Teams">
                  <Input
                    type="number"
                    value={s.teamCount}
                    onChange={e => updateStage(idx, { teamCount: parseInt(e.target.value, 10) || 0 })}
                    min={1}
                    max={100}
                  />
                </Field>
                <Field label="Matches">
                  <Input
                    type="number"
                    value={s.matchCount}
                    onChange={e => updateStage(idx, { matchCount: parseInt(e.target.value, 10) || 0 })}
                    min={0}
                    max={20}
                  />
                </Field>
              </div>

              <div className="mt-2">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-faint">Maps for this stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {MAPS.map(m => {
                    const active = s.maps.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => toggleStageMap(idx, m)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
                          active ? 'border-brand-600/50 bg-brand-600/15 text-white' : 'border-line bg-bg-deep/40 text-ink-faint hover:text-ink-muted',
                        )}
                      >
                        {MAP_LABEL[m]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RulesContactStep({ form, set }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Admin contact link" required hint="Telegram/WhatsApp link shown to participants">
        <Input
          value={form.adminLink}
          onChange={e => set('adminLink', e.target.value)}
          placeholder="https://t.me/your_telegram"
        />
      </Field>

      <Field label="Live stream URL" hint="YouTube channel or live link">
        <Input
          value={form.currentStreamUrl}
          onChange={e => set('currentStreamUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
      </Field>

      <Field label="Tournament rules" required hint="You can edit the pre-filled template">
        <Textarea
          value={form.rules}
          onChange={e => set('rules', e.target.value)}
          rows={14}
          className="font-mono text-xs leading-relaxed"
        />
      </Field>

      <div className="rounded-xl border border-line bg-bg-deep/40 p-3">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          <Sparkles size={11} className="mr-1 inline text-brand-400" />
          <strong className="text-ink-muted">Ready to create?</strong> You can save as <em>Draft</em> and finish later,
          or publish immediately to open registration.
        </p>
      </div>
    </div>
  );
}

/* в”Ђв”Ђв”Ђ Validation в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */

function validate(form: FormState, step: number): string[] {
  const errs: string[] = [];

  if (step === 0) {
    if (!form.name.trim() || form.name.trim().length < 3) errs.push('Tournament name (min 3 characters)');
    if (!form.description.trim()) errs.push('Description is required');
  }

  if (step === 1) {
    if (form.maxTeams < 2) errs.push('Maximum teams must be at least 2');
    if (form.minPlayers < 1) errs.push('Minimum players must be at least 1');
    if (form.maxPlayers < form.minPlayers) errs.push('Max players must be >= min players');
    if (form.minClanTags > form.maxPlayers) errs.push('Min clan tags cannot exceed max players');
    if (!form.registrationOpen) errs.push('Registration open date required');
    if (!form.registrationClose) errs.push('Registration close date required');
    if (form.registrationClose < form.registrationOpen) errs.push('Registration close must be after open');
    if (!form.startDate) errs.push('Start date required');
    if (!form.endDate) errs.push('End date required');
    if (form.endDate < form.startDate) errs.push('End date must be after start date');
  }

  if (step === 2) {
    if (form.prizePool < 0) errs.push('Prize pool cannot be negative');
    if (form.isPaid && form.entryFee < 0) errs.push('Entry fee cannot be negative');
    if (form.prizeDistribution.length === 0) errs.push('Add at least one prize place');
    const total = form.prizeDistribution.reduce((s, p) => s + p.amount, 0);
    if (total > form.prizePool) errs.push('Prize distribution exceeds prize pool');
  }

  if (step === 3) {
    if (form.maps.length === 0) errs.push('Select at least one tournament map');
    if (form.stages.length === 0) errs.push('Add at least one stage');
    form.stages.forEach((s, i) => {
      if (!s.name.trim()) errs.push('Stage ' + (i + 1) + ': name required');
      if (!s.date) errs.push('Stage ' + (i + 1) + ': date required');
      if (!s.startTime) errs.push('Stage ' + (i + 1) + ': start time required');
      if (s.teamCount < 1) errs.push('Stage ' + (i + 1) + ': team count must be at least 1');
      if (s.maps.length === 0) errs.push('Stage ' + (i + 1) + ': select at least one map');
    });
  }

  if (step === 4) {
    if (!form.adminLink.trim()) errs.push('Admin contact link is required');
    if (!form.rules.trim()) errs.push('Tournament rules are required');
  }

  return errs;
}
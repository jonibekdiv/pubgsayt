import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Check, Copy, Crown, Swords, UserPlus, X,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { RequireAuth } from '@/components/common/require-auth';
import { TeamMemberRow } from '@/components/team/team-member-row';
import { LeaveTeamButton } from '@/components/team/leave-team-button';
import { TeamChat } from '@/components/team/team-chat';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import type { TeamMemberRole } from '@/types';

const POLL_MS = 15000;

export function MyTeamPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamTab, setTeamTab] = useState('roster');

  const { data: team, loading, refetch: refetchTeam } = useAsync(
    () => (user ? teamApi.byUser(user.id) : Promise.resolve(undefined)),
    [user?.id],
  );
  const { data: members, refetch: refetchMembers } = useAsync(
    () => (team ? teamApi.members(team.id) : Promise.resolve([])),
    [team?.id],
  );

  // Auto-refresh pending requests
  useEffect(() => {
    if (!team) return;
    const t = window.setInterval(() => {
      void refetchMembers();
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [team, refetchMembers]);

  useEffect(() => {
    const onFocus = () => {
      void refetchMembers();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchMembers]);

  const copyInvite = () => {
    if (!team) return;
    void navigator.clipboard.writeText(
      window.location.origin + '/team/join/' + team.inviteCode,
    );
    toast('SUCCESS', 'Invite link copied');
  };

  const handleApprove = async (memberId: string) => {
    try {
      await teamApi.reviewMember(memberId, 'APPROVED');
      toast('SUCCESS', 'Member approved');
      void refetchTeam();
      void refetchMembers();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      await teamApi.reviewMember(memberId, 'REJECTED');
      toast('WARNING', 'Request rejected');
      void refetchMembers();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!user) return;
    try {
      await teamApi.removeMember(memberId, user.id);
      toast('SUCCESS', 'Member removed');
      void refetchTeam();
      void refetchMembers();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const handleChangeRole = async (memberId: string, role: TeamMemberRole) => {
    if (!user) return;
    try {
      await teamApi.setMemberRole(memberId, role, user.id);
      toast('SUCCESS', 'Role updated');
      void refetchMembers();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const handleTransfer = async (newCaptainUserId: string) => {
    if (!user || !team) return;
    try {
      await teamApi.transferCaptain(team.id, newCaptainUserId, user.id);
      toast('SUCCESS', 'Captain transferred');
      void refetchTeam();
      void refetchMembers();
    } catch (e) {
      toast('ERROR', 'Error', e instanceof Error ? e.message : 'Unknown');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  }

  /* ── Not in a team ── */
  if (!team) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <PageHeader
          title="My Team"
          subtitle="Create your own squad or join an existing one"
        />

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {/* Create team */}
          <Card>
            <CardHeader>
              <CardTitle>Create a team</CardTitle>
              <UserPlus size={14} className="text-brand-400" />
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-ink-muted">
                Start your own squad. You become the captain and can invite
                players.
              </p>
              <Link to="/team/create">
                <Button size="lg" className="w-full">
                  <UserPlus size={16} /> Create team
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Join with code */}
          <JoinWithCodeCard />
        </div>
      </div>
    );
  }

  /* ── In a team ── */
  const approved = (members ?? []).filter(m => m.status === 'APPROVED');
  const pending = (members ?? []).filter(m => m.status === 'PENDING');
  const isCaptain = user?.id === team.captainId;
  const hasOtherMembers = approved.filter(m => m.userId !== user?.id).length > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <PageHeader
        title="My Team"
        subtitle={team.name + ' - ' + team.tag}
        action={
          <Link to={'/teams/' + team.id}>
            <Button size="sm" variant="secondary">
              View team page
            </Button>
          </Link>
        }
      />

      {/* Pending requests (captain only, on top) */}
      {isCaptain && pending.length > 0 && (
        <Card className="border-warning/40 bg-warning/[.04] ring-2 ring-warning/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-warning opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-warning" />
              </span>
              <CardTitle className="text-warning">
                Join Requests - {pending.length}
              </CardTitle>
            </div>
            <AlertCircle size={16} className="text-warning" />
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {pending.map(m => (
                <li
                  key={m.id}
                  className="rounded-xl border border-warning/30 bg-bg-deep/60 p-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar src={m.user.avatar} name={m.user.fullName} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {m.user.fullName}
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        @{m.user.username}
                        {m.user.pubgNickname && (
                          <span> · {m.user.pubgNickname}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="lg"
                      onClick={() => handleApprove(m.id)}
                      className="flex-1"
                    >
                      <Check size={15} /> Approve
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => handleReject(m.id)}
                      className="flex-1 text-danger hover:bg-danger/10"
                    >
                      <X size={15} /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="relative">
          {team.banner && (
            <img
              src={team.banner}
              alt=""
              className="h-24 w-full object-cover sm:h-32"
            />
          )}
          {!team.banner && (
            <div className="h-24 bg-gradient-to-br from-brand-600/30 to-transparent sm:h-32" />
          )}
          <div className="absolute inset-x-0 -bottom-10 flex justify-center sm:-bottom-12">
            {team.logo && (
              <img
                src={team.logo}
                alt=""
                className="h-20 w-20 rounded-2xl border-4 border-bg-panel bg-bg-deep shadow-xl sm:h-24 sm:w-24 sm:rounded-3xl"
              />
            )}
          </div>
        </div>
        <CardBody className="pt-14 text-center sm:pt-16">
          <h2 className="font-display text-xl font-bold uppercase text-white sm:text-2xl">
            {team.name}
          </h2>
          <p className="text-xs text-ink-faint sm:text-sm">
            {team.tag}
            {team.slogan && <span className="ml-2 italic">"{team.slogan}"</span>}
          </p>
          {isCaptain && (
            <div className="mt-3 flex justify-center">
              <Button size="sm" variant="secondary" onClick={copyInvite}>
                <Copy size={13} /> Copy invite link
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs: Roster / Chat */}
      <Tabs
        items={[
          { id: 'roster', label: 'Roster', count: approved.length },
          { id: 'chat', label: 'Team Chat' },
        ]}
        value={teamTab}
        onChange={setTeamTab}
      />

      {/* Roster tab */}
      {teamTab === 'roster' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Roster - {approved.length} members</CardTitle>
              <Crown size={14} className="text-amber-400" />
            </CardHeader>
            <CardBody>
              {!approved.length ? (
                <EmptyState icon={Swords} title="No approved members" />
              ) : (
                <ul className="space-y-2">
                  {approved.map(m => (
                    <TeamMemberRow
                      key={m.id}
                      member={m}
                      isCaptain={!!isCaptain}
                      isSelf={m.userId === user?.id}
                      isTeamCaptain={m.userId === team.captainId}
                      onRemove={() => handleRemove(m.id)}
                      onChangeRole={role => handleChangeRole(m.id, role)}
                      onTransfer={() => handleTransfer(m.userId)}
                    />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <div className="flex justify-center pt-2">
            <LeaveTeamButton
              teamName={team.name}
              isCaptain={!!isCaptain}
              hasOtherMembers={hasOtherMembers}
              onLeft={() => {
                void refetchTeam();
                void refetchMembers();
              }}
            />
          </div>
        </>
      )}

      {/* Chat tab */}
      {teamTab === 'chat' && <TeamChat teamId={team.id} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   JoinWithCodeCard — captain invite code entry
   ───────────────────────────────────────────── */
function JoinWithCodeCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      toast('WARNING', 'Invalid code', 'Codes are at least 4 characters');
      return;
    }

    setBusy(true);
    try {
      const team = await teamApi.byInvite(clean);
      if (!team) {
        toast('ERROR', 'Team not found', 'Check the code with your captain');
        setBusy(false);
        return;
      }
      await teamApi.join(team.id, user.id, clean);
      toast('SUCCESS', 'Request sent', 'Waiting for captain approval');
      setCode('');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast(
        'ERROR',
        'Cannot join',
        err instanceof Error ? err.message : 'Unknown',
      );
    } finally {
      setBusy(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\/team\/join\/([A-Z0-9]+)/i);
      setCode(match ? match[1].toUpperCase() : text.trim().toUpperCase());
    } catch {
      toast('WARNING', 'Cannot read clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join with code</CardTitle>
        <Swords size={14} className="text-brand-400" />
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-ink-muted">
          Enter the invite code from your captain to join their team.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Invite code
              <span className="ml-1 text-ink-faint">(example: LFNQK42C)</span>
            </label>
            <div className="relative">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="ABC12345"
                maxLength={12}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-line bg-bg-deep/60 px-3.5 py-3 pr-20 font-mono text-base font-bold uppercase tracking-wider text-white placeholder:text-ink-faint/70 focus:border-brand-600/70 focus:outline-none focus:ring-2 focus:ring-brand-600/25"
              />
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-line bg-white/[.04] px-2.5 py-1.5 text-[10px] font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-white"
              >
                Paste
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={busy}
            disabled={code.trim().length < 4}
          >
            <Check size={15} /> Find &amp; join team
          </Button>
        </form>

        <p className="rounded-lg border border-line bg-bg-deep/40 p-2.5 text-[11px] leading-relaxed text-ink-faint">
          <AlertCircle size={11} className="mr-1 inline text-brand-400" />
          The captain will need to approve your request before you appear on
          the roster.
        </p>
      </CardBody>
    </Card>
  );
}
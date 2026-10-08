import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function TeamJoinPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: team, loading } = useAsync(
    () => code ? teamApi.byInvite(code) : Promise.resolve(undefined),
    [code],
  );

  const { data: membership } = useAsync(
    () => (team && user) ? teamApi.members(team.id).then(members =>
      members.find(m => m.userId === user.id)
    ) : Promise.resolve(undefined),
    [team?.id, user?.id],
  );

  const { data: myTeam } = useAsync(
    () => user ? teamApi.byUser(user.id) : Promise.resolve(undefined),
    [user?.id],
  );

  if (loading) {
    return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={Users}
          title="Invalid invite link"
          description="Ask your captain for a fresh invite code."
        />
      </div>
    );
  }

  const isMember = membership?.status === 'APPROVED';
  const isPending = membership?.status === 'PENDING';
  const isInOtherTeam = myTeam && myTeam.id !== team.id;

  const join = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/team/join/' + code } });
      return;
    }
    try {
      await teamApi.join(team.id, user.id, code);
      toast('SUCCESS', 'Join request sent', 'Your captain will review it.');
      navigate('/my-team');
    } catch (err) {
      toast('ERROR', 'Cannot join', err instanceof Error ? err.message : 'Unknown');
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardBody className="pt-6 text-center">
          {team.logo && (
            <img
              src={team.logo}
              alt=""
              className="mx-auto h-20 w-20 rounded-2xl border border-line"
            />
          )}
          <p className="mt-4 text-xs font-mono uppercase tracking-wider text-brand-400">
            {team.tag}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">
            {team.name}
          </h1>
          {team.slogan && (
            <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>
          )}

          {/* State-specific message */}
          {isMember ? (
            <div className="mt-6 rounded-xl border border-success/40 bg-success/[.06] p-4">
              <CheckCircle2 size={24} className="mx-auto text-success" />
              <p className="mt-2 text-sm font-semibold text-success">
                You are already a member of this team
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Open My Team to view your roster and matches.
              </p>
              <Button className="mt-4" onClick={() => navigate('/my-team')}>
                Go to My Team <ArrowRight size={14} />
              </Button>
            </div>
          ) : isPending ? (
            <div className="mt-6 rounded-xl border border-warning/40 bg-warning/[.06] p-4">
              <Clock size={24} className="mx-auto text-warning" />
              <p className="mt-2 text-sm font-semibold text-warning">
                Your request is pending approval
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                The captain will review it soon.
              </p>
              <Button variant="secondary" className="mt-4" onClick={() => navigate('/my-team')}>
                View my team
              </Button>
            </div>
          ) : isInOtherTeam ? (
            <div className="mt-6 rounded-xl border border-danger/40 bg-danger/[.06] p-4">
              <XCircle size={24} className="mx-auto text-danger" />
              <p className="mt-2 text-sm font-semibold text-danger">
                You are already in another team
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                You are currently in <strong className="text-white">{myTeam?.name}</strong>.
                Leave it first to join this team.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/my-team')}>
                  My Team
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink-muted">
                You have been invited to join this team.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button size="lg" onClick={join}>
                  {user ? 'Join Team' : 'Login to join'}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => navigate(-1)}>
                  Decline
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

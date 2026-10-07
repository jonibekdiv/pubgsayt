import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAsync } from '@/hooks/useAsync';
import { teamApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function TeamJoinPage() {
  const { code } = useParams<{ code:string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: team, loading } = useAsync(() => code ? teamApi.byInvite(code) : Promise.resolve(undefined), [code]);

  if (loading) return <div className="p-12 text-center text-ink-faint">Loading...</div>;
  if (!team) return <div className="mx-auto max-w-lg">
    <EmptyState icon={Users} title="Invalid invite link" description="Ask your captain for a fresh invite code."/>
  </div>;

  const join = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await teamApi.join(team.id, user.id, code);
      toast('SUCCESS', 'Join request sent', 'Your captain will review it.');
      navigate('/teams/' + team.id);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    }
  };

  return <div className="mx-auto max-w-lg">
    <Card>
      <CardBody className="pt-6 text-center">
        {team.logo && <img src={team.logo} alt="" className="mx-auto h-20 w-20 rounded-2xl border border-line"/>}
        <p className="mt-4 text-xs font-mono uppercase tracking-wider text-brand-400">{team.tag}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">{team.name}</h1>
        {team.slogan && <p className="mt-1 text-sm italic text-ink-muted">"{team.slogan}"</p>}
        <p className="mt-4 text-sm text-ink-muted">You have been invited to join this team.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" onClick={join}>Join Team</Button>
          <Button size="lg" variant="ghost" onClick={() => navigate(-1)}>Decline</Button>
        </div>
      </CardBody>
    </Card>
  </div>;
}
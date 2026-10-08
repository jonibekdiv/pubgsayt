import { useState } from 'react';
import { LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';

export function LeaveTeamButton({ teamName, isCaptain, hasOtherMembers, onLeft }: {
  teamName: string;
  isCaptain: boolean;
  hasOtherMembers: boolean;
  onLeft?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await teamApi.leaveTeam(user.id);
      toast('SUCCESS', isCaptain && !hasOtherMembers ? 'Team dissolved' : 'You left the team');
      setOpen(false);
      onLeft?.();
      navigate('/my-team');
    } catch (e) {
      toast('ERROR', 'Cannot leave', e instanceof Error ? e.message : 'Unknown');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const willDissolve = isCaptain && !hasOtherMembers;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="w-full text-danger hover:bg-danger/10 sm:w-auto">
        <LogOut size={13} /> Leave team
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={willDissolve ? 'Dissolve team' : 'Leave team'}
        description={teamName}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handle} loading={busy}>
              <Trash2 size={13} /> {willDissolve ? 'Dissolve' : 'Leave'}
            </Button>
          </>
        }
      >
        {willDissolve ? (
          <p className="text-sm text-ink-muted">
            You are the only member. Leaving will <strong className="text-danger">permanently dissolve</strong> {teamName}.
          </p>
        ) : isCaptain ? (
          <p className="text-sm text-ink-muted">
            You are the captain. Transfer captain role to another member before leaving.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            Are you sure you want to leave <strong className="text-white">{teamName}</strong>?
          </p>
        )}
      </Modal>
    </>
  );
}
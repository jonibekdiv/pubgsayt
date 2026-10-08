import { useState } from 'react';
import { Crown, MoreVertical, Shield, Trash2, UserMinus, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import type { TeamMember, TeamMemberRole, PublicUser } from '@/types';

interface Props {
  member: TeamMember & { user: PublicUser };
  isCaptain: boolean;
  isSelf: boolean;
  isTeamCaptain: boolean;
  onRemove?: () => void;
  onChangeRole?: (role: TeamMemberRole) => void;
  onTransfer?: () => void;
}

export function TeamMemberRow({ member, isCaptain, isSelf, isTeamCaptain, onRemove, onChangeRole, onTransfer }: Props) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const showMenu = isCaptain && !isTeamCaptain && !isSelf;

  return (
    <li className={cn(
      'flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg-deep/40 p-3 transition sm:flex-nowrap',
      isSelf && 'ring-1 ring-brand-600/30',
    )}>
      <Avatar src={member.user.avatar} name={member.user.fullName} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
          {member.user.fullName}
          {isTeamCaptain && <Crown size={12} className="text-amber-400" />}
          {isSelf && <span className="text-[10px] font-normal text-brand-400">(you)</span>}
        </p>
        <p className="truncate text-xs text-ink-faint">@{member.user.username}</p>
      </div>

      <span className={cn(
        'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        isTeamCaptain
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          : member.role === 'MANAGER'
            ? 'border-brand-600/40 bg-brand-600/10 text-brand-400'
            : member.role === 'SUBSTITUTE'
              ? 'border-line bg-white/[.05] text-ink-faint'
              : 'border-brand-600/30 bg-brand-600/10 text-brand-400',
      )}>
        {member.role}
      </span>

      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white/[.04] px-2.5 py-2 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-white"
              aria-label="Member actions"
            >
              <MoreVertical size={14} />
              <span className="hidden sm:inline">Manage</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onTransfer}>
              <Crown size={15} /> Make captain
            </DropdownMenuItem>
            {onChangeRole && (
              <>
                <DropdownMenuItem onClick={() => onChangeRole('PLAYER')}>
                  <Shield size={15} /> Set as Player
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole('SUBSTITUTE')}>
                  <Users size={15} /> Set as Substitute
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChangeRole('MANAGER')}>
                  <Shield size={15} /> Set as Manager
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem danger onClick={() => setRemoveOpen(true)}>
              <UserMinus size={15} /> Remove from team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Modal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove member"
        description={member.user.fullName}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onRemove?.(); setRemoveOpen(false); }}>
              <Trash2 size={13} /> Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to remove <strong className="text-white">{member.user.fullName}</strong> from the team?
        </p>
      </Modal>
    </li>
  );
}
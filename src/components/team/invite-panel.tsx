import { useState } from 'react';
import {
  Check, Copy, Hash, Link2, MessageCircle, Send, Share2,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface Props {
  teamName: string;
  inviteCode: string;
}

export function InvitePanel({ teamName, inviteCode }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const fullLink = typeof window !== 'undefined'
    ? window.location.origin + '/team/join/' + inviteCode
    : '/team/join/' + inviteCode;

  const copy = async (value: string, kind: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast('SUCCESS', kind === 'link' ? 'Link copied' : 'Code copied');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast('ERROR', 'Cannot copy');
    }
  };

  const shareText = 'Join ' + teamName + ' on Ranger Esports!\n\nLink: ' + fullLink + '\nCode: ' + inviteCode;

  const shareVia = (channel: 'telegram' | 'whatsapp' | 'sms') => {
    let url = '';
    const enc = encodeURIComponent(shareText);
    if (channel === 'telegram') url = 'https://t.me/share/url?url=' + encodeURIComponent(fullLink) + '&text=' + encodeURIComponent('Join ' + teamName + ' on Ranger Esports! Code: ' + inviteCode);
    if (channel === 'whatsapp') url = 'https://wa.me/?text=' + enc;
    if (channel === 'sms') url = 'sms:?&body=' + enc;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite players</CardTitle>
        <Share2 size={14} className="text-brand-400" />
      </CardHeader>
      <CardBody className="space-y-3">

        {/* Full link */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <Link2 size={11} /> Invite link
            </p>
          </div>
          <div className="flex items-stretch gap-1.5">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line bg-bg-deep px-3 py-2.5">
              <span className="truncate font-mono text-[11px] text-brand-400">
                {fullLink}
              </span>
            </div>
            <button
              onClick={() => copy(fullLink, 'link')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition active:scale-95',
                copied === 'link'
                  ? 'border-success/40 bg-success/15 text-success'
                  : 'border-line bg-white/[.04] text-ink-muted hover:border-brand-600/40 hover:text-white',
              )}
              aria-label="Copy link"
            >
              {copied === 'link' ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied === 'link' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Short code */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <Hash size={11} /> Invite code
            </p>
            <p className="text-[10px] text-ink-faint/70">Share this with players to type manually</p>
          </div>
          <div className="flex items-stretch gap-1.5">
            <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-brand-600/30 bg-gradient-to-br from-brand-700/20 to-bg-deep px-3 py-3">
              <span className="font-mono text-lg font-bold uppercase tracking-[.25em] text-white sm:text-xl">
                {inviteCode}
              </span>
            </div>
            <button
              onClick={() => copy(inviteCode, 'code')}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition active:scale-95',
                copied === 'code'
                  ? 'border-success/40 bg-success/15 text-success'
                  : 'border-line bg-white/[.04] text-ink-muted hover:border-brand-600/40 hover:text-white',
              )}
              aria-label="Copy code"
            >
              {copied === 'code' ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied === 'code' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="border-t border-line pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Share via
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => shareVia('telegram')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-bg-deep/40 px-3 py-2.5 text-xs font-semibold text-ink-muted transition active:scale-95 hover:border-brand-600/40 hover:text-white"
            >
              <Send size={12} /> Telegram
            </button>
            <button
              onClick={() => shareVia('whatsapp')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-bg-deep/40 px-3 py-2.5 text-xs font-semibold text-ink-muted transition active:scale-95 hover:border-success/40 hover:text-white"
            >
              <MessageCircle size={12} /> WhatsApp
            </button>
            <button
              onClick={() => copy(shareText, 'link')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-bg-deep/40 px-3 py-2.5 text-xs font-semibold text-ink-muted transition active:scale-95 hover:border-brand-600/40 hover:text-white"
            >
              <Share2 size={12} /> Copy all
            </button>
          </div>
        </div>

        <p className="rounded-lg border border-line bg-bg-deep/40 p-2.5 text-[10px] leading-relaxed text-ink-faint">
          Players can use either the link (opens the join page) or the code (type manually on My Team page).
          Captain approval is required.
        </p>
      </CardBody>

      {/* Hidden toggle — keep compatibility */}
      <button className="hidden" onClick={() => setShareOpen(!shareOpen)} />
    </Card>
  );
}

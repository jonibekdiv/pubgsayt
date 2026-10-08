import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Smile, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync } from '@/hooks/useAsync';
import { chatApi } from '@/services/api';
import { cn, relativeTime, initials } from '@/lib/utils';
import type { ChatMessage } from '@/types';

const POLL_MS = 3000;
const MAX_CHARS = 500;

export function TeamChat({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, refetch } = useAsync(() => chatApi.forTeam(teamId), [teamId]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data ?? [];

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (near) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const t = window.setInterval(() => { void refetch(); }, POLL_MS);
    return () => window.clearInterval(t);
  }, [refetch]);

  useEffect(() => {
    const onFocus = () => { void refetch(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  const send = async () => {
    if (!user || !text.trim() || busy) return;
    const value = text.trim();
    setText('');
    setBusy(true);
    try {
      await chatApi.send(teamId, user.id, value);
      await refetch();
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    } catch (e) {
      toast('ERROR', 'Failed to send', e instanceof Error ? e.message : 'Unknown');
      setText(value);
    } finally {
      setBusy(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const remove = async (msg: ChatMessage) => {
    if (!user) return;
    if (!confirm('Delete this message?')) return;
    try {
      await chatApi.deleteMessage(msg.id, user.id);
      toast('SUCCESS', 'Message deleted');
      void refetch();
    } catch (e) {
      toast('ERROR', 'Cannot delete', e instanceof Error ? e.message : 'Unknown');
    }
  };

  const emojis = ['👍', '🔥', '😂', '😮', '😢', '❤️', '💪', '🎯', '🏆', '🤌'];

  const insertEmoji = (emoji: string) => {
    setText(prev => (prev + emoji).slice(0, MAX_CHARS));
    setShowEmoji(false);
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-line bg-bg-panel/60 sm:h-[640px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
          <MessageCircle size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-white">
            Team Chat
          </p>
          <p className="text-[10px] text-ink-faint">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'} · auto 3s
          </p>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-success" />
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[.04] text-ink-faint">
              <MessageCircle size={22} />
            </div>
            <p className="mt-4 font-display text-sm font-semibold text-white">
              No messages yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-ink-faint">
              Start the conversation with your team.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const isMe = user?.id === m.userId;
              const showAvatar = i === 0 || messages[i - 1]?.userId !== m.userId;
              const prevTime = i > 0 ? new Date(messages[i - 1].createdAt).getTime() : 0;
              const currTime = new Date(m.createdAt).getTime();
              const showTime = currTime - prevTime > 300000;

              return (
                <div key={m.id}>
                  {showTime && (
                    <p className="my-3 text-center text-[10px] uppercase tracking-wider text-ink-faint/70">
                      {new Date(m.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {relativeTime(m.createdAt)}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={cn('flex gap-2', isMe && 'flex-row-reverse')}
                  >
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-600/20 text-brand-400">
                          {m.userAvatar ? (
                            <img src={m.userAvatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-display text-[10px] font-bold">
                              {initials(m.userName)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        'group relative max-w-[75%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%]',
                        isMe
                          ? 'rounded-tr-md bg-brand-600/25 text-white'
                          : 'rounded-tl-md border border-line bg-bg-deep/70 text-ink-muted',
                      )}
                    >
                      {showAvatar && !isMe && (
                        <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-wider text-brand-400">
                          {m.userName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {m.text}
                      </p>

                      <div
                        className={cn(
                          'absolute -top-2 flex gap-1 opacity-0 transition group-hover:opacity-100',
                          isMe ? 'right-0 translate-x-full pl-1' : 'left-0 -translate-x-full pr-1',
                        )}
                      >
                        <button
                          onClick={() => remove(m)}
                          className="rounded-md bg-bg-panel p-1 text-ink-faint shadow-lg transition hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="border-t border-line bg-bg-deep/60 px-3 py-2"
          >
            <div className="flex flex-wrap gap-1">
              {emojis.map(e => (
                <button
                  key={e}
                  onClick={() => insertEmoji(e)}
                  className="rounded-lg p-2 text-xl transition hover:bg-white/[.06] active:scale-90"
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-line bg-bg-deep/40 p-3">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji(v => !v)}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
              showEmoji
                ? 'bg-brand-600/20 text-brand-400'
                : 'text-ink-faint hover:bg-white/5 hover:text-white',
            )}
            aria-label="Emoji"
          >
            <Smile size={18} />
          </button>

          <div className="relative flex-1">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKey}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              className="w-full resize-none rounded-xl border border-line bg-bg-deep/60 px-3 py-2.5 text-sm text-white placeholder:text-ink-faint/70 focus:border-brand-600/60 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
          </div>

          <Button
            size="icon"
            onClick={send}
            disabled={!text.trim() || busy}
            loading={busy}
            className="h-10 w-10 shrink-0"
          >
            <Send size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
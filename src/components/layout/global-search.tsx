import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Trophy, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { searchApi } from '@/services/api';
import type { SearchResults } from '@/types';

const EMPTY: SearchResults = { users:[], teams:[], tournaments:[] };

export function GlobalSearch({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const navigate = useNavigate();

  useEffect(() => { if (!open) { setQ(''); setRes(EMPTY); } }, [open]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setRes(EMPTY); return; }
      setRes(await searchApi.query(q));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (p:string) => { navigate(p); onClose(); };
  const has = res.users.length + res.teams.length + res.tournaments.length > 0;

  return <Modal open={open} onClose={onClose} title="Search" description="Find users, teams, tournaments">
    <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type at least 2 characters..." className="mb-4"/>
    <div className="max-h-80 space-y-4 overflow-y-auto">
      {!has && q.length >= 2 && <p className="py-6 text-center text-sm text-ink-faint">
        <Search size={16} className="mx-auto mb-2 opacity-50"/>No results
      </p>}
      <Section icon={Trophy} title="Tournaments"
        items={res.tournaments.map(t => ({ key:t.id, label:t.name, sub:t.shortName, path:'/tournaments/' + t.id }))}
        onSelect={go}/>
      <Section icon={Users} title="Teams"
        items={res.teams.map(t => ({ key:t.id, label:t.name, sub:t.tag, path:'/teams/' + t.id }))}
        onSelect={go}/>
      <Section icon={Shield} title="Users"
        items={res.users.map(u => ({ key:u.id, label:u.fullName, sub:'@' + u.username, path:'/profile' }))}
        onSelect={go}/>
    </div>
  </Modal>;
}

function Section({ icon:Icon, title, items, onSelect }:
  { icon:typeof Search; title:string; items:{key:string;label:string;sub?:string;path:string}[]; onSelect:(p:string)=>void }) {
  if (!items.length) return null;
  return <div>
    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-ink-faint">
      <Icon size={11}/> {title}
    </p>
    <ul className="space-y-0.5">
      {items.map(i => (
        <li key={i.key}>
          <button onClick={() => onSelect(i.path)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-white/[.06]">
            <span className="truncate text-sm text-white">{i.label}</span>
            {i.sub && <span className="ml-2 shrink-0 text-xs text-ink-faint">{i.sub}</span>}
          </button>
        </li>
      ))}
    </ul>
  </div>;
}
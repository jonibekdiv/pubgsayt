import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { RequireAuth } from '@/components/common/require-auth';
import { useAsync } from '@/hooks/useAsync';
import { roleApi } from '@/services/api';
import { PERMISSION_CATALOG } from '@/lib/permissions';
import { useToast } from '@/context/ToastContext';

export function AdminRoles() {
  return <RequireAuth permission="roles.view"><Inner/></RequireAuth>;
}

function Inner() {
  const { data, refetch } = useAsync(() => roleApi.list(), []);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (p:string) => setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);

  const save = async () => {
    if (!name || !key) { toast('WARNING', 'Name and key required'); return; }
    try {
      await roleApi.create({ key, name, description:'Custom role', permissions:selected });
      toast('SUCCESS', 'Role created');
      setOpen(false);
      void refetch();
      setName(''); setKey(''); setSelected([]);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    }
  };

  return <div>
    <PageHeader title="Roles & Permissions" subtitle="Manage role definitions"
      action={<Button onClick={() => setOpen(true)}>New role</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(data ?? []).map(r => (
        <Card key={r.id}>
          <CardHeader>
            <div>
              <CardTitle>{r.name}</CardTitle>
              <p className="mt-1 font-mono text-[10px] text-ink-faint">{r.key}</p>
            </div>
            {r.system && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">SYSTEM</span>}
          </CardHeader>
          <CardBody>
            <p className="text-xs text-ink-muted">{r.description}</p>
            <p className="mt-3 text-xs text-ink-faint">{r.permissions.length} permissions</p>
          </CardBody>
        </Card>
      ))}
    </div>

    <Modal open={open} onClose={() => setOpen(false)} title="Create Role" className="sm:max-w-2xl"
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Role name" required>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Moderator"/>
          </Field>
          <Field label="Role key" required>
            <Input value={key} onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))} placeholder="MODERATOR"/>
          </Field>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-xl border border-line p-3">
          {PERMISSION_CATALOG.map(g => (
            <div key={g.group} className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{g.group}</p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {g.items.map(p => (
                  <label key={p.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/[.04]">
                    <input type="checkbox" checked={selected.includes(p.key)} onChange={() => toggle(p.key)}
                      className="h-3.5 w-3.5 rounded border-line bg-bg-deep"/>
                    <span className="text-ink-muted">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  </div>;
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import { RequireAuth } from '@/components/common/require-auth';

export function TeamCreatePage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name:'', tag:'', slogan:'', description:'', country:'Uzbekistan', city:'Tashkent' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.name.length < 3 || form.tag.length < 2) {
      toast('WARNING', 'Validation', 'Name min 3 chars, tag min 2');
      return;
    }
    setBusy(true);
    try {
      const team = await teamApi.create({
        ...form,
        captainId: user.id,
        logo: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + form.tag + '-logo'
      });
      await refresh();
      toast('SUCCESS', 'Team created', team.name + ' is ready');
      navigate('/teams/' + team.id);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Create Team" subtitle="Start your squad and register for tournaments"/>
    <Card>
      <CardBody className="pt-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Team name" required>
            <Input value={form.name} onChange={e => setForm({ ...form, name:e.target.value })} placeholder="ALONE GAMERS" required/>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tag" required hint="2-4 characters">
              <Input value={form.tag} onChange={e => setForm({ ...form, tag:e.target.value.toUpperCase() })} maxLength={4} placeholder="AG" required/>
            </Field>
            <Field label="Slogan">
              <Input value={form.slogan} onChange={e => setForm({ ...form, slogan:e.target.value })} placeholder="Never Give Up"/>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country">
              <Input value={form.country} onChange={e => setForm({ ...form, country:e.target.value })}/>
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={e => setForm({ ...form, city:e.target.value })}/>
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Tell us about your team..."/>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={busy}><Shield size={14}/> Create team</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  </div>;
}
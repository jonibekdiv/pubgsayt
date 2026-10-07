import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { organizerApi } from '@/services/api';

export function OrganizerApplyPage() {
  return <RequireAuth><Inner/></RequireAuth>;
}

function Inner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    organizationName:'', description:'', experience:'', previousTournaments:'',
    phone:'', email: user?.email ?? ''
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await organizerApi.apply({
        userId:user.id, fullName:user.fullName, ...f, socials:{}
      });
      setDone(true);
      toast('SUCCESS', 'Application submitted');
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-2xl">
    <PageHeader title="Become an Organizer" subtitle="Host your own PUBG tournaments"/>
    <Card><CardBody className="pt-6">
      {done ? (
        <div className="py-8 text-center">
          <Building2 size={40} className="mx-auto text-brand-400"/>
          <p className="mt-3 font-display text-lg font-bold text-white">Application submitted</p>
          <p className="mt-1 text-sm text-ink-faint">You will be notified once reviewed.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Organization name" required>
            <Input value={f.organizationName} onChange={e => setF({ ...f, organizationName:e.target.value })} required/>
          </Field>
          <Field label="Description" required>
            <Textarea value={f.description} onChange={e => setF({ ...f, description:e.target.value })} required/>
          </Field>
          <Field label="Experience" required>
            <Textarea value={f.experience} onChange={e => setF({ ...f, experience:e.target.value })} required/>
          </Field>
          <Field label="Previous tournaments">
            <Input value={f.previousTournaments} onChange={e => setF({ ...f, previousTournaments:e.target.value })}/>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required>
              <Input value={f.phone} onChange={e => setF({ ...f, phone:e.target.value })} required/>
            </Field>
            <Field label="Email" required>
              <Input type="email" value={f.email} onChange={e => setF({ ...f, email:e.target.value })} required/>
            </Field>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Submit application</Button>
        </form>
      )}
    </CardBody></Card>
  </div>;
}
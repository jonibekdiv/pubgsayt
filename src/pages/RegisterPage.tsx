import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ fullName:'', username:'', email:'', phone:'', password:'', confirm:'' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) { toast('WARNING', 'Passwords do not match'); return; }
    if (f.password.length < 6) { toast('WARNING', 'Password too short', 'Minimum 6 characters'); return; }
    setBusy(true);
    try {
      await register({ fullName:f.fullName, username:f.username, email:f.email, phone:f.phone, password:f.password });
      toast('SUCCESS', 'Account created', 'Welcome to Ranger Esports!');
      navigate('/dashboard', { replace:true });
    } catch (err) {
      toast('ERROR', 'Registration failed', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={22} className="text-white"/>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-ink-faint">Join the Ranger community</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name" required>
            <Input value={f.fullName} onChange={e => setF({ ...f, fullName:e.target.value })} required/>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username" required>
              <Input value={f.username} onChange={e => setF({ ...f, username:e.target.value })} required/>
            </Field>
            <Field label="Phone" required>
              <Input value={f.phone} onChange={e => setF({ ...f, phone:e.target.value })} required/>
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" value={f.email} onChange={e => setF({ ...f, email:e.target.value })} required/>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Password" required>
              <Input type="password" value={f.password} onChange={e => setF({ ...f, password:e.target.value })} required/>
            </Field>
            <Field label="Confirm" required>
              <Input type="password" value={f.confirm} onChange={e => setF({ ...f, confirm:e.target.value })} required/>
            </Field>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </CardBody>
    </Card>
  </div>;
}
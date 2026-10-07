import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const DEMO = [
  { label:'Superadmin', email:'superadmin@example.com' },
  { label:'Organizer', email:'organizer@example.com' },
  { label:'Host', email:'host@example.com' },
  { label:'Captain', email:'captain@example.com' }
];

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(id, pwd);
      toast('SUCCESS', 'Signed in', 'Welcome back!');
      const state = loc.state as { from?:string } | null;
      navigate(state?.from ?? '/dashboard', { replace:true });
    } catch (err) {
      toast('ERROR', 'Login failed', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  const quick = (email:string) => { setId(email); setPwd('ChangeMe123!'); };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700">
            <Zap size={22} className="text-white"/>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-faint">Sign in to your Ranger account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Username or email" required>
            <Input value={id} onChange={e => setId(e.target.value)} required placeholder="captain@example.com"/>
          </Field>
          <Field label="Password" required>
            <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required placeholder="********"/>
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
        </form>
        <div className="mt-4 flex justify-between text-xs">
          <Link to="/forgot-password" className="text-brand-400 hover:underline">Forgot password?</Link>
          <Link to="/register" className="text-brand-400 hover:underline">Create account</Link>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-bg-deep/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-warning">DEVELOPMENT ONLY - one-click login</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map(d => (
              <button key={d.email} type="button" onClick={() => quick(d.email)}
                className="rounded-lg border border-line bg-white/[.03] px-2 py-1.5 text-[11px] text-ink-muted transition hover:border-brand-600/40 hover:text-white">
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-faint">Password: <span className="font-mono">ChangeMe123!</span></p>
        </div>
      </CardBody>
    </Card>
  </div>;
}
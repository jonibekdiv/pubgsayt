import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { authApi } from '@/services/api';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.resetPassword(email, 'ChangeMe123!');
      setDone(true);
      toast('SUCCESS', 'Password reset', 'Demo: password changed to ChangeMe123!');
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
    <Card className="w-full">
      <CardBody className="pt-8">
        <h1 className="text-center font-display text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-1 text-center text-sm text-ink-faint">Enter your email to reset</p>
        {done ? (
          <p className="mt-6 rounded-xl border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
            Password reset to ChangeMe123!
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={busy}>Reset password</Button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-ink-faint">
          <Link to="/login" className="text-brand-400 hover:underline">Back to login</Link>
        </p>
      </CardBody>
    </Card>
  </div>;
}
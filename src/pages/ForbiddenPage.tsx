import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="font-display text-7xl font-bold text-danger/30">403</p>
    <h1 className="mt-2 font-display text-2xl font-bold text-white">Access denied</h1>
    <p className="mt-2 max-w-sm text-sm text-ink-faint">You do not have permission to access this page.</p>
    <Link to="/dashboard" className="mt-6"><Button>Go to Dashboard</Button></Link>
  </div>;
}
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <p className="font-display text-7xl font-bold text-brand-600/30">404</p>
    <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
    <p className="mt-2 max-w-sm text-sm text-ink-faint">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-6"><Button>Go home</Button></Link>
  </div>;
}
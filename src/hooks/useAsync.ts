import { useCallback, useEffect, useRef, useState } from 'react';
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await fn(); if (mounted.current) setData(r); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Error'); }
    finally { if (mounted.current) setLoading(false); }
  }, deps);
  useEffect(() => { mounted.current = true; void run(); return () => { mounted.current = false; }; }, [run]);
  return { data, loading, error, refetch: run };
}
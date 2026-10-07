import { useEffect, useState } from 'react';
export function useCountUp(target: number, duration = 800): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const s = performance.now();
    const tick = (n: number) => {
      const p = Math.min((n - s) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}
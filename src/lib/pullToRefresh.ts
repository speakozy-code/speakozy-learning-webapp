import { useEffect, useRef, useState } from 'react';

/** Pull down at the top of the page to reload (installed PWAs have no browser refresh gesture). */
export function usePullToRefresh(threshold = 90) {
  const [dist, setDist] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    const main = () => document.getElementById('app-main');
    const atTop = () => (main()?.scrollTop || 0) <= 0 && window.scrollY <= 0;
    const onStart = (e: TouchEvent) => { start.current = atTop() ? e.touches[0].clientY : null; };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const d = e.touches[0].clientY - start.current;
      if (d > 0 && atTop()) setDist(Math.min(d, 140)); else setDist(0);
    };
    const onEnd = () => {
      if (start.current !== null && dist >= threshold) window.location.reload();
      start.current = null; setDist(0);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
  }, [dist, threshold]);
  return { active: dist > 20, ready: dist >= threshold };
}

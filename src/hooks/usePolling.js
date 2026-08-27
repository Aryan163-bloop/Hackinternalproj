import { useEffect, useRef } from 'react';

export function usePolling(callback, intervalMs = 2500, enabled = true) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        await saved.current();
      } catch {
        /* keep dashboard alive */
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
}

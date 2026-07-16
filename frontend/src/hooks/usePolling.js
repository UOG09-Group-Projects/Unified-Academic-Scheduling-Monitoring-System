import { useEffect, useRef } from 'react';

/**
 * Runs `callback` immediately and then every `intervalMs`, until unmounted
 * or `paused` is true. Used to fake "real time" sync via lightweight polling.
 */
export default function usePolling(callback, intervalMs, paused = false) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    const tick = () => { if (!cancelled) savedCallback.current(); };

    tick();
    const id = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, paused]);
}

import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const start = Date.now();
    let frame: ReturnType<typeof setTimeout>;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      setValue(current);

      if (t < 1) {
        frame = setTimeout(tick, 16);
      } else {
        fromRef.current = target;
      }
    };

    tick();
    return () => clearTimeout(frame);
  }, [target, durationMs]);

  return value;
}

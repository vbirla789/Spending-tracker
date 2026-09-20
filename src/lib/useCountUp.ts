import { useEffect, useRef, useState } from "react";

/**
 * Ease a displayed number toward a target.
 *
 * Money changing instantly reads as a different screen; easing it reads as the
 * same money being recalculated, which is what actually happened when you
 * switched range or month. Respects reduced-motion by snapping.
 */
export function useCountUp(target: number, duration = 420): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || duration === 0) {
      from.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    const origin = from.current;
    const delta = target - origin;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // cubic ease-out — fast arrival, soft settle
      const eased = 1 - Math.pow(1 - t, 3);
      const next = origin + delta * eased;
      setValue(next);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

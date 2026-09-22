import { useEffect, type RefObject } from "react";

/**
 * Mouse-drag panning for a horizontal rail.
 *
 * Touch already pans an `overflow-x: auto` box natively, but a mouse has no
 * gesture for it — a laptop without a trackpad simply cannot reach the
 * overflowed months. Grab-and-drag fills that hole; touch pointers are left
 * to the native scroller so the two never fight.
 *
 * A drag that actually moved suppresses the click it would otherwise end
 * with, so dragging across the month tiles doesn't also select one.
 */
export default function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      active = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const up = () => {
      active = false;
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("click", click, true);
    };
  }, [ref]);
}

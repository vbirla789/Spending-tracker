import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HABITS, RING_ORDER } from "../data";
import { donutArcs } from "../lib/chart";
import { rupees, sum } from "../lib/format";
import Money from "../lib/mask";

const SIZE = 167;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const GAP = 14;

/**
 * Category breakdown for one month.
 *
 * The centre figure is the sum of the arcs and each percentage is derived, so
 * the ring, the total and the legend cannot disagree. Arc sequence comes from
 * RING_ORDER — see the note there on why it isn't the legend order.
 */
export default function HabitsCard() {
  const [monthKey, setMonthKey] = useState(HABITS[0].key);
  const [open, setOpen] = useState(false);
  const month = HABITS.find((m) => m.key === monthKey) ?? HABITS[0];
  const popover = useRef<HTMLDivElement>(null);

  const total = sum(month.categories.map((c) => c.amount));

  const ring = RING_ORDER.map((key) => month.categories.find((c) => c.key === key)!).filter(
    Boolean,
  );
  const arcs = donutArcs(
    ring.map((c) => c.amount / total),
    RADIUS,
    STROKE,
    GAP,
  );

  // Dismiss the month menu on an outside tap or Escape — a popover that only
  // closes by re-tapping its trigger feels stuck on touch.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!popover.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="card-shadow w-full rounded-[12px] border border-hair bg-card">
      <div className="flex w-full flex-col gap-[16px] p-[16px]">
        <div className="flex w-full flex-col gap-[12px]">
          <div className="flex w-full items-center justify-between">
            <p className="font-mono text-[12px] font-semibold uppercase leading-[1.4] text-ink-dim">
              Habits
            </p>

            <div className="relative" ref={popover}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Month: ${month.label}. Change month`}
                className="flex items-center justify-center gap-[4px] rounded-[40px] border border-hair py-[6px] pl-[12px] pr-[8px] font-mono text-[12px] font-semibold uppercase leading-[1.4] tracking-[1px] text-black"
              >
                {month.label}
                <motion.img
                  src="/icons/chevron-right.svg"
                  alt=""
                  className="size-[16px]"
                  animate={{ rotate: open ? 270 : 90 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.ul
                    role="listbox"
                    className="card-shadow absolute right-0 top-[calc(100%+6px)] z-20 w-[104px] overflow-hidden rounded-[12px] border border-hair bg-white"
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {HABITS.map((m) => (
                      <li key={m.key}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={m.key === monthKey}
                          onClick={() => {
                            setMonthKey(m.key);
                            setOpen(false);
                          }}
                          className={[
                            "w-full px-[12px] py-[9px] text-left font-mono text-[12px] font-semibold uppercase leading-[1.4] tracking-[1px]",
                            m.key === monthKey ? "bg-hair text-black" : "text-ink-dim",
                          ].join(" ")}
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="h-px w-full bg-hair" />
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-[32px]">
          <div className="relative size-[167px] shrink-0">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="size-full"
              role="img"
              aria-label={`${rupees(total)} spent in ${month.label} across ${ring.length} categories`}
            >
              {/* -90 puts the first arc at 12 o'clock */}
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} fill="none">
                {ring.map((cat, i) => (
                  <motion.circle
                    key={cat.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={`var(${cat.token})`}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${arcs[i].dash} ${arcs[i].circumference - arcs[i].dash}`}
                    initial={false}
                    animate={{ strokeDashoffset: arcs[i].offset }}
                    transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                  />
                ))}
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[4px]">
              <Money
                value={total}
                className="tnum font-serif text-[28px] font-bold leading-[1.3] text-black"
              />
              <p className="font-mono text-[12px] font-semibold uppercase leading-[1.4] text-ink-dim">
                Spent in {month.label}
              </p>
            </div>
          </div>

          <ul className="flex w-full flex-col gap-[12px]">
            {month.categories.map((cat, i) => (
              <li key={cat.key} className="flex w-full flex-col gap-[12px]">
                {i > 0 && <div className="h-px w-full bg-hair" />}
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <div
                      className="size-[14px] shrink-0 rounded-[2px]"
                      style={{ background: `var(${cat.token})` }}
                    />
                    <p className="font-mono text-[12px] font-semibold uppercase leading-[1.4] tracking-[0.6px] text-black">
                      {cat.label}
                    </p>
                    <p className="tnum font-mono text-[12px] font-semibold uppercase leading-[1.4] text-ink-dim">
                      {Math.round((cat.amount / total) * 100)}%
                    </p>
                  </div>
                  <Money
                    value={cat.amount}
                    className="tnum font-serif text-[14px] font-bold leading-[1.3] text-black"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

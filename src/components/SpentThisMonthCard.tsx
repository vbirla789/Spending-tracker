import { useRef, useState } from "react";
import { SPEND_CURRENT, SPEND_PRIOR } from "../data";
import { project, smoothPath } from "../lib/chart";
import { rupees } from "../lib/format";
import Money from "../lib/mask";

const W = 303;
const H = 143;
const DAYS = SPEND_PRIOR.length; // full length of the prior month
/* Both series terminate in a 5px dot, so the plot area is inset by a little
   more than the radius. Without this the last marker is centred on the
   viewBox edge and renders as a half-circle. */
const INSET = 7;

/**
 * Cumulative spend this month against the same month last month.
 *
 * Both series are drawn on one shared scale — normalising them separately
 * would make a cheaper month look identical to an expensive one. The current
 * line stops at today, which is why it ends mid-chart with a dot while the
 * dashed prior line runs the full width.
 *
 * Drag across the chart to scrub: the headline figure and both dots follow the
 * pointer, so the comparison can be read at any day, not just today.
 */
export default function SpentThisMonthCard() {
  const svg = useRef<SVGSVGElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  /* Drag state is tracked here rather than read back from
     `hasPointerCapture`. Capture is still requested so the gesture survives
     the pointer leaving the chart, but it isn't the source of truth — it
     reports false for synthetic events, which silently killed scrubbing. */
  const dragging = useRef(false);

  // One ceiling for both series. Prior runs the whole month so it sets it.
  const max = Math.max(...SPEND_PRIOR, ...SPEND_CURRENT);
  const axis = { min: 0, max, padTop: 10, padBottom: 8, padLeft: INSET, padRight: INSET };
  const priorPts = project(SPEND_PRIOR, W, H, axis);
  // The current month covers only the days elapsed. Sharing the prior month's
  // domain puts day N of this month directly above day N of last month —
  // stretching it to full width would align the wrong days.
  const currentPts = project(SPEND_CURRENT, W, H, { ...axis, domain: DAYS });

  const todayPt = currentPts[currentPts.length - 1];
  const priorEnd = priorPts[priorPts.length - 1];

  const activeIndex = scrub ?? SPEND_CURRENT.length - 1;
  const headline = SPEND_CURRENT[Math.min(activeIndex, SPEND_CURRENT.length - 1)];
  const currentDot = currentPts[Math.min(activeIndex, currentPts.length - 1)];
  const priorDot = priorPts[Math.min(activeIndex, priorPts.length - 1)];

  function pick(clientX: number) {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    // Map against the inset plot area, not the whole element, so dragging to
    // the far edge lands on the last day rather than overshooting past it.
    const scale = rect.width / W;
    const x = clientX - rect.left - INSET * scale;
    const ratio = Math.min(1, Math.max(0, x / (rect.width - 2 * INSET * scale)));
    // Clamp to days elapsed — there is no "this month" data past today, and
    // letting the scrubber run into the future would read as a flat line.
    setScrub(Math.round(ratio * (DAYS - 1)));
  }

  return (
    <section className="card-shadow w-full rounded-[12px] border border-hair bg-card">
      <div className="flex w-full flex-col gap-[16px] p-[16px]">
        <div className="flex w-full flex-col gap-[12px]">
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
            Spent this month
          </p>
          <div className="h-px w-full bg-hair" />
        </div>

        <Money
          value={headline}
          className="tnum font-serif text-[28px] font-semibold leading-[1.3] text-black"
        />

        <div className="flex w-full flex-col gap-[10px]">
          <svg
            ref={svg}
            viewBox={`0 0 ${W} ${H}`}
            /* Uniform scaling, not `preserveAspectRatio="none"`. Stretching
               the viewBox squashed the end-of-series dots into ovals — the
               grey one read as a clipped smear against the card edge. */
            className="block h-auto w-full touch-none"
            role="img"
            aria-label={`Spent ${rupees(headline)} so far this month, against last month`}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              pick(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging.current) pick(e.clientX);
            }}
            onPointerUp={() => {
              dragging.current = false;
              setScrub(null);
            }}
            onPointerCancel={() => {
              dragging.current = false;
              setScrub(null);
            }}
            onPointerLeave={() => {
              // Capture normally keeps the drag alive, but if it was never
              // granted the gesture must still end when the pointer exits.
              if (!svg.current?.hasPointerCapture?.(1)) {
                dragging.current = false;
                setScrub(null);
              }
            }}
          >
            {/* last month — dashed ghost, full width */}
            <path
              d={smoothPath(priorPts)}
              fill="none"
              stroke="var(--color-series-prior)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            {/* this month — solid, stops at today */}
            <path
              d={smoothPath(currentPts)}
              fill="none"
              stroke="var(--color-series-current)"
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {scrub !== null && (
              <line
                x1={priorDot.x}
                y1={0}
                x2={priorDot.x}
                y2={H}
                stroke="var(--color-hair)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}

            <circle cx={priorEnd.x} cy={priorEnd.y} r={5} fill="var(--color-series-prior)" />
            <circle
              cx={scrub === null ? todayPt.x : currentDot.x}
              cy={scrub === null ? todayPt.y : currentDot.y}
              r={5}
              fill="var(--color-series-current)"
            />
          </svg>

          <div className="h-px w-full bg-hair" />

          <div className="flex w-full justify-between pr-[8px] font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
            {["01", "08", "15", "22", "29"].map((d) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </div>

        <div className="flex gap-[24px]">
          <Legend color="var(--color-series-current)" label="Sep" strong />
          <Legend color="var(--color-series-prior)" label="Aug" />
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label, strong }: { color: string; label: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-[8px]">
      <div className="size-[10px] shrink-0 rounded-full" style={{ background: color }} />
      <p
        className="font-mono text-[12px] font-medium uppercase leading-[1.4]"
        style={{ color: strong ? color : "var(--color-ink-dim)" }}
      >
        {label}
      </p>
    </div>
  );
}

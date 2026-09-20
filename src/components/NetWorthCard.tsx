import { motion } from "framer-motion";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { NET_WORTH, RANGES, type Range } from "../data";
import { areaPath, polyPath, project } from "../lib/chart";
import { percent, rupees, signedRupees } from "../lib/format";
import Money from "../lib/mask";
import Pill from "./Pill";

const H = 170;
/**
 * Horizontal room per data point. Sets how far the chart runs past the screen
 * — at 20px even the shortest window (1M, 30 points) is 600px wide against a
 * ~365px viewport, so every range has somewhere to pan to. At the Figma's
 * ~13px the month barely overflowed and the gesture felt broken.
 */
const PX_PER_POINT = 20;
/** Floor, so a short series still overflows enough to be worth dragging. */
const MIN_W = 600;

/**
 * Net worth over a selectable window.
 *
 * The delta and its percentage are derived from the visible series — switch to
 * 3Y and the headline change recalculates, because a "+₹800 (5.5%)" that never
 * moves when the window does is decoration.
 *
 * The plot is wider than the screen and pans horizontally, so a long window
 * keeps its day-to-day detail instead of being compressed into a squiggle.
 */
export default function NetWorthCard() {
  const [range, setRange] = useState<Range>("1M");
  const gradientId = useId();
  const scroller = useRef<HTMLDivElement>(null);

  const series = NET_WORTH[range];
  const first = series[0];
  const last = series[series.length - 1];
  const delta = last - first;
  const pct = (delta / first) * 100;

  const W = Math.max(MIN_W, series.length * PX_PER_POINT);
  // A little headroom above the peak so the line never touches the card edge.
  const points = project(series, W, H, { padTop: 14, padBottom: 2 });

  /* Open on the right edge — today is the part anyone wants first, and the
     rest is history you choose to go back through. Layout effect so the jump
     happens before paint rather than as a visible scroll. */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [range]);

  return (
    <section className="flex w-full flex-col rounded-[12px]" aria-labelledby="nw-label">
      <div className="flex w-full flex-col gap-[8px] py-[8px]">
        <p
          id="nw-label"
          className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
        >
          Net worth
        </p>
        <Money
          value={last}
          className="tnum font-serif text-[32px] font-semibold leading-[1.3] text-black"
        />
        <div
          className={[
            "tnum flex items-center gap-[4px] font-mono text-[14px] font-medium leading-[1.4]",
            delta >= 0 ? "text-gain" : "text-cat-grocery",
          ].join(" ")}
        >
          <Money value={delta} signed />
          {/* The percentage stays visible while hidden — it gives no absolute
              figure away, and something has to remain legible or the row
              collapses to a row of dots. */}
          <p>({percent(Math.abs(pct))})</p>
        </div>
      </div>

      {/* Full-bleed pan rail: the plot escapes the 20px page gutter entirely
          and scrolls, so it reads as a continuous timeline rather than a
          chart cropped to fit. */}
      <div
        ref={scroller}
        className="rail -mx-[20px] w-[calc(100%+40px)] overflow-x-auto"
        role="group"
        aria-label={`Net worth chart, ${range}. Scroll horizontally to pan through time.`}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="block"
          role="img"
          aria-label={`Net worth ${rupees(last)}, ${signedRupees(delta)} over ${range}`}
        >
          <defs>
            {/* Alpha stops measured off the Figma export (0.47 at the top,
                0.32 at 22%, 0.135 at 55%), except the mid stop is held a
                little higher so the wash still reaches the range pills — a
                straight falloff left the bottom of the box empty and the
                pills read as a detached row. */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3648C9" stopOpacity="0.47" />
              <stop offset="55%" stopColor="#3648C9" stopOpacity="0.2" />
              {/* fades out against the canvas — keep in step with
                  --color-canvas, which SVG can't read from a CSS variable */}
              <stop offset="100%" stopColor="#FAFAFC" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* keyed on range so the path re-mounts and re-draws on switch */}
          <motion.path
            key={`${range}-area`}
            d={areaPath(points, H)}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32 }}
          />
          <motion.path
            key={`${range}-line`}
            /* Straight segments, not a curve — the day-to-day jaggedness is
               the character of the Figma chart and smoothing it away made the
               line look invented. */
            d={polyPath(points)}
            fill="none"
            stroke="#3648C9"
            strokeWidth={1.5}
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
      </div>

      {/* Six pills don't fit 375px, so they ride a scroll rail rather than
          wrapping — wrapping would shift the card height per breakpoint.

          Full-bleed with the page gutter re-applied as padding, same as the
          month tiles: at rest the first pill lines up with the content above
          it, but the row runs clean off both screen edges once you scroll
          rather than stopping short of them. */}
      <div
        className="rail -mx-[20px] flex w-[calc(100%+40px)] gap-[12px] overflow-x-auto px-[20px] pt-[2px]"
        role="tablist"
        aria-label="Net worth range"
      >
        {RANGES.map((r) => (
          <Pill key={r} role="tab" selected={r === range} onClick={() => setRange(r)}>
            {/* fixed 51px pill from the Figma, so the six of them overflow the
                gutter by exactly as much as they do in the file */}
            <span className="block w-[29px] text-center">{r}</span>
          </Pill>
        ))}
      </div>
    </section>
  );
}

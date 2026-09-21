import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AUG_DAILY, CASH_FLOW, DAILY_SPEND, HABITS } from "../data";
import { rupees, sum } from "../lib/format";
import Money from "../lib/mask";

/**
 * The interactive bodies of Sonar's answers.
 *
 * The agent's claim is that its answers are derived from your data — these
 * make the derivation itself the interface. Move the slider and the numbers
 * recompute in front of you; the chart is the working, not an illustration
 * of it. Inspired by Figma 1500:199455 (the proportion bar and the
 * month-against-month line card).
 */

export type AgentWidget =
  | { kind: "whatif"; catKey: string }
  | { kind: "monthline" }
  | { kind: "flowbar" };

const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number];

/* ================================================================== */
/* What-if — a cut you can drag                                        */

/**
 * The simulation answer, with the percentage on a slider instead of fixed at
 * half. Every figure recomputes as it moves — the point is that the agent's
 * arithmetic is live, not quoted.
 */
export function WhatIfCard({ catKey }: { catKey: string }) {
  const cat = HABITS[0].categories.find((c) => c.key === catKey) ?? HABITS[0].categories[0];
  const [pct, setPct] = useState(50);

  const cut = Math.round((cat.amount * pct) / 100);
  const after = cat.amount - cut;

  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-hair bg-white p-[16px] shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
      <div className="mb-[16px] flex flex-col gap-[12px]">
        <div className="flex w-full items-center justify-between">
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
            If you cut {cat.label}
          </p>
          <p className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black">
            {pct}%
          </p>
        </div>
        <div className="h-px w-full bg-hair" />
      </div>

      <div className="flex flex-col gap-[16px]">
        {/* The bar is the same money twice: the faded band is this month's
            figure, the solid band what would survive the cut. The boundary is
            the slider's thumb position, so dragging visibly eats the bar. */}
        <div className="relative h-[14px] w-full overflow-hidden rounded-[2px]">
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: `var(${cat.token})` }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-[2px]"
            style={{ background: `var(${cat.token})` }}
            initial={false}
            animate={{ width: `${100 - pct}%` }}
            transition={{ duration: 0.18, ease: EASE }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          aria-label={`Cut ${cat.label} by ${pct} percent`}
          className="w-full accent-black"
        />

        <div className="flex flex-col gap-[12px]">
          <Row label={`${cat.label} now`} value={cat.amount} token={cat.token} />
          <Row label="After the cut" value={after} token={cat.token} />
          <div className="h-px w-full bg-hair" />
          <div className="flex w-full items-center justify-between">
            <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
              Freed each month
            </p>
            <Money
              value={cut}
              signed
              className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
            />
          </div>
          <div className="flex w-full items-center justify-between">
            <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
              Over a year
            </p>
            <Money
              value={cut * 12}
              signed
              className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, token }: { label: string; value: number; token?: string }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-[8px]">
        {token && (
          <div className="size-[12px] shrink-0 rounded-[2px]" style={{ background: `var(${token})` }} />
        )}
        <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
          {label}
        </p>
      </div>
      <Money
        value={value}
        className="tnum font-serif text-[14px] font-medium leading-[1.3] text-black"
      />
    </div>
  );
}

/* ================================================================== */
/* Month line — Sep against Aug, day by day                            */

const LINE_W = 280;
const LINE_H = 110;

/** Cumulative sum, prefixed with a zero so every line starts on the floor. */
function cumulative(values: number[]): number[] {
  const out = [0];
  for (const v of values) out.push(out[out.length - 1] + v);
  return out;
}

/** Catmull-Rom through the points, emitted as cubic Béziers — the soft curve
    the inspiration card draws, without a chart library. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Spent-this-month, Sep's running total against Aug's (Figma 1500:199455).
 * Sep is solid and ends in a dot at today; Aug is dashed and runs the full
 * month. The legend chips are toggles — tap one to drop that line out and
 * read the other alone.
 */
export function MonthLineCard() {
  const [show, setShow] = useState({ sep: true, aug: true });

  const { sepPts, augPts, sepTotal } = useMemo(() => {
    const sep = cumulative(DAILY_SPEND);
    const aug = cumulative(AUG_DAILY);
    const yMax = Math.max(sep[sep.length - 1], aug[aug.length - 1]) * 1.05;
    const pt = (day: number, v: number) => ({
      x: (day / 31) * LINE_W,
      y: LINE_H - (v / yMax) * LINE_H,
    });
    return {
      sepPts: sep.map((v, day) => pt(day, v)),
      augPts: aug.map((v, day) => pt(day, v)),
      sepTotal: sep[sep.length - 1],
    };
  }, []);

  const sepEnd = sepPts[sepPts.length - 1];
  const augEnd = augPts[augPts.length - 1];

  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-hair bg-white p-[16px] shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
      <div className="mb-[16px] flex flex-col gap-[12px]">
        <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
          Spent this month
        </p>
        <div className="h-px w-full bg-hair" />
      </div>

      <div className="flex flex-col gap-[12px]">
        <Money
          value={sepTotal}
          className="tnum font-serif text-[24px] font-semibold leading-[1.3] text-black"
        />

        <svg
          viewBox={`-4 -6 ${LINE_W + 8} ${LINE_H + 12}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${rupees(sepTotal)} spent so far in Sep, against Aug's full month`}
        >
          <motion.path
            d={smoothPath(augPts)}
            fill="none"
            stroke="var(--color-series-prior)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, opacity: show.aug ? 1 : 0.12 }}
            transition={{ pathLength: { duration: 0.9, ease: EASE }, opacity: { duration: 0.25 } }}
          />
          <motion.circle
            cx={augEnd.x}
            cy={augEnd.y}
            r="4"
            fill="var(--color-series-prior)"
            initial={{ opacity: 0 }}
            animate={{ opacity: show.aug ? 1 : 0.12 }}
            transition={{ duration: 0.25, delay: 0.5 }}
          />
          <motion.path
            d={smoothPath(sepPts)}
            fill="none"
            stroke="var(--color-series-current)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, opacity: show.sep ? 1 : 0.12 }}
            transition={{ pathLength: { duration: 0.9, ease: EASE }, opacity: { duration: 0.25 } }}
          />
          <motion.circle
            cx={sepEnd.x}
            cy={sepEnd.y}
            r="4.5"
            fill="var(--color-series-current)"
            initial={{ opacity: 0 }}
            animate={{ opacity: show.sep ? 1 : 0.12 }}
            transition={{ duration: 0.25, delay: 0.5 }}
          />
        </svg>

        {/* Day-of-month ticks, weekly. */}
        <div className="relative h-[17px] w-full">
          {[1, 8, 15, 22, 29].map((day) => (
            <p
              key={day}
              className="absolute -translate-x-1/2 font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
              style={{ left: `${(day / 31) * 100}%` }}
            >
              {String(day).padStart(2, "0")}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-[16px]">
          <LegendChip
            label="Sep"
            on={show.sep}
            colour="var(--color-series-current)"
            solid
            onToggle={() => setShow((s) => ({ ...s, sep: !s.sep }))}
          />
          <LegendChip
            label="Aug"
            on={show.aug}
            colour="var(--color-series-prior)"
            onToggle={() => setShow((s) => ({ ...s, aug: !s.aug }))}
          />
        </div>
      </div>
    </div>
  );
}

function LegendChip({
  label,
  on,
  colour,
  solid = false,
  onToggle,
}: {
  label: string;
  on: boolean;
  colour: string;
  solid?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`flex items-center gap-[6px] font-mono text-[12px] font-medium uppercase leading-[1.4] transition-opacity duration-150 ${on ? "" : "opacity-40"}`}
    >
      <span
        className="block size-[8px] rounded-full"
        style={solid ? { background: colour } : { border: `1.5px dashed ${colour}` }}
      />
      <span style={{ color: on ? (solid ? colour : "var(--color-ink)") : "var(--color-ink-dim)" }}>
        {label}
      </span>
    </button>
  );
}

/* ================================================================== */
/* Flow bar — the month as one strip                                   */

/**
 * The latest month's flow as a proportion bar (Figma 1500:199455): money in,
 * money out and what's left, side by side on one strip, so the answer to "am
 * I cash flow positive?" is readable as widths before it's readable as
 * figures. Segments grow in from nothing on mount.
 */
export function FlowBar() {
  const month = CASH_FLOW[CASH_FLOW.length - 1];
  const net = month.income - month.expenses;
  const parts = [
    { key: "in", value: month.income, token: "--color-income" },
    { key: "out", value: month.expenses, token: "--color-expense" },
    { key: "net", value: Math.abs(net), token: "--color-net" },
  ];
  const total = sum(parts.map((p) => p.value));

  return (
    <div className="mb-[16px] flex h-[14px] w-full gap-[4px]" aria-hidden="true">
      {parts.map((p, i) => (
        <motion.div
          key={p.key}
          className="h-full rounded-[3px]"
          style={{ background: `var(${p.token})` }}
          initial={{ width: 0 }}
          animate={{ width: `${(p.value / total) * 100}%` }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.12 * i }}
        />
      ))}
    </div>
  );
}

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AUG_DAILY, CASH_FLOW, DAILY_SPEND, HABITS, JUL_DAILY } from "../data";
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
        {/* The bar IS the slider. The faded run growing from the left is the
            cut, the solid remainder is what survives, and the handle stands
            on the boundary — dragging visibly eats the category. A separate
            track underneath put the control a row away from the thing it
            controls. The native input is stretched invisibly across the
            whole band, so keyboard and screen-reader behaviour stay stock. */}
        <div className="relative flex h-[24px] w-full items-center">
          <div className="relative h-[14px] w-full overflow-hidden rounded-[2px]">
            {/* Faded base = the whole category; the solid band anchored right
                is what survives. What the handle has passed reads as gone. */}
            <div className="absolute inset-0 opacity-25" style={{ background: `var(${cat.token})` }} />
            <motion.div
              className="absolute inset-y-0 right-0"
              style={{ background: `var(${cat.token})` }}
              initial={false}
              animate={{ width: `${100 - pct}%` }}
              transition={{ duration: 0.15, ease: EASE }}
            />
          </div>
          <motion.div
            className="pointer-events-none absolute h-[24px] w-[14px] -translate-x-1/2 rounded-[7px] border border-black bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            initial={false}
            animate={{ left: `${pct}%` }}
            transition={{ duration: 0.15, ease: EASE }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            aria-label={`Cut ${cat.label} by ${pct} percent`}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>

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

/** The months the line card can draw. Sep is the running month — solid, in
    front, ending in a dot at today; the finished months are dashed context.
    Order here is z-order back-to-front and legend order left-to-right. */
const LINE_MONTHS = [
  { key: "jul", label: "Jul", daily: JUL_DAILY, colour: "var(--color-gain)", solid: false },
  { key: "aug", label: "Aug", daily: AUG_DAILY, colour: "var(--color-series-prior)", solid: false },
  { key: "sep", label: "Sep", daily: DAILY_SPEND, colour: "var(--color-series-current)", solid: true },
] as const;

type LineMonthKey = (typeof LINE_MONTHS)[number]["key"];

/**
 * Spent-this-month, the running total of each month laid over the others
 * (Figma 1500:199455). Sep is solid and ends in a dot at today; the finished
 * months are dashed. The legend chips are a filter — any combination of
 * months, so "is this month unusual?" can be answered against more than one
 * baseline. The last month standing can't be toggled off: an empty chart
 * answers nothing.
 */
export function MonthLineCard() {
  const [show, setShow] = useState<Record<LineMonthKey, boolean>>({
    jul: false,
    aug: true,
    sep: true,
  });

  const toggle = (key: LineMonthKey) =>
    setShow((s) => {
      const next = { ...s, [key]: !s[key] };
      return Object.values(next).some(Boolean) ? next : s;
    });

  const months = useMemo(() => {
    const series = LINE_MONTHS.map((m) => ({ ...m, cum: cumulative([...m.daily]) }));
    const yMax = Math.max(...series.map((m) => m.cum[m.cum.length - 1])) * 1.05;
    return series.map((m) => ({
      ...m,
      pts: m.cum.map((v, day) => ({
        x: (day / 31) * LINE_W,
        y: LINE_H - (v / yMax) * LINE_H,
      })),
      total: m.cum[m.cum.length - 1],
    }));
  }, []);

  const sepTotal = months.find((m) => m.key === "sep")!.total;

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
          aria-label={`${rupees(sepTotal)} spent so far in Sep, against earlier months`}
        >
          {months.map((m) => {
            const end = m.pts[m.pts.length - 1];
            return (
              <g key={m.key}>
                <motion.path
                  d={smoothPath(m.pts)}
                  fill="none"
                  stroke={m.colour}
                  strokeWidth={m.solid ? 2 : 1.5}
                  strokeDasharray={m.solid ? undefined : "4 4"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: show[m.key] ? 1 : 0 }}
                  transition={{
                    pathLength: { duration: 0.9, ease: EASE },
                    opacity: { duration: 0.25 },
                  }}
                />
                <motion.circle
                  cx={end.x}
                  cy={end.y}
                  r={m.solid ? 4.5 : 4}
                  fill={m.colour}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: show[m.key] ? 1 : 0 }}
                  transition={{ duration: 0.25, delay: 0.5 }}
                />
              </g>
            );
          })}
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

        <div className="flex items-center gap-[8px]">
          {[...LINE_MONTHS].reverse().map((m) => (
            <LegendChip
              key={m.key}
              label={m.label}
              on={show[m.key]}
              colour={m.colour}
              solid={m.solid}
              onToggle={() => toggle(m.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A filter pill, in the same vocabulary as the app's range pills: on = a
 * white pill with a hairline, off = bare grey text. The dot keeps carrying
 * the series colour, so you can still tell which line is which month.
 */
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
      className={[
        "flex items-center gap-[6px] rounded-[50px] px-[12px] py-[6px] font-mono text-[12px] font-medium uppercase leading-[1.4]",
        "transition-colors duration-150 active:scale-95",
        on ? "border border-hair-pill bg-white text-black" : "border border-transparent text-ink-dim",
      ].join(" ")}
    >
      <span
        className="block size-[8px] rounded-full"
        style={solid ? { background: colour } : { border: `1.5px dashed ${colour}` }}
      />
      {label}
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

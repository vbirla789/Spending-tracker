import { motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { AUG_DAILY, CASH_FLOW, DAILY_SPEND, HABITS, JUL_DAILY, RING_ORDER } from "../data";
import { donutArcs } from "../lib/chart";
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
  | { kind: "ring" }
  | { kind: "trend"; catKey: string }
  | { kind: "projection" }
  | { kind: "flowbar" };

const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number];

/* ================================================================== */
/* The card shell every answer body shares                             */

/**
 * Square corners, and a titled band whose rule runs the card's full width.
 *
 * The rule is the edge of the header, so it has to reach both borders — held
 * inside the body's padding it read as a divider between two rows of content
 * instead. Same structure as the cash flow and habits cards on the Overview,
 * so an answer looks like the screen it was derived from.
 */
export function AnswerCard({
  title,
  trailing,
  children,
}: {
  title: string;
  /** Sits opposite the title in the header band — a readout or a control. */
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden border border-hair bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
      {/* The header band is tinted and its title is black — it reads as a
          label on the card rather than a caption inside it. */}
      <div className="flex w-full items-center justify-between bg-tip px-[16px] py-[12px]">
        <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-black">
          {title}
        </p>
        {trailing}
      </div>
      <div className="h-px w-full bg-hair" />
      <div className="p-[16px]">{children}</div>
    </div>
  );
}

/**
 * A rule inside a padded card body that still reaches both card borders.
 * Negative margins undo the 16px padding rather than the body losing it, so
 * only the rules break out and the rows stay aligned.
 *
 * Dashed, unlike the solid rule under a card's header: that one is an edge,
 * these separate rows of the same list, and the lighter texture keeps them
 * from reading as another boundary.
 */
export function CardRule() {
  return <div className="-mx-[16px] h-px w-[calc(100%+32px)] card-dash" />;
}

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

  return (
    <AnswerCard title={`If you cut ${cat.label}`}>
      <div className="flex flex-col gap-[16px]">
        {/* What you're cutting from on the left, how deep on the right, sat
            directly over the bar they describe. The two rows that used to
            spell out "now" and "after the cut" said in four numbers what the
            bar already shows as two lengths. */}
        <div className="flex w-full items-baseline justify-between">
          <Money
            value={cat.amount}
            className="tnum font-serif text-[20px] font-semibold leading-[1.3] text-black"
          />
          <p className="tnum font-serif text-[20px] font-semibold leading-[1.3] text-black">
            {pct}%
          </p>
        </div>

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
          {/* Shadow only, no outline. A black hairline round a 14px handle
              read as a drawn object sitting on the bar; the shadow alone lets
              it float over it. Two layers, since one soft shadow on white
              over a mid-tone fill disappears into the fill. */}
          <motion.div
            className="pointer-events-none absolute h-[24px] w-[14px] -translate-x-1/2 rounded-[7px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22),0_0_1px_rgba(0,0,0,0.18)]"
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
          <CardRule />
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
    </AnswerCard>
  );
}


/* ================================================================== */
/* Month line — Sep against Aug, day by day                            */

const LINE_W = 280;
const LINE_H = 110;
/* The viewBox is padded so the end dots aren't half-clipped at the edges.
   The y-axis labels have to undo that padding to sit on their own
   gridlines — see tickTop. */
const LINE_VB_Y = -6;
const LINE_VB_H = LINE_H + 12;
/** Axis step. A round ₹2k grid rather than a fraction of the tallest month —
    a scale exists to be read off, so its numbers have to be round. */
const LINE_STEP = 2_000;
const LINE_AXIS_W = 29;

/** Where a value's gridline lands as a percentage of the rendered SVG box. */
const tickTop = (value: number, yMax: number) =>
  ((LINE_H * (1 - value / yMax) - LINE_VB_Y) / LINE_VB_H) * 100;

/** Cumulative sum, prefixed with a zero so every line starts on the floor. */
function cumulative(values: number[]): number[] {
  const out = [0];
  for (const v of values) out.push(out[out.length - 1] + v);
  return out;
}

/** The x-axis is weekly, so the line is sampled weekly too. */
const LINE_WEEK = 7;

/**
 * Every seventh day, plus wherever the month actually ends.
 *
 * Thirty-odd points across 280px is a reading a day, and no curve makes
 * that legible — it's a zigzag whatever you fit through it. A running
 * total doesn't need daily resolution to answer "am I ahead of last
 * month"; it needs to be comparable at a glance. Weekly points land on the
 * dates already labelled under the chart, so a kink in the line is always
 * a tick you can name.
 */
function weeklyPoints(cum: number[]): { day: number; value: number }[] {
  const out: { day: number; value: number }[] = [];
  for (let day = 0; day < cum.length; day += LINE_WEEK) out.push({ day, value: cum[day] });
  const lastDay = cum.length - 1;
  if (out[out.length - 1].day !== lastDay) out.push({ day: lastDay, value: cum[lastDay] });
  return out;
}

/** Straight segments between the sampled points — no smoothing to overshoot. */
function linearPath(pts: { x: number; y: number }[]): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
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

  const { months, yMax, ticks } = useMemo(() => {
    const series = LINE_MONTHS.map((m) => ({ ...m, cum: cumulative([...m.daily]) }));
    const tallest = Math.max(...series.map((m) => m.cum[m.cum.length - 1]));
    /* Round the ceiling up to the next whole step so every gridline is a
       round rupee figure and the tallest month still clears the top. */
    const max = Math.ceil(tallest / LINE_STEP) * LINE_STEP;
    return {
      yMax: max,
      ticks: Array.from({ length: max / LINE_STEP + 1 }, (_, i) => max - i * LINE_STEP),
      months: series.map((m) => ({
        ...m,
        pts: weeklyPoints(m.cum).map(({ day, value }) => ({
          x: (day / 31) * LINE_W,
          y: LINE_H - (value / max) * LINE_H,
        })),
        total: m.cum[m.cum.length - 1],
      })),
    };
  }, []);

  const sepTotal = months.find((m) => m.key === "sep")!.total;

  return (
    <AnswerCard title="Compare">
      {/* No running total on the card. The reply above it already states the
          figure and the gap to last month; repeating it here made the card a
          second copy of the sentence rather than the evidence for it. */}
      <div className="flex flex-col gap-[12px]">
        {/* Chart and scale in one row, and that row holds ONLY the plot: the
            label tops are percentages of the SVG's own box, so anything else
            sharing the row's height would throw them off. */}
        <div className="flex items-stretch gap-[12px]">
        <svg
          viewBox={`-4 ${LINE_VB_Y} ${LINE_W + 8} ${LINE_VB_H}`}
          className="h-auto min-w-0 flex-1"
          role="img"
          aria-label={`${rupees(sepTotal)} spent so far in Sep, against earlier months`}
        >
          {/* Gridlines first, so every line draws over them. Without these
              the labels are a legend to nothing — you'd be eyeballing
              across empty space to read a height. */}
          {ticks.map((t) => (
            <line
              key={t}
              x1={0}
              x2={LINE_W}
              y1={LINE_H * (1 - t / yMax)}
              y2={LINE_H * (1 - t / yMax)}
              stroke="var(--color-bar)"
              strokeDasharray="2 2"
            />
          ))}
          {months.map((m) => {
            const end = m.pts[m.pts.length - 1];
            return (
              <g key={m.key}>
                <motion.path
                  d={linearPath(m.pts)}
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

          {/* The rupee scale. Percentage tops rather than a fixed column,
              because the SVG's height comes from its aspect ratio and isn't
              a figure we could match. */}
          <div
            className="relative shrink-0"
            style={{ width: LINE_AXIS_W }}
            aria-hidden="true"
          >
            {ticks.map((t) => (
              <p
                key={t}
                className="tnum absolute -translate-y-1/2 whitespace-nowrap font-serif text-[10px] font-semibold leading-[1.3] text-ink-dim"
                style={{ top: `${tickTop(t, yMax)}%` }}
              >
                ₹{t === 0 ? "0" : `${t / 1000}K`}
              </p>
            ))}
          </div>
        </div>

        {/* Day-of-month ticks, weekly. Inset on the right by the scale's
            column so its percentages span the plot, not the whole card. */}
        <div
          className="relative h-[17px]"
          style={{ marginRight: LINE_AXIS_W + 12 }}
        >
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

        <CardRule />

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
    </AnswerCard>
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

/* ================================================================== */
/* Category ring — the split, as something you interrogate            */

const RING_SIZE = 150;
const RING_STROKE = 16;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_GAP = 5;

/**
 * "Where did my money go?" as a ring you can question rather than a table
 * you read down.
 *
 * Tap an arc or a row and the centre becomes that category — its share, its
 * figure — while the rest of the ring recedes. The follow-up under it is
 * built from whatever is selected, so the next question is always about the
 * thing you just pointed at.
 */
export function CategoryRing({ onAsk }: { onAsk: (q: string) => void }) {
  const month = HABITS[0];
  const total = sum(month.categories.map((c) => c.amount));
  const ring = RING_ORDER.map((key) => month.categories.find((c) => c.key === key)!);
  const arcs = donutArcs(
    ring.map((c) => c.amount / total),
    RING_RADIUS,
    RING_GAP,
  );

  /* Opens on the largest slice — the answer to the question as asked. */
  const biggest = [...month.categories].sort((a, b) => b.amount - a.amount)[0];
  const [selKey, setSelKey] = useState(biggest.key);
  const sel = month.categories.find((c) => c.key === selKey) ?? biggest;

  return (
    <AnswerCard title={`${month.label} breakdown`}>
      <div className="flex flex-col gap-[16px]">
        <div className="relative mx-auto" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="size-full" aria-hidden="true">
            <g transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} fill="none">
              {ring.map((cat, i) => (
                <motion.circle
                  key={cat.key}
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={`var(${cat.token})`}
                  strokeWidth={RING_STROKE}
                  strokeDasharray={`${arcs[i].dash} ${arcs[i].circumference - arcs[i].dash}`}
                  strokeDashoffset={arcs[i].offset}
                  className="cursor-pointer"
                  style={{ pointerEvents: "stroke" }}
                  onClick={() => setSelKey(cat.key)}
                  initial={false}
                  /* Unselected arcs fall back rather than disappear — the
                     slice you picked has to be read against the whole. */
                  animate={{ opacity: cat.key === selKey ? 1 : 0.22 }}
                  transition={{ duration: 0.25, ease: EASE }}
                />
              ))}
            </g>
          </svg>

          {/* The total holds the centre, as it does on the habits card. It
              used to show the selected category — which the legend row right
              below was already saying, so the same name and figure appeared
              twice on one card. The centre is the anchor every slice is a
              share of; the legend is where you read the parts. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[4px]">
            <p className="tnum font-serif text-[24px] font-semibold leading-[1.3] text-black">
              {rupees(total)}
            </p>
            <p className="font-mono text-[11px] font-medium uppercase leading-[1.4] text-ink-dim">
              Spent in {month.label}
            </p>
          </div>
        </div>

        <CardRule />

        <div className="flex flex-col gap-[12px]">
          {month.categories.map((cat) => {
            const on = cat.key === selKey;
            return (
              <button
                key={cat.key}
                type="button"
                aria-pressed={on}
                onClick={() => setSelKey(cat.key)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-[8px]">
                  <motion.div
                    className="size-[12px] shrink-0 rounded-[2px]"
                    style={{ background: `var(${cat.token})` }}
                    initial={false}
                    animate={{ opacity: on ? 1 : 0.35 }}
                    transition={{ duration: 0.2 }}
                  />
                  <p
                    className={`font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] transition-colors duration-200 ${on ? "text-black" : "text-ink-dim"}`}
                  >
                    {cat.label}
                  </p>
                  {/* The share lives beside the name, as on the habits card,
                      so the legend says what the ring shows. */}
                  <p className="tnum font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
                    {Math.round((cat.amount / total) * 100)}%
                  </p>
                </div>
                <Money
                  value={cat.amount}
                  className={`tnum font-serif text-[14px] font-semibold leading-[1.3] transition-colors duration-200 ${on ? "text-black" : "text-ink-dim"}`}
                />
              </button>
            );
          })}
        </div>

        <CardRule />

        {/* Reads off the selection, so the way onward is always about the
            slice under your finger rather than a fixed next question. */}
        <button
          type="button"
          onClick={() => onAsk(`Why is ${sel.label.toLowerCase()} so high?`)}
          className="flex h-[36px] w-full items-center justify-center rounded-[50px] border border-chip-edge bg-chip font-mono text-[12px] font-medium leading-[1.4] tracking-[0.6px] text-black transition-transform duration-150 active:scale-95"
        >
          Why is {sel.label.toLowerCase()} so high?
        </button>
      </div>
    </AnswerCard>
  );
}

/* ================================================================== */
/* Category trend — one category across the months we hold            */

/**
 * A category over time as bars you can tap, rather than three rows of
 * figures. Selecting a month moves the readout and recomputes the delta
 * against the month before it, so the comparison is the thing you're
 * steering instead of a fixed line at the bottom.
 */
export function CategoryTrend({ catKey }: { catKey: string }) {
  const series = HABITS.map((m) => ({
    key: m.key,
    label: m.label,
    amount: m.categories.find((c) => c.key === catKey)?.amount ?? 0,
  }))
    /* HABITS is newest-first; a trend has to read oldest to newest. */
    .reverse();

  const cat = HABITS[0].categories.find((c) => c.key === catKey) ?? HABITS[0].categories[0];
  const ceiling = Math.max(...series.map((s) => s.amount));
  const [selIdx, setSelIdx] = useState(series.length - 1);
  const sel = series[selIdx];
  const prev = selIdx > 0 ? series[selIdx - 1] : null;
  const delta = prev ? sel.amount - prev.amount : 0;

  return (
    <AnswerCard
      title={`${cat.label} over time`}
      trailing={
        <p className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black">
          {rupees(sel.amount)}
        </p>
      }
    >
      <div className="flex flex-col gap-[16px]">
        <div className="flex h-[96px] items-end justify-between gap-[12px]">
          {series.map((m, i) => {
            const on = i === selIdx;
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={on}
                aria-label={`${m.label}: ${rupees(m.amount)}`}
                onClick={() => setSelIdx(i)}
                className="flex h-full flex-1 flex-col items-center justify-end gap-[8px]"
              >
                <motion.div
                  className="w-full rounded-[2px]"
                  style={{ background: `var(${cat.token})` }}
                  initial={{ height: 0 }}
                  animate={{
                    height: (m.amount / ceiling) * 70,
                    opacity: on ? 1 : 0.28,
                  }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.06 * i }}
                />
                <p
                  className={`font-mono text-[12px] font-medium uppercase leading-[1.4] transition-colors duration-200 ${on ? "text-black" : "text-ink-dim"}`}
                >
                  {m.label}
                </p>
              </button>
            );
          })}
        </div>

        <CardRule />

        <div className="flex w-full items-center justify-between">
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
            {prev ? `Change vs ${prev.label}` : "Earliest month held"}
          </p>
          {prev ? (
            <Money
              value={delta}
              signed
              className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
            />
          ) : (
            <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
              —
            </p>
          )}
        </div>
      </div>
    </AnswerCard>
  );
}

/* ================================================================== */
/* Projection — what this month's rate is worth, held                 */

const PROJ_HORIZONS = [6, 12, 24] as const;
const PROJ_W = 280;
const PROJ_H = 90;

/**
 * "What's driving my net worth?" answered as a forecast you can stretch
 * rather than a figure you're told.
 *
 * The month's net is the rate; the pills change how long you hold it, and
 * the curve and the endpoint redraw. It's the counterfactual the brief asks
 * for — a number you can push on — built from the same cash flow the screen
 * behind it shows.
 */
export function SavingsProjection() {
  const month = CASH_FLOW[CASH_FLOW.length - 1];
  const rate = month.income - month.expenses;
  const [horizon, setHorizon] = useState<number>(12);

  const total = rate * horizon;
  /* Always plotted against the longest horizon, so switching stretches the
     curve along a fixed axis instead of rescaling the whole chart. */
  const ceiling = rate * PROJ_HORIZONS[PROJ_HORIZONS.length - 1];
  const pts = Array.from({ length: horizon + 1 }, (_, i) => ({
    x: (i / PROJ_HORIZONS[PROJ_HORIZONS.length - 1]) * PROJ_W,
    y: PROJ_H - ((rate * i) / ceiling) * PROJ_H,
  }));
  const end = pts[pts.length - 1];

  return (
    <AnswerCard
      title="If you keep this rate"
      trailing={
        <Money
          value={total}
          className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
        />
      }
    >
      <div className="flex flex-col gap-[16px]">
        <svg
          viewBox={`-4 -6 ${PROJ_W + 8} ${PROJ_H + 12}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${rupees(total)} saved over ${horizon} months at ${rupees(rate)} a month`}
        >
          <line
            x1={0}
            x2={PROJ_W}
            y1={PROJ_H}
            y2={PROJ_H}
            stroke="var(--color-bar)"
            strokeDasharray="2 2"
          />
          <motion.path
            d={linearPath(pts)}
            fill="none"
            stroke="var(--color-income)"
            strokeWidth={2}
            initial={false}
            animate={{ d: linearPath(pts) }}
            transition={{ duration: 0.4, ease: EASE }}
          />
          <motion.circle
            r={4.5}
            fill="var(--color-income)"
            initial={false}
            animate={{ cx: end.x, cy: end.y }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </svg>

        <div className="flex items-center gap-[8px]">
          {PROJ_HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={h === horizon}
              onClick={() => setHorizon(h)}
              className={[
                "rounded-[50px] px-[12px] py-[6px] font-mono text-[12px] font-medium uppercase leading-[1.4]",
                "transition-colors duration-150 active:scale-95",
                h === horizon
                  ? "border border-hair-pill bg-white text-black"
                  : "border border-transparent text-ink-dim",
              ].join(" ")}
            >
              {h === 24 ? "2 years" : h === 12 ? "1 year" : `${h} months`}
            </button>
          ))}
        </div>

        <CardRule />

        <div className="flex w-full items-center justify-between">
          <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
            Kept each month
          </p>
          <Money
            value={rate}
            signed
            className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
          />
        </div>
      </div>
    </AnswerCard>
  );
}

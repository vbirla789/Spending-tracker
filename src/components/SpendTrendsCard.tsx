import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { DAILY_SPEND, SPEND_TRENDS, TODAY_DAY } from "../data";
import { percent, rupees, sum } from "../lib/format";

/* ------------------------------------------------------------------ */
/* Monthly geometry — Figma 1489:165547, horizontals scaled 1.5× into a
   pannable rail (see the README). Vertical geometry untouched.        */

const M_SCALE = 1.5;
const M_PLOT_H = 167;
const M_BAR_W = 24 * M_SCALE;
const M_PITCH = 59.4 * M_SCALE;
const M_GUIDES = [34.5, 96.5, 158.5, 221.5, 283.5].map((x) => x * M_SCALE);
const M_AVG_W = 283 * M_SCALE;
const M_GUIDE_UP = 14;
const M_GUIDE_DOWN = 25;
const TRACK_W = 30;
const THUMB_W = 8;

/* ------------------------------------------------------------------ */
/* Daily geometry — Figma 1497:199156. 20 day columns justify-between
   across a 309px plot (343 minus the y-axis labels and their gap),
   with today always the 11th column, exactly where the file parks its
   TODAY pill (x=162 ≈ 10 × 16.21). Fits the gutter, so no rail.       */

const D_PLOT_W = 309;
const D_PLOT_H = 170;
const D_COLS = 20;
const D_PITCH = (D_PLOT_W - 1) / (D_COLS - 1);
/** Days before today shown in the window; the rest of the columns are the
    future, drawn as bare guides. */
const D_PAST = 10;
/** Px per the ceiling — the file's black marker runs 156px, from the baseline
    to the top gridline, and the four y labels sit on a 52px pitch. */
const D_SCALE_H = 156;
const D_CEILING = 2_400;

/** ₹10,032 → "₹10k". The design labels in thousands; the data is in rupees. */
const thousands = (value: number) => `₹${Math.round(value / 1000)}k`;

/** How far each view slides in/out — enough to read as travel, not a jump. */
const SLIDE = 40;
const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number];

type View = "monthly" | "daily";

/**
 * Spend trends — the screen's opening claim, now two claims deep.
 *
 * The eyebrow is the switcher (Figma 1500:199389): "MONTHLY TRENDS ‹ ›"
 * flips to the daily view and back. The label carries a dotted underline and
 * a pair of chevrons — the file's whole affordance — rather than a segmented
 * control, so switching costs no extra row on the screen.
 *
 * Monthly: six months against their own average. Daily: the month so far,
 * one column per day, scrubbable — drag across the plot and the callout
 * follows with that day's spend.
 */
export default function SpendTrendsCard() {
  const [{ view, dir }, setState] = useState<{ view: View; dir: 1 | -1 }>({
    view: "monthly",
    dir: 1,
  });

  const toggle = () =>
    setState((s) => ({ view: s.view === "monthly" ? "daily" : "monthly", dir: s.view === "monthly" ? 1 : -1 }));

  /* Monthly headline: gap to the six-month average. */
  const amounts = SPEND_TRENDS.map((m) => m.amount);
  const average = sum(amounts) / amounts.length;
  const monthlyGap = (average - SPEND_TRENDS[SPEND_TRENDS.length - 1].amount) / average;
  const below = monthlyGap >= 0;

  /* Daily headline: the largest day in the last seven. */
  const last7 = DAILY_SPEND.slice(Math.max(0, TODAY_DAY - 7));
  const peak = Math.max(...last7);

  return (
    <section className="flex w-full shrink-0 flex-col" aria-labelledby="st-label">
      <div className="flex flex-col items-start gap-[10px]">
        {/* The label is the control. Dotted underline says "tap me" the way a
            definition link does; the paired chevrons say there's more than one
            of these views. One button, because with two views every part of it
            means the same thing: the other one. */}
        <button
          type="button"
          id="st-label"
          onClick={toggle}
          aria-live="polite"
          aria-label={`${view} trends. Switch view`}
          className="flex items-center gap-[2px] transition-transform duration-150 active:scale-95"
        >
          <span className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim underline decoration-dotted [text-underline-position:from-font]">
            {view} Trends
          </span>
          <span className="flex items-center">
            <img src="/icons/chevron-right-bold.svg" alt="" className="-mr-[2px] size-[14px] rotate-180" />
            <img src="/icons/chevron-right-bold.svg" alt="" className="size-[14px]" />
          </span>
        </button>

        {/* Fixed-height stage so the swap can't reflow the caption below it.
            42px is the serif headline's own line box. */}
        <div className="relative h-[42px] w-full overflow-hidden">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={view}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.34, ease: EASE }}
              className="absolute inset-0 flex items-baseline gap-[8px]"
            >
              {view === "monthly" ? (
                <>
                  <p className="tnum font-serif text-[32px] font-semibold leading-[1.3] text-black">
                    {percent(Math.abs(monthlyGap) * 100)}
                  </p>
                  {/* The exported glyph points up; the design flips it rather
                      than shipping a second icon, so the flip is the state. */}
                  <img
                    src="/icons/caret-up.svg"
                    alt=""
                    className={`size-[20px] self-center ${below ? "-scale-y-100" : ""}`}
                  />
                </>
              ) : (
                <p className="tnum font-serif text-[32px] font-semibold leading-[1.3] text-black">
                  {rupees(peak)}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative h-[34px] w-full overflow-hidden">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.p
              key={view}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.34, ease: EASE }}
              className="absolute inset-0 font-mono text-[12px] leading-[1.4] text-ink-dim"
            >
              {view === "monthly" ? (
                <>
                  currently spending {below ? "less" : "more"} than usual,
                  <br />
                  there’s a room for little extra treat.
                </>
              ) : (
                <>
                  Highest spending day in last 7 days,
                  <br />
                  slow down a bit
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* The two bodies are different heights (the daily view carries its
          callout and pills), so the stage animates between them rather than
          letting the cards below jump. */}
      <motion.div
        className="relative w-full"
        animate={{ height: view === "monthly" ? 270 : 319 }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={view}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: EASE }}
            className="absolute inset-x-0 top-0"
          >
            {view === "monthly" ? <MonthlyBody average={average} /> : <DailyBody />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

const slideVariants = {
  enter: (d: number) => ({ x: d * SLIDE, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: -d * SLIDE, opacity: 0 }),
};

/* ================================================================== */
/* Monthly                                                             */

function MonthlyBody({ average }: { average: number }) {
  const ceiling = Math.max(...SPEND_TRENDS.map((m) => m.amount));
  const current = SPEND_TRENDS[SPEND_TRENDS.length - 1];
  const height = (value: number) => (value / ceiling) * M_PLOT_H;
  const plotW = (SPEND_TRENDS.length - 1) * M_PITCH + M_BAR_W;
  const liveX = (SPEND_TRENDS.length - 1) * M_PITCH + M_BAR_W / 2;

  const rail = useRef<HTMLDivElement>(null);
  /* 0 = fully scrolled back, 1 = at the present. Drives the indicator, so the
     thumb reports where you actually are instead of being a static mark. */
  const [progress, setProgress] = useState(1);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const travel = el.scrollWidth - el.clientWidth;
    setProgress(travel > 0 ? el.scrollLeft / travel : 1);
  }, []);

  /* Opens at the present and scrolls back into history, matching the cash
     flow rail and the file, whose thumb is drawn parked at the right. */
  useLayoutEffect(() => {
    const el = rail.current;
    if (el) el.scrollLeft = el.scrollWidth;
    sync();
  }, [sync]);

  return (
    <div className="flex w-full flex-col items-center gap-[24px] pt-[48px]">
      {/* Full-bleed, with the page gutter re-applied inside: the chart rests
          flush with the headline above it but runs clean under both screen
          edges once you drag it, rather than stopping short of them. */}
      <div
        ref={rail}
        onScroll={sync}
        className="rail -mx-[16px] w-[calc(100%+32px)] overflow-x-auto px-[16px]"
      >
        <div className="flex flex-col" style={{ width: plotW }}>
          <div className="relative" style={{ width: plotW, height: M_PLOT_H }}>
            {/* One SVG for the guides so the 2-2 dash pattern is exact — a
                CSS dashed border rounds the pattern to fit the edge. */}
            <svg
              aria-hidden="true"
              className="absolute left-0"
              style={{
                top: -M_GUIDE_UP,
                width: plotW,
                height: M_PLOT_H + M_GUIDE_UP + M_GUIDE_DOWN,
              }}
            >
              {M_GUIDES.map((x) => (
                <line
                  key={x}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={M_PLOT_H + M_GUIDE_UP + M_GUIDE_DOWN}
                  stroke="var(--color-bar)"
                  strokeDasharray="2 2"
                />
              ))}
            </svg>

            {SPEND_TRENDS.map((month, i) => {
              const live = month.key === current.key;
              return (
                <motion.div
                  key={month.key}
                  className={
                    live
                      ? "absolute bottom-0 border border-black bg-white"
                      : "absolute bottom-0 bg-bar"
                  }
                  style={{ left: i * M_PITCH, width: M_BAR_W }}
                  initial={false}
                  animate={{ height: height(month.amount) }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
              );
            })}

            {/* Sits at the average's own height rather than a fixed offset, so
                the marker can't drift away from the bars it describes. The rule
                stops short of the live bar — it's the history being averaged,
                not the month still running. */}
            <div
              className="absolute left-0 flex translate-y-1/2 items-center"
              style={{ bottom: height(average), width: M_AVG_W }}
            >
              <div className="h-px flex-1 border-t border-dashed border-gain" />
              <div className="rounded-[23px] border border-gain bg-white px-[8px] py-[2px]">
                <p className="whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] text-gain">
                  Avg {thousands(average)}
                </p>
              </div>
              <div className="h-px flex-1 border-t border-dashed border-gain" />
            </div>

            {/* Rides 8px above the live bar's top edge, so it tracks the value
                instead of being parked at a hard-coded y. */}
            <div
              className="absolute flex flex-col items-center drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
              style={{
                left: liveX,
                bottom: height(current.amount) + 8,
                transform: "translateX(-50%)",
              }}
            >
              <div className="rounded-[3px] bg-white px-[8px] py-[4px]">
                <p className="whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] text-black">
                  {thousands(current.amount)}
                </p>
              </div>
              <img
                src="/icons/tooltip-pointer.svg"
                alt=""
                className="-mt-px block h-[6px] w-[14px] rotate-180"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="h-px w-full bg-rule" />
            {/* Inside the rail, so the labels travel with the bars they name.
                Centred on each bar rather than laid out as an even row, which
                would drift out of register as soon as the pitch changed. */}
            <div className="relative h-[17px] w-full">
              {SPEND_TRENDS.map((month, i) => (
                <p
                  key={month.key}
                  className={[
                    "absolute -translate-x-1/2 whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4]",
                    month.key === current.key ? "text-black" : "text-axis",
                  ].join(" ")}
                  style={{ left: i * M_PITCH + M_BAR_W / 2 }}
                >
                  {month.label}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* A real scroll position now that there's something to scroll. The
          file draws the thumb parked at the right, which is where opening
          on the present month puts it. */}
      <div
        className="relative h-[5px] overflow-hidden bg-[#eee]"
        style={{ width: TRACK_W }}
        aria-hidden="true"
      >
        <div
          className="absolute top-0 h-full bg-black"
          style={{ width: THUMB_W, left: progress * (TRACK_W - THUMB_W) }}
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Daily                                                               */

type DayCol = {
  /** 1-based day of the month, or null past the month's end. */
  day: number | null;
  amount: number;
  isPast: boolean;
};

function dayColumns(): DayCol[] {
  const start = TODAY_DAY - D_PAST;
  return Array.from({ length: D_COLS }, (_, i) => {
    const day = start + i;
    const inMonth = day >= 1 && day <= 30;
    return {
      day: inMonth ? day : null,
      amount: day >= 1 && day <= TODAY_DAY ? (DAILY_SPEND[day - 1] ?? 0) : 0,
      isPast: day >= 1 && day <= TODAY_DAY,
    };
  });
}

/**
 * The month so far, one column per day (Figma 1497:199156).
 *
 * The window is today−10 … today+9, which is exactly where the file parks its
 * TODAY pill — the 11th of 20 columns. Future days are bare guides: the shape
 * of the month you haven't spent yet.
 *
 * The plot is a scrubber. Drag across it (or arrow-key it) and the black
 * marker, the callout and the date pill follow to that day; it opens parked
 * on the spike the headline is talking about.
 */
function DailyBody() {
  const cols = dayColumns();
  const todayIdx = D_PAST;

  /* Opens on the day the headline points at — the biggest of the last 7. */
  const peakIdx = cols.reduce(
    (best, c, i) => (c.isPast && c.day! > TODAY_DAY - 7 && c.amount > cols[best].amount ? i : best),
    todayIdx,
  );
  const [selIdx, setSelIdx] = useState(peakIdx);
  const sel = cols[selIdx];
  const selX = selIdx * D_PITCH;

  const plot = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const scrubTo = useCallback(
    (clientX: number) => {
      const el = plot.current;
      if (!el) return;
      /* As a fraction of the rendered width, not divided by D_PITCH: on
         desktop the whole phone is scale()d down, so client px and layout px
         disagree and a pitch division lands every drag short. */
      const rect = el.getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      const i = Math.min(todayIdx, Math.max(0, Math.round(frac * (D_COLS - 1))));
      setSelIdx(i);
    },
    [todayIdx],
  );

  const barH = (amount: number) => (amount / D_CEILING) * D_SCALE_H;

  /* Pill collision. The date pill runs ~56px wide and TODAY ~49px; when the
     scrub brings the two spans into contact, TODAY fades rather than letting
     the cards shingle. Widths are the rendered sizes, not measured — both
     labels are fixed-length uppercase mono, so they can't drift. */
  const DATE_PILL_W = 56;
  const TODAY_PILL_W = 49;
  const todayX = todayIdx * D_PITCH;
  const datePillLeft = Math.min(selX, D_PLOT_W - DATE_PILL_W);
  const pillsCollide =
    selIdx !== todayIdx &&
    datePillLeft < todayX + TODAY_PILL_W &&
    datePillLeft + DATE_PILL_W > todayX;

  /* Even thirds of the ceiling. The file's own middle labels (₹1.8/₹1.2 on
     an even pitch) aren't linear against its bars, and the numbers win —
     see the README table. */
  const ticks = [D_CEILING, D_CEILING * (2 / 3), D_CEILING / 3, 0];

  return (
    <div className="relative flex w-full flex-col pt-[96px]">
      {/* Callout — SPENT ON / date / figure — pointing down at the selected
          column from above the plot, the file's flat 2px drop shadow and all.
          Left edge rides the column (the file parks it flush), clamped so it
          never leaves the plot. */}
      <motion.div
        className="absolute top-[24px] z-10 flex flex-col items-start drop-shadow-[0px_2px_0px_rgba(0,0,0,0.25)]"
        initial={false}
        animate={{ left: Math.min(Math.max(selX - 1, 0), D_PLOT_W - 120) }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        <div className="-mb-[3px] flex w-[120px] flex-col gap-[12px] rounded-[6px] bg-white p-[8px]">
          <p className="font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
            Spent on
          </p>
          <div className="flex w-full items-start justify-between">
            <p className="font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
              {sel.day} Sep
            </p>
            <p className="tnum font-serif text-[12px] font-semibold leading-[1.3] text-black">
              {rupees(sel.amount)}
            </p>
          </div>
        </div>
        <img src="/icons/pointer-wide.svg" alt="" className="block h-[8px] w-[34px]" />
      </motion.div>

      <div className="flex w-full items-start justify-center gap-[12px]">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* The scrubber. A slider in ARIA terms: one value (the selected
              day) on a min/max track, adjustable by drag or arrow keys. */}
          <div
            ref={plot}
            role="slider"
            tabIndex={0}
            aria-label="Spending by day"
            aria-valuemin={cols[0].day ?? 1}
            aria-valuemax={TODAY_DAY}
            aria-valuenow={sel.day ?? TODAY_DAY}
            aria-valuetext={`${rupees(sel.amount)} on ${sel.day} Sep`}
            className="relative touch-none outline-none"
            style={{ height: D_PLOT_H }}
            onPointerDown={(e) => {
              dragging.current = true;
              scrubTo(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && scrubTo(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setSelIdx((i) => Math.max(0, i - 1));
              if (e.key === "ArrowRight") setSelIdx((i) => Math.min(todayIdx, i + 1));
            }}
          >
            {cols.map((col, i) => (
              <div key={i}>
                {/* Every day gets its hairline guide; days with spend get the
                    4px bar over it. */}
                <div
                  className="absolute bottom-0 w-px bg-bar"
                  style={{ left: i * D_PITCH, height: D_PLOT_H }}
                />
                {col.amount > 0 && (
                  <motion.div
                    className="absolute bottom-0 w-[4px] -translate-x-1/2 bg-[#cfcfcf]"
                    style={{ left: i * D_PITCH + 0.5 }}
                    initial={{ height: 0 }}
                    animate={{ height: barH(col.amount) }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.04 * i }}
                  />
                )}
              </div>
            ))}

            {/* The selection marker: a black hairline from the baseline to the
                top gridline — the file's 156px — riding over the day's bar. */}
            <motion.div
              className="absolute bottom-0 w-px bg-black"
              style={{ height: D_SCALE_H }}
              initial={false}
              animate={{ left: selX }}
              transition={{ duration: 0.22, ease: EASE }}
            />
          </div>

          {/* Ticks under the baseline: one per day, the selected one black and
              a step wider, as the file draws it. */}
          <div className="relative mt-[8px] h-[6px]">
            {cols.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full w-px bg-bar"
                style={{ left: i * D_PITCH }}
              />
            ))}
            <motion.div
              className="absolute top-0 h-full w-[3px] -translate-x-[1px] bg-black"
              initial={false}
              animate={{ left: selX }}
              transition={{ duration: 0.22, ease: EASE }}
            />
          </div>

          {/* The two pills under the axis: the selected date (follows the
              scrub) and TODAY (fixed). When the scrub is on today they'd say
              the same thing twice, so the date pill yields — and when it
              merely gets close, TODAY fades out instead of colliding: the
              selection is what you're pointing at, TODAY is only a landmark. */}
          <div className="relative mt-[3px] h-[36px]">
            {selIdx !== todayIdx && (
              <motion.div
                className="absolute top-0 flex flex-col items-start drop-shadow-[0px_2px_0px_rgba(0,0,0,0.25)]"
                initial={false}
                animate={{ left: datePillLeft }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <img
                  src="/icons/pointer-wide.svg"
                  alt=""
                  className="-mb-[3px] block h-[8px] w-[34px] -scale-y-100"
                />
                <div className="rounded-[6px] bg-white p-[8px]">
                  <p className="whitespace-nowrap font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
                    {sel.day} Sep
                  </p>
                </div>
              </motion.div>
            )}
            <motion.div
              className="absolute top-0 flex flex-col items-start drop-shadow-[0px_2px_0px_rgba(0,0,0,0.25)]"
              style={{ left: todayIdx * D_PITCH }}
              initial={false}
              animate={{ opacity: pillsCollide ? 0 : 1 }}
              transition={{ duration: 0.18 }}
            >
              <img
                src="/icons/pointer-wide.svg"
                alt=""
                className="-mb-[3px] block h-[8px] w-[34px] -scale-y-100"
              />
              <div className="rounded-[6px] bg-white p-[8px]">
                <p className="whitespace-nowrap font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
                  Today
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Y labels, 10px serif on the file's 52px pitch (13px label + 39px
            gap), hung off the plot's right edge. */}
        <div className="flex w-[22px] shrink-0 flex-col gap-[39px]">
          {ticks.map((t) => (
            <p
              key={t}
              className="tnum whitespace-nowrap font-serif text-[10px] font-semibold leading-[1.3] text-ink-dim"
            >
              ₹{t === 0 ? "0" : (t / 1000).toFixed(1).replace(/\.0$/, "")}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

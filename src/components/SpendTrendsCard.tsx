import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { DAILY_SPEND, SPEND_AVG_WINDOW, SPEND_TRENDS, TODAY_DAY } from "../data";
import { percent, rupees, sum } from "../lib/format";
import useDragScroll from "../lib/useDragScroll";

/* ------------------------------------------------------------------ */
/* Monthly geometry — Figma 1489:165547 / 1505:199456.                 */

const M_PLOT_H = 167;
/** 24px bars on a 60px pitch — a 36px gap between neighbours, with each
    divider guide sitting dead centre in it, 18px off either bar. */
const M_BAR_W = 24;
const M_PITCH = 60;
/** Air after the last bar so the callout's right half isn't clipped by the
    rail edge. */
const M_PAD_RIGHT = 20;
/** One guide per gap, on the half-pixel so a 1px dashed line stays crisp. */
const M_GUIDES = SPEND_TRENDS.slice(1).map((_, i) => (i + 1) * M_PITCH - 18 + 0.5);
const M_GUIDE_UP = 14;
const M_GUIDE_DOWN = 25;
const TRACK_W = 30;
const THUMB_W = 8;

/* ------------------------------------------------------------------ */
/* Daily geometry — Figma 1507:210638. 20 day columns justify-between
   across a 302px plot (343 minus the 29px y-axis labels and their 12px
   gap), with today the 11th column — where the file parks its TODAY
   pill. Fits the gutter, so no rail.                                  */

const D_PLOT_W = 302;
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

/**
 * Both bodies stand exactly this tall, and both hang their plot off the same
 * 96px top gap.
 *
 * The daily view is naturally ~50px taller than the monthly one — it carries
 * a callout above the plot and two pills below it. Letting the stage animate
 * between the two heights walked the cash flow and habits cards down the
 * screen on every switch. Pinning both to the taller figure costs the monthly
 * view some air above its chart and buys two things: nothing below the
 * section ever moves, and the two plots occupy the same band, so switching
 * reads as the bars changing rather than the page relaying out.
 */
const STAGE_H = 319;
const TOP_GAP = 96;

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

  /* Monthly headline: the gap to the trailing average. The window is the last
     SPEND_AVG_WINDOW months, not the whole array — the earlier months are
     scrollable history, and rolling them into the average would drag the
     yardstick away from the half-year the design quotes. */
  const window = SPEND_TRENDS.slice(-SPEND_AVG_WINDOW);
  const average = sum(window.map((m) => m.amount)) / window.length;
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

      {/* A fixed stage, sized to the taller body — see STAGE_H. Nothing below
          this section moves when the view changes. */}
      <div className="relative w-full" style={{ height: STAGE_H }}>
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
      </div>
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
  const height = (value: number) => (value / ceiling) * M_PLOT_H;
  const plotW = (SPEND_TRENDS.length - 1) * M_PITCH + M_BAR_W;

  /* The AVG rule spans exactly the months it averages and stops 14px short of
     the live one (the file's clearance), so the marker states its own scope —
     the scrollable history to its left isn't in the figure. */
  const avgLeft = (SPEND_TRENDS.length - SPEND_AVG_WINDOW) * M_PITCH;
  const avgWidth = (SPEND_TRENDS.length - 1) * M_PITCH - 14 - avgLeft;

  /* Tap a month and the callout walks over to it with that month's figure —
     same idea as the daily scrubber, at month grain. Opens on the month in
     progress, which is what the file draws. */
  const [selIdx, setSelIdx] = useState(SPEND_TRENDS.length - 1);
  const selMonth = SPEND_TRENDS[selIdx];
  const selX = selIdx * M_PITCH + M_BAR_W / 2;

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

  /* A mouse can't pan an overflow box; touch can. */
  useDragScroll(rail);

  return (
    <div className="flex w-full flex-col items-center gap-[24px]">
      {/* Full-bleed, with the page gutter re-applied inside: the chart rests
          flush with the headline above it but runs clean under both screen
          edges once you drag it, rather than stopping short of them.

          The 48px gap under the headline lives INSIDE the scroll content, not
          above the rail: the callout stands ~44px proud of the tallest bar,
          and everything above the rail's content box gets clipped by its
          overflow — parked outside, the callout vanished whenever the tallest
          month was selected. */}
      <div
        ref={rail}
        onScroll={sync}
        className="rail -mx-[16px] w-[calc(100%+32px)] overflow-x-auto px-[16px]"
      >
        {/* The extra right padding keeps the callout's overhang inside the
            scrollable content instead of clipped at its edge. */}
        <div className="flex flex-col" style={{ width: plotW + M_PAD_RIGHT, paddingTop: TOP_GAP }}>
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
              const selected = i === selIdx;
              return (
                <button
                  key={month.key}
                  type="button"
                  aria-label={`${month.label}: ${rupees(month.amount)}`}
                  aria-pressed={selected}
                  onClick={() => setSelIdx(i)}
                  /* The hit area is the whole column, not the sliver of bar —
                     a 24px target at the bottom of a 167px plot is a stretch
                     to hit; the full pitch height isn't. */
                  className="absolute bottom-0 top-0"
                  style={{ left: i * M_PITCH - (M_PITCH - M_BAR_W) / 2, width: M_PITCH }}
                >
                  {/* The outline is the selection mark, and it travels with
                      the tap — it opens on the month in progress but isn't
                      its property. The colour flip is a transition so the
                      mark visibly hands over rather than teleporting. */}
                  <motion.div
                    className={[
                      "absolute bottom-0 border transition-colors duration-200",
                      selected ? "border-black bg-white" : "border-transparent bg-bar",
                    ].join(" ")}
                    style={{ left: (M_PITCH - M_BAR_W) / 2, width: M_BAR_W }}
                    initial={false}
                    animate={{ height: height(month.amount) }}
                    transition={{ duration: 0.45, ease: EASE }}
                  />
                </button>
              );
            })}

            {/* Sits at the average's own height rather than a fixed offset, so
                the marker can't drift away from the bars it describes. The rule
                stops short of the live bar — it's the history being averaged,
                not the month still running. */}
            <div
              className="absolute flex translate-y-1/2 items-center"
              style={{ bottom: height(average), left: avgLeft, width: avgWidth }}
            >
              <div className="h-px flex-1 border-t border-dashed border-gain" />
              <div className="rounded-[23px] border border-gain bg-white px-[8px] py-[2px]">
                <p className="whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] text-gain">
                  Avg {thousands(average)}
                </p>
              </div>
              <div className="h-px flex-1 border-t border-dashed border-gain" />
            </div>

            {/* Rides 8px above the selected bar's top edge and walks between
                months on tap — it tracks a value, not a parking spot. */}
            <div
              /* A CSS transition, not framer: with the popLayout ancestor,
                 framer stopped retargeting this element's `left` on update —
                 the callout always sat one selection behind. CSS transitions
                 have no opinion about the tree above them. */
              className="pointer-events-none absolute flex -translate-x-1/2 flex-col items-center drop-shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-[left,bottom] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ left: selX, bottom: height(selMonth.amount) + 8 }}
            >
              <div className="rounded-[3px] bg-white px-[8px] py-[4px]">
                <p className="whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] text-black">
                  {thousands(selMonth.amount)}
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
                    "absolute -translate-x-1/2 whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] transition-colors duration-200",
                    i === selIdx ? "text-black" : "text-axis",
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
    <div className="relative flex w-full flex-col" style={{ paddingTop: TOP_GAP }}>
      {/* Callout — SPENT ON / date / figure — pointing down at the selected
          column from above the plot, the file's flat 2px drop shadow and all.
          Left edge rides the column (the file parks it flush), clamped so it
          never leaves the plot. */}
      <motion.div
        className="tip-shadow absolute top-[24px] z-10 flex flex-col items-start"
        initial={false}
        animate={{ left: Math.min(Math.max(selX - 1, 0), D_PLOT_W - 120) }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        {/* The date joins the label on one line and the figure sits under it,
            so the card reads as one statement top to bottom instead of a
            heading over a two-column row. */}
        <div className="-mb-[3px] flex w-[120px] flex-col gap-[8px] rounded-[6px] bg-tip p-[8px]">
          <p className="font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
            Spent on {sel.day} Sep
          </p>
          <p className="tnum font-serif text-[12px] font-semibold leading-[1.3] text-black">
            {rupees(sel.amount)}
          </p>
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
                    className="absolute bottom-0 w-[4px] bg-[#cfcfcf]"
                    /* Static centring offset, not a translate class — framer
                       owns the transform once it animates. */
                    style={{ left: i * D_PITCH - 1.5 }}
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
              className="absolute top-0 h-full w-[3px] bg-black"
              style={{ x: -1 }}
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
                className="tip-shadow absolute top-0 flex flex-col items-start"
                initial={false}
                animate={{ left: datePillLeft }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <img
                  src="/icons/pointer-wide.svg"
                  alt=""
                  className="-mb-[3px] block h-[8px] w-[34px] -scale-y-100"
                />
                <div className="rounded-[6px] bg-tip p-[8px]">
                  <p className="whitespace-nowrap font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
                    {sel.day} Sep
                  </p>
                </div>
              </motion.div>
            )}
            <motion.div
              className="tip-shadow absolute top-0 flex flex-col items-start"
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
              <div className="rounded-[6px] bg-tip p-[8px]">
                <p className="whitespace-nowrap font-mono text-[11px] font-medium uppercase leading-[1.4] text-black">
                  Today
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Y labels, 10px serif on the file's 52px pitch (13px label + 39px
            gap), hung off the plot's right edge. 29px wide, which is what the
            ₹2.4K form needs — at 22px the unit wrapped. */}
        <div className="flex w-[29px] shrink-0 flex-col gap-[39px]">
          {ticks.map((t) => (
            <p
              key={t}
              className="tnum whitespace-nowrap font-serif text-[10px] font-semibold leading-[1.3] text-ink-dim"
            >
              ₹{t === 0 ? "0" : `${(t / 1000).toFixed(1).replace(/\.0$/, "")}K`}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

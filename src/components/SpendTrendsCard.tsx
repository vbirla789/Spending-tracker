import { motion } from "framer-motion";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { SPEND_TRENDS } from "../data";
import { percent, sum } from "../lib/format";

/* The file draws this plot at 321px, which fits the 343 column exactly and so
   can never be panned — the months are as small as they will ever be and the
   scroll indicator underneath has nothing to indicate. Everything horizontal
   is scaled by 1.5 and the whole thing put in a full-bleed rail: the file's
   proportions, bars wide enough to read, and somewhere to scroll. Vertical
   geometry is untouched, so the section still stands 167px tall. */
const SCALE = 1.5;
const PLOT_H = 167;
const BAR_W = 24 * SCALE;
const PITCH = 59.4 * SCALE;
const GUIDES = [34.5, 96.5, 158.5, 221.5, 283.5].map((x) => x * SCALE);
/** Stops short of the live bar — it's the history being averaged. */
const AVG_W = 283 * SCALE;

/* The guides overrun the plot: 14px into the headroom above the tallest bar
   and 25px past the baseline, so they read as a field the bars stand in
   rather than as ticks belonging to them. */
const GUIDE_UP = 14;
const GUIDE_DOWN = 25;

/** Track and thumb of the scroll indicator, straight from the file. */
const TRACK_W = 30;
const THUMB_W = 8;

/** ₹10,032 → "₹10k". The design labels in thousands; the data is in rupees. */
const thousands = (value: number) => `₹${Math.round(value / 1000)}k`;

/**
 * Spend trends — the screen's opening claim (Figma 1489:165547).
 *
 * Six months of spend with the current one outlined, measured against their
 * own average. It leads the screen rather than a balance because the brief
 * asks for "light insight on their spending, not just raw numbers": a bar you
 * can see sitting under the average says something a figure can't.
 *
 * Every number here is derived from SPEND_TRENDS — the headline percentage,
 * the AVG marker's value *and* its height, and the callout on the last bar.
 */
export default function SpendTrendsCard() {
  const amounts = SPEND_TRENDS.map((m) => m.amount);
  const average = sum(amounts) / amounts.length;
  const ceiling = Math.max(...amounts);
  const current = SPEND_TRENDS[SPEND_TRENDS.length - 1];

  /* Positive = spending below your own average, which is the good direction
     here — the opposite of every other delta on the screen, hence the caret
     pointing down in green rather than up. */
  const gap = (average - current.amount) / average;
  const below = gap >= 0;

  const height = (value: number) => (value / ceiling) * PLOT_H;
  const plotW = (SPEND_TRENDS.length - 1) * PITCH + BAR_W;
  const liveX = (SPEND_TRENDS.length - 1) * PITCH + BAR_W / 2;

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
    <section className="flex w-full shrink-0 flex-col gap-[48px]" aria-labelledby="st-label">
      <div className="flex flex-col items-start gap-[10px]">
        <p
          id="st-label"
          className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
        >
          Spend trends
        </p>

        <div className="flex items-baseline gap-[8px]">
          <p className="tnum font-serif text-[32px] font-semibold leading-[1.3] text-black">
            {percent(Math.abs(gap) * 100)}
          </p>
          {/* The exported glyph is a caret pointing up; the design flips it
              rather than shipping a second icon, so the flip is the state. */}
          <img
            src="/icons/caret-up.svg"
            alt=""
            className={`size-[20px] ${below ? "-scale-y-100" : ""}`}
          />
        </div>

        <p className="font-mono text-[12px] leading-[1.4] text-ink-dim">
          currently spending {below ? "less" : "more"} than usual,
          <br />
          there’s a room for little extra treat.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-[24px]">
        {/* Full-bleed, with the page gutter re-applied inside: the chart rests
            flush with the headline above it but runs clean under both screen
            edges once you drag it, rather than stopping short of them. */}
        <div
          ref={rail}
          onScroll={sync}
          className="rail -mx-[16px] w-[calc(100%+32px)] overflow-x-auto px-[16px]"
        >
          <div className="flex flex-col" style={{ width: plotW }}>
            <div className="relative" style={{ width: plotW, height: PLOT_H }}>
              {/* One SVG for the guides so the 2-2 dash pattern is exact — a
                  CSS dashed border rounds the pattern to fit the edge. */}
              <svg
                aria-hidden="true"
                className="absolute left-0"
                style={{ top: -GUIDE_UP, width: plotW, height: PLOT_H + GUIDE_UP + GUIDE_DOWN }}
              >
                {GUIDES.map((x) => (
                  <line
                    key={x}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={PLOT_H + GUIDE_UP + GUIDE_DOWN}
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
                    style={{ left: i * PITCH, width: BAR_W }}
                    initial={false}
                    animate={{ height: height(month.amount) }}
                    transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                  />
                );
              })}

              {/* Sits at the average's own height rather than a fixed offset,
                  so the marker can't drift away from the bars it describes. */}
              <div
                className="absolute left-0 flex translate-y-1/2 items-center"
                style={{ bottom: height(average), width: AVG_W }}
              >
                <div className="h-px flex-1 border-t border-dashed border-gain" />
                <div className="rounded-[23px] border border-gain bg-white px-[8px] py-[2px]">
                  <p className="whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4] text-gain">
                    Avg {thousands(average)}
                  </p>
                </div>
                <div className="h-px flex-1 border-t border-dashed border-gain" />
              </div>

              {/* Rides 8px above the live bar's top edge, so it tracks the
                  value instead of being parked at a hard-coded y. */}
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
              {/* Inside the rail, so the labels travel with the bars they
                  name. Centred on each bar rather than laid out as an even
                  row, which would drift out of register as soon as the pitch
                  changed. */}
              <div className="relative h-[17px] w-full">
                {SPEND_TRENDS.map((month, i) => (
                  <p
                    key={month.key}
                    className={[
                      "absolute -translate-x-1/2 whitespace-nowrap font-mono text-[12px] font-medium uppercase leading-[1.4]",
                      month.key === current.key ? "text-black" : "text-axis",
                    ].join(" ")}
                    style={{ left: i * PITCH + BAR_W / 2 }}
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
    </section>
  );
}

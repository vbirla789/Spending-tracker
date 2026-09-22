import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { CASH_FLOW } from "../data";
import Money from "../lib/mask";
import useDragScroll from "../lib/useDragScroll";

/** Tallest bar in the design. Every bar is scaled against the same ceiling. */
const BAR_MAX_PX = 52;

/**
 * Four months of money in vs money out.
 *
 * Tapping a month selects it and the three rows below recalculate. Bar heights
 * are derived from a single ceiling across all months, so a tall bar in May is
 * genuinely taller than a short one in July — the columns are comparable, not
 * per-tile normalised.
 */
export default function CashFlowSection() {
  /* Opens on the newest month with the row resting at its right edge, so the
     three figures below describe where you are rather than where you were
     five months ago. */
  const newest = CASH_FLOW[CASH_FLOW.length - 1];
  const [activeKey, setActiveKey] = useState(newest.key);
  const active = CASH_FLOW.find((m) => m.key === activeKey) ?? newest;

  const ceiling = Math.max(...CASH_FLOW.flatMap((m) => [m.income, m.expenses]));
  const scale = (value: number) => Math.max(4, Math.round((value / ceiling) * BAR_MAX_PX));

  const net = active.income - active.expenses;

  /* Touch pans the tile rail natively; a mouse has no gesture for it, so
     grab-and-drag stands in on laptops. Dragging suppresses the tile click. */
  const rail = useRef<HTMLDivElement>(null);
  useDragScroll(rail);

  /* Parked at the newest month by scroll position, NOT justify-end: a
     justify-end flex scroller pushes its overflow past the start edge, where
     scrollLeft can never go — the older months were unreachable on every
     input, which read as "the rail doesn't scroll". */
  useLayoutEffect(() => {
    const el = rail.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    /* Now a card like the others, rather than bare section on the canvas —
       with the backdrop grid behind everything, an unbounded section had
       nothing separating it from the pattern. */
    <section
      /* shrink-0 is load-bearing: `overflow-hidden` resolves a flex item's
         min-height to 0, so inside the scrolling column this card would
         happily squash to its padding and swallow everything in it. */
      className="w-full shrink-0 overflow-hidden border border-hair bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]"
      aria-labelledby="cf-label"
    >
      {/* The title owns its own padded band and the rule runs the full width
          of the card beneath it — an inset rule would read as a divider
          inside the content rather than as the edge of a header. */}
      <div className="flex w-full flex-col px-[16px] py-[12px]">
        <p
          id="cf-label"
          className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
        >
          Cash flow
        </p>
      </div>
      <div className="h-px w-full bg-hair" />

      <div className="flex flex-col gap-[32px] p-[16px]">
        {/* The rail bleeds to the card's edges and re-applies the 16px card
            padding inside itself, so the newest tile lines up with the figures
            below while the older ones run out under the card edge.
            justify-end parks it on that newest tile. */}
        <div
          ref={rail}
          className="rail -mx-[16px] flex w-[calc(100%+32px)] gap-[16px] overflow-x-auto px-[16px]"
          role="tablist"
          aria-label="Month"
        >
          {CASH_FLOW.map((month, i) => {
            const selected = month.key === activeKey;
            return (
              <button
                key={month.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(month.key)}
                className={[
                  // ml-auto on the first tile right-aligns the row when it
                  // fits without the justify-end overflow trap.
                  i === 0 ? "ml-auto" : "",
                  // 78×104 from the Figma. justify-end pins the bars and label
                  // to the bottom, so short months leave their headroom above
                  // rather than floating mid-tile.
                  "flex h-[104px] w-[78px] shrink-0 flex-col items-center justify-end gap-[8px] overflow-hidden",
                  "rounded-[1px] border bg-white px-[12px] pb-[8px] pt-[12px] transition-colors duration-150",
                  // Both states are white; the border and the label carry the
                  // selection. The bars stay at full strength either way —
                  // dimming them would make the unselected months harder to
                  // compare, which is the only reason they're on screen.
                  //
                  // The selected tile drops its bottom edge so it opens onto
                  // the figures below rather than closing itself off from
                  // them — those three rows are this month, and a complete
                  // box said the opposite.
                  selected ? "border-black border-b-transparent" : "border-hair",
                ].join(" ")}
              >
                <div className="flex items-end gap-[12px]">
                  <motion.div
                    className="w-[20px] bg-income"
                    initial={false}
                    animate={{ height: scale(month.income) }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  />
                  <motion.div
                    className="w-[20px] bg-expense"
                    initial={false}
                    animate={{ height: scale(month.expenses) }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <p
                  className={[
                    "font-mono text-[12px] font-medium uppercase leading-[1.4]",
                    selected ? "tracking-[0.6px] text-black" : "tracking-[1px] text-ink-dim",
                  ].join(" ")}
                >
                  {month.label}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[16px]">
            <Row swatch="bg-income" label="Incoming" value={active.income} />
            {/* Negated so the figure itself carries the minus and NumberFlow
                can roll it, rather than gluing a sign onto a positive. */}
            <Row swatch="bg-expense" label="Outgoing" value={-active.expenses} />
          </div>
          <div className="h-px w-full bg-hair" />
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-[8px]">
              {/* The net row gets a swatch of its own now — without one it
                  read as a footnote to the two rows above rather than as the
                  third quantity they add up to. */}
              <div className="size-[12px] shrink-0 rounded-[2px] bg-net" />
              <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
                Net cash flow
              </p>
            </div>
            <Money
              value={net}
              signed
              className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ swatch, label, value }: { swatch: string; label: string; value: number }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-[8px]">
        <div className={`size-[12px] shrink-0 rounded-[2px] ${swatch}`} />
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

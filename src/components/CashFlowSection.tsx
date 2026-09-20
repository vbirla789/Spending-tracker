import { motion } from "framer-motion";
import { useState } from "react";
import { CASH_FLOW } from "../data";
import Money from "../lib/mask";

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
  /* Opens on the first month, with the row resting at its left edge — you
     read the run of months forwards and scroll into the recent ones. */
  const [activeKey, setActiveKey] = useState(CASH_FLOW[0].key);
  const active = CASH_FLOW.find((m) => m.key === activeKey) ?? CASH_FLOW[0];

  const ceiling = Math.max(...CASH_FLOW.flatMap((m) => [m.income, m.expenses]));
  const scale = (value: number) => Math.max(4, Math.round((value / ceiling) * BAR_MAX_PX));

  const net = active.income - active.expenses;

  return (
    /* Now a card like the others, rather than bare section on the canvas —
       with the backdrop grid behind everything, an unbounded section had
       nothing separating it from the pattern. */
    <section
      /* shrink-0 is load-bearing: `overflow-hidden` resolves a flex item's
         min-height to 0, so inside the scrolling column this card would
         happily squash to its padding and swallow everything in it. */
      className="w-full shrink-0 overflow-hidden rounded-[12px] border border-hair bg-card p-[16px] shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]"
      aria-labelledby="cf-label"
    >
      <div className="mb-[16px] flex w-full flex-col gap-[12px]">
        <p
          id="cf-label"
          className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
        >
          Cash flow
        </p>
        <div className="h-px w-full bg-hair" />
      </div>

      <div className="flex flex-col gap-[32px]">
        {/* The rail bleeds to the card's edges and re-applies the 16px card
            padding inside itself, so the first tile lines up with the "Cash
            flow" label while the rest still run under the card edge. */}
        <div
          className="rail -mx-[16px] flex w-[calc(100%+32px)] gap-[16px] overflow-x-auto px-[16px]"
          role="tablist"
          aria-label="Month"
        >
          {CASH_FLOW.map((month) => {
            const selected = month.key === activeKey;
            return (
              <button
                key={month.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(month.key)}
                className={[
                  // 78×104 from the Figma. justify-end pins the bars and label
                  // to the bottom, so short months leave their headroom above
                  // rather than floating mid-tile.
                  "flex h-[104px] w-[78px] shrink-0 flex-col items-center justify-end gap-[8px] overflow-hidden",
                  "rounded-[8px] border bg-white px-[12px] pb-[8px] pt-[12px] transition-colors duration-150",
                  // Both states are white now; the border and the label carry
                  // the selection, same as the range pills.
                  selected ? "border-black" : "border-hair",
                ].join(" ")}
              >
                {/* Unselected months sit back at 40% so the chosen one reads as
                    the subject and the rest as context. */}
                <div
                  className={[
                    "flex items-end gap-[12px] transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-40",
                  ].join(" ")}
                >
                  <motion.div
                    className="w-[20px] rounded-[4px] bg-income"
                    initial={false}
                    animate={{ height: scale(month.income) }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  />
                  <motion.div
                    className="w-[20px] rounded-[4px] bg-expense"
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
            <Row swatch="bg-income" label="Income" value={active.income} />
            {/* Negated so the figure itself carries the minus and NumberFlow
                can roll it, rather than gluing a sign onto a positive. */}
            <Row swatch="bg-expense" label="Expenses" value={-active.expenses} />
          </div>
          <div className="h-px w-full bg-hair" />
          <div className="flex w-full items-center justify-between">
            <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
              Net cash flow
            </p>
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

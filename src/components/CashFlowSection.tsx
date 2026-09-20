import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { CASH_FLOW } from "../data";
import Money from "../lib/mask";

/** Tallest bar in the design. Every bar is scaled against the same ceiling. */
const BAR_MAX_PX = 59;

/**
 * Four months of money in vs money out.
 *
 * Tapping a month selects it and the three rows below recalculate. Bar heights
 * are derived from a single ceiling across all months, so a tall bar in May is
 * genuinely taller than a short one in July — the columns are comparable, not
 * per-tile normalised.
 */
export default function CashFlowSection() {
  const [activeKey, setActiveKey] = useState(CASH_FLOW[CASH_FLOW.length - 1].key);
  const active = CASH_FLOW.find((m) => m.key === activeKey) ?? CASH_FLOW[0];
  const scroller = useRef<HTMLDivElement>(null);

  const ceiling = Math.max(...CASH_FLOW.flatMap((m) => [m.income, m.expenses]));
  const scale = (value: number) => Math.max(4, Math.round((value / ceiling) * BAR_MAX_PX));

  const net = active.income - active.expenses;

  /* Open on the most recent month. Before paint, so it doesn't read as the
     row scrolling itself on load. */
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <section className="flex w-full flex-col gap-[24px]" aria-labelledby="cf-label">
      <p
        id="cf-label"
        className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
      >
        Cash flow
      </p>

      <div className="flex flex-col gap-[32px]">
        {/* Full-bleed scroll rail. It escapes the 20px page gutter on both
            sides and carries no horizontal padding of its own, so tiles run
            clean off each edge instead of stopping short of them — the row
            reads as continuing past the screen rather than being boxed. */}
        <div
          ref={scroller}
          className="rail -mx-[20px] flex w-[calc(100%+40px)] gap-[16px] overflow-x-auto"
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
                  "flex h-[110px] shrink-0 flex-col items-center justify-end gap-[12px] overflow-hidden",
                  "rounded-[8px] border px-[12px] pb-[8px] pt-[12px] transition-colors duration-150",
                  selected ? "border-black bg-white" : "border-hair bg-well",
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
                    className="w-[24px] rounded-[4px] bg-income"
                    initial={false}
                    animate={{ height: scale(month.income) }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  />
                  <motion.div
                    className="w-[24px] rounded-[4px] bg-expense"
                    initial={false}
                    animate={{ height: scale(month.expenses) }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
                <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
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
        <div className={`size-[14px] shrink-0 rounded-[2px] ${swatch}`} />
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

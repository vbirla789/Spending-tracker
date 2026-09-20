import NumberFlow from "@number-flow/react";
import { createContext, useContext, type ReactNode } from "react";

const MaskContext = createContext(false);

export function MaskProvider({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return <MaskContext.Provider value={hidden}>{children}</MaskContext.Provider>;
}

export const useMasked = () => useContext(MaskContext);

/** en-IN gives ₹ with Indian digit grouping (₹1,23,456) for free. */
const LOCALE = "en-IN";

/* Declared `as const` rather than typed as Intl.NumberFormatOptions —
   NumberFlow's own Format type wants the literal union members, and the
   widened `style: string` from the Intl interface doesn't satisfy it. */
const FORMAT = {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
} as const;

/* "always" keeps the + on a positive delta, which is the whole point of
   showing a delta. */
const FORMAT_SIGNED = { ...FORMAT, signDisplay: "always" } as const;

/**
 * A money figure that shuffles between values and can hide itself.
 *
 * Visible state is a NumberFlow, so switching range or month rolls the digits
 * to their new value rather than swapping the string — the figure reads as the
 * same money being recalculated, which is what actually happened.
 *
 * Hidden state replaces the digits with one dot each and keeps the symbol and
 * sign, so "₹61,200" becomes "₹ ●●●●●". Dots rather than a blur: a blur still
 * leaks the shape of the number and reads as a rendering fault rather than a
 * deliberate state. Digit count is preserved so the width still feels like
 * *your* number.
 */
export default function Money({
  value,
  signed = false,
  className,
}: {
  value: number;
  /** Show an explicit + on positive values. Used for deltas and net flow. */
  signed?: boolean;
  className?: string;
}) {
  const hidden = useMasked();

  const rounded = Math.round(value);
  const sign = signed ? (rounded < 0 ? "−" : "+") : rounded < 0 ? "−" : "";
  const digitCount = Math.abs(rounded).toLocaleString(LOCALE).replace(/\D/g, "").length;

  /* The wrapper is pinned to exactly one line-height (`1lh`) and both states
     live inside it.

     Without this the screen jumps on every toggle: a 0.52em dot is an
     inline-level box that sits on the baseline, so a row of them grows the
     line box past the digits' ascender. The figure got a few pixels taller,
     and because these cards are stacked in a flex column that shift
     cascaded down the whole page. An explicit height on a flex container
     means its children can't grow it, so the box is identical either way. */
  return (
    <span className={`inline-flex h-[1lh] items-center ${className ?? ""}`}>
      {hidden ? (
        <span className="inline-flex items-center gap-[0.22em]" aria-label="Hidden">
          <span>{sign}₹</span>
          <span className="inline-flex items-center gap-[0.2em]">
            {Array.from({ length: digitCount }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block size-[0.52em] rounded-full bg-current"
              />
            ))}
          </span>
        </span>
      ) : (
        <NumberFlow
          value={rounded}
          locales={LOCALE}
          format={signed ? FORMAT_SIGNED : FORMAT}
          // Hints the compositor before the roll starts; without it the first
          // digit change after an idle period drops frames.
          willChange
        />
      )}
    </span>
  );
}

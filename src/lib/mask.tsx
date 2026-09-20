import { AnimatePresence, motion } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";

const MaskContext = createContext(false);

export function MaskProvider({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return <MaskContext.Provider value={hidden}>{children}</MaskContext.Provider>;
}

export const useMasked = () => useContext(MaskContext);

/**
 * Runs the shimmer band over its contents as they mount.
 *
 * The band is a sibling overlay that fades itself out in its own final
 * keyframe, so there is nothing to tear down — see `.shimmer-band`. It mounts
 * fresh on every toggle because AnimatePresence keys the two states apart,
 * which is what restarts the animation.
 */
function Sweep({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={["shimmer-host", className ?? ""].join(" ")}>
      {children}
      <span className="shimmer-band" aria-hidden="true" />
    </span>
  );
}

/**
 * A money figure that can hide itself.
 *
 * Hidden state replaces the digits with one dot each and keeps the symbol and
 * sign — so "₹61,200" becomes "₹ ●●●●●". Dots rather than a blur: a blur still
 * leaks the shape of the number and reads as a rendering fault rather than a
 * deliberate state.
 *
 * Both directions play a skeleton-style shimmer sweep (`.shimmer-sweep`) as
 * they swap. The figure isn't loading, but the sweep is the gesture people
 * already read as "this value is being resolved", which is exactly what
 * covering and uncovering it should feel like.
 *
 * Digit count is preserved (not padded to a fixed length) because the width
 * should still feel like *your* number, and because a figure that changes
 * length on hide would jog the layout.
 */
export default function Money({
  text,
  className,
  dotClassName,
}: {
  /** Pre-formatted string, e.g. "₹61,200" or "−₹1,488". */
  text: string;
  className?: string;
  dotClassName?: string;
}) {
  const hidden = useMasked();

  // Everything before the first digit is the prefix: the sign and the symbol.
  const firstDigit = text.search(/\d/);
  const prefix = firstDigit === -1 ? text : text.slice(0, firstDigit);
  const digitCount = (text.match(/\d/g) ?? []).length;

  return (
    <span className={className} aria-label={hidden ? "Hidden" : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <motion.span
            key="masked"
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            <Sweep className="inline-flex items-center gap-[0.22em]">
              <span>{prefix}</span>
              <span className="inline-flex items-center gap-[0.2em]">
                {Array.from({ length: digitCount }, (_, i) => (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    className={[
                      "inline-block size-[0.52em] rounded-full bg-current",
                      dotClassName ?? "",
                    ].join(" ")}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    // Dots land left to right, so hiding reads as the number
                    // being covered over rather than swapped out.
                    transition={{
                      duration: 0.2,
                      delay: i * 0.03,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  />
                ))}
              </span>
            </Sweep>
          </motion.span>
        ) : (
          <motion.span
            key="clear"
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Sweep className="inline-block">{text}</Sweep>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

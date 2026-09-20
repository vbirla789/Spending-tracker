import type { ReactNode } from "react";

/**
 * The rounded control used for both the net-worth range switcher and the
 * habits month picker — the Figma's "Price pill" component in its two states.
 *
 * Both states are now white; only the border and text weight separate them.
 * Selected takes a black hairline and black text (plus the backdrop blur, so
 * it stays legible where it overlaps the grid backdrop); unselected takes the
 * lighter #e0e0e0 hairline and dim text.
 */
export default function Pill({
  children,
  selected = false,
  onClick,
  ariaLabel,
  role,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  role?: "tab" | "button";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      aria-selected={role === "tab" ? selected : undefined}
      className={[
        "flex shrink-0 items-center justify-center gap-[4px] rounded-[40px] border px-[10px] py-[8px]",
        "font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[1px]",
        // 44px minimum touch target without changing the visual height: the
        // pill stays 33px tall and the tap area is grown with a pseudo-element.
        "relative after:absolute after:inset-x-0 after:top-1/2 after:h-[44px] after:-translate-y-1/2 after:content-['']",
        "transition-colors duration-150",
        selected
          ? "border-black bg-white text-black backdrop-blur-[4px]"
          : "border-hair-pill bg-white text-ink-dim hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

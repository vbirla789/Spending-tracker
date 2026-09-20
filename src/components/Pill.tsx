import type { ReactNode } from "react";

/**
 * The rounded control used for both the net-worth range switcher and the
 * habits month picker. Selected is white with a black hairline; unselected is
 * the `well` fill with a grey hairline and dim text — the Figma's "Price pill"
 * component in its two states.
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
          ? "border-black bg-white text-black"
          : "border-hair bg-well text-ink-dim hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

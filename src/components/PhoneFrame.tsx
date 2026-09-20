import type { ReactNode } from "react";

/**
 * iPhone shell so the screen reads as a real app on desktop. On an actual
 * phone we drop the bezel (`bare`) and run edge-to-edge, so the prototype
 * feels like the installed app rather than a picture of one.
 */
export default function PhoneFrame({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    // No padding here on purpose — any `absolute inset-0` overlay resolves
    // against this box, so padding would leave uncovered strips at the notch
    // and the home indicator. Screens carry the insets themselves.
    return <div className="relative h-svh w-full overflow-hidden bg-canvas">{children}</div>;
  }

  return (
    <div className="relative">
      <div className="relative h-[812px] w-[375px] rounded-[54px] bg-[#1a1a1f] p-[5px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        {/* the notch ships with StatusBar, so the frame itself stays clean */}
        <div className="relative h-full w-full overflow-hidden rounded-[49px] bg-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}

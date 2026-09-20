import { useState } from "react";
import CashFlowSection from "../components/CashFlowSection";
import HabitsCard from "../components/HabitsCard";
import HomeBar from "../components/HomeBar";
import NetWorthCard from "../components/NetWorthCard";
import SpentThisMonthCard from "../components/SpentThisMonthCard";
import StatusBar from "../components/StatusBar";
import { MaskProvider } from "../lib/mask";

/**
 * Overview — Figma node 1313:389718.
 *
 * Structure follows the file exactly: a 16px gap between the header block and
 * the content column, then a 40px rhythm between the four sections. Only the
 * content column scrolls, so the header buttons stay reachable on a tall page.
 */
export default function Overview() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="flex h-full w-full flex-col gap-[16px] overflow-hidden bg-canvas">
      <header className="safe-top flex w-full shrink-0 flex-col items-center">
        <StatusBar />
        <div className="flex w-full items-center justify-between px-[20px] py-[12px]">
          <button
            type="button"
            aria-label="Profile"
            className="card-shadow flex size-[40px] shrink-0 items-center justify-center rounded-full border border-hair-icon bg-white transition-transform duration-150 active:scale-95"
          >
            <img src="/icons/profile.svg" alt="" className="size-[20px]" />
          </button>
          {/* The eye is the only affordance in the design that implies a
              state, so it owns balance privacy. Figures swap to one dot per
              digit — see lib/mask. */}
          <button
            type="button"
            aria-pressed={hidden}
            aria-label={hidden ? "Show balances" : "Hide balances"}
            onClick={() => setHidden((v) => !v)}
            className="card-shadow flex size-[40px] shrink-0 items-center justify-center rounded-full border border-hair-icon bg-white transition-transform duration-150 active:scale-95"
          >
            {/* Two icon variants from the Figma component (node 1316:389909):
                Active=yes is the eye, Active=no is the eye-slash. The icon
                itself carries the state — dimming it only said "disabled". */}
            <img
              src={hidden ? "/icons/eye-slash.svg" : "/icons/eye.svg"}
              alt=""
              className="size-[20px]"
            />
          </button>
        </div>
      </header>

      <main className="phone-scroll safe-bottom flex min-h-0 flex-1 flex-col gap-[40px] overflow-y-auto px-[20px] pb-[24px]">
        <MaskProvider hidden={hidden}>
          <NetWorthCard />
          <CashFlowSection />
          <HabitsCard />
          <SpentThisMonthCard />
        </MaskProvider>
      </main>

      <HomeBar />
    </div>
  );
}

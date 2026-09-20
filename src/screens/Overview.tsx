import { useState } from "react";
import AskSonarCard from "../components/AskSonarCard";
import AskSonarFab from "../components/AskSonarFab";
import CashFlowSection from "../components/CashFlowSection";
import GridBackdrop from "../components/GridBackdrop";
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
export default function Overview({ onAsk }: { onAsk: (question: string) => void }) {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col gap-[16px] overflow-hidden bg-canvas">
      <GridBackdrop />

      <header className="safe-top relative flex w-full shrink-0 flex-col items-center">
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

      {/* pb clears the floating pill, so the last card can scroll past it
          instead of ending underneath it */}
      <main className="phone-scroll safe-bottom relative flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto px-[20px] pb-[84px]">
        <MaskProvider hidden={hidden}>
          <NetWorthCard />
          <CashFlowSection />
          {/* Slotted where the Figma has it — after the hard numbers, before
              the behavioural cards. This entry asks a specific question; the
              floating pill below opens the agent to ask your own. */}
          <AskSonarCard onAsk={onAsk} />
          <HabitsCard />
          <SpentThisMonthCard />
        </MaskProvider>
      </main>

      {/* Empty string opens Sonar at its intro screen rather than with a
          question already asked — see App. */}
      <AskSonarFab onOpen={() => onAsk("")} />

      <HomeBar />
    </div>
  );
}

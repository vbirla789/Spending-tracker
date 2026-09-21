import CashFlowSection from "../components/CashFlowSection";
import HabitsCard from "../components/HabitsCard";
import HomeBar from "../components/HomeBar";
import AskSonarButton from "../components/AskSonarButton";
import SpendTrendsCard from "../components/SpendTrendsCard";
import StatusBar from "../components/StatusBar";

/**
 * Overview — Figma node 1489:154535.
 *
 * Three sections on a 32px rhythm, inset 16px from the page edge. The header
 * keeps the wider 20px gutter the design gives it, so the profile button and
 * the Ask SONAR pill sit a little outside the content column rather than
 * lining up with it.
 */
export default function Overview({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    /* Dot paper, not the ruled grid — the backdrop changed with this version
       of the design, which also makes it match the agent sheet that slides up
       over it. */
    <div className="dot-paper relative flex h-full w-full flex-col overflow-hidden">
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

          {/* The agent used to be reached from a pill floating over the
              scroller. It lives in the header now, which is why nothing
              hides on scroll any more — a header button can't get lost
              behind content the way a floating one could. */}
          <AskSonarButton onOpen={() => onAsk("")} />
        </div>
      </header>

      <main className="phone-scroll safe-bottom relative mt-[32px] flex min-h-0 flex-1 flex-col gap-[32px] overflow-y-auto px-[16px] pb-[32px]">
        <SpendTrendsCard />
        <CashFlowSection />
        <HabitsCard />
      </main>

      <HomeBar />
    </div>
  );
}

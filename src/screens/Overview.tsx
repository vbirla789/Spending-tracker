import { useLayoutEffect, useRef, useState } from "react";
import AskSonarCard from "../components/AskSonarCard";
import AskSonarFab from "../components/AskSonarFab";
import CashFlowSection from "../components/CashFlowSection";
import GridBackdrop from "../components/GridBackdrop";
import HabitsCard from "../components/HabitsCard";
import HomeBar from "../components/HomeBar";
import NetWorthCard from "../components/NetWorthCard";
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

  /* Hide the floating pill while you're reading down the page, bring it back
     the moment you scroll up — the pattern every content app uses, on the
     assumption that scrolling up means you're looking for a control.
     The 6px threshold ignores the jitter of a finger resting on the glass,
     which would otherwise flicker it; under 40px it always shows, so it can't
     get stranded off-screen at the top. */
  const [fabVisible, setFabVisible] = useState(true);
  const lastScroll = useRef(0);

  /* The pinned block's height drives the scroller's top spacer. Observed
     rather than measured once, because hiding balances reflows the delta
     line and the block changes height under us. */
  const pinned = useRef<HTMLDivElement>(null);
  const [pinnedHeight, setPinnedHeight] = useState(0);

  useLayoutEffect(() => {
    const el = pinned.current;
    if (!el) return;
    const sync = () => setPinnedHeight(el.getBoundingClientRect().height);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function onScroll(e: React.UIEvent<HTMLElement>) {
    const y = e.currentTarget.scrollTop;
    const dy = y - lastScroll.current;
    if (Math.abs(dy) < 6) return;
    setFabVisible(dy < 0 || y < 40);
    lastScroll.current = y;
  }

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

      <MaskProvider hidden={hidden}>
        <div className="relative min-h-0 flex-1">
          {/* Pinned. Net worth doesn't scroll — the cards ride up over it, so
              the figure you opened the app for stays put while you read the
              detail. Measured rather than hard-coded, since the delta line
              reflows when balances are hidden. */}
          <div ref={pinned} className="absolute inset-x-0 top-0 z-0 px-[20px]">
            <NetWorthCard />
          </div>

          <main
            onScroll={onScroll}
            className="phone-scroll absolute inset-0 z-10 overflow-y-auto overflow-x-hidden"
          >
            {/* Transparent spacer the height of the pinned block, so the sheet
                below starts level with it and the chart shows through. */}
            <div style={{ height: pinnedHeight }} aria-hidden />

            {/* The sheet. Opaque, so it occludes the chart as it rises; it
                carries its own backdrop so the grid texture doesn't stop at
                its top edge. pt is the 36px gap under the range pills; pb
                clears the floating pill. */}
            <div className="relative min-h-full bg-canvas">
              <GridBackdrop />
              <div className="safe-bottom relative flex flex-col gap-[24px] px-[20px] pb-[84px] pt-[36px]">
                <CashFlowSection />
                {/* Slotted where the Figma has it — after the hard numbers,
                    before the behavioural cards. This entry asks a specific
                    question; the floating pill opens the agent to ask your
                    own. */}
                <AskSonarCard onAsk={onAsk} />
                <HabitsCard />
              </div>
            </div>
          </main>
        </div>
      </MaskProvider>

      {/* Empty string opens Sonar at its intro screen rather than with a
          question already asked — see App. */}
      <AskSonarFab onOpen={() => onAsk("")} visible={fabVisible} />

      <HomeBar />
    </div>
  );
}

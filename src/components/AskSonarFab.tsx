/**
 * The persistent way into Sonar, floating above the home indicator.
 *
 * Distinct from the "Question of the day" card: that one asks a specific
 * question, this one just opens the agent at its intro screen (Figma
 * 1328:425040) so you can ask your own. Same brand treatment as the card's
 * CTA — the tint wash, the #4546ce hairline and the gradient label — so the
 * two read as the same door rather than two different features.
 */
export default function AskSonarFab({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[34px] z-20 flex justify-center">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Ask Sonar"
        /* backdrop-blur because it sits over scrolling content — a flat white
           pill would look pasted on once a card slid underneath it. */
        className="pointer-events-auto flex items-center gap-[8px] rounded-full border border-[#4546ce] px-[20px] py-[12px] backdrop-blur-[6px] transition-transform duration-150 active:scale-[0.97]"
        style={{
          backgroundImage:
            "linear-gradient(161.6deg, rgba(65,70,206,0.06) 1.8%, rgba(191,61,235,0.06) 98.7%), linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.92) 100%)",
          boxShadow: "0 6px 20px 0 rgba(47,48,55,0.10), 0 1px 2px 0 rgba(34,42,53,0.06)",
        }}
      >
        <img src="/icons/ai-magic.svg" alt="" className="size-[16px]" />
        <span
          className="bg-clip-text text-[14px] font-semibold leading-[18px] tracking-[-0.14px] text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #4146ce 0%, #bf3deb 54.5%)" }}
        >
          Ask SONAR
        </span>
      </button>
    </div>
  );
}

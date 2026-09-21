/**
 * The way into Sonar, sitting in the Overview header (Figma 1489:165541).
 *
 * It used to float over the scroller and hide itself on the way down. Moving
 * it into the header costs the screen nothing — the header doesn't scroll —
 * and buys back the scroll-direction logic the floating version needed just
 * to stay out of the content's way.
 *
 * The label is painted with the brand gradient via background-clip rather
 * than a flat brand colour, so the two stops that run through the icon carry
 * through the word as well.
 */
export default function AskSonarButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex shrink-0 items-center justify-center gap-[8px] overflow-hidden rounded-[50px] border border-[#4546ce] bg-white px-[12px] py-[8px] transition-transform duration-150 active:scale-95"
    >
      <img src="/icons/ai-magic.svg" alt="" className="size-[16px]" />
      {/* The Figma sets this in noon's `noontree` Bold, which isn't available
          here — it renders uppercase in the file, and Geist Mono is what every
          other control on this screen already uses, so the substitution keeps
          the label in the system rather than inventing a third typeface.
          Size, line-height and tracking are the design's label3 token. */}
      <span
        className="bg-clip-text font-mono text-[14px] font-medium uppercase leading-[18px] tracking-[-0.14px] text-transparent"
        style={{ backgroundImage: "linear-gradient(90deg, #4146ce 0%, #bf3deb 54.5%)" }}
      >
        Ask SONAR
      </span>
    </button>
  );
}

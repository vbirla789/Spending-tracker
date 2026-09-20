import { QUESTION_OF_THE_DAY } from "../lib/agent";

/**
 * The agent's touchpoint on the Overview (Figma 1329:436634).
 *
 * A question rather than a search box: it shows what Sonar can be asked
 * instead of asking the reader to imagine it, which is the whole reason this
 * sits on home rather than a bare "Ask AI" button.
 */
export default function AskSonarCard({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <section
      className="w-full shrink-0 overflow-hidden rounded-[12px] border border-hair bg-card p-[16px] shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]"
      aria-labelledby="qotd-label"
    >
      <div className="mb-[16px] flex w-full flex-col gap-[12px]">
        <p
          id="qotd-label"
          className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim"
        >
          Question of the day
        </p>
        <div className="h-px w-full bg-hair" />
      </div>

      <div className="flex w-full flex-col gap-[20px]">
        <p className="font-mono text-[16px] font-medium leading-[1.4] tracking-[0.6px] text-black">
          {QUESTION_OF_THE_DAY}
        </p>

        <button
          type="button"
          onClick={() => onAsk(QUESTION_OF_THE_DAY)}
          className="flex w-full items-center justify-center gap-[8px] overflow-hidden rounded-[8px] border border-[#4546ce] px-[12px] py-[8px] transition-transform duration-150 active:scale-[0.99]"
          /* A 5% wash of the same two brand stops the label is painted with,
             so the button reads as tinted rather than filled. */
          style={{
            backgroundImage:
              "linear-gradient(161.6deg, rgba(65,70,206,0.05) 1.8%, rgba(191,61,235,0.05) 98.7%), linear-gradient(90deg, #fff 0%, #fff 100%)",
          }}
        >
          <img src="/icons/ai-magic.svg" alt="" className="size-[16px]" />
          {/* The Figma sets this in noon's `noontree` Bold, which isn't
              available here — it renders uppercase in the file, and Geist Mono
              is what every other control on this screen already uses, so the
              substitution keeps the label in the system rather than inventing
              a third typeface. Size, line-height and tracking are the design's
              label3 token. */}
          <span
            className="bg-clip-text font-mono text-[14px] font-semibold uppercase leading-[18px] tracking-[-0.14px] text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, #4146ce 0%, #bf3deb 54.5%)",
            }}
          >
            Ask SONAR
          </span>
        </button>
      </div>
    </section>
  );
}

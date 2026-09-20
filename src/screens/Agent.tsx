import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ChatInput from "../components/ChatInput";
import HomeBar from "../components/HomeBar";
import StatusBar from "../components/StatusBar";
import { answerFor, SUGGESTIONS, type Answer } from "../lib/agent";
import { rupees, signedRupees } from "../lib/format";

type Turn = { id: number; question: string; answer: Answer };

/**
 * Sonar — the agent screen (Figma 1328:391858).
 *
 * Two states in one screen rather than two routes: empty, where the orb and
 * the suggestion chips do the teaching, and conversation, where the question
 * moves up into the header and the thread fills the body. The input is the
 * same component in both, so it doesn't jump when the state changes.
 */
export default function Agent({
  initialQuestion,
  onBack,
}: {
  /** Asked automatically on mount — used when arriving from the home card. */
  initialQuestion?: string;
  onBack: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>(() =>
    initialQuestion ? [{ id: 0, question: initialQuestion, answer: answerFor(initialQuestion) }] : [],
  );
  const [draft, setDraft] = useState("");
  const thread = useRef<HTMLDivElement>(null);

  const empty = turns.length === 0;

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setTurns((prev) => [...prev, { id: prev.length, question: q, answer: answerFor(q) }]);
    setDraft("");
  }

  // Keep the newest turn in view as the thread grows.
  useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  return (
    <div className="relative flex h-full w-full flex-col bg-canvas">
      <div className="safe-top shrink-0">
        <StatusBar />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-[20px]">
        <header className="flex h-[36px] shrink-0 items-center gap-[12px]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-[36px] shrink-0 items-center justify-center transition-transform duration-150 active:scale-90"
          >
            <img src="/icons/chevron-right.svg" alt="" className="size-[20px] rotate-180" />
          </button>
          {/* The live question becomes the title once there's a thread, so the
              header doubles as "what am I looking at". */}
          {!empty && (
            <p className="truncate font-mono text-[16px] font-medium leading-[1.4] tracking-[0.6px] text-black">
              {turns[0].question}
            </p>
          )}
        </header>

        {empty ? (
          <EmptyState onPick={ask} draft={draft} setDraft={setDraft} onSubmit={() => ask(draft)} />
        ) : (
          <>
            <div ref={thread} className="phone-scroll mt-[24px] min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-[24px] pb-[16px]">
                {turns.map((turn, i) => (
                  <div key={turn.id} className="flex flex-col gap-[24px]">
                    {/* The first question is already the header title, so it
                        isn't repeated as a bubble. */}
                    {i > 0 && <UserBubble text={turn.question} />}
                    <AgentReply answer={turn.answer} />
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 pb-[8px] pt-[8px]">
              <ChatInput value={draft} onChange={setDraft} onSubmit={() => ask(draft)} />
            </div>
          </>
        )}
      </div>

      <HomeBar />
    </div>
  );
}

function EmptyState({
  onPick,
  draft,
  setDraft,
  onSubmit,
}: {
  onPick: (q: string) => void;
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
}) {
  // Two rails, offset from each other, so the rows read as a drifting field of
  // prompts rather than a tidy two-column list — as in the Figma.
  const [rowA, rowB] = [SUGGESTIONS.slice(0, 2), SUGGESTIONS.slice(2)];

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col justify-center gap-[36px] pb-[24px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex flex-col items-center gap-[24px]">
        <div className="flex flex-col items-center gap-[16px]">
          <div className="size-[128px] overflow-hidden rounded-full border border-[#e3e3e3] p-[4px]">
            <img
              src="/icons/orb.png"
              alt=""
              className="size-[118px] rounded-full object-cover"
            />
          </div>
          <span className="rounded-[20px] border border-[#e3e3e3] bg-[#f5f5f5] px-[12px] py-[6px] font-mono text-[12px] font-medium leading-[1.4] tracking-[0.6px] text-black">
            SONAR AI
          </span>
        </div>
        <h1 className="w-[253px] text-center font-serif text-[32px] font-medium leading-[1.3] text-black">
          Your Finance Agent
        </h1>
        <ChatInput value={draft} onChange={setDraft} onSubmit={onSubmit} />
      </div>

      <div className="-mx-[20px] flex flex-col gap-[16px]">
        <ChipRail items={rowA} onPick={onPick} offset={118} />
        <ChipRail items={rowB} onPick={onPick} offset={75} />
      </div>
    </motion.div>
  );
}

function ChipRail({
  items,
  onPick,
  offset,
}: {
  items: readonly string[];
  onPick: (q: string) => void;
  /**
   * How far the row starts pre-scrolled, in px. The Figma has each row
   * beginning at a different negative x so the two don't line up at the left
   * edge — they read as a drifting field of prompts rather than a table. Both
   * rows overflow, so this is real scroll position, not a spacer.
   */
  offset: number;
}) {
  const rail = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = rail.current;
    if (el) el.scrollLeft = offset;
  }, [offset]);

  return (
    <div ref={rail} className="rail flex gap-[16px] overflow-x-auto px-[20px]">
      {items.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="flex h-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-[50px] bg-[#ededed] px-[12px] py-[6px] font-mono text-[12px] font-medium leading-[1.4] tracking-[0.6px] text-black transition-transform duration-150 active:scale-95"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      className="flex justify-end pl-[48px]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Square bottom-right corner marks it as yours — the agent's replies
          have no bubble at all, so the asymmetry is the only speaker cue. */}
      <p className="card-shadow max-w-[287px] rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px] bg-white p-[12px] font-mono text-[16px] font-medium leading-[1.4] tracking-[0.6px] text-black">
        {text}
      </p>
    </motion.div>
  );
}

function AgentReply({ answer }: { answer: Answer }) {
  return (
    <motion.div
      className="flex gap-[12px]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="size-[34px] shrink-0 overflow-hidden rounded-full border border-[#e3e3e3] p-[3px]">
        <img src="/icons/orb.png" alt="Sonar" className="size-[28px] rounded-full object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <div className="flex flex-col gap-[12px]">
          <p className="font-mono text-[16px] font-medium leading-[1.4] tracking-[0.6px] text-black">
            {answer.greeting}
          </p>
          <p className="whitespace-pre-wrap font-mono text-[16px] font-medium leading-[1.4] tracking-[0.6px] text-black">
            {answer.body}
          </p>
        </div>

        {answer.card && (
          <div className="w-full overflow-hidden rounded-[12px] border border-hair bg-white p-[16px] shadow-[0_1px_4px_0_rgba(0,0,0,0.04)]">
            <div className="mb-[16px] flex flex-col gap-[12px]">
              <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] text-ink-dim">
                {answer.card.title}
              </p>
              <div className="h-px w-full bg-hair" />
            </div>

            <div className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[16px]">
                {answer.card.rows.map((row) => (
                  <div key={row.label} className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      {row.token && (
                        <span
                          className="size-[12px] shrink-0 rounded-[2px]"
                          style={{ background: `var(${row.token})` }}
                        />
                      )}
                      <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
                        {row.label}
                      </p>
                    </div>
                    <p className="tnum font-serif text-[14px] font-medium leading-[1.3] text-black">
                      {row.value < 0 ? `−${rupees(row.value)}` : rupees(row.value)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-px w-full bg-hair" />
              <div className="flex w-full items-center justify-between">
                <p className="font-mono text-[12px] font-medium uppercase leading-[1.4] tracking-[0.6px] text-black">
                  {answer.card.total.label}
                </p>
                <p className="tnum font-serif text-[14px] font-semibold leading-[1.3] text-black">
                  {answer.card.total.signed
                    ? signedRupees(answer.card.total.value)
                    : rupees(answer.card.total.value)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

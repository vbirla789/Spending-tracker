/**
 * The "Ask Sonar" field. Shared by the agent's empty state and its
 * conversation, so the control doesn't move or restyle between them.
 *
 * The trailing button swaps mic → send once there's something to send, which
 * is the only difference between the two states in the Figma.
 */
export default function ChatInput({
  value,
  onChange,
  onSubmit,
  autoFocus = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
}) {
  const canSend = value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="w-full overflow-hidden rounded-[132px] bg-white shadow-[0_0_68px_0_rgba(47,48,55,0.05),0_4px_6px_0_rgba(34,42,53,0.04),0_0_0_1px_rgba(34,42,53,0.05),0_1px_1px_0_rgba(0,0,0,0.05)]"
    >
      <div className="flex w-full items-center gap-[10px] py-[8px] pl-[16px] pr-[8px]">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          placeholder="Ask Sonar"
          aria-label="Ask Sonar"
          className="min-w-0 flex-1 bg-transparent font-mono text-[14px] font-medium leading-[1.4] text-black outline-none placeholder:text-ink-dim"
        />
        {canSend ? (
          <button
            type="submit"
            aria-label="Send"
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full border border-[#8f8f8f] bg-black transition-transform duration-150 active:scale-95"
          >
            {/* the exported glyph is dark, so it's inverted to read on black */}
            <img src="/icons/send.svg" alt="" className="size-[20px] invert" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice input"
            className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[#ededed] transition-transform duration-150 active:scale-95"
          >
            <img src="/icons/microphone.svg" alt="" className="size-[18px]" />
          </button>
        )}
      </div>
    </form>
  );
}

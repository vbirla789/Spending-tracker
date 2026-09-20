/**
 * iOS status bar, 1:1 with the Figma component (node 1301:375868): 47px tall,
 * notch bleeding 2px above the top edge, time on the left, the signal/wifi/
 * battery cluster exported as a single asset on the right.
 *
 * Hidden on real phones (`faux-status`) — the device draws its own.
 */
export default function StatusBar() {
  return (
    <div className="faux-status relative h-[47px] w-full shrink-0 overflow-hidden">
      <img
        src="/icons/notch.svg"
        alt=""
        className="absolute left-1/2 top-[-2px] h-[32px] w-[164px] -translate-x-1/2"
      />
      <p className="absolute left-[27px] top-[15px] w-[54px] text-center font-['SF_Pro_Text',system-ui] text-[17px] font-semibold leading-[22px] tracking-[-0.408px] text-[#212121]">
        9:41
      </p>
      <img
        src="/icons/status-right.svg"
        alt=""
        className="absolute right-[26.6px] top-[19px] h-[13px] w-[77.4px]"
      />
    </div>
  );
}

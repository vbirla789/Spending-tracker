/**
 * iOS home indicator.
 *
 * The Figma instance is set to the Light appearance (a white bar) even though
 * it sits on the near-white canvas, which makes it invisible. The component's
 * own documentation says to "switch Appearance to match the surface behind it
 * — Light on dark surfaces, Dark on light surfaces", so this renders the Dark
 * bar. That's the one deliberate colour departure from the file.
 */
export default function HomeBar() {
  return (
    <div className="faux-home-bar flex w-full shrink-0 flex-col items-center justify-center pb-[8px] pt-[12px]">
      <div className="h-[5px] w-[124px] rounded-[8px] bg-black" />
    </div>
  );
}

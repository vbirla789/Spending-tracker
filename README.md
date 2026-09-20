# Overview — personal finance home screen

A 1:1 build of Figma node [`1313:389718`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1313-389718) from the *Seller detail page* file, wired up so every control actually does something.

**Stack:** Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion — matching [Quest](https://github.com/vbirla789/Quest---track-savings-app).

## Run it

```bash
npm install
npm run dev      # http://localhost:5270
```

## What's on the screen

Four sections in the file's order and rhythm (16px header gap, 40px between sections, 20px page gutter):

| Section | Content |
| --- | --- |
| **Net worth** | ₹ figure, derived delta, area chart, six range pills |
| **Cash flow** | Four month tiles (income vs expenses), then income / expenses / net |
| **Habits** | Category donut with month picker and a derived legend |
| **Spent this month** | This month against last month, scrubbable |

## Interaction spec

### Net worth — range pills
- **Tap** a pill to change the window. `1M · 3M · 6M · 1Y · 3Y · ALL`, single-select, `role="tablist"`.
- The line **redraws** with a 550ms `pathLength` sweep; the wash cross-fades over 320ms.
- The headline figure **counts** to its new value over 420ms (cubic ease-out).
- **The delta recalculates.** `1M` is +₹800 (1.3%); `3Y` is +₹42,900 (234.4%). A delta that never moves when the window does is decoration.
- Six pills are wider than the gutter, so the row is a **horizontal scroll rail** — `ALL` sits just off the right edge exactly as it does in the file. It never wraps, because wrapping would change the card's height per breakpoint.

### Cash flow — month tiles
- **Tap** a tile to select that month. Selected is white with a black hairline; the rest sit back at 40% opacity.
- Bars **animate height** over 400ms. All bars share **one ceiling across all four months**, so a tall bar in May is genuinely taller than a short one in July — the tiles are comparable, not individually normalised.
- The three rows below recalculate and count up. **Net flow is derived** and can go negative — July is −₹1,080 and the sign flips.

### Habits — month picker
- **Tap** the `SEP ⌄` pill to open a listbox; the chevron rotates 90°→270°.
- Dismisses on **outside tap** or **Escape**, not only by re-tapping the trigger — a popover that traps you feels broken on touch.
- Choosing a month **re-tweens the arcs** (`strokeDashoffset`, 450ms) and counts the centre figure. Percentages and the total are derived from the amounts, so the ring, the centre and the legend can't drift apart.

### Spent this month — scrubber
- **Press and drag** anywhere across the chart. The headline figure, the dot and a vertical guide follow your finger.
- **Release** to snap back to today.
- Past today the current-month value **clamps** — this month has no data in the future, and letting it run would draw a lie.
- Both series share **one y-scale**. Normalising separately would make a cheap month look identical to an expensive one.

### Header — privacy toggle
- The **eye** hides every figure: `₹61,200` becomes `₹ ●●●●●`, one dot per digit.
- The **icon swaps to eye-slash** — the two variants of the Figma component at node [`1316:389909`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1316-389909) (`Active=yes` / `Active=no`). The glyph carries the state; dimming it only said "disabled".
- A **skeleton-style shimmer** sweeps across each figure as it changes — two 620ms passes, then done. It's a transition, not a loading state.
- The symbol and sign are kept (`−₹1,488` → `−₹ ●●●●`), and **percentages stay visible** — they give no absolute figure away, and a row of nothing but dots reads as broken.
- Digit count is preserved rather than padded to a fixed length — the width should still feel like *your* number, and a figure that changed length on hide would jog the layout.
- `aria-pressed` and the button label flip with the state; masked figures expose `aria-label="Hidden"`.

The shimmer is an **overlay band that fades itself out in its own last keyframe** with `animation-fill-mode: forwards`. The first attempt masked the text directly, which looked right mid-sweep but left the figure permanently half-dimmed: when a CSS animation ends, `mask-position` snaps back to its static value and part of the element stays under the translucent stop. Ending at `opacity: 0` makes the resting state invisible by construction, with no JS cleanup to get wrong.

### Motion
One curve throughout — `cubic-bezier(0.23, 1, 0.32, 1)`. Everything is disabled under `prefers-reduced-motion`, and the count-up snaps instead of easing.

## Responsiveness

| Width | Behaviour |
| --- | --- |
| **> 640px** | 375×812 phone mockup, centred. Scales down (never up) to fit short windows. |
| **≤ 640px** | Bezel, faux status bar and faux home indicator all drop. Runs edge-to-edge with `env(safe-area-inset-*)` applied by the screen, not the frame. |

Only the content column scrolls — the header stays put, so the profile and eye buttons are always reachable. The two horizontal rails (range pills, month tiles) scroll independently with `overscroll-behavior` contained, so a sideways fling doesn't chain out to the page.

Every tap target clears 44px. The pills stay visually 33px tall and grow their hit area with a pseudo-element.

## Where the design and the maths disagree

The Figma dummy data doesn't reconcile. Everything here is **derived from the amounts**, so three displayed values differ from the file:

| | Figma | Here | Why |
| --- | --- | --- | --- |
| Net worth delta | +₹800 **(5.5%)** | +₹800 **(1.3%)** | ₹800 on ₹60,400 is 1.3%. 5.5% would need a +₹3,190 move. |
| Net cash flow | ₹1,234 | **+₹868** | ₹2,356 − ₹1,488 = ₹868. |
| Aug expense bar | same height as May's | **taller** | Aug spends ₹1,488 against May's ₹1,198, so its bar must be taller. |

The habits figures are internally consistent and used unchanged: 2,356 + 1,488 + 1,364 + 992 = **₹6,200**, and 38/24/22/16 = 100%.

**One deliberate colour change:** the home indicator. The Figma instance uses the Light (white) bar on the near-white canvas, which makes it invisible; the component's own documentation says to match it to the surface behind it, so this renders the Dark bar.

## Charts: assets vs code

Icons — profile, eye, chevron, notch, status cluster — are the **exported Figma assets**, committed to `public/icons/`.

The four charts are **rendered from data** rather than dropped in as the exported images. An exported PNG can't respond to a range pill, a month tap or a drag, and the whole point of the screen is that those controls work. Geometry and colours are taken from the exports (`#0F61FF` stroke, 50%→0 gradient wash, 18px donut stroke, 167px ring), so they match — they're just alive.

**The net-worth line stays jagged on purpose.** A smoothed version was tried and reverted — the day-to-day texture is the character of the Figma chart, and curving it made the line read as an illustration of a trend rather than a record of one. Dense point counts (30–84) and a straight polyline.

**The spend chart's end dot used to be clipped.** Two causes: `preserveAspectRatio="none"` squashed the circles into ovals, and the last point sat exactly on the viewBox edge so half the marker fell outside. The chart now scales uniformly and the plot area is inset 7px each side. Both series also share one x-domain, so day N of this month sits directly above day N of last month.

## Structure

```
src/
  data.ts                  all figures; nothing derivable is stored
  lib/
    chart.ts               projection, path building, donut arc geometry
    format.ts              ₹ formatting (en-IN grouping)
    mask.tsx               privacy context + the dot-masked <Money> figure
    useCountUp.ts          eased number transitions
  components/
    PhoneFrame · StatusBar · HomeBar · Pill
    NetWorthCard · CashFlowSection · HabitsCard · SpentThisMonthCard
  screens/Overview.tsx     node 1313:389718
```

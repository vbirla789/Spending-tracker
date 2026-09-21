# Overview — personal finance home screen

A 1:1 build of Figma node [`1489:154535`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1489-154535) from the *Seller detail page* file, wired up so every control actually does something.

**Stack:** Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + [NumberFlow](https://number-flow.barvian.me/) — matching [Quest](https://github.com/vbirla789/Quest---track-savings-app).

## Run it

```bash
npm install
npm run dev      # http://localhost:5270
```

## What's on the screen

Three sections in the file's order and rhythm (32px under the header, 32px between sections, 16px page gutter — the header keeps a wider 20px gutter of its own):

| Section | Content |
| --- | --- |
| **Spend trends** | Derived headline %, six monthly bars, an AVG marker and a callout on the month in progress |
| **Cash flow** | A card: five month tiles (incoming vs outgoing), then incoming / outgoing / net |
| **Habits** | Category donut with month picker and a derived legend |

**Spend trends leads, not net worth.** The brief asks the home screen for *"financial well being, cash flow and even habits, with light insight on their spending, not just raw numbers"* — it never mentions net worth, and a balance figure is the rawest number there is. A bar you can see sitting under your own average says something a figure can't, and it sets up the agent, whose worked example is "where is my money going". An earlier version of this build led with a net worth area chart and six range pills; both are gone.

## Sonar — the agent

A second screen ([`1328:391858`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1328-391858)) that presents itself over the Overview like a sheet.

**The sphere is live.** A Three.js shader marble ported from [Overdue-EMI-assist-app](https://github.com/vbirla789/Overdue-EMI-assist-app) — the mesh turns at 16°/sec while the highlights stay put, because the form is shaded off the sphere's own normal rather than a texture. No containing ring: the shader's fresnel rim already reads as the edge of the glass, so a border on top looked like a second, harder edge.

It's used **once**, for the hero. Each instance owns a WebGL context and browsers cap those around 16, so the 34px reply avatars keep a flat still — at that size the rotation isn't legible anyway.

**Thinking state** — sending doesn't jump straight to an answer. The reply resolves after 1.9s, and while it's pending the agent shows named steps (*reading your transactions → comparing the months → putting it together*) over three pulsing dots. Named rather than a bare spinner because the whole claim is that the answer is derived from your data; the status says which part it's on. The question arriving from the home card is deliberately unanswered on mount too, so opening the agent shows it working rather than presenting a reply it never thought about. Only one question resolves at a time — queuing a second would let them land out of order.

**Empty state** — the sphere, a `SONAR AI` chip, "Your Finance Agent", the ask field, and two rails of suggested prompts. The rails start pre-scrolled to *different* offsets (118px and 75px, from the Figma) so they read as a drifting field of prompts rather than a two-column table.

**Conversation** — the opening question becomes the header title rather than being repeated as a bubble. Replies are unbubbled with the orb as an avatar; your own messages get a white card with a squared bottom-right corner. That asymmetry is the only speaker cue, so no colour or alignment work is needed.

**Answers are somewhere to go, not somewhere to stop.** Two ways onward:

- **Tap a line in the card.** Rows that can be drilled carry a probe and render as buttons with a faint chevron — tapping one asks it as your next question. Tapping `FOOD & DINING` in the breakdown asks "why is food & dining so high?", which returns that category across three months, which in turn offers to halve it. Three levels deep without typing.
- **Follow-up chips** under the reply, on the newest turn only. Leaving them on every turn would stack stale invitations down the thread and turn the scroll into a menu.

Both routes go through the same `ask()`, so a tap and a typed question are indistinguishable downstream — and every chip is guaranteed answerable, because the suggestion and the branch that answers it live in the same file.

**Every answer is composed from `data.ts`**, not a string table — see `lib/agent.ts`. Ask "where did my money go?" and the reply names whichever category is actually largest and renders the real split; change a month's figures and the agent's wording and card change with them. An assistant that quotes a total the screen behind it disagrees with is worse than no assistant.

**Three answers are interactive, not just composed** (`components/AgentWidgets.tsx`, after Figma [`1500:199455`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1500-199455)):

- **"Cut food & dining in half?"** answers with the cut on a slider. Half is just where it opens — drag it and the after-figure, the freed-per-month and per-year numbers roll (NumberFlow), while a bar of the category visibly gets eaten. The agent's arithmetic is live, not quoted.
- **"What changed since August?"** answers with the two months as running-total lines — Sep solid blue ending in a dot at today, Aug dashed grey running the full month — drawn in with a path sweep. The legend chips are toggles: drop a month out to read the other alone. The body's "₹1,390 more than by this point in Aug" is computed from the same two day-series the chart draws.
- **"Am I cash flow positive?"** opens its analysis card with a proportion strip — money in, money out, and what's left as three widths — so the answer is readable as geometry before it's readable as figures.

The ask field is one component across both states so it doesn't jump, and its trailing button swaps mic → send the moment there's something to send.

### The way in

The **`Ask SONAR` pill in the header** opens the agent at its intro screen, to ask your own question. The code path that opens it with a question already asked is still there and still used: tapping a row inside an answer goes through it.

It used to float above the home indicator and hide itself on scroll down — the assumption being that scrolling up meant you were reaching for a control. Moving it into the header deletes that whole mechanism: a header button can't get lost behind content, so there is no scroll-direction listener, no 6px jitter threshold, and no 84px of bottom padding needed to keep the last card clear of it.

## Interaction spec

### Spend trends
- **The eyebrow is the switcher** (Figma [`1500:199389`](https://www.figma.com/design/v2kNjPYdqzigJ6fJ6nrMS3/Seller-detail-page?node-id=1500-199389)): `MONTHLY TRENDS ‹ ›` flips to `DAILY TRENDS ‹ ›` and back — dotted underline, paired bold chevrons, no extra control row. The headline, caption and chart body slide directionally (40px travel, 340ms) on a height-animated stage, so the cards below glide rather than jump.
- **Daily view is a scrubber.** Twenty day columns with today always the 11th — exactly where the file parks its TODAY pill (x=162 ≈ 10 × 16.21px). Drag across the plot (or arrow-key it) and the black marker, the `SPENT ON` callout and the date pill follow to that day; future days are bare guides. It opens parked on the spike the headline names: the biggest day of the last seven, derived from `DAILY_SPEND`.
- `DAILY_SPEND` sums to exactly the ₹6,200 the habits card reports for Sep, so the daily bars, the donut and the agent's month line are three renderings of one series.
- **Everything is read out of one array.** `SPEND_TRENDS` in `data.ts` holds six monthly figures; the headline `16.4%`, the `AVG ₹12k` marker's *value and its height*, the `₹10k` callout and all six bar heights are derived from it. Change one month and they all move together.
- **The plot pans horizontally.** The file draws it at 321px, which fits the column exactly — so the months are as small as they'll ever be and the indicator underneath has nothing to indicate. Horizontal geometry is scaled 1.5× into a full-bleed rail: same proportions, bars wide enough to read, four months in view and the rest to scroll back into. Vertical geometry is untouched, so the section still stands 167px tall.
- It **opens on the present** and scrolls back into history, matching the cash flow rail — and the file, which draws the indicator's thumb parked at the right.
- **The indicator is live**, not decoration: the thumb is positioned from `scrollLeft`, so it sits at 0 when you're fully scrolled back and at 22px (track minus thumb) at the present.
- Month labels live **inside** the rail, centred on each bar, so they travel with the bars they name rather than drifting out of register.
- The figures are chosen so the three numbers the design writes down are simultaneously true of one series: average ₹12,000, month in progress ₹10,032 (labelled `₹10k`), gap 16.4%.
- **Only the month in progress is outlined**, white on a black hairline; the five closed months are flat `#e6e6e6`. The subject is the bar you can still change.
- The **AVG marker sits at the average's own height**, not at a fixed offset, so it can't drift away from the bars it describes. Its rule stops short of the live bar — it's the history being averaged, not the month still running.
- The **callout rides 8px above the live bar's top edge** rather than being parked at a hard-coded y.
- The green caret is the *same* exported glyph flipped (`-scale-y-100`). Down-and-green is the good direction here: you're under your own average.

### Cash flow — month tiles
- **Tap** a tile to select that month. Selected is white with a black hairline; the rest carry a grey one.
- Bars stay at **full strength in every tile**. An earlier build dimmed the unselected months to 40%, which made the only thing they're on screen for — comparison — harder.
- Five months, `Apr` through `Aug`. Opens on the **newest** tile with the row parked at its right edge, so the three figures below describe where you are rather than where you were five months ago.
- The row is a **full-bleed rail with the gutter re-applied as padding**: aligned at rest, but tiles pass clean under both screen edges once you scroll, rather than stopping short of them.
- Bars **animate height** over 400ms. All bars share **one ceiling across all five months**, so a tall bar in May is genuinely taller than a short one in July — the tiles are comparable, not individually normalised.
- The three rows below recalculate and roll. **Net flow is derived** and can go negative — July is −₹1,844, sign and all.

### Habits — month picker
- **Tap** the `SEP ⌄` pill to open a listbox; the chevron rotates 90°→270°.
- Dismisses on **outside tap** or **Escape**, not only by re-tapping the trigger — a popover that traps you feels broken on touch.
- Choosing a month **re-tweens the arcs** (`strokeDashoffset`, 450ms) and counts the centre figure. Percentages and the total are derived from the amounts, so the ring, the centre and the legend can't drift apart.


### Header — privacy toggle (removed)
The header used to carry an eye that masked every figure to `₹ ●●●●●`, one dot per digit, with the icon swapping to eye-slash. This version of the design replaces that button with the `Ask SONAR` pill, so the toggle has no trigger and is gone from the screen.

The machinery is still in `lib/mask.tsx` and every figure still renders through `<Money>`, which defaults to visible — so restoring it is a button and a piece of state, not a rewrite. Worth knowing if it comes back: the masked state is pinned to one line-height (`h-[1lh]`) because a row of dots is taller than a row of digits, and without the pin the whole page shifted on every toggle.

### Motion
One curve throughout — `cubic-bezier(0.23, 1, 0.32, 1)`, with NumberFlow handling its own digit easing. Everything is disabled under `prefers-reduced-motion`.

## Responsiveness

| Width | Behaviour |
| --- | --- |
| **> 640px** | 375×812 phone mockup, centred. Scales down (never up) to fit short windows. |
| **≤ 640px** | Bezel, faux status bar and faux home indicator all drop. Runs edge-to-edge with `env(safe-area-inset-*)` applied by the screen, not the frame. |

## The backdrop

**Dot paper**, the same `.dot-paper` the agent sheet uses: a 1.35px dot on an 11.35px grid at 11% black, straight off the file (which draws it as ~10,900 individual ellipses). Earlier versions of this screen used a ruled-grid pattern built from exported line tiles; this version replaces it, which has the side benefit that the home screen and the sheet that slides over it now share one backdrop.

It's anchored to the screen rather than the scroller, so it stays put while content moves over it. That matches the Figma, where it's painted on the frame.

**One surface colour throughout.** `html` and `body` carry the screen's own canvas — `#fafafc`, a hair cooler and darker than the `#ffffff` cards so a card reads as a surface sitting on the page rather than a hairline drawn on it — and a `theme-color` meta tints the browser's chrome to match. The desktop stage grey lives on a wrapper in `App`, not on `body` — when it sat on `body` it showed through the safe-area insets and behind Safari's collapsing toolbars, bracketing the app in a mismatched grey on a real phone. `overscroll-behavior: none` on the document stops the rubber-band gutter exposing it too.

Only the content column scrolls — the header stays put, so the profile button and `Ask SONAR` are always reachable. The month-tile rail scrolls independently with `overscroll-behavior` contained, so a sideways fling doesn't chain out to the page.

Every tap target clears 44px.

## Where the design and the maths disagree

The Figma dummy data doesn't reconcile. Everything here is **derived from the amounts**, so a few displayed values differ from the file:

| | Figma | Here | Why |
| --- | --- | --- | --- |
| Net cash flow | ₹1,234 | **+₹3,128** | The file's own rows are ₹4,356 in and ₹1,228 out, which nets to ₹3,128. |
| `AVG ₹12k` line height | ~₹16k above the baseline | **₹12k** | The marker is drawn well above the bars it averages. Placed at the average's real height instead. |
| Month-in-progress bar | 91px | **86px** | 91px is ₹10.9k on the file's own scale, but the bar is labelled ₹10k. The other five match the file to the pixel. |
| Aug outgoing bar | 28px (≈₹2,346) | **15px** | Drawn at more than twice the ₹1,228 its own legend row states. |
| Daily y-axis labels | ₹2.4 / ₹1.8 / ₹1.2 / ₹0 on an even 52px pitch | **₹2.4 / ₹1.6 / ₹0.8 / ₹0** | The file's middle values aren't linear against its own pixels — even pitch needs even thirds. |
| Daily callout parking | On the window's first column | **On 18 Sep, the day the headline names** | The callout follows the scrub; its rest position is the claim being made. |

The habits figures are internally consistent and used unchanged: 2,356 + 1,488 + 1,364 + 992 = **₹6,200**, and 38/24/22/16 = 100%. The spend-trends series is chosen so that the average, the current month and the headline percentage are all true at once — see the note on `SPEND_TRENDS`.

**One Figma inconsistency not reproduced:** the month tiles carry an 8px corner radius on the first tile and 1px on the other four. All five use 1px here, matching the four that agree and the rendered design.

**Card corners are square.** Neither card node in the file carries a radius — the 12px they had was inherited from an earlier version of this build and is gone.

**One deliberate colour change:** the home indicator. The Figma instance uses the Light (white) bar on the near-white canvas, which makes it invisible; the component's own documentation says to match it to the surface behind it, so this renders the Dark bar.

## Charts: assets vs code

Icons — profile, chevron, notch, status cluster, the AI spark, the green caret and the callout pointer — are the **exported Figma assets**, committed to `public/icons/`. The caret ships once: the file exports an up-caret and flips it, so the flip is what carries the direction.

The charts are **rendered from data** rather than dropped in as the exported images. An exported PNG can't respond to a month tap, and it can't move its own average marker when the numbers change. Geometry and colours are taken from the exports (`#e6e6e6` bars, `2 2` dash on the guides, `#dadada` baseline, 18px donut stroke, 167px ring), so they match — they're just alive.

## Structure

```
src/
  data.ts                  all figures; nothing derivable is stored
  lib/
    agent.ts               composes Sonar's answers from data.ts
    chart.ts               donut arc geometry
    format.ts              ₹ formatting for labels (en-IN grouping)
    mask.tsx               <Money>: NumberFlow, with the masked state unused
  components/
    PhoneFrame · StatusBar · HomeBar
    SpendTrendsCard · CashFlowSection · HabitsCard
    AgentWidgets (what-if slider · month line · flow bar)
    AskSonarButton · ChatInput · Sphere3D
  screens/
    Overview.tsx           node 1489:154535
    Agent.tsx              node 1328:391858
```

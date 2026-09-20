/**
 * All figures for the Overview screen.
 *
 * Nothing that can be derived is stored. Deltas, percentages, bar heights and
 * the cash-flow net are all computed from the numbers below, so the screen can
 * never show a total that disagrees with its own parts — which is exactly the
 * drift the Figma dummy data has (see README, "Where the design and the maths
 * disagree").
 */

export type Range = "1M" | "3M" | "6M" | "1Y" | "3Y" | "ALL";
export const RANGES: Range[] = ["1M", "3M", "6M", "1Y", "3Y", "ALL"];

/**
 * Deterministic jitter. The Figma net-worth line is visibly noisy — a smooth
 * curve would read as fake — but `Math.random` would redraw differently on
 * every render and make the chart flicker under StrictMode's double-invoke.
 * A seeded LCG gives the same texture every time.
 */
function walk(seed: number, from: number, to: number, points: number): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  // Amplitude scales with the span so a 3-year chart isn't as twitchy per-point
  // as a 1-month one.
  const amp = (to - from) / points / 1.4;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = from + (to - from) * t;
    // endpoints stay exact so the headline figure always matches the line's end
    const wobble = i === 0 || i === points - 1 ? 0 : (rand() - 0.45) * amp * 9;
    out.push(Math.round(base + wobble));
  }
  return out;
}

/** Every range lands on the same present-day value — only the history differs. */
const NET_WORTH_NOW = 61_200;

/* Dense point counts on purpose. The texture of a real balance moving day to
   day is the point of this chart — a smooth curve reads as an illustration of
   a trend rather than a record of one. */
export const NET_WORTH: Record<Range, number[]> = {
  "1M": walk(7, 60_400, NET_WORTH_NOW, 30),
  "3M": walk(19, 57_800, NET_WORTH_NOW, 46),
  "6M": walk(23, 52_400, NET_WORTH_NOW, 54),
  "1Y": walk(41, 44_100, NET_WORTH_NOW, 60),
  "3Y": walk(57, 18_300, NET_WORTH_NOW, 72),
  ALL: walk(83, 6_200, NET_WORTH_NOW, 84),
};

export type MonthFlow = {
  key: string;
  label: string;
  income: number;
  expenses: number;
};

/**
 * Cash flow, newest last. `income`/`expenses` are the source of truth; the two
 * bars in a month tile are sized as a share of the tallest bar across all
 * months, so the columns stay comparable month to month.
 */
export const CASH_FLOW: MonthFlow[] = [
  { key: "may", label: "May", income: 2_356, expenses: 1_198 },
  { key: "jun", label: "Jun", income: 1_720, expenses: 1_720 },
  { key: "jul", label: "Jul", income: 720, expenses: 1_800 },
  { key: "aug", label: "Aug", income: 2_356, expenses: 1_488 },
];

export type Category = {
  key: string;
  label: string;
  amount: number;
  /** CSS custom property name, so the swatch and the arc can't drift apart. */
  token: string;
};

export type HabitsMonth = {
  key: string;
  label: string;
  categories: Category[];
};

/**
 * Clockwise arc order, starting at 12 o'clock.
 *
 * Deliberately not the legend order and not its reverse — the Figma ring runs
 * others → travel → groceries → food, which puts the largest slice last so it
 * closes the loop back at 12. Stated explicitly rather than derived, because
 * any rule that reproduces it would be a rule invented to fit one case.
 */
export const RING_ORDER = ["other", "travel", "grocery", "food"] as const;

/**
 * Habits. The donut total is the sum of its categories and each percentage is
 * derived — add a category and the ring, the centre figure and the legend all
 * stay in step.
 */
export const HABITS: HabitsMonth[] = [
  {
    key: "sep",
    label: "Sep",
    categories: [
      { key: "food", label: "Food & dining", amount: 2_356, token: "--color-cat-food" },
      { key: "travel", label: "Travel", amount: 1_488, token: "--color-cat-travel" },
      { key: "grocery", label: "Groceries", amount: 1_364, token: "--color-cat-grocery" },
      { key: "other", label: "Others", amount: 992, token: "--color-cat-other" },
    ],
  },
  {
    key: "aug",
    label: "Aug",
    categories: [
      { key: "food", label: "Food & dining", amount: 1_910, token: "--color-cat-food" },
      { key: "travel", label: "Travel", amount: 2_240, token: "--color-cat-travel" },
      { key: "grocery", label: "Groceries", amount: 1_180, token: "--color-cat-grocery" },
      { key: "other", label: "Others", amount: 1_450, token: "--color-cat-other" },
    ],
  },
  {
    key: "jul",
    label: "Jul",
    categories: [
      { key: "food", label: "Food & dining", amount: 2_040, token: "--color-cat-food" },
      { key: "travel", label: "Travel", amount: 860, token: "--color-cat-travel" },
      { key: "grocery", label: "Groceries", amount: 1_620, token: "--color-cat-grocery" },
      { key: "other", label: "Others", amount: 1_130, token: "--color-cat-other" },
    ],
  },
];

/**
 * Spend-to-date, one point per day. The current month stops at "today" (the
 * solid line ends mid-chart with a dot); last month runs the full width as a
 * dashed ghost so the gap between them is the story.
 */
export const SPEND_CURRENT = [
  0, 210, 505, 505, 940, 1_180, 1_460, 1_460, 1_905, 2_240, 2_600, 2_600, 3_150, 3_470, 3_900,
  4_260, 4_260, 4_880, 5_300, 5_760, 6_140, 6_140, 6_720, 7_180, 7_640, 8_090, 8_420, 8_780,
];

export const SPEND_PRIOR = [
  0, 180, 430, 430, 810, 1_090, 1_330, 1_330, 1_700, 2_090, 2_450, 2_450, 3_020, 3_460, 3_980,
  4_480, 4_480, 5_240, 5_900, 6_520, 7_080, 7_080, 7_880, 8_620, 9_340, 10_010, 10_620, 11_240,
  11_820, 12_360, 12_820,
];

/** Which day of the month "today" is — where the solid line stops. */
export const TODAY_INDEX = SPEND_CURRENT.length - 1;

/**
 * All figures for the Overview screen.
 *
 * Nothing that can be derived is stored. Deltas, percentages, bar heights and
 * the cash-flow net are all computed from the numbers below, so the screen can
 * never show a total that disagrees with its own parts — which is exactly the
 * drift the Figma dummy data has (see README, "Where the design and the maths
 * disagree").
 */

export type SpendMonth = {
  key: string;
  label: string;
  amount: number;
};

/**
 * Monthly spend, oldest first. The last entry is the month in progress — it
 * gets the outlined bar and the callout rather than a month name.
 *
 * The figures are picked so that all three numbers the design puts in writing
 * are true of the same series at once: the average lands on ₹12k, the month in
 * progress on ₹10k, and the gap between them on the headline's 16.4%. Every
 * one of those is read back out of this array rather than typed in beside it,
 * so changing a month moves the headline, the AVG marker and the callout
 * together.
 */
export const SPEND_TRENDS: SpendMonth[] = [
  { key: "mar", label: "Mar", amount: 9_086 },
  { key: "apr", label: "Apr", amount: 14_561 },
  { key: "may", label: "May", amount: 5_125 },
  { key: "jun", label: "Jun", amount: 13_746 },
  { key: "jul", label: "Jul", amount: 19_450 },
  { key: "recent", label: "Recent", amount: 10_032 },
];

/** Day of the month "today" falls on — the daily view and the agent's
    month-against-month comparison both cut their series here. */
export const TODAY_DAY = 22;

/**
 * September, day by day, up to today. Sums to exactly the ₹6,200 the habits
 * card reports for Sep, so the daily view, the donut and the agent's
 * month-to-date line are three renderings of one series rather than three
 * series. Zero days are real zeros — the chart shows them as bare guides.
 *
 * Day 18 is the spike: the largest figure in the last seven days, which is
 * what the daily view's headline and callout point at.
 */
export const DAILY_SPEND: number[] = [
  180, 0, 240, 160, 0, 320, 140, 0, 260, 410, 0, 120, 340, 0, 480, 220, 0, 2_200, 160, 0, 380,
  590,
];

/**
 * August and July, day by day, complete. Each sums to what the habits card
 * reports for its month (₹6,780 and ₹5,650), for the same reason as above —
 * the agent's month lines and the donut must be readings of one series.
 */
export const AUG_DAILY: number[] = [
  230, 0, 180, 320, 0, 140, 260, 340, 0, 620, 180, 0, 240, 710, 120, 0, 380, 290, 0, 160, 640, 0,
  210, 330, 150, 0, 290, 560, 0, 240, 190,
];

export const JUL_DAILY: number[] = [
  150, 0, 220, 180, 0, 310, 90, 0, 240, 650, 130, 0, 260, 0, 630, 210, 0, 290, 160, 0, 590, 120,
  0, 270, 190, 0, 310, 230, 0, 180, 240,
];

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
 *
 * Five months, Apr–Aug, matching the design. August carries the two figures
 * the design spells out (₹4,356 in, ₹1,228 out); the rest are read off the
 * heights its tiles are drawn at.
 */
export const CASH_FLOW: MonthFlow[] = [
  { key: "apr", label: "Apr", income: 4_356, expenses: 2_514 },
  { key: "may", label: "May", income: 4_356, expenses: 2_514 },
  { key: "jun", label: "Jun", income: 3_352, expenses: 3_352 },
  // July runs negative on purpose — it's the case the net row has to handle,
  // and a run of five all-positive months would never exercise it.
  { key: "jul", label: "Jul", income: 1_508, expenses: 3_352 },
  { key: "aug", label: "Aug", income: 4_356, expenses: 1_228 },
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


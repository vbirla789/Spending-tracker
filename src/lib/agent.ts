import { CASH_FLOW, HABITS, type Category } from "../data";
import { rupees, sum } from "./format";

export type AnswerRow = {
  label: string;
  value: number;
  /** CSS custom property for the swatch. Omitted rows render without one. */
  token?: string;
  /**
   * The question this row asks when tapped. Rows with a probe become buttons
   * — this is what makes an answer somewhere to go rather than somewhere to
   * stop.
   */
  probe?: string;
};

export type Answer = {
  greeting: string;
  body: string;
  card?: {
    title: string;
    rows: AnswerRow[];
    /**
     * The bolded summary line under the rule. `signed` marks it as a net or a
     * delta, where the leading +/− is the point; a plain total like "total
     * spent" must not carry one.
     */
    total: { label: string; value: number; signed?: boolean };
  };
  /** Offered as chips under the reply. Every one must be answerable below. */
  followUps: string[];
};

/** The chips on the entry screen, and what the agent can answer cold. */
export const SUGGESTIONS = [
  "Where did my money go?",
  "Why is this month different?",
  "What changed since August?",
  "What's driving my net worth?",
] as const;

/** Surfaced on the Overview card as the daily prompt. */
export const QUESTION_OF_THE_DAY = "Am I cash flow positive?";

const GREETING = "Hey Vishal";
const latest = () => CASH_FLOW[CASH_FLOW.length - 1];
const thisMonth = () => HABITS[0];

function findCategory(q: string): Category | undefined {
  return thisMonth().categories.find((c) => {
    const first = c.label.toLowerCase().split(" ")[0];
    return q.includes(first);
  });
}

/**
 * Compose an answer from the same figures the Overview renders.
 *
 * Deliberately not a canned string table: every number below is read from
 * `data.ts`, so if a month changes the agent's reply changes with it. An
 * assistant that quotes a total the screen behind it disagrees with is worse
 * than no assistant.
 *
 * Order matters — "what if I cut food in half?" mentions a category, so the
 * simulation branch has to be tested before the category one.
 */
export function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  const month = latest();
  const net = month.income - month.expenses;

  // 1. Simulation — "what if I cut X in half?"
  if (q.includes("cut") || q.includes("half")) {
    const cat = findCategory(q) ?? thisMonth().categories[0];
    const saved = Math.round(cat.amount / 2);
    return {
      greeting: GREETING,
      body: `Halving ${cat.label.toLowerCase()} frees ${rupees(saved)} a month — ${rupees(
        saved * 12,
      )} over a year.\n\nAgainst this month:`,
      card: {
        title: "If you halved it",
        rows: [
          { label: `${cat.label} now`, value: cat.amount, token: cat.token },
          { label: "After the cut", value: cat.amount - saved, token: cat.token },
        ],
        total: { label: "Freed each month", value: saved, signed: true },
      },
      followUps: ["Where did my money go?", QUESTION_OF_THE_DAY],
    };
  }

  // 2. One category, across the months we hold
  const cat = findCategory(q);
  if (cat) {
    const history = HABITS.map((m) => ({
      label: m.label,
      amount: m.categories.find((c) => c.key === cat.key)?.amount ?? 0,
    }));
    const change = history[0].amount - history[1].amount;
    return {
      greeting: GREETING,
      body: `${cat.label} is ${rupees(cat.amount)} this month, ${
        change >= 0 ? "up" : "down"
      } ${rupees(change)} on ${history[1].label}.\n\nThe last three months:`,
      card: {
        title: `${cat.label} over time`,
        rows: history.map((h) => ({ label: h.label, value: h.amount, token: cat.token })),
        total: { label: `Change vs ${history[1].label}`, value: change, signed: true },
      },
      followUps: [`Cut ${cat.label.toLowerCase()} in half?`, "Where did my money go?"],
    };
  }

  // 3. The full spending split
  if (q.includes("money go") || q.includes("spend on") || q.includes("split")) {
    const habits = thisMonth();
    const total = sum(habits.categories.map((c) => c.amount));
    const top = [...habits.categories].sort((a, b) => b.amount - a.amount)[0];
    return {
      greeting: GREETING,
      body: `Most of it went to ${top.label.toLowerCase()} — ${Math.round(
        (top.amount / total) * 100,
      )}% of everything you spent in ${habits.label}.\n\nHere's the split — tap any line to go deeper:`,
      card: {
        title: `${habits.label} breakdown`,
        rows: habits.categories.map((c) => ({
          label: c.label,
          value: c.amount,
          token: c.token,
          probe: `Why is ${c.label.toLowerCase()} so high?`,
        })),
        total: { label: "Total spent", value: total, signed: false },
      },
      followUps: [`Cut ${top.label.toLowerCase()} in half?`, "What changed since August?"],
    };
  }

  // 4. Net worth
  if (q.includes("net worth") || q.includes("savings rate")) {
    return {
      greeting: GREETING,
      body: `What moves it is what you keep. ${month.label} kept ${rupees(net)} of ${rupees(
        month.income,
      )} — that's ${Math.round((net / month.income) * 100)}%.\n\nThe last full month:`,
      card: {
        title: `${month.label} analysis`,
        rows: [
          { label: "Income", value: month.income, token: "--color-income" },
          {
            label: "Expenses",
            value: -month.expenses,
            token: "--color-expense",
            probe: "Where did my money go?",
          },
        ],
        total: { label: "Added to net worth", value: net, signed: true },
      },
      followUps: ["Where did my money go?", "What changed since August?"],
    };
  }

  // 5. Month against month
  if (q.includes("changed") || q.includes("different") || q.includes("compare")) {
    const prev = CASH_FLOW[CASH_FLOW.length - 2];
    const prevNet = prev.income - prev.expenses;
    const swing = net - prevNet;
    return {
      greeting: GREETING,
      body: `${month.label} came out ${rupees(swing)} ${
        swing >= 0 ? "better" : "worse"
      } than ${prev.label}. The income is steady — it's the spending that moved.\n\nSide by side:`,
      card: {
        title: `${prev.label} vs ${month.label}`,
        rows: [
          { label: `${prev.label} net`, value: prevNet, token: "--color-expense" },
          { label: `${month.label} net`, value: net, token: "--color-income" },
        ],
        total: { label: "Difference", value: swing, signed: true },
      },
      followUps: ["Where did my money go?", "What's driving my net worth?"],
    };
  }

  // 6. Default — the question of the day, and the fallback for free text
  return {
    greeting: GREETING,
    body:
      net >= 0
        ? `As of right now you're cash positive and doing great in terms of cash flow.\n\nHere's the analysis:`
        : `Right now you're running negative — ${month.label} spent more than it earned.\n\nHere's the analysis:`,
    card: {
      title: `${month.label} analysis`,
      rows: [
        { label: "Income", value: month.income, token: "--color-income" },
        {
          label: "Expenses",
          value: -month.expenses,
          token: "--color-expense",
          probe: "Where did my money go?",
        },
      ],
      total: { label: "Net cash flow", value: net, signed: true },
    },
    followUps: ["Where did my money go?", "What changed since August?"],
  };
}

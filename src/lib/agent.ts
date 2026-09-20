import { CASH_FLOW, HABITS, NET_WORTH } from "../data";
import { sum } from "./format";

export type AnswerRow = {
  label: string;
  value: number;
  /** CSS custom property for the swatch. Omitted rows render without one. */
  token?: string;
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
};

/** The chips on the entry screen, and what the agent can actually answer. */
export const SUGGESTIONS = [
  "Where did my money go?",
  "Why is this month different?",
  "What changed since August?",
  "What's driving my net worth?",
] as const;

/** Surfaced on the Overview card as the daily prompt. */
export const QUESTION_OF_THE_DAY = "Am I cash flow positive?";

const latest = () => CASH_FLOW[CASH_FLOW.length - 1];

/**
 * Compose an answer from the same figures the Overview renders.
 *
 * Deliberately not a canned string table: every number below is read from
 * `data.ts`, so if a month changes the agent's reply changes with it. An
 * assistant that quotes a total the screen behind it disagrees with is worse
 * than no assistant.
 */
export function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  const month = latest();
  const net = month.income - month.expenses;

  if (q.includes("money go") || q.includes("spend on")) {
    const habits = HABITS[0];
    const total = sum(habits.categories.map((c) => c.amount));
    const top = [...habits.categories].sort((a, b) => b.amount - a.amount)[0];
    return {
      greeting: "Hey Vishal",
      body: `Most of it went to ${top.label.toLowerCase()} — ${Math.round(
        (top.amount / total) * 100,
      )}% of everything you spent in ${habits.label}.\n\nHere's the split:`,
      card: {
        title: `${habits.label} breakdown`,
        rows: habits.categories.map((c) => ({
          label: c.label,
          value: c.amount,
          token: c.token,
        })),
        total: { label: "Total spent", value: total, signed: false },
      },
    };
  }

  if (q.includes("net worth")) {
    const series = NET_WORTH["6M"];
    const delta = series[series.length - 1] - series[0];
    return {
      greeting: "Hey Vishal",
      body: `You're up ₹${delta.toLocaleString("en-IN")} over six months, and almost all of it is money you kept rather than markets moving.\n\nHere's the last full month:`,
      card: {
        title: `${month.label} analysis`,
        rows: [
          { label: "Income", value: month.income, token: "--color-income" },
          { label: "Expenses", value: -month.expenses, token: "--color-expense" },
        ],
        total: { label: "Added to net worth", value: net, signed: true },
      },
    };
  }

  if (q.includes("changed") || q.includes("different")) {
    const prev = CASH_FLOW[CASH_FLOW.length - 2];
    const prevNet = prev.income - prev.expenses;
    const swing = net - prevNet;
    return {
      greeting: "Hey Vishal",
      body: `${month.label} came out ₹${Math.abs(swing).toLocaleString("en-IN")} ${
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
    };
  }

  // Default — the question of the day, and the safest fallback for anything
  // typed freehand.
  return {
    greeting: "Hey Vishal",
    body:
      net >= 0
        ? `As of right now you're cash positive and doing great in terms of cash flow.\n\nHere's the analysis:`
        : `Right now you're running negative — ${month.label} spent more than it earned.\n\nHere's the analysis:`,
    card: {
      title: `${month.label} analysis`,
      rows: [
        { label: "Income", value: month.income, token: "--color-income" },
        { label: "Expenses", value: -month.expenses, token: "--color-expense" },
      ],
      total: { label: "Net cash flow", value: net, signed: true },
    },
  };
}

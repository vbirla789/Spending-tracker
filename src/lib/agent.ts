import { AUG_DAILY, CASH_FLOW, DAILY_SPEND, HABITS, TODAY_DAY, type Category } from "../data";
import type { AgentWidget } from "../components/AgentWidgets";
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
  /**
   * An interactive body rendered with (or instead of) the card — a slider,
   * a line chart, a proportion bar. See AgentWidgets. `flowbar` is the one
   * that renders *inside* the card, above its rows.
   */
  widget?: AgentWidget;
  /** Offered as chips under the reply. Every one must be answerable below. */
  followUps: string[];
};

/**
 * The chips on the entry screen, and what the agent can answer cold.
 *
 * Every one of these lands on something you can touch — a ring you can
 * interrogate, a slider, a filter, a forecast you can stretch. A question
 * whose best answer is a table of figures doesn't earn a chip here: the
 * whole claim of this screen is that the answer is a thing you can push on,
 * so the prompts have to advertise that.
 */
export const SUGGESTIONS = [
  "Where did my money go?",
  "What if I cut food & dining?",
  "How does this month compare?",
  "What if I keep saving like this?",
] as const;

/** Surfaced on the Overview card as the daily prompt. */
export const QUESTION_OF_THE_DAY = "Am I cash flow positive?";

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
      body: `Halving ${cat.label.toLowerCase()} frees ${rupees(saved)} a month — ${rupees(
        saved * 12,
      )} over a year.\n\nBut half is just a starting point — drag it:`,
      widget: { kind: "whatif", catKey: cat.key },
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
      body: `${cat.label} is ${rupees(cat.amount)} this month, ${
        change >= 0 ? "up" : "down"
      } ${rupees(change)} on ${history[1].label}.\n\nTap a month to compare it against the one before:`,
      widget: { kind: "trend", catKey: cat.key },
      followUps: [`Cut ${cat.label.toLowerCase()} in half?`, "Where did my money go?"],
    };
  }

  // 3. The full spending split
  if (q.includes("money go") || q.includes("spend on") || q.includes("split")) {
    const habits = thisMonth();
    const total = sum(habits.categories.map((c) => c.amount));
    const top = [...habits.categories].sort((a, b) => b.amount - a.amount)[0];
    return {
      body: `Most of it went to ${top.label.toLowerCase()} — ${Math.round(
        (top.amount / total) * 100,
      )}% of everything you spent in ${habits.label}.\n\nTap a slice to pull it out:`,
      widget: { kind: "ring" },
      followUps: [`Cut ${top.label.toLowerCase()} in half?`, "How does this month compare?"],
    };
  }

  // 4. What the rate is worth if you hold it
  if (
    q.includes("net worth") ||
    q.includes("savings rate") ||
    q.includes("keep saving") ||
    q.includes("keep this")
  ) {
    return {
      body: `What moves it is what you keep. ${month.label} kept ${rupees(net)} of ${rupees(
        month.income,
      )} — that's ${Math.round((net / month.income) * 100)}%.\n\nStretch it out and see what that's worth:`,
      widget: { kind: "projection" },
      followUps: ["Where did my money go?", "How does this month compare?"],
    };
  }

  // 5. Month against month — Sep's running total against Aug's, as lines
  if (q.includes("changed") || q.includes("different") || q.includes("compare")) {
    const sepSoFar = sum(DAILY_SPEND);
    const augByNow = sum(AUG_DAILY.slice(0, TODAY_DAY));
    const diff = sepSoFar - augByNow;
    return {
      body: `You've spent ${rupees(sepSoFar)} so far this month — ${rupees(diff)} ${
        diff >= 0 ? "more" : "less"
      } than by this point in Aug.\n\nDay by day. The legend is a filter — bring Jul in for a second baseline:`,
      widget: { kind: "monthline" },
      followUps: ["Where did my money go?", "What if I keep saving like this?"],
    };
  }

  // 6. Default — the question of the day, and the fallback for free text
  return {
    body:
      net >= 0
        ? `As of right now you're cash positive and doing great in terms of cash flow.\n\nHere's the analysis:`
        : `Right now you're running negative — ${month.label} spent more than it earned.\n\nHere's the analysis:`,
    widget: { kind: "flowbar" },
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
    followUps: ["Where did my money go?", "How does this month compare?"],
  };
}

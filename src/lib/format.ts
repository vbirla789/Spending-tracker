/** Indian digit grouping (₹1,23,456), which `en-IN` gives us for free. */
export function rupees(value: number): string {
  return `₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`;
}

/** Signed money for deltas — the sign leads, so it reads before the digits. */
export function signedRupees(value: number): string {
  return `${value < 0 ? "−" : "+"}${rupees(value)}`;
}

/** One decimal, because a whole-number percent hides small monthly moves. */
export function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

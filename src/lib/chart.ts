export type Pt = { x: number; y: number };

/**
 * Map a series into a viewBox. `min`/`max` can be forced so two series drawn
 * on the same axes (this month vs last month) share one scale — otherwise the
 * shorter line would be stretched and the comparison would lie.
 */
export function project(
  values: number[],
  width: number,
  height: number,
  opts: {
    min?: number;
    max?: number;
    padTop?: number;
    padBottom?: number;
    /** Horizontal insets. Needed wherever a series ends in a dot — without
        them the marker is drawn centred on the edge and half of it is clipped. */
    padLeft?: number;
    padRight?: number;
    /** Points the x-axis is scaled against, when a series is shorter than the
        axis it sits on. A month-to-date line must land on the same x as day N
        of last month, not be stretched across the full width. */
    domain?: number;
  } = {},
): Pt[] {
  const { padTop = 0, padBottom = 0, padLeft = 0, padRight = 0 } = opts;
  const min = opts.min ?? Math.min(...values);
  const max = opts.max ?? Math.max(...values);
  const span = max - min || 1;
  const usableY = height - padTop - padBottom;
  const usableX = width - padLeft - padRight;
  const steps = (opts.domain ?? values.length) - 1 || 1;
  return values.map((v, i) => ({
    x: padLeft + (i / steps) * usableX,
    y: padTop + usableY - ((v - min) / span) * usableY,
  }));
}

/** Straight segments — right for the noisy net-worth line. */
export function polyPath(points: Pt[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

/**
 * Turn category shares into dash geometry for a donut with rounded caps and
 * even gaps.
 *
 * Round caps overhang the dash by half the stroke at each end, so the drawn
 * dash has to be shortened by a full stroke width and pushed forward by half
 * of one — otherwise neighbouring arcs collide and the gaps disappear.
 */
export function donutArcs(
  shares: number[],
  radius: number,
  strokeWidth: number,
  gap: number,
): { dash: number; offset: number; circumference: number }[] {
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;
  return shares.map((share) => {
    const arc = share * circumference;
    const dash = Math.max(1, arc - gap - strokeWidth);
    const offset = -(cursor + gap / 2 + strokeWidth / 2);
    cursor += arc;
    return { dash, offset, circumference };
  });
}

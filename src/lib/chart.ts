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
 * Catmull-Rom converted to cubic béziers. Used for the spend lines, which are
 * cumulative and so should read as one continuous climb rather than a
 * sawtooth. Tension 0.5 matches the curve in the Figma export.
 */
export function smoothPath(points: Pt[]): string {
  if (points.length < 3) return polyPath(points);
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(2)},${c1.y.toFixed(2)} ${c2.x.toFixed(2)},${c2.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Close a line down to the baseline so it can take the gradient wash. */
export function areaPath(points: Pt[], baseline: number, smooth = false): string {
  const line = smooth ? smoothPath(points) : polyPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x.toFixed(2)},${baseline} L${first.x.toFixed(2)},${baseline} Z`;
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

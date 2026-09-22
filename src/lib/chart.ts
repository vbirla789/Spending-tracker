/**
 * Turn category shares into dash geometry for a donut with flat ends and
 * even gaps (Figma 1497:199317 — the arcs are radial cuts, not round caps).
 *
 * Butt caps end exactly where the dash ends, so the geometry is direct: each
 * arc gives up one gap's length, half at each end.
 */
export function donutArcs(
  shares: number[],
  radius: number,
  gap: number,
): { dash: number; offset: number; circumference: number }[] {
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;
  return shares.map((share) => {
    const arc = share * circumference;
    const dash = Math.max(1, arc - gap);
    const offset = -(cursor + gap / 2);
    cursor += arc;
    return { dash, offset, circumference };
  });
}

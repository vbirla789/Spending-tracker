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

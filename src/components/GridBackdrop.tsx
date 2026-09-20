/**
 * The decorative grid behind the whole screen (Figma 1321:389939).
 *
 * One tile is a 400.423×309.057 block of ruled lines plus a scatter of filled
 * squares; the design stacks six of them down the page. The lines come from
 * the exported assets, the squares are reproduced as positioned divs since
 * they're plain rectangles with per-block alpha.
 *
 * Effective opacity is 0.56 × 0.07 ≈ 4% — it should read as paper texture,
 * not as a chart behind the content.
 */

const TILE_W = 400.423;
const TILE_H = 309.057;
const TILES = 6;

/** Squares within the blocks group, which itself sits at (12.54, 4.71). */
const BLOCKS: { x: number; y: number; w: number; h: number; a: number }[] = [
  { x: 213.68, y: 216.41, w: 21.246, h: 21.246, a: 0.5 },
  { x: 106.84, y: 216.41, w: 21.246, h: 21.246, a: 0.2 },
  { x: 299.27, y: 67.08, w: 21.246, h: 20.943, a: 0.25 },
  { x: 128.09, y: 131.1, w: 21.246, h: 20.943, a: 0.15 },
  { x: 277.72, y: 88.32, w: 21.246, h: 20.943, a: 0.25 },
  { x: 106.8, y: 67.08, w: 21.246, h: 20.943, a: 0.15 },
  { x: 277.72, y: 67.08, w: 21.246, h: 20.943, a: 0.25 },
  { x: 106.8, y: 131.1, w: 21.246, h: 20.943, a: 0.15 },
  { x: 85.59, y: 216.41, w: 21.246, h: 21.246, a: 0.2 },
  { x: 85.59, y: 237.65, w: 21.246, h: 21.55, a: 0.2 },
  { x: 42.8, y: 195.16, w: 21.246, h: 21.246, a: 0.2 },
  // "top" group, flattened from its 235.23,0 origin
  { x: 256.48, y: 24.28, w: 21.246, h: 21.246, a: 0.15 },
  { x: 235.0, y: 2.91, w: 21.246, h: 21.056, a: 0.15 },
  { x: 235.0, y: 24.164, w: 21.246, h: 21.194, a: 0.15 },
  // "top left" group, flattened from its 19.73,22.46 origin
  { x: 42.8, y: 45.22, w: 21.55, h: 21.853, a: 0.2 },
  { x: 21.25, y: 23.98, w: 21.55, h: 21.246, a: 0.2 },
  { x: 0, y: 24.28, w: 21.55, h: 21.246, a: 0.2 },
  { x: 21.25, y: 45.22, w: 21.55, h: 21.853, a: 0.2 },
  { x: 106.84, y: 2.73, w: 21.55, h: 21.246, a: 0.25 },
  { x: 42.8, y: 88.02, w: 21.246, h: 21.55, a: 0.2 },
  { x: 299.27, y: 195.16, w: 21.246, h: 21.246, a: 0.15 },
  { x: 320.52, y: 216.41, w: 21.246, h: 21.246, a: 0.15 },
];

function Tile() {
  return (
    <div className="relative shrink-0 opacity-[0.07]" style={{ width: TILE_W, height: TILE_H }}>
      {/* Ruled lines. The horizontal set is authored portrait and rotated,
          exactly as the component is set up in the file. */}
      <div
        className="absolute left-0 top-0 flex items-center justify-center"
        style={{ width: TILE_W, height: TILE_H }}
      >
        <div className="-rotate-90" style={{ width: 309.057, height: 400.423 }}>
          <img src="/icons/grid-hori.svg" alt="" className="block h-full w-full" />
        </div>
      </div>
      <img
        src="/icons/grid-verti.svg"
        alt=""
        className="absolute block"
        style={{ left: 12.35, top: -0.05, width: 405.987, height: 309.164 }}
      />

      <div
        className="absolute"
        style={{ left: 12.54, top: 4.71, width: 341.762, height: 259.205 }}
      >
        {BLOCKS.map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              background: `rgba(0,0,0,${b.a})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function GridBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-start overflow-hidden"
      style={{ width: TILE_W, opacity: 0.56 }}
    >
      {Array.from({ length: TILES }, (_, i) => (
        <Tile key={i} />
      ))}
    </div>
  );
}

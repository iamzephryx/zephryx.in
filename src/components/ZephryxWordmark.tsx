/**
 * The banner as a pixel bitmap rendered with SVG rects rather than text
 * glyphs. The original box-drawing/block-character ASCII art looked right
 * but depended on the active font actually containing those glyphs — it
 * didn't on Windows, so the browser silently substituted a different font
 * for just those characters and the columns stopped lining up. Drawing the
 * same blocky look as vector shapes removes the font from the equation
 * entirely: every platform renders the identical set of rectangles.
 */
const BITMAP = [
  '####### ####### ######  ##   ## ######  ##   ## ##   ##',
  '     ## ##      ##   ## ##   ## ##   ##  ## ##   ## ## ',
  '    ##  #####   ######  ####### ######    ###     ###  ',
  '   ##   ##      ##      ##   ## ##  ##     #      ###  ',
  '  ##    ##      ##      ##   ## ##   ##    #     ## ## ',
  '####### ####### ##      ##   ## ##   ##    #    ##   ##',
];

const CELL = 4;
const GAP = 0.6;
const COLS = BITMAP[0].length;
const ROWS = BITMAP.length;

export default function ZephryxWordmark() {
  return (
    <svg
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label="ZEPHRYX"
      className="block h-auto w-full max-w-[420px] text-red-core"
    >
      {BITMAP.flatMap((row, r) =>
        [...row].map((cell, c) =>
          cell === '#' ? (
            <rect
              key={`${r}-${c}`}
              x={c * CELL}
              y={r * CELL}
              width={CELL - GAP}
              height={CELL - GAP}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

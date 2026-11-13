import { NAVY, themed, WHITE } from '../art';
import { alpha, f1, P } from '../geometry';
import { big, column, D, EndLine, type IDrawProps, Kicker } from '../kit';
import type { TFaceModel } from '../model';

const D60 = 60;
const RING = 128;

// The panel's 5 × 7 font, one string per row with '#' for a lit pixel; the colon and infinity keep their own widths.
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.', '.', '#', '.', '#', '.', '.'],
  '∞': ['.........', '.##...##.', '#..#.#..#', '#...#...#', '#..#.#..#', '.##...##.', '.........'],
};
const BLANK = ['.....', '.....', '.....', '.....', '.....', '.....', '.....'];
const ROWS = 7;

type TCell = readonly [number, number];

// The reading laid out on the panel grid: every pixel, which are lit, and which belong to the colon.
function layout(text: string): { cols: number; lit: TCell[]; colon: TCell[] } {
  const lit: TCell[] = [];
  const colon: TCell[] = [];
  let col = 0;
  for (const ch of text) {
    if (col > 0) col += 1;
    const g = GLYPHS[ch] ?? BLANK;
    const w = g[0]?.length ?? 0;
    g.forEach((row, y) => {
      for (let x = 0; x < w; x++) if (row[x] === '#') (ch === ':' ? colon : lit).push([col + x, y]);
    });
    col += w;
  }
  return { cols: col, lit, colon };
}

// Circles as one path, so a whole layer of pixels is a single element.
const circles = (pts: readonly TCell[], r: number, dx = 0, dy = 0): string => {
  const rr = r.toFixed(2);
  const d2 = (2 * r).toFixed(2);
  return pts
    .map(([x, y]) => `M${f1(x - r + dx)} ${f1(y + dy)}a${rr} ${rr} 0 1 0 ${d2} 0a${rr} ${rr} 0 1 0 -${d2} 0`)
    .join('');
};

const SOCKET = { light: NAVY(0.06), dark: WHITE(0.055), oled: WHITE(0.07) } as const;
const RIM = { light: WHITE(0.95), dark: WHITE(0.045), oled: WHITE(0.05) } as const;

// The reading as a dot-matrix panel: unlit pixels stay visible, lit ones carry a soft bloom at night.
function Matrix({ m }: { m: TFaceModel }) {
  const { cols, lit, colon } = layout(m.digits);
  // The pitch shrinks as hours lengthen the reading, so the panel stays about 200 wide inside the ring.
  const p = Math.min(8, 204 / Math.max(1, cols));
  const r = p * 0.4;
  const w = (cols - 1) * p + 2 * r;
  const h = (ROWS - 1) * p + 2 * r;
  const at = ([x, y]: TCell): TCell => [r + x * p, r + y * p];
  const on = new Set([...lit, ...colon].map(([x, y]) => y * cols + x));
  const off: TCell[] = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < cols; x++) if (!on.has(y * cols + x)) off.push(at([x, y]));
  const px = lit.map(at);
  const dots = colon.map(at);
  const ink = m.t.ink;
  // A hollow colon is the shape of "not awake", as on Flip.
  const ring = 0.2 * p;
  return (
    <svg width={f1(w)} height={f1(h)} viewBox={`0 0 ${f1(w)} ${f1(h)}`} style={{ display: 'block' }} aria-hidden="true">
      <path d={circles(off, r)} fill={themed(m.theme, SOCKET)} />
      {m.night && <path d={circles(px, r * 1.6)} style={{ fill: ink }} opacity=".1" />}
      <path d={circles(px, r)} style={{ fill: ink }} />
      <path
        className={m.live ? 'afx-breath' : undefined}
        d={circles(dots, m.hollow ? r - ring / 2 : r)}
        fill={m.hollow ? 'none' : ink}
        strokeWidth={m.hollow ? f1(ring) : undefined}
        style={m.hollow ? { stroke: ink } : undefined}
      />
    </svg>
  );
}

// Sixty dots around the dial; each minute left keeps one lit, in one heat colour.
export default function Dots({ m }: IDrawProps) {
  const litN = m.st === 'idle' ? D60 : Math.round(m.frac * D60);
  const c = m.heat(m.frac);
  // Spent minutes stay visible as empty sockets, their lower lip catching the light; the burning minute is drawn apart.
  const bigSock: TCell[] = [];
  const smallSock: TCell[] = [];
  const large: TCell[] = [];
  const small: TCell[] = [];
  for (let i = 0; i < D60; i++) {
    if (i === litN - 1) continue;
    const major = i % 5 === 0;
    (i >= litN ? (major ? bigSock : smallSock) : major ? large : small).push(P(RING, i * 6));
  }
  const lead = litN > 0 ? P(RING, (litN - 1) * 6) : undefined;
  const leadR = (litN - 1) % 5 === 0 ? 4.5 : 3;
  // A soft specular on each lit lens, lit from the top left.
  const core = (pts: readonly TCell[], r: number) => circles(pts, r * 0.42, -r * 0.24, -r * 0.24);
  const lens = m.night ? WHITE(0.42) : WHITE(0.5);
  return (
    <>
      <svg
        style={{ position: 'absolute', left: 0, top: 0 }}
        width={360}
        height={310}
        viewBox="0 0 360 310"
        aria-hidden="true"
      >
        <path
          className={D}
          d={circles(bigSock, 4.5, 0.6, 0.7) + circles(smallSock, 3, 0.5, 0.6)}
          fill={themed(m.theme, RIM)}
        />
        <path d={circles(bigSock, 4.5) + circles(smallSock, 3)} fill={m.t.line} />
        {m.night && <path className={D} d={circles(large, 7.2)} style={{ fill: alpha(c, 0x30) }} />}
        <path d={circles(large, 4.5) + circles(small, 3)} style={{ fill: c }} />
        <path className={D} d={core(large, 4.5) + core(small, 3)} fill={lens} />
        {lead && (
          // The minute now burning breathes while the screen is held.
          <g className={m.live ? 'afx-breath' : undefined}>
            {m.night && <path className={D} d={circles([lead], leadR + 2.7)} style={{ fill: alpha(c, 0x30) }} />}
            <path d={circles([lead], leadR)} style={{ fill: c }} />
            <path className={D} d={core([lead], leadR)} fill={lens} />
          </g>
        )}
      </svg>
      <div style={column(10)}>
        <Kicker m={m} />
        {m.thumb ? <span style={big(m.long ? 52 : 72)}>{m.digits}</span> : <Matrix m={m} />}
        <EndLine m={m} px={15} />
      </div>
    </>
  );
}

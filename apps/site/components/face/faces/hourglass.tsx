import { Fragment, useId } from 'react';
import { NAVY, WHITE } from '../art';
import { alpha, f1 } from '../geometry';
import { big, fit, type IDrawProps, Kicker, L, lmin, MONO, Svg } from '../kit';

const BULB =
  'M66 42 H154 C154 98 117 126 114 155 C117 184 154 212 154 268 H66 C66 212 103 184 106 155 C103 126 66 98 66 42 Z';
const TOP_CLIP = 'M66 42 H154 C154 98 117 126 114 155 H106 C103 126 66 98 66 42 Z';
const BOTTOM_CLIP = 'M106 155 C103 184 66 212 66 268 H154 C154 212 117 184 114 155 Z';
const CAP = { light: ['#C9CBD8', '#F4F4FA'], night: ['#2B3550', '#55617E'] } as const;
const GLASS_LINE = { light: NAVY(0.28), night: 'rgba(220,230,255,.32)' };
const GRAINS = [
  [96, 0.5, 1.2],
  [104, 0.8, 1],
  [117, 0.65, 1.2],
  [124, 0.35, 1],
  [88, 0.3, 1],
  [132, 0.25, 1.1],
  [110, 0.95, 1],
  [100, 0.2, 1],
] as const;

const bez = (a: number, b: number, c: number, d: number, t: number): number =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
const sample = (xs: readonly number[], ys: readonly number[]): (readonly [number, number])[] =>
  Array.from({ length: 201 }, (_, i) => {
    const t = i / 200;
    return [
      bez(xs[0] ?? 0, xs[1] ?? 0, xs[2] ?? 0, xs[3] ?? 0, t),
      bez(ys[0] ?? 0, ys[1] ?? 0, ys[2] ?? 0, ys[3] ?? 0, t),
    ];
  });
const lerpAt = (pts: readonly (readonly [number, number])[], x: number): number => {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (!a || !b) continue;
    const lo = Math.min(a[0], b[0]);
    const hi = Math.max(a[0], b[0]);
    if (x >= lo && x <= hi) return hi === lo ? a[1] : a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
  }
  return pts[pts.length - 1]?.[1] ?? 0;
};
// The upper bulb's right wall as (half width, y), and the pile's left flank as (x, height share).
const WALL = sample([44, 44, 7, 4], [42, 98, 126, 155]);
const FLANK = sample([58, 80, 96, 110], [0.42, 0.6, 1.15, 1.15]);
// One column per pixel across the glass: where the upper bulb's wall ends and how high the pile stands.
const COLS = Array.from({ length: 88 }, (_, i) => {
  const x = 66.5 + i;
  const c = Math.abs(x - 110);
  return { u: (x - 60) / 100, wall: c <= 4 ? 155 : lerpAt(WALL, c), k: lerpAt(FLANK, Math.min(x, 220 - x)) };
});
// Sand area in the upper bulb under a surface at ys that dips d in the middle.
const topArea = (ys: number, d: number): number =>
  COLS.reduce((a, c) => a + Math.max(0, c.wall - Math.max(42, ys + 4 * d * c.u * (1 - c.u))), 0);
// Sand area of a pile p tall in the lower bulb (the mirror of the upper one about y 155).
const pileArea = (p: number): number =>
  COLS.reduce((a, c) => a + Math.max(0, 268 - Math.max(310 - c.wall, 270 - p * c.k)), 0);
const solve = (f: (v: number) => number, target: number, lo: number, hi: number): number => {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 24; i++) {
    const mid = (a + b) / 2;
    if (f(mid) < target) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
};
const dipOf = (ft: number): number => (ft > 0.02 ? Math.min(16, 6 + 14 * (1 - ft)) : 0);
const TOP_FULL = topArea(50, dipOf(1));
const PILE_MAX = 96;
const PILE_FULL = pileArea(PILE_MAX);

// Sand falls from top to bottom as the session runs; a fine stream moves while awake.
export default function Hourglass({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const { accent } = m;
  const ft = m.ringFrac;
  const hi = m.heat(m.frac);
  const lo = alpha(hi, 0xb0);
  const dip = dipOf(ft);
  // Levels are solved by area, so the sand shown in each bulb is the share of time it stands for.
  const topY = ft >= 1 ? 50 : solve((v) => -topArea(v, dip), -ft * TOP_FULL, 42, 155);
  const edge = `M60 ${f1(topY)} Q110 ${f1(topY + dip * 2)} 160 ${f1(topY)}`;
  const pile = ft <= 0 ? PILE_MAX : solve(pileArea, (1 - ft) * PILE_FULL, 0, PILE_MAX);
  const y = (k: number) => f1(270 - pile * k);
  const bottom = `M58 270 V${y(0.42)} C80 ${y(0.6)} 96 ${y(1.15)} 110 ${y(1.15)} C124 ${y(1.15)} 140 ${y(0.6)} 162 ${y(0.42)} V270 Z`;
  const cap = m.night ? CAP.night : CAP.light;
  // The end line breaks only between its phrases, never inside a time.
  const phrases = m.endLine.split(' · ');
  const ids = {
    top: `af-hg-t${id}`,
    bot: `af-hg-b${id}`,
    sand: `af-hg-s${id}`,
    wood: `af-hg-w${id}`,
    glow: `af-hg-g${id}`,
  };
  return (
    <>
      <Svg>
        <defs>
          <clipPath id={ids.top}>
            <path d={TOP_CLIP} />
          </clipPath>
          <clipPath id={ids.bot}>
            <path d={BOTTOM_CLIP} />
          </clipPath>
          <linearGradient id={ids.sand} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: hi }} />
            <stop offset="1" style={{ stopColor: lo }} />
          </linearGradient>
          <linearGradient id={ids.wood} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: cap[0] }} />
            <stop offset=".5" style={{ stopColor: cap[1] }} />
            <stop offset="1" style={{ stopColor: cap[0] }} />
          </linearGradient>
          <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: accent, stopOpacity: 0.28 }} />
            <stop offset="1" style={{ stopColor: accent, stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="214" rx="70" ry="60" fill={`url(#${ids.glow})`} opacity={m.liveOp} />
        <rect x="46" y="38" width="6" height="234" rx="3" fill={`url(#${ids.wood})`} />
        <rect x="168" y="38" width="6" height="234" rx="3" fill={`url(#${ids.wood})`} />
        <path d={BULB} style={{ fill: m.theme === 'light' ? NAVY(0.03) : WHITE(0.03) }} />
        <g clipPath={`url(#${ids.top})`}>
          {ft > 0.01 && (
            <>
              <path className="af-tr" d={`${edge} V160 H60 Z`} fill={`url(#${ids.sand})`} />
              <path d={edge} fill="none" strokeWidth="1.5" opacity=".9" style={{ stroke: hi }} />
            </>
          )}
        </g>
        <g clipPath={`url(#${ids.bot})`}>
          {pile > 1 && <path className="af-tr" d={bottom} fill={`url(#${ids.sand})`} />}
          {pile > 6 &&
            GRAINS.map(([x, k, r]) => <circle key={x} cx={x} cy={y(k)} r={r} opacity=".7" style={{ fill: lo }} />)}
        </g>
        <line
          className="afx-stream"
          x1="110"
          y1="150"
          x2="110"
          y2={f1(268 - pile * 1.15)}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3 5"
          opacity={m.live && ft > 0.01 && ft < 0.999 ? 1 : 0}
          style={{ stroke: hi }}
        />
        <path
          d={BULB}
          fill="none"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ stroke: m.night ? GLASS_LINE.night : GLASS_LINE.light }}
        />
        <path d="M74 52 C76 92 96 118 104 140" fill="none" strokeWidth="3" strokeLinecap="round" stroke={WHITE(0.28)} />
        <path
          d="M76 258 C78 226 92 196 102 176"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={WHITE(0.16)}
        />
        <rect x="38" y="26" width="144" height="16" rx="6" fill={`url(#${ids.wood})`} />
        <rect x="38" y="268" width="144" height="16" rx="6" fill={`url(#${ids.wood})`} />
        <rect x="38" y="26" width="144" height="3" rx="1.5" fill={WHITE(0.22)} />
        <rect x="38" y="268" width="144" height="3" rx="1.5" fill={WHITE(0.22)} />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 196,
          top: 0,
          width: 158,
          height: 310,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Kicker m={m} />
        <span style={{ ...big(fit(m, m.long ? 40 : 52, 34)), whiteSpace: 'nowrap' }}>{m.digits}</span>
        <span className={L} style={{ fontSize: lmin(14), color: m.t.ink2 }}>
          {phrases.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && ' '}
              <span style={{ whiteSpace: 'nowrap' }}>{i < phrases.length - 1 ? `${p} ·` : p}</span>
            </Fragment>
          ))}
        </span>
        {!m.indef && (
          <span className={L} style={{ marginTop: 8, fontFamily: MONO, fontSize: lmin(12), color: accent }}>
            {m.pctLabel} sand left
          </span>
        )}
      </div>
    </>
  );
}

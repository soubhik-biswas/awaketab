import { Fragment, useId } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { f1 } from '../geometry';
import { big, D, fit, type IDrawProps, Kicker, L, lmin, MONO, Svg } from '../kit';

const BULB =
  'M66 42 H154 C154 98 117 126 114 155 C117 184 154 212 154 268 H66 C66 212 103 184 106 155 C103 126 66 98 66 42 Z';
const TOP_CLIP = 'M66 42 H154 C154 98 117 126 114 155 H106 C103 126 66 98 66 42 Z';
const BOTTOM_CLIP = 'M106 155 C103 184 66 212 66 268 H154 C154 212 117 184 114 155 Z';
const CAP: TThemed<readonly [string, string, string]> = {
  light: ['#FFFFFF', '#E2E3EC', '#C4C6D3'],
  dark: ['#4C556E', '#2A3146', '#171B28'],
  oled: ['#3A4257', '#1E2333', '#10131C'],
};
const ROD: TThemed<readonly [string, string, string]> = {
  light: ['#BFC1CE', '#FFFFFF', '#C8CAD6'],
  dark: ['#1C2130', '#5B6582', '#222736'],
  oled: ['#151925', '#454E66', '#191D2A'],
};
const GLASS: TThemed<readonly [string, string, string]> = {
  light: [NAVY(0.02), NAVY(0.035), NAVY(0.055)],
  dark: [WHITE(0.065), WHITE(0.02), WHITE(0.04)],
  oled: [WHITE(0.06), WHITE(0.015), WHITE(0.035)],
};
const GLASS_EDGE = { light: NAVY(0.3), night: 'rgba(220,230,255,.36)' };

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
// The pile's left flank as x and height share: a cone steepening to the point the stream lands on.
const FLANK_X = [58, 78, 100, 110] as const;
const FLANK_K = [0.42, 0.58, 1.06, 1.15] as const;
// The upper bulb's right wall as (half width, y).
const WALL = sample([44, 44, 7, 4], [42, 98, 126, 155]);
const FLANK = sample(FLANK_X, FLANK_K);
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
// A full bulb lies flat; once sand runs, a funnel opens over the neck and deepens as the bulb empties.
const dipOf = (ft: number): number => (ft >= 1 ? 0 : ft > 0.02 ? Math.min(16, 6 + 14 * (1 - ft)) : 0);
const TOP_FULL = topArea(50, 0);
const PILE_MAX = 96;
const PILE_FULL = pileArea(PILE_MAX);
// Grains settling where the stream lands: [dx, dy above the point, radius].
const SETTLE = [
  [-4.5, 2.5, 0.9],
  [3.8, 1.6, 0.8],
  [-1.2, 4.6, 0.7],
] as const;

const mix = (c: string, pct: number, base: string): string => `color-mix(in srgb, ${c} ${pct}%, ${base})`;

// Sand falls from top to bottom as the session runs; a fine stream moves while awake.
export default function Hourglass({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const { theme, night } = m;
  const ft = m.indef ? 1 : m.ringFrac;
  const hi = m.heat(ft);
  const dip = dipOf(ft);
  // Levels are solved by area, so the sand shown in each bulb is the share of time it stands for.
  const topY = ft >= 1 ? 50 : solve((v) => -topArea(v, dip), -ft * TOP_FULL, 42, 155);
  const edge = `M60 ${f1(topY)} Q110 ${f1(topY + dip * 2)} 160 ${f1(topY)}`;
  const pile = ft <= 0 ? PILE_MAX : solve(pileArea, (1 - ft) * PILE_FULL, 0, PILE_MAX);
  const y = (k: number) => f1(270 - pile * k);
  const [x0, x1, x2, x3] = FLANK_X;
  const [k0, k1, k2, k3] = FLANK_K;
  const peak = 270 - pile * k3;
  const flank = `M${x0} ${y(k0)} C${x1} ${y(k1)} ${x2} ${y(k2)} ${x3} ${y(k3)} C${220 - x2} ${y(k2)} ${220 - x1} ${y(k1)} ${220 - x0} ${y(k0)}`;
  const bottom = `M${x0} 270 V${y(k0)}${flank.slice(flank.indexOf(' C'))} V270 Z`;
  const flowing = m.awake && !m.indef && ft > 0.01 && ft < 0.999;
  const cap = CAP[theme];
  const rod = ROD[theme];
  const glass = GLASS[theme];
  const sheen = (a: number): string => WHITE(night ? a : Math.min(1, a * 3.2));
  const shade = night ? BLACK(0.32) : NAVY(0.12);
  // The end line breaks only between its phrases, never inside a time.
  const phrases = m.endLine.split(' · ');
  const ids = {
    top: `af-hg-t${id}`,
    bot: `af-hg-b${id}`,
    sand: `af-hg-s${id}`,
    grain: `af-hg-n${id}`,
    glass: `af-hg-l${id}`,
    cap: `af-hg-c${id}`,
    brush: `af-hg-r${id}`,
    rod: `af-hg-o${id}`,
    foot: `af-hg-f${id}`,
  };
  const capAt = (top: number) => (
    <>
      <rect x="38" y={top} width="144" height="16" rx="5" fill={`url(#${ids.cap})`} />
      <rect className={D} x="38" y={top} width="144" height="16" rx="5" fill={`url(#${ids.brush})`} />
      <rect x="41" y={top + 0.5} width="138" height="1" rx=".5" fill={sheen(0.3)} />
      <rect x="41" y={top + 14.5} width="138" height="1" rx=".5" fill={shade} />
    </>
  );
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
            <stop offset="0" style={{ stopColor: mix(hi, 72, '#FFFFFF') }} />
            <stop offset=".35" style={{ stopColor: hi }} />
            <stop offset="1" style={{ stopColor: mix(hi, 70, '#000000') }} />
          </linearGradient>
          <pattern id={ids.grain} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1.2" r=".55" fill={BLACK(0.3)} />
            <circle cx="3.6" cy="3.4" r=".5" fill={WHITE(0.22)} />
            <circle cx="1.8" cy="4.2" r=".35" fill={BLACK(0.22)} />
          </pattern>
          <linearGradient id={ids.glass} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: glass[0] }} />
            <stop offset=".55" style={{ stopColor: glass[1] }} />
            <stop offset="1" style={{ stopColor: glass[2] }} />
          </linearGradient>
          <linearGradient id={ids.cap} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: cap[0] }} />
            <stop offset=".5" style={{ stopColor: cap[1] }} />
            <stop offset="1" style={{ stopColor: cap[2] }} />
          </linearGradient>
          <linearGradient id={ids.brush} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: WHITE(0) }} />
            <stop offset=".3" style={{ stopColor: WHITE(night ? 0.1 : 0.5) }} />
            <stop offset=".5" style={{ stopColor: WHITE(0) }} />
            <stop offset=".75" style={{ stopColor: WHITE(night ? 0.07 : 0.35) }} />
            <stop offset="1" style={{ stopColor: WHITE(0) }} />
          </linearGradient>
          <linearGradient id={ids.rod} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: rod[0] }} />
            <stop offset=".35" style={{ stopColor: rod[1] }} />
            <stop offset="1" style={{ stopColor: rod[2] }} />
          </linearGradient>
          <radialGradient id={ids.foot} cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: night ? BLACK(0.5) : NAVY(0.16) }} />
            <stop offset="1" style={{ stopColor: night ? BLACK(0) : NAVY(0) }} />
          </radialGradient>
        </defs>
        <ellipse className={D} cx="110" cy="290" rx="76" ry="4.5" fill={`url(#${ids.foot})`} />
        <rect x="46" y="38" width="6" height="234" rx="3" fill={`url(#${ids.rod})`} />
        <rect x="168" y="38" width="6" height="234" rx="3" fill={`url(#${ids.rod})`} />
        <path d={BULB} fill={`url(#${ids.glass})`} />
        <g clipPath={`url(#${ids.top})`}>
          {ft > 0.01 && (
            <>
              <path d={`${edge} V160 H60 Z`} fill={`url(#${ids.sand})`} />
              <path className={D} d={`${edge} V160 H60 Z`} fill={`url(#${ids.grain})`} />
              <path d={edge} fill="none" strokeWidth="1.2" style={{ stroke: mix(hi, 55, '#FFFFFF') }} />
            </>
          )}
        </g>
        <g clipPath={`url(#${ids.bot})`}>
          {pile > 1 && (
            <>
              <path d={bottom} fill={`url(#${ids.sand})`} />
              <path className={D} d={bottom} fill={`url(#${ids.grain})`} />
              <path d={flank} fill="none" strokeWidth="1" opacity=".8" style={{ stroke: mix(hi, 55, '#FFFFFF') }} />
            </>
          )}
        </g>
        {flowing && (
          <>
            <line x1="110" y1="153" x2="110" y2={f1(peak + 1)} strokeWidth="1.1" opacity=".55" style={{ stroke: hi }} />
            <line
              className="afx-stream"
              x1="110"
              y1="153"
              x2="110"
              y2={f1(peak + 1)}
              strokeWidth="1.9"
              strokeDasharray="1.6 4.4"
              style={{ stroke: mix(hi, 72, '#FFFFFF') }}
            />
            <line
              className={`afx-stream ${D}`}
              x1="110.7"
              y1="153"
              x2="110.7"
              y2={f1(peak)}
              strokeWidth="1.3"
              strokeDasharray="1 11"
              opacity=".8"
              style={{ stroke: hi }}
            />
            {SETTLE.map(([dx, dy, r], i) => (
              <circle
                key={dx}
                className={`afx-twinkle ${D}`}
                data-delay={(i * 0.7).toFixed(1)}
                cx={f1(110 + dx)}
                cy={f1(peak - dy)}
                r={r}
                opacity=".7"
                style={{ fill: mix(hi, 72, '#FFFFFF') }}
              />
            ))}
          </>
        )}
        <path d={BULB} fill="none" strokeWidth="5" strokeLinejoin="round" style={{ stroke: glass[2] }} />
        <path
          d={BULB}
          fill="none"
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ stroke: night ? GLASS_EDGE.night : GLASS_EDGE.light }}
        />
        <ellipse
          cx="110"
          cy="155"
          rx="5.5"
          ry="1.6"
          fill="none"
          strokeWidth="1"
          style={{ stroke: night ? GLASS_EDGE.night : GLASS_EDGE.light }}
        />
        <path d="M74 52 C76 92 96 118 104 140" fill="none" strokeWidth="3" strokeLinecap="round" stroke={sheen(0.28)} />
        <path
          className={D}
          d="M81 50 C83 84 98 110 105 127"
          fill="none"
          strokeWidth="1"
          strokeLinecap="round"
          stroke={sheen(0.14)}
        />
        <path
          className={D}
          d="M146 60 C145 80 136 100 126 116"
          fill="none"
          strokeWidth="1.2"
          strokeLinecap="round"
          stroke={sheen(0.1)}
        />
        <path
          d="M76 258 C78 226 92 196 102 176"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={sheen(0.16)}
        />
        <rect x="64" y="42" width="92" height="2" rx="1" fill={shade} />
        <rect x="64" y="266" width="92" height="2" rx="1" fill={shade} />
        {capAt(26)}
        {capAt(268)}
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
          <span className={L} style={{ marginTop: 8, fontFamily: MONO, fontSize: lmin(12), color: m.heatT(ft) }}>
            {m.pctLabel} sand left
          </span>
        )}
      </div>
    </>
  );
}

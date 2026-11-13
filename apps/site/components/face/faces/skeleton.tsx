import { type CSSProperties, useId } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { alpha, arc, f1, P, ticks } from '../geometry';
import { D, hand, type IDrawProps, lmin, MONO, Svg, windowAt } from '../kit';
import { band, Crystal } from './analog-dial';

const BRASS = ['#F7ECCB', '#CFB47C', '#8A6F3E'] as const;
const EDGE = ['#F2F5FA', '#8D97AB'] as const;
const CORE = ['#BCC4D2', '#5E677A'] as const;
const RUBY = ['#FF9AB0', '#D81B4F', '#6E0822'] as const;
const BLUED = ['#9DBBF5', '#3A5DAE', '#172A63'] as const;
const FLANGE: TThemed<readonly [string, string]> = {
  light: ['#FFFFFF', '#E1E4EC'],
  dark: ['#2B2F3B', '#11131A'],
  oled: ['#0B0D13', '#000000'],
};
// The base plate under the open movement, grained with perlage: overlapping rings of circular graining.
const GROUND: TThemed<CSSProperties> = {
  light: {
    background: `radial-gradient(circle, ${NAVY(0.045)} 0 2px, ${NAVY(0.015)} 4px, transparent 6.5px) 0 0 / 13px 13px, radial-gradient(circle, ${NAVY(0.03)} 0 2px, transparent 6px) 6.5px 6.5px / 13px 13px, radial-gradient(circle at 35% 25%, #FFFFFF, #E9EBF1 80%)`,
    boxShadow: `inset 0 3px 10px ${NAVY(0.14)}`,
  },
  dark: {
    background: `radial-gradient(circle, ${WHITE(0.06)} 0 2px, ${WHITE(0.02)} 4px, transparent 6.5px) 0 0 / 13px 13px, radial-gradient(circle, ${WHITE(0.04)} 0 2px, transparent 6px) 6.5px 6.5px / 13px 13px, radial-gradient(circle at 35% 25%, #1B1E27, #0A0B10 80%)`,
    boxShadow: `inset 0 3px 10px ${BLACK(0.55)}`,
  },
  oled: {
    background: `radial-gradient(circle, ${WHITE(0.03)} 0 2px, transparent 6px) 0 0 / 13px 13px, #000000`,
  },
};
const HAND = {
  light: 'linear-gradient(90deg, #A88B52 50%, #6E5630 50%)',
  night: 'linear-gradient(90deg, #FBF3DA 50%, #BFA36C 50%)',
};
const TICK = { light: '#7A6238', night: '#CFB47C' };
const DAUPHINE = 'polygon(50% 0, 100% 82%, 50% 100%, 0 82%)';
const WINDOW: TThemed<CSSProperties> = {
  light: {
    background: 'rgba(255,255,255,.92)',
    boxShadow: `inset 0 1px 0 #FFFFFF, 0 0 0 1px #D9D9E5, 0 4px 10px ${NAVY(0.12)}`,
  },
  dark: {
    background: 'rgba(7,9,14,.84)',
    boxShadow: `inset 0 1px 0 ${WHITE(0.08)}, 0 0 0 1px #2A2D38, 0 4px 10px ${BLACK(0.4)}`,
  },
  oled: { background: '#000000', boxShadow: '0 0 0 1px #16181F' },
};

const circle = (cx: number, cy: number, r: number): string =>
  `M${f1(cx - r)} ${f1(cy)}A${r} ${r} 0 1 0 ${f1(cx + r)} ${f1(cy)}A${r} ${r} 0 1 0 ${f1(cx - r)} ${f1(cy)}Z`;

// A gear outline: n teeth of depth d on radius r around (cx, cy).
const gear = (cx: number, cy: number, r: number, n: number, d: number): string => {
  const step = 360 / n;
  let p = '';
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    const pts: readonly (readonly [number, number])[] = [
      [a0, r - d],
      [a0 + step * 0.18, r],
      [a0 + step * 0.5, r],
      [a0 + step * 0.68, r - d],
    ];
    pts.forEach(([deg, rr], j) => {
      const [x, y] = P(rr, deg, cx, cy);
      p += `${i === 0 && j === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
    });
  }
  return `${p}Z`;
};

interface IWheel {
  cx: number;
  cy: number;
  rim: string;
  spokes: string;
  hub: number;
}
// A skeletonised wheel: the toothed rim cut out (even-odd), straight spokes to a hub.
const wheel = (cx: number, cy: number, r: number, n: number, d: number, arms: number, hub: number): IWheel => {
  const inner = r - d - 5;
  let spokes = '';
  for (let k = 0; k < arms; k++) {
    const deg = (k * 360) / arms + 15;
    const [ax, ay] = P(hub - 1, deg, cx, cy);
    const [bx, by] = P(inner + 1.5, deg, cx, cy);
    spokes += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  }
  return { cx, cy, rim: gear(cx, cy, r, n, d) + circle(cx, cy, inner), spokes, hub };
};
const W1 = wheel(132, 122, 50, 18, 7, 5, 10);
const W2 = wheel(222, 118, 34, 14, 6, 4, 7);
const W3 = wheel(168, 200, 30, 12, 6, 4, 6);

const BX = 240;
const BY = 200;
const spiral = (r0: number, r1: number, turns: number): string => {
  const n = Math.round(turns * 24);
  let d = '';
  for (let i = 0; i <= n; i++) {
    const [x, y] = P(r0 + ((r1 - r0) * i) / n, i * 15, BX, BY);
    d += `${i === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)}`;
  }
  return d;
};
const HAIRSPRING = spiral(3, 16, 4.5);
const ARMS = [30, 150, 270]
  .map((deg) => {
    const [ax, ay] = P(3, deg, BX, BY);
    const [bx, by] = P(21, deg, BX, BY);
    return `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  })
  .join('');
const TIMING = Array.from({ length: 8 }, (_, i) => P(24.6, i * 45 + 22.5, BX, BY));

const BRIDGES = [
  { d: 'M70 148 L132 122 L222 118 L270 98', w: 13 },
  { d: 'M90 214 L168 200', w: 11 },
  { d: `M268 222 L${BX} ${BY}`, w: 11 },
] as const;
const SCREWS = [
  [70, 148],
  [270, 98],
  [90, 214],
  [268, 222],
] as const;
const JEWELS = [
  [132, 122],
  [222, 118],
  [168, 200],
  [BX, BY],
] as const;

const RING = band(118, 134, 0, 360);
const MINOR = ticks(128, 132.5, 60, (i) => i % 5 !== 0);
const HOURS = ticks(121, 132.5, 12, (i) => i !== 0);
const TWELVE = ticks(121, 132.5, 360, (i) => i === 2 || i === 358);

// The power reserve: a fan under 12 that empties as the session runs down.
const PR = { cx: 180, cy: 96, r: 38 } as const;
const PR_TRACK = arc(PR.r, -45, 45, PR.cx, PR.cy);
const PR_TICKS = [-45, -22.5, 0, 22.5, 45]
  .map((deg) => {
    const [ax, ay] = P(PR.r + 4.5, deg, PR.cx, PR.cy);
    const [bx, by] = P(PR.r + 8, deg, PR.cx, PR.cy);
    return `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  })
  .join('');

// An open movement: brass wheels turn, the balance swings under its cock and the power reserve shows the time left.
export default function Skeleton({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const u = (name: string): string => `af-sk-${name}${id}`;
  const url = (name: string): string => `url(#${u(name)})`;
  const k = m.night ? 'night' : 'light';
  const flange = FLANGE[m.theme];
  const shade = m.night ? BLACK(0.45) : NAVY(0.2);
  // The shadow sits on the turning hand and the dauphine cut on its blade, so the cut cannot clip the shadow away.
  const lift = { filter: `drop-shadow(0 2px 3px ${m.night ? BLACK(0.55) : NAVY(0.3)})` };
  const blade = <span style={{ position: 'absolute', inset: 0, background: HAND[k], clipPath: DAUPHINE }} />;
  const reserve = m.indef ? 1 : m.ringFrac;
  const wheelArt = (w: IWheel, fill: string, cls: string, spoke: number) => (
    <g className={cls} data-svg-origin={`${String(w.cx)} ${String(w.cy)}`}>
      <path d={w.rim} fillRule="evenodd" fill={fill} />
      <path d={w.spokes} fill="none" stroke={fill} strokeWidth={spoke} />
      <circle cx={w.cx} cy={w.cy} r={w.hub} fill={fill} />
    </g>
  );
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 21,
          width: 268,
          height: 268,
          borderRadius: '50%',
          ...GROUND[m.theme],
        }}
      />
      <Svg>
        <defs>
          <linearGradient id={u('brass')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: BRASS[0] }} />
            <stop offset=".5" style={{ stopColor: BRASS[1] }} />
            <stop offset="1" style={{ stopColor: BRASS[2] }} />
          </linearGradient>
          <linearGradient id={u('steel')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: EDGE[0] }} />
            <stop offset="1" style={{ stopColor: EDGE[1] }} />
          </linearGradient>
          <linearGradient id={u('core')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: CORE[0] }} />
            <stop offset="1" style={{ stopColor: CORE[1] }} />
          </linearGradient>
          <linearGradient id={u('flange')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: flange[0] }} />
            <stop offset="1" style={{ stopColor: flange[1] }} />
          </linearGradient>
          <radialGradient id={u('ruby')} cx=".35" cy=".35" r=".75">
            <stop offset="0" style={{ stopColor: RUBY[0] }} />
            <stop offset=".45" style={{ stopColor: RUBY[1] }} />
            <stop offset="1" style={{ stopColor: RUBY[2] }} />
          </radialGradient>
          <radialGradient id={u('blued')} cx=".35" cy=".35" r=".75">
            <stop offset="0" style={{ stopColor: BLUED[0] }} />
            <stop offset=".5" style={{ stopColor: BLUED[1] }} />
            <stop offset="1" style={{ stopColor: BLUED[2] }} />
          </radialGradient>
        </defs>
        <g opacity={m.theme === 'oled' ? 0.82 : 1}>
          {wheelArt(W1, url('brass'), 'afx-spinS', 4)}
          {wheelArt(W2, url('steel'), 'afx-spinR', 3)}
          {wheelArt(W3, url('brass'), 'afx-spin', 3)}
          <path
            className={D}
            d={HAIRSPRING}
            fill="none"
            strokeWidth=".8"
            opacity=".8"
            style={{ stroke: m.night ? EDGE[0] : CORE[1] }}
          />
          <g className="afx-wobble" data-svg-origin={`${String(BX)} ${String(BY)}`}>
            <circle cx={BX} cy={BY} r="22" fill="none" stroke={url('brass')} strokeWidth="3.5" />
            <path d={ARMS} fill="none" stroke={url('brass')} strokeWidth="2" strokeLinecap="round" />
            <g className={D}>
              {TIMING.map(([x, y], i) => (
                <circle key={i} cx={f1(x)} cy={f1(y)} r="1.5" fill={url('brass')} />
              ))}
            </g>
          </g>
          {BRIDGES.map((b) => (
            <g key={b.d} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={b.d} transform="translate(1.5 2.5)" strokeWidth={b.w + 1} style={{ stroke: shade }} />
              <path d={b.d} stroke={url('steel')} strokeWidth={b.w} />
              <path d={b.d} stroke={url('core')} strokeWidth={b.w - 4} />
            </g>
          ))}
          <g className={D}>
            {SCREWS.map(([x, y]) => (
              <g key={`${String(x)}-${String(y)}`}>
                <circle cx={x} cy={y} r="3.6" fill={url('blued')} />
                <path
                  d={`M${f1(x - 2.4)} ${f1(y - 1)}L${f1(x + 2.4)} ${f1(y + 1)}`}
                  strokeWidth="1"
                  strokeLinecap="round"
                  style={{ stroke: BLUED[2] }}
                />
              </g>
            ))}
          </g>
          {JEWELS.map(([x, y]) => (
            <g key={`${String(x)}-${String(y)}`}>
              <circle cx={x} cy={y} r="5.4" fill={url('steel')} />
              <circle cx={x} cy={y} r="3.5" fill={url('ruby')} />
              <circle className={D} cx={f1(x - 1.2)} cy={f1(y - 1.3)} r=".9" fill={WHITE(0.85)} />
            </g>
          ))}
        </g>
        <path
          d={PR_TRACK}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ stroke: alpha(m.t.ink2, 0x38) }}
        />
        <path
          d={arc(PR.r, -45, -45 + 90 * reserve, PR.cx, PR.cy)}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ stroke: m.accent }}
        />
        <path className={D} d={PR_TICKS} strokeWidth="1.4" strokeLinecap="round" style={{ stroke: TICK[k] }} />
        <path d={RING} fill={url('flange')} />
        <g fill="none" strokeWidth="1" style={{ stroke: m.t.line }}>
          <circle cx="180" cy="155" r="118" />
          <circle cx="180" cy="155" r="134" />
        </g>
        <path className={D} d={MINOR} strokeWidth="1" opacity=".7" style={{ stroke: TICK[k] }} />
        <path d={HOURS} strokeWidth="2.6" style={{ stroke: TICK[k] }} />
        <path d={TWELVE} strokeWidth="2.2" style={{ stroke: TICK[k] }} />
      </Svg>
      <div className="afx-h" style={hand(70, 0, 13, m.hourDeg, m.hourDeg0, 'none', lift)}>
        {blade}
      </div>
      <div className="afx-m" style={hand(112, 0, 10, m.minDeg, m.minDeg0, 'none', lift)}>
        {blade}
      </div>
      <div className="afx-s" style={hand(120, 26, 2, m.secDeg, m.secDeg0, m.accent)}>
        <span
          style={{
            position: 'absolute',
            left: -3,
            top: 130,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: m.accent,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 172,
          top: 147,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, #FFF6DC, ${BRASS[1]} 55%, #7A6238)`,
          boxShadow: `0 2px 4px ${BLACK(0.5)}`,
        }}
      />
      <div
        style={{
          ...windowAt(180, 234, 92, 26),
          padding: '0 12px',
          borderRadius: 13,
          ...WINDOW[m.theme],
          fontFamily: MONO,
          fontSize: lmin(14),
          fontWeight: 600,
          color: m.accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
      <Crystal m={m} />
    </>
  );
}

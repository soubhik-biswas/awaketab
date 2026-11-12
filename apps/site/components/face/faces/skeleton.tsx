import { useId } from 'react';
import { BLACK } from '../art';
import { f1, P, ticks } from '../geometry';
import { hand, type IDrawProps, lmin, MONO, Svg, windowAt } from '../kit';

const BRASS = ['#F3E6C2', '#C9B07A', '#8D7444'] as const;
const STEEL = ['#E7ECF5', '#7F8AA0'] as const;
const JEWEL = '#D81B60';
const HAND = {
  light: 'linear-gradient(90deg, #B59A64 50%, #7A6238 50%)',
  night: 'linear-gradient(90deg, #F6EDD2 50%, #B59A64 50%)',
};
const DAUPHINE = 'polygon(50% 0, 100% 82%, 50% 100%, 0 82%)';
const TICK = { light: '#8D7444', night: '#C9B07A' };
const HOLE = { light: '#F3F3F9', night: '#0B1020' };
const WINDOW = { light: '#FFFFFF', night: 'rgba(7,11,22,.85)' };
// No tick at six: the time-left window sits there.
const TICKS = ticks(112, 122, 12, (i) => i !== 6);

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
const G1 = gear(132, 122, 50, 18, 7);
const G2 = gear(222, 118, 34, 14, 6);
const G3 = gear(168, 200, 30, 12, 6);

// An open movement: brass gears turn and the balance wheel swings.
export default function Skeleton({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const brass = `url(#af-brass${id})`;
  const steel = `url(#af-steel${id})`;
  const k = m.night ? 'night' : 'light';
  const handExtra = { clipPath: DAUPHINE, filter: `drop-shadow(0 2px 3px ${BLACK(0.5)})` };
  return (
    <>
      <Svg>
        <defs>
          <linearGradient id={`af-brass${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: BRASS[0] }} />
            <stop offset=".5" style={{ stopColor: BRASS[1] }} />
            <stop offset="1" style={{ stopColor: BRASS[2] }} />
          </linearGradient>
          <linearGradient id={`af-steel${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: STEEL[0] }} />
            <stop offset="1" style={{ stopColor: STEEL[1] }} />
          </linearGradient>
        </defs>
        <circle cx="180" cy="155" r="122" fill="none" strokeWidth="1" style={{ stroke: m.t.line }} />
        <path d={TICKS} strokeWidth="2.5" strokeLinecap="round" style={{ stroke: TICK[k] }} />
        <g className="afx-spinS" data-svg-origin="132 122">
          <path d={G1} fill={brass} opacity=".95" />
          <circle cx="132" cy="122" r="16" style={{ fill: HOLE[k] }} />
          <path d="M132 106 V138 M116 122 H148" stroke={brass} strokeWidth="4" />
        </g>
        <g className="afx-spinR" data-svg-origin="222 118">
          <path d={G2} fill={steel} opacity=".9" />
          <circle cx="222" cy="118" r="11" style={{ fill: HOLE[k] }} />
        </g>
        <g className="afx-spin" data-svg-origin="168 200">
          <path d={G3} fill={brass} opacity=".9" />
          <circle cx="168" cy="200" r="9" style={{ fill: HOLE[k] }} />
        </g>
        <rect
          x="92"
          y="150"
          width="170"
          height="14"
          rx="7"
          fill={steel}
          opacity=".55"
          transform="rotate(-18 180 157)"
        />
        <g className="afx-wobble" data-svg-origin="236 206">
          <circle cx="236" cy="206" r="26" fill="none" stroke={brass} strokeWidth="4" />
          <path d="M236 180 V232 M210 206 H262" stroke={brass} strokeWidth="2.5" />
        </g>
        <circle cx="132" cy="122" r="4" fill={JEWEL} />
        <circle cx="222" cy="118" r="3.5" fill={JEWEL} />
        <circle cx="168" cy="200" r="3.5" fill={JEWEL} />
        <circle cx="236" cy="206" r="3.5" fill={JEWEL} />
      </Svg>
      <div className="afx-h" style={hand(66, 0, 12, m.hourDeg, m.hourDeg0, HAND[k], handExtra)} />
      <div className="afx-m" style={hand(104, 0, 10, m.minDeg, m.minDeg0, HAND[k], handExtra)} />
      <div className="afx-s" style={hand(116, 26, 2, m.secDeg, m.secDeg0, m.accent)} />
      <div
        style={{
          position: 'absolute',
          left: 172,
          top: 147,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${BRASS[0]}, ${BRASS[2]})`,
          boxShadow: `0 2px 6px ${BLACK(0.5)}`,
        }}
      />
      <div
        style={{
          ...windowAt(180, 244, 92, 30),
          padding: '0 12px',
          borderRadius: 15,
          background: WINDOW[k],
          border: `1px solid ${m.t.line}`,
          fontFamily: MONO,
          fontSize: lmin(14),
          fontWeight: 600,
          color: m.accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
    </>
  );
}

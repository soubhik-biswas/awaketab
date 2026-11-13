import { useId } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha, dash, f1 } from '../geometry';
import { big, column, D, fit, type IDrawProps, Kicker, L, mono, Svg } from '../kit';

const W = 18;
// The arcs are turned a quarter back to start at 12, so in their own space the top-left light comes from the top right.
const GLOSS_AXIS = { x1: 318, y1: 17, x2: 42, y2: 293 } as const;

interface IBand {
  r: number;
  f: number;
  color: string;
  op: number;
  night: boolean;
  shade: string;
  gloss: string;
}

function Band({ r, f, color, op, night, shade, gloss }: IBand) {
  const on = f > 0;
  const top = 155 - r;
  return (
    <>
      <circle cx="180" cy="155" r={r} fill="none" strokeWidth={W} style={{ stroke: alpha(color, 0x26) }} />
      <circle className={D} cx="180" cy="155" r={r} fill="none" strokeWidth={W} stroke={`url(#${shade})`} />
      <g
        className={`af-tr ${D}`}
        opacity={on && f < 1 ? 1 : 0}
        style={{ transform: `rotate(${(360 * Math.min(f, 1)).toFixed(1)}deg)`, transformOrigin: '180px 155px' }}
      >
        <circle cx="181.7" cy={top} r="9.4" style={{ fill: night ? BLACK(0.36) : NAVY(0.14) }} />
      </g>
      <circle
        className="af-tr"
        cx="180"
        cy="155"
        r={r}
        fill="none"
        strokeWidth={W}
        strokeLinecap="round"
        transform="rotate(-90 180 155)"
        opacity={on ? op : 0}
        style={{ stroke: color, strokeDasharray: dash(2 * Math.PI * r, f) }}
      />
      <circle
        className={`af-tr ${D}`}
        cx="180"
        cy="155"
        r={r + 3}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(-90 180 155)"
        opacity={on ? op : 0}
        stroke={`url(#${gloss})`}
        style={{ strokeDasharray: dash(2 * Math.PI * (r + 3), f) }}
      />
      <path
        className={D}
        d={`M178.4 ${f1(top - 3.6)}L182 ${f1(top)}L178.4 ${f1(top + 3.6)}`}
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={on ? 1 : 0.4}
        style={{ stroke: night ? BLACK(0.5) : WHITE(0.9) }}
      />
    </>
  );
}

// Session, minutes and seconds as three concentric rings: green, sky and violet while awake.
export default function Rings({ m }: IDrawProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const idle = m.st === 'idle';
  const fs = idle ? 1 : m.s / 60;
  const shade = `af-rings-shade${id}`;
  const gloss = `af-rings-gloss${id}`;
  const band = { night: m.night, shade, gloss };
  return (
    <>
      <Svg>
        <defs>
          <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1="42" y1="17" x2="318" y2="293">
            <stop offset="0" style={{ stopColor: m.night ? BLACK(0.36) : NAVY(0.08) }} />
            <stop offset=".5" style={{ stopColor: m.night ? BLACK(0) : NAVY(0) }} />
            <stop offset="1" style={{ stopColor: m.night ? WHITE(0.04) : WHITE(0.6) }} />
          </linearGradient>
          <linearGradient id={gloss} gradientUnits="userSpaceOnUse" {...GLOSS_AXIS}>
            <stop offset="0" style={{ stopColor: WHITE(m.night ? 0.34 : 0.42) }} />
            <stop offset=".55" style={{ stopColor: WHITE(m.night ? 0.08 : 0.12) }} />
            <stop offset="1" style={{ stopColor: WHITE(0) }} />
          </linearGradient>
        </defs>
        <Band r={128} f={idle ? 1 : m.frac} color={m.accent} op={1} {...band} />
        <Band r={104} f={idle ? 1 : (m.m + m.s / 60) / 60} color={m.mc2} op={m.multi ? 1 : 0.72} {...band} />
        <Band r={80} f={fs} color={m.mc3} op={m.multi ? 1 : 0.48} {...band} />
      </Svg>
      <div
        className="af-tr"
        style={{
          position: 'absolute',
          left: 100,
          top: 75,
          width: 160,
          height: 160,
          transform: `rotate(${(360 * fs).toFixed(1)}deg)`,
          // Hidden on the turn of the minute, so its way back to 12 is never seen.
          opacity: idle || m.st === 'up' || fs === 0 ? 0 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 76,
            top: -4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: m.t.ink,
            boxShadow: `0 0 0 1.5px ${alpha(m.mc3, 0x66)}, 0 0 6px ${alpha(m.mc3, 0x99)}`,
          }}
        />
      </div>
      <div style={column(4)}>
        {!m.awake && <Kicker m={m} />}
        <span
          style={{
            ...big(fit(m, m.long ? 32 : 46, 30), 500, '-0.035em'),
            ...(m.st === 'up' ? { color: m.t.ink2 } : {}),
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={mono(12, '.1em', m.t.ink2)}>
          {m.indef ? 'NO END' : m.endShort}
        </span>
      </div>
    </>
  );
}

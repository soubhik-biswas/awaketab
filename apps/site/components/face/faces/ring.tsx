import { useId } from 'react';
import { BLACK, NAVY, WHITE } from '../art';
import { alpha, dash, f1, P, ticks } from '../geometry';
import { big, column, D, EndLine, fit, type IDrawProps, Kicker, Svg, sweep } from '../kit';

const R = 138;
const C = 2 * Math.PI * R;
// The gloss rides the outer half of the arc, where light from the top left lands.
const GLOSS_R = 139.6;
const GLOSS_C = 2 * Math.PI * GLOSS_R;
// The arc is turned a quarter back to start at 12, so in its own space the top-left light comes from the top right.
const GLOSS_AXIS = { x1: 318, y1: 17, x2: 42, y2: 293 } as const;
const MASK = 'radial-gradient(circle, transparent 0 106.8px, #000 107.3px 108.7px, transparent 109.2px)';
// Minute, hour and quarter marks; each is split into the part of the session still to run and the part spent.
const SCALE = [
  { r1: 123.5, w: 1.2, op: 0.5, keep: (i: number) => i % 5 !== 0 },
  { r1: 119, w: 2, op: 0.62, keep: (i: number) => i % 5 === 0 && i % 15 !== 0 },
  { r1: 115.5, w: 2.6, op: 0.85, keep: (i: number) => i % 15 === 0 },
] as const;

// The signature: the lamp rides the end of the arc; every other state takes its status colour.
export default function Ring({ m }: IDrawProps) {
  const { t, accent } = m;
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  const deg = 360 * m.ringFrac;
  const [dx, dy] = P(R, deg);
  const idle = m.st === 'idle';
  const starting = m.st === 'starting';
  const halted = m.st === 'paused' || m.st === 'blocked' || m.st === 'unsupported';
  const shown = m.ringFrac > 0;
  const lit = (i: number) => shown && 6 * i <= deg + 0.01;
  const arcDash = starting ? '10 16' : dash(C, m.ringFrac);
  const glow = m.night && m.awake && shown;
  const shade = `af-ring-shade${id}`;
  const gloss = `af-ring-gloss${id}`;
  return (
    <>
      <Svg>
        <defs>
          <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1="42" y1="17" x2="318" y2="293">
            <stop offset="0" style={{ stopColor: m.night ? BLACK(0.42) : NAVY(0.09) }} />
            <stop offset=".5" style={{ stopColor: m.night ? BLACK(0) : NAVY(0) }} />
            <stop offset="1" style={{ stopColor: m.night ? WHITE(0.05) : WHITE(0.85) }} />
          </linearGradient>
          <linearGradient id={gloss} gradientUnits="userSpaceOnUse" {...GLOSS_AXIS}>
            <stop offset="0" style={{ stopColor: WHITE(m.night ? 0.38 : 0.46) }} />
            <stop offset=".55" style={{ stopColor: WHITE(m.night ? 0.1 : 0.14) }} />
            <stop offset="1" style={{ stopColor: WHITE(0) }} />
          </linearGradient>
        </defs>
        {SCALE.map((s) => (
          <g key={s.r1} className={D} strokeWidth={s.w} strokeLinecap="round">
            <path d={ticks(s.r1, 128, 60, (i) => s.keep(i) && lit(i))} opacity={s.op} style={{ stroke: t.ink }} />
            <path d={ticks(s.r1, 128, 60, (i) => s.keep(i) && !lit(i))} opacity=".26" style={{ stroke: t.ink2 }} />
          </g>
        ))}
        <circle cx="180" cy="155" r={R} fill="none" strokeWidth="8" style={{ stroke: t.track }} />
        <circle className={D} cx="180" cy="155" r={R} fill="none" strokeWidth="8" stroke={`url(#${shade})`} />
        {m.night && (
          <g className={D} fill="none" strokeLinecap="round" transform="rotate(-90 180 155)" opacity={glow ? 1 : 0}>
            <circle
              className="af-tr"
              cx="180"
              cy="155"
              r={R}
              strokeWidth="20"
              opacity=".07"
              style={{ stroke: accent, strokeDasharray: arcDash }}
            />
            <circle
              className="af-tr"
              cx="180"
              cy="155"
              r={R}
              strokeWidth="13"
              opacity=".12"
              style={{ stroke: accent, strokeDasharray: arcDash }}
            />
          </g>
        )}
        <circle
          className="af-tr"
          cx="180"
          cy="155"
          r={R}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={idle ? 0.35 : shown ? 1 : 0}
          style={{ stroke: accent, strokeDasharray: arcDash }}
        />
        <circle
          className={`af-tr ${D}`}
          cx="180"
          cy="155"
          r={GLOSS_R}
          fill="none"
          strokeWidth="1.4"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={shown && !idle && !starting ? 1 : 0}
          stroke={`url(#${gloss})`}
          style={{ strokeDasharray: dash(GLOSS_C, m.ringFrac) }}
        />
        <circle
          className={D}
          cx={f1(dx + 0.7)}
          cy={f1(dy + 1.4)}
          r="10.2"
          style={{ fill: m.night ? BLACK(0.38) : NAVY(0.14) }}
        />
        <circle className="afx-pulse" cx={f1(dx)} cy={f1(dy)} r="11" opacity={m.haloOp} style={{ fill: accent }} />
        <circle
          cx={f1(dx)}
          cy={f1(dy)}
          r="7.5"
          strokeWidth="3"
          style={{ fill: m.hollow ? t.panel : accent, stroke: accent }}
        />
        {!m.hollow && <circle className={D} cx={f1(dx - 2.3)} cy={f1(dy - 2.5)} r="2.3" style={{ fill: WHITE(0.6) }} />}
      </Svg>
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 68,
          top: 43,
          width: 224,
          height: 224,
          opacity: m.liveOp,
          ...sweep(m),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg 290deg, ${alpha(accent, 0xa6)} 360deg)`,
            WebkitMaskImage: MASK,
            maskImage: MASK,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 109.5,
            top: 1.5,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 6px ${alpha(accent, 0x99)}`,
          }}
        />
      </div>
      <div style={column(6)}>
        <Kicker m={m} color={halted ? accent : t.ink2} />
        <span style={{ ...big(fit(m, m.long ? 52 : 72, 46)), ...(m.st === 'up' ? { color: t.ink2 } : {}) }}>
          {m.digits}
        </span>
        <EndLine m={m} px={15} />
      </div>
    </>
  );
}

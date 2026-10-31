import { alpha, dash, f1, P, ticks } from '../geometry';
import { big, column, D, EndLine, type IDrawProps, Kicker, Svg, sweep } from '../kit';

const C = 2 * Math.PI * 138;
const MINOR = ticks(124, 129, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(118, 129, 60, (i) => i % 5 === 0);
const MASK = 'radial-gradient(circle, transparent 0 109px, #000 109.5px 112px, transparent 112.5px)';

// The signature: the lamp rides the end of the arc; every other state takes its status colour.
export default function Ring({ m }: IDrawProps) {
  const { t, accent } = m;
  const [dx, dy] = P(138, 360 * m.ringFrac);
  return (
    <>
      <Svg>
        <path
          className={D}
          d={MINOR}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".35"
          style={{ stroke: t.ink2 }}
        />
        <path d={MAJOR} strokeWidth="2.4" strokeLinecap="round" opacity=".55" style={{ stroke: t.ink }} />
        <circle cx="180" cy="155" r="138" fill="none" strokeWidth="7" style={{ stroke: t.track }} />
        <circle
          className="af-tr"
          cx="180"
          cy="155"
          r="138"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={m.st === 'idle' ? 0.35 : m.ringFrac === 0 ? 0 : 1}
          style={{ stroke: accent, strokeDasharray: m.st === 'starting' ? '10 16' : dash(C, m.ringFrac) }}
        />
        <circle className="afx-pulse" cx={f1(dx)} cy={f1(dy)} r="12" opacity={m.haloOp} style={{ fill: accent }} />
        <circle
          cx={f1(dx)}
          cy={f1(dy)}
          r="7"
          strokeWidth="3"
          style={{ fill: m.hollow ? t.panel : accent, stroke: accent }}
        />
      </Svg>
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 68,
          top: 43,
          width: 224,
          height: 224,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, transparent 0deg 290deg, ${alpha(accent, 0x99)} 360deg)`,
          WebkitMaskImage: MASK,
          maskImage: MASK,
          opacity: m.liveOp,
          ...sweep(m),
        }}
      />
      <div style={column(6)}>
        <Kicker m={m} />
        <span style={big(m.long ? 52 : 72)}>{m.digits}</span>
        <EndLine m={m} px={15} />
      </div>
    </>
  );
}

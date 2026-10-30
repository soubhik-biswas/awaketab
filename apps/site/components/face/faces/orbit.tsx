import '../face-art.css';
import { alpha, arc, dash, f1, P } from '../geometry';
import { big, column, EndLine, type IDrawProps, Kicker, Stars, type TStar, Svg, sweep } from '../kit';

const C134 = 2 * Math.PI * 134;
const STARS: readonly TStar[] = [
  [118, 70, 2],
  [240, 76, 3],
  [92, 150, 2],
  [262, 190, 2],
  [140, 232, 3],
  [226, 236, 2],
  [200, 50, 2],
  [70, 112, 2],
  [286, 120, 2],
  [110, 200, 2],
];
const MOON_MASK = 'radial-gradient(circle, transparent 0 86px, #000 86.5px 89.5px, transparent 90px)';

// Three orbits: the session in green, minutes in sky, a violet moon sweeping the seconds.
export default function Orbit({ m }: IDrawProps) {
  const { t, mc1, mc2, mc3 } = m;
  const idle = m.st === 'idle';
  const [px, py] = P(134, 360 * m.ringFrac);
  const mAng = idle ? 359.9 : Math.min(359.9, ((m.m % 60) + m.s / 60) * 6);
  const [ox, oy] = P(110, mAng);
  const mc3a = alpha(mc3, 0xcc);
  return (
    <>
      <Stars pts={STARS} colors={[t.ink2, mc2, mc3, t.ink2]} />
      <Svg>
        <circle cx="180" cy="155" r="134" fill="none" strokeWidth="1.5" style={{ stroke: t.line }} />
        <circle
          cx="180"
          cy="155"
          r="110"
          fill="none"
          strokeWidth="1.2"
          strokeDasharray="2 5"
          style={{ stroke: t.line }}
        />
        <circle cx="180" cy="155" r="88" fill="none" strokeWidth="1" style={{ stroke: t.line }} />
        <circle
          className="af-tr"
          cx="180"
          cy="155"
          r="134"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={idle ? 0.35 : m.ringFrac === 0 ? 0 : 1}
          style={{ stroke: mc1, strokeDasharray: m.st === 'starting' ? '10 16' : dash(C134, m.ringFrac) }}
        />
        <path
          d={arc(110, 0, mAng)}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".6"
          style={{ stroke: mc2 }}
        />
        <circle className="afx-pulse" cx={f1(px)} cy={f1(py)} r="14" opacity={m.haloOp} style={{ fill: mc1 }} />
        <circle cx={f1(px)} cy={f1(py)} r="9" strokeWidth="3" style={{ fill: mc1, stroke: t.panel }} />
        <circle cx={f1(ox)} cy={f1(oy)} r="7" strokeWidth="2.5" style={{ fill: mc2, stroke: t.panel }} />
      </Svg>
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 90,
          top: 65,
          width: 180,
          height: 180,
          borderRadius: '50%',
          opacity: m.liveOp,
          ...sweep(m),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg 250deg, ${mc3a} 360deg)`,
            WebkitMaskImage: MOON_MASK,
            maskImage: MOON_MASK,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 84,
            top: -4,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: mc3,
            boxShadow: `0 0 12px ${mc3a}`,
          }}
        />
      </div>
      <div style={column(5)}>
        <Kicker m={m} />
        <span style={big(m.long ? 36 : 48)}>{m.digits}</span>
        <EndLine m={m} px={13} />
      </div>
    </>
  );
}

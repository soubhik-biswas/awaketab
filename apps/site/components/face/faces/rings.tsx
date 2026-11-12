import { alpha, dash } from '../geometry';
import { big, column, fit, type IDrawProps, L, mono, Svg, sweep } from '../kit';

const C1 = 2 * Math.PI * 128;
const C2 = 2 * Math.PI * 104;
const C3 = 2 * Math.PI * 80;

function Band({ r, c, f, color, op }: { r: number; c: number; f: number; color: string; op?: number }) {
  return (
    <>
      <circle cx="180" cy="155" r={r} fill="none" strokeWidth="18" style={{ stroke: alpha(color, 0x26) }} />
      <circle
        className="af-tr"
        cx="180"
        cy="155"
        r={r}
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        transform="rotate(-90 180 155)"
        opacity={op}
        style={{ stroke: color, strokeDasharray: dash(c, f) }}
      />
    </>
  );
}

// Session, minutes and seconds as three concentric rings: green, sky and violet while awake.
export default function Rings({ m }: IDrawProps) {
  const idle = m.st === 'idle';
  return (
    <>
      <Svg>
        <Band r={128} c={C1} f={idle ? 1 : m.frac} color={m.accent} />
        <Band r={104} c={C2} f={idle ? 1 : (m.m + m.s / 60) / 60} color={m.mc2} op={m.multi ? 1 : 0.72} />
        <Band r={80} c={C3} f={idle ? 1 : m.s / 60} color={m.mc3} op={m.multi ? 1 : 0.48} />
      </Svg>
      <div
        className="afx-s"
        style={{ position: 'absolute', left: 100, top: 75, width: 160, height: 160, opacity: m.liveOp, ...sweep(m) }}
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
            boxShadow: `0 0 10px ${m.accent}`,
          }}
        />
      </div>
      <div style={column(4)}>
        <span style={big(fit(m, m.long ? 34 : 46, 30), 400, '-0.03em')}>{m.digits}</span>
        <span className={L} style={mono(12, '.1em', m.t.ink2)}>
          {m.endShort}
        </span>
      </div>
    </>
  );
}

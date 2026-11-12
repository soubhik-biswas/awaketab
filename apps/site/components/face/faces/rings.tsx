import { alpha, dash } from '../geometry';
import { big, column, fit, type IDrawProps, Kicker, L, mono, Svg } from '../kit';

const C1 = 2 * Math.PI * 128;
const C2 = 2 * Math.PI * 104;
const C3 = 2 * Math.PI * 80;

function Band({ r, c, f, color, op = 1 }: { r: number; c: number; f: number; color: string; op?: number }) {
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
        opacity={f > 0 ? op : 0}
        style={{ stroke: color, strokeDasharray: dash(c, f) }}
      />
    </>
  );
}

// Session, minutes and seconds as three concentric rings: green, sky and violet while awake.
export default function Rings({ m }: IDrawProps) {
  const idle = m.st === 'idle';
  const fs = idle ? 1 : m.s / 60;
  return (
    <>
      <Svg>
        <Band r={128} c={C1} f={idle ? 1 : m.frac} color={m.accent} />
        <Band r={104} c={C2} f={idle ? 1 : (m.m + m.s / 60) / 60} color={m.mc2} op={m.multi ? 1 : 0.72} />
        <Band r={80} c={C3} f={fs} color={m.mc3} op={m.multi ? 1 : 0.48} />
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
          opacity: idle || m.st === 'up' ? 0 : 1,
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
            boxShadow: `0 0 10px ${m.accent}`,
          }}
        />
      </div>
      <div style={column(4)}>
        {!m.awake && <Kicker m={m} style={{ letterSpacing: '.12em' }} />}
        <span style={big(fit(m, m.long ? 32 : 46, 30), 400, '-0.03em')}>{m.digits}</span>
        <span className={L} style={mono(12, '.1em', m.t.ink2)}>
          {m.indef ? 'NO END' : m.endShort}
        </span>
      </div>
    </>
  );
}

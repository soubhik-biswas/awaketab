import { plate } from '../art';
import { arc, f1, P, ticks } from '../geometry';
import { big, D, fit, type IDrawProps, Kicker, L, lmin, mono, Svg, PLATE } from '../kit';
import type { TFaceModel } from '../model';
import { minutesSpan } from './analog-dial';

// Dial radius; the plate's bezel adds 8 and the lit ring sits just outside it, so the two dials and the arrow
// between them never touch.
const R = 62;
const LEFT = 92;
const RIGHT = 268;
const CY_DIAL = 118;
const RING = R + 11;

// A tapered hand from a short counter-tail to a narrow tip, as one closed outline.
const blade = (cx: number, cy: number, deg: number, len: number, tail: number, w0: number, w1: number): string => {
  const [px, py] = P(1, deg + 90, 0, 0);
  const [tx, ty] = P(len, deg, cx, cy);
  const [bx, by] = P(tail, deg + 180, cx, cy);
  const pts: readonly (readonly [number, number])[] = [
    [bx + (px * w0) / 2, by + (py * w0) / 2],
    [tx + (px * w1) / 2, ty + (py * w1) / 2],
    [tx - (px * w1) / 2, ty - (py * w1) / 2],
    [bx - (px * w0) / 2, by - (py * w0) / 2],
  ];
  return `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z`;
};

interface IRing {
  from: number;
  span: number;
}

function Dial({
  m,
  cx,
  sec,
  label,
  lit,
  text,
  ring,
}: {
  m: TFaceModel;
  cx: number;
  sec: number | null;
  label: string;
  lit: boolean;
  text?: string;
  ring?: IRing;
}) {
  const { t, accent } = m;
  const cy = CY_DIAL;
  const hc = lit ? accent : t.ink;
  const hDeg = (((sec ?? 0) / 3600) % 12) * 30;
  const mDeg = (((sec ?? 0) / 60) % 60) * 6;
  const end = ring ? ring.from + ring.span : 0;
  const [ex, ey] = P(RING, end, cx, cy);
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: cx - R,
          top: cy - R,
          width: R * 2,
          height: R * 2,
          borderRadius: '50%',
          ...plate(m.theme, m.accent),
        }}
      />
      <Svg>
        {lit && <circle cx={cx} cy={cy} r={RING} fill="none" strokeWidth="1.5" style={{ stroke: t.line }} />}
        {ring && ring.span > 0 && (
          <>
            <path
              d={arc(RING, ring.from, end, cx, cy)}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ stroke: accent }}
            />
            <circle cx={f1(ex)} cy={f1(ey)} r="3.5" style={{ fill: accent }} />
          </>
        )}
        <path
          className={D}
          d={ticks(53, 56, 60, (i) => i % 5 !== 0, cx, cy)}
          strokeWidth="1"
          opacity=".5"
          style={{ stroke: t.ink2 }}
        />
        <path
          d={ticks(49, 56, 12, (i) => i % 3 !== 0, cx, cy)}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity=".85"
          style={{ stroke: t.ink2 }}
        />
        <path d={ticks(45, 56, 4, undefined, cx, cy)} strokeWidth="3" strokeLinecap="round" style={{ stroke: t.ink }} />
        {sec !== null && (
          <g strokeWidth=".8" strokeLinejoin="round" style={{ fill: hc, stroke: hc }}>
            <path d={blade(cx, cy, hDeg, 30, 7, 5.5, 3)} />
            <path d={blade(cx, cy, mDeg, 47, 9, 4, 2)} />
          </g>
        )}
        <circle cx={cx} cy={cy} r="4.2" style={{ fill: hc }} />
        <circle cx={cx} cy={cy} r="1.6" style={{ fill: t.panel }} />
      </Svg>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: cx - 70,
          top: 20,
          width: 140,
          textAlign: 'center',
          ...mono(12, '.16em', lit ? accent : t.ink2),
        }}
      >
        {label}
      </span>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: cx - 70,
          top: cy + R + 16,
          width: 140,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontSize: lmin(15),
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: lit ? accent : t.ink,
        }}
      >
        {text ?? m.t12(sec ?? 0)}
      </span>
    </>
  );
}

// Two small dials side by side: the time now and the time it ends; with no end, the time it started and now. The
// lit dial's ring runs from the first dial's minute to its own, so it ends at its minute hand.
export default function Dual({ m }: IDrawProps) {
  const open = m.indef && m.st !== 'idle';
  const fromSec = open ? m.nowSec - m.r : m.nowSec;
  const ring: IRing = {
    from: ((fromSec / 60) % 60) * 6,
    span: open ? Math.min(360, m.r / 10) : minutesSpan(m),
  };
  return (
    <>
      {open ? (
        <>
          <Dial m={m} cx={LEFT} sec={fromSec} label="STARTED" lit={false} />
          <Dial m={m} cx={RIGHT} sec={m.nowSec} label="NOW" lit ring={ring} />
        </>
      ) : (
        <>
          <Dial m={m} cx={LEFT} sec={m.nowSec} label="NOW" lit={false} />
          <Dial
            m={m}
            cx={RIGHT}
            sec={m.indef ? null : m.endSec}
            label="ENDS"
            lit
            ring={ring}
            {...(m.indef ? { text: 'No end' } : null)}
          />
        </>
      )}
      <Svg>
        <path
          className="afx-breath"
          d={`M168 ${CY_DIAL} H188 M181 ${CY_DIAL - 7} L188 ${CY_DIAL} L181 ${CY_DIAL + 7}`}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: m.accent }}
        />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 222,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span style={big(fit(m, 44, 40), 300, '-0.03em')}>{m.digits}</span>
        <Kicker m={m} />
      </div>
    </>
  );
}

import { plate } from '../art';
import { f1, P, ticks } from '../geometry';
import { big, fit, type IDrawProps, Kicker, L, lmin, mono, Svg, PLATE } from '../kit';
import type { TFaceModel } from '../model';

// Dial radius; the plate's bezel adds 8 and the highlight ring sits just outside it, so the two dials and the arrow
// between them never touch.
const R = 62;
const LEFT = 92;
const RIGHT = 268;
const CY_DIAL = 118;

function Dial({
  m,
  cx,
  sec,
  label,
  lit,
  text,
}: {
  m: TFaceModel;
  cx: number;
  sec: number | null;
  label: string;
  lit: boolean;
  text?: string;
}) {
  const { t, accent } = m;
  const cy = CY_DIAL;
  const hc = lit ? accent : t.ink;
  const [hx, hy] = P(30, (((sec ?? 0) / 3600) % 12) * 30, cx, cy);
  const [mx, my] = P(46, (((sec ?? 0) / 60) % 60) * 6, cx, cy);
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
          ...(lit ? { outline: `2px solid ${accent}`, outlineOffset: 10 } : null),
        }}
      />
      <Svg>
        <path
          d={ticks(50, 56, 12, undefined, cx, cy)}
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".7"
          style={{ stroke: t.ink2 }}
        />
        {sec !== null && (
          <>
            <line
              x1={cx}
              y1={cy}
              x2={f1(hx)}
              y2={f1(hy)}
              strokeWidth="5"
              strokeLinecap="round"
              style={{ stroke: hc }}
            />
            <line
              x1={cx}
              y1={cy}
              x2={f1(mx)}
              y2={f1(my)}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ stroke: hc }}
            />
          </>
        )}
        <circle cx={cx} cy={cy} r="4.5" style={{ fill: hc }} />
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
          color: lit ? accent : t.ink,
        }}
      >
        {text ?? m.t12(sec ?? 0)}
      </span>
    </>
  );
}

// Two small dials side by side: the time now and the time it ends; with no end, the time it started and now.
export default function Dual({ m }: IDrawProps) {
  const open = m.indef && m.st !== 'idle';
  return (
    <>
      {open ? (
        <>
          <Dial m={m} cx={LEFT} sec={m.nowSec - m.r} label="STARTED" lit={false} />
          <Dial m={m} cx={RIGHT} sec={m.nowSec} label="NOW" lit />
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
            {...(m.indef ? { text: 'No end' } : null)}
          />
        </>
      )}
      <Svg>
        <path
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
        <span style={big(fit(m, 44, 40))}>{m.digits}</span>
        <Kicker m={m} />
      </div>
    </>
  );
}

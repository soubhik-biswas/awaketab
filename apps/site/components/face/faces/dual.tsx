import { plate } from '../art';
import { f1, P, ticks } from '../geometry';
import { big, type IDrawProps, Kicker, L, lmin, mono, Svg } from '../kit';
import type { TFaceModel } from '../model';

function Dial({
  m,
  cx,
  cy,
  sec,
  label,
  ends,
}: {
  m: TFaceModel;
  cx: number;
  cy: number;
  sec: number;
  label: string;
  ends: boolean;
}) {
  const { t, accent } = m;
  const hc = ends ? accent : t.ink;
  const [hx, hy] = P(36, ((sec / 3600) % 12) * 30, cx, cy);
  const [mx, my] = P(54, ((sec / 60) % 60) * 6, cx, cy);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: cx - 74,
          top: cy - 74,
          width: 148,
          height: 148,
          borderRadius: '50%',
          ...plate(m.theme, m.accent),
          ...(ends ? { outline: `2px solid ${accent}`, outlineOffset: 3 } : null),
        }}
      />
      <Svg>
        <path
          d={ticks(60, 68, 12, undefined, cx, cy)}
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".7"
          style={{ stroke: t.ink2 }}
        />
        <line x1={cx} y1={cy} x2={f1(hx)} y2={f1(hy)} strokeWidth="5" strokeLinecap="round" style={{ stroke: hc }} />
        <line x1={cx} y1={cy} x2={f1(mx)} y2={f1(my)} strokeWidth="3.5" strokeLinecap="round" style={{ stroke: hc }} />
        <circle cx={cx} cy={cy} r="4.5" style={{ fill: hc }} />
      </Svg>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: cx - 60,
          top: cy - 104,
          width: 120,
          textAlign: 'center',
          ...mono(12, '.16em', ends ? accent : t.ink2),
        }}
      >
        {label}
      </span>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: cx - 60,
          top: cy + 82,
          width: 120,
          textAlign: 'center',
          fontSize: lmin(15),
          fontWeight: 600,
          color: ends ? accent : t.ink,
        }}
      >
        {m.t12(sec)}
      </span>
    </>
  );
}

// Two small dials side by side: the time now and the time it ends.
export default function Dual({ m }: IDrawProps) {
  return (
    <>
      <Dial m={m} cx={96} cy={128} sec={m.nowSec} label="NOW" ends={false} />
      <Dial m={m} cx={264} cy={128} sec={m.endSec} label="ENDS" ends />
      <Svg>
        <path
          d="M164 122 H196 M188 114 L196 122 L188 130"
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
          top: 234,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span style={big(44)}>{m.digits}</span>
        <Kicker m={m} />
      </div>
    </>
  );
}

import { SUB_DIAL } from '../art';
import { arc, f1, P, ticks } from '../geometry';
import { DialLabel, type IDrawProps, L, lmin, MONO, mono, Svg, sweep } from '../kit';

const MINOR = ticks(128, 134, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(124, 134, 60, (i) => i % 5 === 0);
const SUB_L = ticks(32, 36, 12, undefined, 124, 160);
const SUB_R = ticks(32, 36, 12, undefined, 236, 160);

// Minute and second sub-dials with a sweeping chrono hand.
export default function Chrono({ m }: IDrawProps) {
  const { t, accent } = m;
  const sub = SUB_DIAL[m.theme];
  const minDeg = Math.min(m.m, 59.9) * 6;
  const [lx, ly] = P(30, minDeg, 124, 160);
  const unit = (left: number, text: string) => (
    <span
      className={L}
      style={{ position: 'absolute', left, width: 76, top: 204, textAlign: 'center', ...mono(12, '.12em', t.ink2) }}
    >
      {text}
    </span>
  );
  return (
    <>
      <Svg>
        <path d={MINOR} strokeWidth="1.2" opacity=".55" style={{ stroke: t.ink2 }} />
        <path d={MAJOR} strokeWidth="2.4" style={{ stroke: t.ink }} />
        <circle cx="124" cy="160" r="38" strokeWidth="1" style={{ fill: sub, stroke: t.line }} />
        <circle cx="236" cy="160" r="38" strokeWidth="1" style={{ fill: sub, stroke: t.line }} />
        <path d={SUB_L} strokeWidth="1.4" opacity=".7" style={{ stroke: t.ink2 }} />
        <path d={SUB_R} strokeWidth="1.4" opacity=".7" style={{ stroke: t.ink2 }} />
        <path
          d={arc(26, 0, minDeg, 124, 160)}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ stroke: accent }}
        />
        <line
          x1="124"
          y1="160"
          x2={f1(lx)}
          y2={f1(ly)}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ stroke: t.ink }}
        />
        <circle cx="124" cy="160" r="4" style={{ fill: t.ink }} />
      </Svg>
      {Array.from({ length: 12 }, (_, k) => (
        <DialLabel
          key={k}
          m={m}
          text={String((k + 1) * 5)}
          rr={116}
          deg={(k + 1) * 30}
          fs={12}
          color={t.ink2}
          extra={{ fontFamily: MONO }}
        />
      ))}
      {unit(86, 'MIN')}
      {unit(198, 'SEC')}
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 234,
          top: 126,
          width: 4,
          height: 44,
          borderRadius: 2,
          background: accent,
          transformOrigin: '50% 77.3%',
          ...sweep(m),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 232,
          top: 156,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: accent,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 82,
          width: 100,
          height: 36,
          borderRadius: 8,
          background: sub,
          border: `1px solid ${t.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.digits}
      </div>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          width: 360,
          top: 219,
          textAlign: 'center',
          fontSize: lmin(14),
          color: t.ink2,
        }}
      >
        {m.endLine}
      </span>
      <div
        className="afx-s"
        style={{
          position: 'absolute',
          left: 179,
          top: 25,
          width: 2,
          height: 160,
          background: accent,
          transformOrigin: '50% 81.25%',
          opacity: m.liveOp,
          ...sweep(m),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 174,
          top: 149,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: accent,
          border: `2px solid ${t.panel}`,
        }}
      />
    </>
  );
}

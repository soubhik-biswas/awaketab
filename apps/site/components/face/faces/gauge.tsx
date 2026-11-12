import { arc, f1, P } from '../geometry';
import { big, D, DialLabel, EndLine, fit, type IDrawProps, MONO, Svg } from '../kit';

const GX = 180;
const GY = 175;
const GR = 130;
const gA = (f: number): number => -120 + 240 * f;

const gTicks = (r1: number, r2: number, n: number, every: number): string => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    if (every && i % every !== 0) continue;
    if (!every && i % 10 === 0) continue;
    const deg = gA(i / n);
    const [ax, ay] = P(r1, deg, GX, GY);
    const [bx, by] = P(r2, deg, GX, GY);
    d += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  }
  return d;
};
const MINOR = gTicks(112, 118, 40, 0);
const MAJOR = gTicks(108, 118, 40, 10);
const span = (f: number): string => arc(GR, gA(0) + 360, gA(f) + 360, GX, GY);

// An instrument needle with a five-minute warning zone; the readout sits below the needle's reach at empty and full.
export default function Gauge({ m }: IDrawProps) {
  const { t, accent } = m;
  const gFr = m.st === 'idle' ? 1 : m.frac;
  const warnF = m.total > 0 ? Math.min(1, 300 / m.total) : 0;
  return (
    <>
      <Svg>
        <path d={span(1)} fill="none" strokeWidth="16" strokeLinecap="round" style={{ stroke: t.track }} />
        <path d={span(warnF)} fill="none" strokeWidth="16" opacity=".35" style={{ stroke: t.paused }} />
        <path
          d={span(Math.max(0.002, gFr))}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          style={{ stroke: accent }}
        />
        <path className={D} d={MINOR} strokeWidth="1.4" opacity=".55" style={{ stroke: t.ink2 }} />
        <path d={MAJOR} strokeWidth="2.6" style={{ stroke: t.ink }} />
      </Svg>
      {(m.total > 0 && !m.indef ? [0.25, 0.5, 0.75] : []).map((q) => (
        <DialLabel
          key={q}
          m={m}
          text={String(Math.round((m.total / 60) * q))}
          rr={90}
          deg={gA(q)}
          fs={13}
          color={t.ink2}
          extra={{ fontFamily: MONO }}
          cx={GX}
          cy={GY}
        />
      ))}
      <div
        className="af-tr"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 360,
          height: 310,
          transformOrigin: '180px 175px',
          transform: `rotate(${gA(gFr).toFixed(2)}deg)`,
        }}
      >
        <div
          className="afx-jit"
          style={{ position: 'absolute', left: 0, top: 0, width: 360, height: 310, transformOrigin: '180px 175px' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 177,
              top: 63,
              width: 6,
              height: 124,
              borderRadius: 3,
              background: `linear-gradient(180deg, ${accent}, ${t.ink} 70%)`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 166,
          top: 161,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: t.ink,
          border: `4px solid ${t.panel}`,
          boxShadow: `0 0 0 2px ${t.line}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 213,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={big(fit(m, m.long ? 38 : 46, 32), 400)}>{m.digits}</span>
        <EndLine m={m} px={14} />
      </div>
    </>
  );
}

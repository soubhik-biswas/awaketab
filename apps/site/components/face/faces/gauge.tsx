import type { CSSProperties } from 'react';
import { BLACK, NAVY, type TThemed, WHITE } from '../art';
import { arc, f1, P } from '../geometry';
import { big, D, DialLabel, EndLine, fit, type IDrawProps, MONO, PLATE, Svg } from '../kit';
import { Applied, Crystal, METAL } from './analog-dial';

const GX = 180;
const GY = 158;
const GR = 120;
const gA = (f: number): number => -120 + 240 * f;

const gTicks = (r1: number, r2: number, keep: (i: number) => boolean): string => {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    if (!keep(i)) continue;
    const deg = gA(i / 40);
    const [ax, ay] = P(r1, deg, GX, GY);
    const [bx, by] = P(r2, deg, GX, GY);
    d += `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  }
  return d;
};
const MINOR = gTicks(98, 104, (i) => i % 5 !== 0);
const MID = gTicks(95, 104, (i) => i % 5 === 0 && i % 10 !== 0);
const MAJOR = gTicks(91, 106, (i) => i % 10 === 0);
const span = (f: number, rr = GR): string => arc(rr, gA(0) + 360, gA(f) + 360, GX, GY);
const SCALE = span(1, 106.5);
const NEEDLE = 'polygon(40% 0, 60% 0, 100% 80.95%, 100% 100%, 0 100%, 0 80.95%)';

// The instrument's dial: fine concentric graining under a soft top-left sheen, set in a two-ring bezel.
const POD: TThemed<CSSProperties> = {
  light: {
    background: `radial-gradient(110% 80% at 30% 8%, #FFFFFF, transparent 55%), repeating-radial-gradient(circle, ${NAVY(0.022)} 0, transparent 1.5px, ${NAVY(0.022)} 3px), radial-gradient(circle at 50% 32%, #FFFFFF 0%, #F3F3F9 60%, #E6E6EF 100%)`,
    boxShadow: `inset 0 1px 0 #FFFFFF, inset 0 -14px 30px ${NAVY(0.07)}, 0 22px 44px ${NAVY(0.12)}, 0 0 0 1px #D4D4E2, 0 0 0 6px #F7F7FB, 0 0 0 7px #DCDCE8`,
  },
  dark: {
    background: `radial-gradient(110% 80% at 30% 8%, ${WHITE(0.07)}, transparent 50%), repeating-radial-gradient(circle, ${WHITE(0.016)} 0, transparent 1.5px, ${WHITE(0.016)} 3px), radial-gradient(circle at 50% 32%, #1B1E28 0%, #0E1016 60%, #08090D 100%)`,
    boxShadow: `inset 0 1px 0 ${WHITE(0.1)}, inset 0 0 0 1px ${WHITE(0.035)}, inset 0 -18px 40px ${BLACK(0.5)}, 0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #262A35, 0 0 0 6px #12141A, 0 0 0 7px #23262F`,
  },
  oled: { background: '#000000', boxShadow: '0 0 0 1px #1A2236' },
};
// The pivot cap: turned gunmetal with a lit spot to the top left.
const CAP: TThemed<string> = {
  light: `radial-gradient(circle at 36% 30%, ${WHITE(0.4)} 0 8%, transparent 40%), repeating-radial-gradient(circle, ${WHITE(0.06)} 0, transparent 1px, ${WHITE(0.06)} 2px), radial-gradient(circle at 45% 38%, #4A536B, #0B1020 75%)`,
  dark: `radial-gradient(circle at 36% 30%, ${WHITE(0.35)} 0 8%, transparent 40%), repeating-radial-gradient(circle, ${WHITE(0.05)} 0, transparent 1px, ${WHITE(0.05)} 2px), radial-gradient(circle at 45% 38%, #3A3F4C, #101218 75%)`,
  oled: `repeating-radial-gradient(circle, ${WHITE(0.05)} 0, transparent 1px, ${WHITE(0.05)} 2px), radial-gradient(circle at 45% 38%, #2A2E38, #0A0B0F 75%)`,
};

// An instrument needle with a five-minute warning zone; the readout sits below the needle's reach at empty and full.
export default function Gauge({ m }: IDrawProps) {
  const { t, accent } = m;
  const k = METAL[m.theme];
  const gFr = m.ringFrac;
  const warnF = m.total > 0 ? Math.min(1, 300 / m.total) : 0;
  const value = span(Math.max(0.002, gFr));
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: GX - 144,
          top: GY - 144,
          width: 288,
          height: 288,
          borderRadius: '50%',
          ...POD[m.theme],
        }}
      />
      <Svg>
        <path
          d={span(1)}
          fill="none"
          strokeWidth="16.5"
          strokeLinecap="round"
          style={{ stroke: m.night ? BLACK(0.55) : NAVY(0.08) }}
        />
        <path d={span(1)} fill="none" strokeWidth="14" strokeLinecap="round" style={{ stroke: t.track }} />
        <path d={span(warnF, 131.5)} fill="none" strokeWidth="3" opacity=".9" style={{ stroke: t.paused }} />
        {m.awake && m.night && (
          <path d={value} fill="none" strokeWidth="24" strokeLinecap="round" opacity=".14" style={{ stroke: accent }} />
        )}
        <path d={value} fill="none" strokeWidth="14" strokeLinecap="round" style={{ stroke: accent }} />
        <path
          d={value}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity={m.night ? 0.35 : 0.3}
          style={{ stroke: WHITE(1) }}
        />
        <path className={D} d={SCALE} fill="none" strokeWidth=".8" opacity=".45" style={{ stroke: t.ink2 }} />
        <path className={D} d={MINOR} strokeWidth="1.1" opacity=".6" style={{ stroke: t.ink2 }} />
        <path d={MID} strokeWidth="1.8" style={{ stroke: t.ink2 }} />
        <Applied m={m} d={MAJOR} w={3.2} />
      </Svg>
      {(m.total > 0 && !m.indef ? [0.25, 0.5, 0.75] : []).map((q) => (
        <DialLabel
          key={q}
          m={m}
          text={String(Math.round((m.total / 60) * q))}
          rr={78}
          deg={gA(q)}
          fs={13}
          color={t.ink2}
          extra={{ fontFamily: MONO, fontWeight: 500 }}
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
          transformOrigin: `${GX}px ${GY}px`,
          transform: `rotate(${gA(gFr).toFixed(2)}deg)`,
        }}
      >
        <div
          className="afx-jit"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 360,
            height: 310,
            transformOrigin: `${GX}px ${GY}px`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: GX - 4,
              top: GY - 102,
              width: 8,
              height: 126,
              background: `linear-gradient(90deg, ${WHITE(0.34)} 0 50%, ${BLACK(0.14)} 50%), linear-gradient(180deg, ${accent} 0 64%, ${k.shade} 64%)`,
              clipPath: NEEDLE,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: GX - 7,
              top: GY + 13,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: `radial-gradient(circle at 36% 32%, ${WHITE(0.5)} 0 14%, transparent 46%), ${k.shade}`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: GX - 12,
          top: GY - 12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent} 0 3px, transparent 3.5px), ${CAP[m.theme]}`,
          boxShadow: `0 2px 6px ${k.drop}, 0 0 0 1px ${t.line}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 194,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={big(fit(m, m.long ? 34 : 42, 28), 400)}>{m.digits}</span>
        <EndLine m={m} px={14} style={{ maxWidth: 196, textAlign: 'center', textWrap: 'balance', lineHeight: 1.2 }} />
      </div>
      <Crystal m={m} cx={GX} cy={GY} r={144} />
    </>
  );
}

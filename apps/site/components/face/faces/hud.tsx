import { fxInk } from '../art';
import { alpha, sectorPath } from '../geometry';
import { card, DISPLAY, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';

// A pale dash with light-grey off segments by day, a dark dash at night.
const ART = {
  light: {
    glass: 'radial-gradient(80% 70% at 50% 60%, #FFFFFF, #ECEFF5 75%)',
    off: '#DCE0E9',
    lab: '#5C6275',
    lampLine: '#D3D6E0',
    lampInk: '#5C6275',
    video: '#1C64B8',
  },
  night: {
    glass: 'radial-gradient(80% 70% at 50% 60%, #0D1222, #03050A 75%)',
    off: '#161D2E',
    lab: '#7D8AA6',
    lampLine: '#1F2738',
    lampInk: '#4A5570',
    video: '#7CBBFF',
  },
};
type TArt = (typeof ART)['light'];
const HS = 40;
const SEGS = Array.from({ length: HS }, (_, i) =>
  sectorPath(i % 5 === 0 ? 116 : 120, 136, -125 + (250 * i) / HS + 0.9 + 360, -125 + (250 * (i + 1)) / HS - 0.9 + 360),
);

function Lamp({ a, on, color, children }: { a: TArt; on: boolean; color: string; children: string }) {
  return (
    <span
      className={L}
      style={{
        height: 28,
        padding: '0 10px',
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: MONO,
        fontSize: lmin(12),
        letterSpacing: '.1em',
        border: `1px solid ${on ? color : a.lampLine}`,
        color: on ? color : a.lampInk,
        background: on ? alpha(color, 0x1f) : 'transparent',
      }}
    >
      {children}
    </span>
  );
}

// A car-dashboard arc of segments with italic digits and tell-tale lights.
export default function Hud({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const acc = m.accent;
  const lit = Math.round(m.ringFrac * HS);
  return (
    <div className={PLATE} style={card(m, { background: a.glass })}>
      <svg
        style={{ position: 'absolute', left: -14, top: -14 }}
        width="360"
        height="310"
        viewBox="0 0 360 310"
        aria-hidden="true"
      >
        <path d={SEGS.slice(lit).join(' ')} fill={a.off} />
        <path d={SEGS.slice(0, lit).join(' ')} style={{ fill: m.heat(m.frac) }} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 74,
          width: 332,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: fxInk(!m.night),
        }}
      >
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.24em', color: a.lab }}>
          TIME LEFT
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: fit(m, m.long ? 56 : 76, 48),
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            transform: 'skewX(-9deg)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 24px ${alpha(acc, 0x40)}`,
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(13), color: acc }}>
          END {m.endShort}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          bottom: 22,
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Lamp a={a} on={m.awake} color={m.lampValue}>
          SCREEN
        </Lamp>
        <Lamp a={a} on={m.st === 'fallback'} color={a.video}>
          VIDEO
        </Lamp>
        <Lamp a={a} on={m.st === 'paused' || m.st === 'blocked'} color={m.t.paused}>
          HOLD
        </Lamp>
      </div>
    </div>
  );
}

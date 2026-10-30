import { alpha, sectorPath } from '../geometry';
import { card, DISPLAY, type IDrawProps, L, lmin, MONO, nightAccent, nightClass, nightHeat } from '../kit';

const GLASS = 'radial-gradient(80% 70% at 50% 60%, #0D1222, #03050A 75%)';
const OFF = '#161D2E';
const LAMP_OFF = { line: '#1F2738', ink: '#4A5570' };
const KEY_INK = '#7D8AA6';
const VIDEO = '#7CBBFF';
const HS = 40;
const SEGS = Array.from({ length: HS }, (_, i) =>
  sectorPath(i % 5 === 0 ? 116 : 120, 136, -125 + (250 * i) / HS + 0.9 + 360, -125 + (250 * (i + 1)) / HS - 0.9 + 360),
);

function Lamp({ on, color, children }: { on: boolean; color: string; children: string }) {
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
        border: `1px solid ${on ? color : LAMP_OFF.line}`,
        color: on ? color : LAMP_OFF.ink,
        background: on ? alpha(color, 0x1f) : 'transparent',
      }}
    >
      {children}
    </span>
  );
}

// A car-dashboard arc of segments with italic digits and tell-tale lamps.
export default function Hud({ m }: IDrawProps) {
  const acc = nightAccent(m);
  const lit = Math.round(m.ringFrac * HS);
  return (
    <div className={nightClass(m)} style={card(m, { background: GLASS })}>
      <svg
        style={{ position: 'absolute', left: -14, top: -14 }}
        width="360"
        height="310"
        viewBox="0 0 360 310"
        aria-hidden="true"
      >
        <path d={SEGS.slice(lit).join(' ')} fill={OFF} />
        <path d={SEGS.slice(0, lit).join(' ')} style={{ fill: nightHeat(m, m.frac) }} />
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
          color: '#FFFFFF',
        }}
      >
        <span className={L} style={{ fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.24em', color: KEY_INK }}>
          TIME LEFT
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            fontSize: m.long ? 56 : 76,
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
        className={m.theme}
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
        <Lamp on={m.awake} color={m.lampValue}>
          SCREEN
        </Lamp>
        <Lamp on={m.st === 'fallback'} color={VIDEO}>
          VIDEO
        </Lamp>
        <Lamp on={m.st === 'paused' || m.st === 'blocked'} color="var(--warning)">
          HOLD
        </Lamp>
      </div>
    </div>
  );
}

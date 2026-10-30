import { CARD_SHADOW } from '../art';
import { alpha, f1, P, ticks } from '../geometry';
import { type IDrawProps, L, mono, Svg } from '../kit';

const SCOPE = {
  light: 'radial-gradient(circle, #F2FBF5, #E2F2E8)',
  dark: 'radial-gradient(circle, #0C1A14, #07100C)',
  oled: '#000000',
};
const PILL = { light: 'rgba(255,255,255,.9)', night: 'rgba(7,11,22,.85)' };
const TICKS = ticks(128, 135, 36);

// A sweeping scope; the blip marks the end time on the rings.
export default function Radar({ m }: IDrawProps) {
  const { accent } = m;
  const a1 = alpha(accent, 0x26);
  const a2 = alpha(accent, 0x40);
  const a3 = alpha(accent, 0x99);
  const [bx, by] = P(110, 360 * m.ringFrac);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 19,
          width: 272,
          height: 272,
          borderRadius: '50%',
          overflow: 'hidden',
          background: SCOPE[m.theme],
          boxShadow: CARD_SHADOW[m.theme],
        }}
      >
        <div
          className="afx-radar"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${a3} 0deg, ${a1} 40deg, transparent 90deg 360deg)`,
            opacity: m.awake || m.st === 'idle' ? 1 : 0.35,
            transform: `rotate(${(360 * (1 - m.frac)).toFixed(1)}deg)`,
          }}
        />
      </div>
      <Svg>
        <circle cx="180" cy="155" r="45" fill="none" strokeWidth="1" style={{ stroke: a2 }} />
        <circle cx="180" cy="155" r="90" fill="none" strokeWidth="1" style={{ stroke: a2 }} />
        <circle cx="180" cy="155" r="135" fill="none" strokeWidth="1.5" style={{ stroke: a3 }} />
        <path d="M180 20 V290 M45 155 H315" strokeWidth="1" style={{ stroke: a2 }} />
        <path d={TICKS} strokeWidth="1.4" opacity=".7" style={{ stroke: accent }} />
        <circle className="afx-pulse" cx={f1(bx)} cy={f1(by)} r="9" opacity={m.haloOp} style={{ fill: accent }} />
        <circle cx={f1(bx)} cy={f1(by)} r="5" style={{ fill: accent }} />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 116,
          top: 128,
          width: 128,
          height: 54,
          borderRadius: 12,
          background: m.night ? PILL.night : PILL.light,
          border: `1px solid ${a2}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={mono(12, '.08em', accent)}>
          {m.endShort}
        </span>
      </div>
    </>
  );
}

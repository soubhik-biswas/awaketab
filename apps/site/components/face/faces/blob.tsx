import type { CSSProperties } from 'react';
import { BLACK, WHITE } from '../art';
import { alpha } from '../geometry';
import { card, D, type IDrawProps, Kicker, L, lmin, PLATE } from '../kit';

// A pearl of pastel colour with dark ink by day; a glossy drop of deep colour with white digits at night.
const ART = {
  light: {
    ground:
      'radial-gradient(110% 80% at 25% 0%, #FFFFFF, transparent 55%), linear-gradient(170deg, #F6F7FC 0%, #EEF0F8 60%, #E8EAF5 100%)',
    hues: ['#A6D8FF', '#C8B6FF', '#FFC6E6'],
    lamp: '#9DE6C4',
    // A milky centre, so the dark ink keeps its contrast over every hue as the pearl turns.
    veil: `radial-gradient(circle closest-side, ${WHITE(0.6)}, ${WHITE(0.42)} 55%, ${WHITE(0.14)} 82%, ${WHITE(0)})`,
    base: ', #FFFFFF',
    // Light gathers at the edge of a pearl, so the rim brightens rather than darkens.
    rim: `inset 0 0 30px ${WHITE(0.85)}, inset 0 0 0 1px ${WHITE(0.9)}`,
    halo: 0.6,
    gloss: WHITE(0.95),
    caustic: WHITE(0.55),
    floor: 'rgba(96,80,170,.2)',
    ink: '#0B1020',
    ink2: '#2E3346',
    textShadow: `0 1px 0 ${WHITE(0.6)}`,
  },
  night: {
    ground: 'radial-gradient(110% 80% at 25% 0%, #0E1122, transparent 60%), #05060E',
    hues: ['#3FB8FF', '#7B5CFF', '#FF7DD8'],
    lamp: '',
    // The drop's own shade, deepest behind the time: white digits keep their contrast over every hue as it turns.
    veil: 'radial-gradient(circle closest-side, rgba(5,6,14,.52), rgba(5,6,14,.44) 58%, rgba(5,6,14,.3) 82%, rgba(5,6,14,.12))',
    base: '',
    rim: `inset 0 0 26px ${WHITE(0.2)}, inset 0 0 0 1px ${WHITE(0.14)}`,
    halo: 0.5,
    gloss: WHITE(0.5),
    caustic: WHITE(0.14),
    floor: BLACK(0.6),
    ink: '#FFFFFF',
    ink2: WHITE(0.9),
    textShadow: `0 2px 14px ${BLACK(0.35)}`,
  },
} as const;
const OLED_GROUND = '#000000';
const SHAPE = '42% 58% 63% 37% / 45% 41% 59% 55%';
// The morphing shape always holds a circle of about 0.45 × its box, so the static gloss inside never leaves it.
const BOX = { left: 61, top: 22, width: 210, height: 210 } as const;
const CX = BOX.left + BOX.width / 2;
const CY = BOX.top + BOX.height / 2;

// A soft light inside the drop that stays put while the shape turns, so the light keeps coming from the top left.
const spot = (dx: number, dy: number, w: number, h: number, c: string, tilt = -30): CSSProperties => ({
  position: 'absolute',
  left: CX + dx - w / 2,
  top: CY + dy - h / 2,
  width: w,
  height: h,
  borderRadius: '50%',
  transform: `rotate(${tilt}deg)`,
  background: `radial-gradient(closest-side, ${c}, transparent)`,
});

// A morphing drop of colour, like a voice assistant at rest.
export default function Blob({ m }: IDrawProps) {
  const a = m.night ? ART.night : ART.light;
  const dayLamp = m.lampValue === m.t.lamp ? ART.light.lamp : `color-mix(in srgb, ${m.lamp} 40%, #FFFFFF)`;
  const lead = m.night ? m.lamp : dayLamp;
  // A resting state is its own colour at night and a pale tint of it by day.
  const grad = m.multi
    ? `conic-gradient(from 200deg, ${lead}, ${a.hues.join(', ')}, ${lead})`
    : m.night
      ? `conic-gradient(from 200deg, ${m.accent}, ${alpha(m.accent, 0x88)}, ${m.accent})`
      : `conic-gradient(from 200deg, ${alpha(m.accent, 0x5c)}, ${alpha(m.accent, 0x2e)}, ${alpha(m.accent, 0x5c)})`;
  const smallest = m.digits.length > 7;
  return (
    <div className={PLATE} style={card(m, { background: m.theme === 'oled' ? OLED_GROUND : a.ground })}>
      <div
        style={{
          position: 'absolute',
          left: CX - 78,
          top: BOX.top + BOX.height + 2,
          width: 156,
          height: 16,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${a.floor}, transparent)`,
        }}
      />
      <div style={{ position: 'absolute', ...BOX, opacity: a.halo }}>
        <div
          className="afx-breath"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `${grad}${a.base}`,
            filter: 'blur(24px)',
          }}
        />
      </div>
      <div
        className="afx-morph"
        style={{
          position: 'absolute',
          ...BOX,
          borderRadius: SHAPE,
          background: `${a.veil}, ${grad}${a.base}`,
          boxShadow: a.rim,
        }}
      />
      <div className={D} style={spot(-32, -50, 58, 24, a.gloss)} />
      <div className={D} style={spot(-54, -26, 9, 9, a.gloss, 0)} />
      <div className={D} style={spot(24, 50, 64, 26, a.caustic)} />
      <div
        style={{
          position: 'absolute',
          ...BOX,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingTop: 6,
          color: a.ink,
          textShadow: a.textShadow,
        }}
      >
        <Kicker m={m} color={a.ink2} />
        <span
          style={{
            fontSize: smallest ? 42 : m.long ? 48 : 60,
            fontWeight: 300,
            letterSpacing: '-0.045em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
      </div>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 0,
          width: 332,
          top: 252,
          textAlign: 'center',
          fontSize: lmin(14),
          color: m.t.ink2,
        }}
      >
        {m.endLine}
      </span>
    </div>
  );
}

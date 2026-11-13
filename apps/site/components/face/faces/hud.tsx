import { useId } from 'react';
import { BLACK, CARD_SHADOW, fxInk, NAVY, WHITE } from '../art';
import { alpha, f1, P, sectorPath } from '../geometry';
import { card, D, DISPLAY, fit, type IDrawProps, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceModel, TFaceTheme } from '../model';

interface IArt {
  glass: string;
  // The cover glass: a soft reflection from the top left and a deeper rim where the glass meets the bezel.
  sheen: string;
  rim: string;
  off: string;
  stop: string;
  lab: string;
  lampLine: string;
  lampInk: string;
  video: string;
}

// A pale instrument by day, a dark cluster at night, true black in OLED.
const NIGHT: IArt = {
  glass: 'radial-gradient(80% 70% at 50% 60%, #0D1222, #03050A 75%)',
  sheen: `linear-gradient(152deg, ${WHITE(0.06)} 0%, ${WHITE(0)} 32%)`,
  rim: `inset 0 0 0 1px ${WHITE(0.03)}, inset 0 -26px 48px ${BLACK(0.45)}`,
  off: '#161D2E',
  stop: '#3A4560',
  lab: '#7D8AA6',
  lampLine: '#1F2738',
  lampInk: '#7380A0',
  video: '#7CBBFF',
};
const ART: Readonly<Record<TFaceTheme, IArt>> = {
  light: {
    glass: 'radial-gradient(80% 70% at 50% 60%, #FFFFFF, #ECEFF5 75%)',
    sheen: `linear-gradient(152deg, ${WHITE(0.9)} 0%, ${WHITE(0)} 34%)`,
    rim: `inset 0 0 0 1px ${WHITE(0.7)}, inset 0 -22px 44px ${NAVY(0.06)}`,
    off: '#DCE0E9',
    stop: '#A9AFBE',
    lab: '#5C6275',
    lampLine: '#D3D6E0',
    lampInk: '#5C6275',
    video: '#1C64B8',
  },
  dark: NIGHT,
  oled: {
    ...NIGHT,
    glass: 'radial-gradient(80% 70% at 50% 60%, #060912, #000000 75%)',
    sheen: `linear-gradient(152deg, ${WHITE(0.04)} 0%, ${WHITE(0)} 30%)`,
    rim: `inset 0 0 0 1px ${WHITE(0.03)}`,
    off: '#0E1320',
  },
};

const HS = 40;
const A0 = -125;
const SPAN = 250;
const SEGS = Array.from({ length: HS }, (_, i) =>
  sectorPath(i % 5 === 0 ? 116 : 120, 136, A0 + (SPAN * i) / HS + 0.9 + 360, A0 + (SPAN * (i + 1)) / HS - 0.9 + 360),
);
// End stops just past both ends of the scale, like the pins of a gauge.
const STOPS = [A0 - 2.4, A0 + SPAN + 2.4]
  .map((deg) => {
    const [ax, ay] = P(113, deg);
    const [bx, by] = P(140, deg);
    return `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}`;
  })
  .join('');

// Awake reads as time left; every other state names itself, so a paused or refused session never looks running.
const label = (m: TFaceModel): string => (m.awake ? (m.indef ? m.topWord : 'time left') : m.topWord);

// A filled light is on and a ring is off, so the tell-tales read by shape too.
function Lamp({
  a,
  on,
  color,
  glow,
  children,
}: {
  a: IArt;
  on: boolean;
  color: string;
  glow: boolean;
  children: string;
}) {
  return (
    <span
      className={L}
      style={{
        height: 28,
        padding: '0 8px',
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: MONO,
        fontSize: lmin(12),
        letterSpacing: '.1em',
        whiteSpace: 'nowrap',
        border: `1px solid ${on ? color : a.lampLine}`,
        color: on ? color : a.lampInk,
        background: on ? alpha(color, 0x1f) : 'transparent',
      }}
    >
      <span
        style={{
          flex: 'none',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: on ? color : 'transparent',
          boxShadow: on ? (glow ? `0 0 6px ${alpha(color, 0x99)}` : undefined) : `inset 0 0 0 1.5px ${a.lampLine}`,
        }}
      />
      {children}
    </span>
  );
}

// A car-dashboard arc of segments with italic digits and tell-tale lights.
export default function Hud({ m }: IDrawProps) {
  const a = ART[m.theme];
  const acc = m.accent;
  const heat = m.heat(m.frac);
  const lit = Math.round(m.ringFrac * HS);
  const lead = lit > 0 ? SEGS[lit - 1] : undefined;
  const glow = m.night && !m.thumb;
  const id = useId().replace(/[^a-zA-Z0-9_-]/gu, '');
  // Each lit segment burns brightest at its outer end, like a bar of a light-emitting gauge.
  const grad = `${id}-lit`;
  return (
    <div className={PLATE} style={card(m, { background: a.glass, boxShadow: `${CARD_SHADOW[m.theme]}, ${a.rim}` })}>
      <svg
        style={{ position: 'absolute', left: -14, top: -14 }}
        width="360"
        height="310"
        viewBox="0 0 360 310"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={grad} gradientUnits="userSpaceOnUse" cx="180" cy="155" r="136">
            <stop offset="0.84" style={{ stopColor: heat, stopOpacity: m.night ? 0.62 : 0.78 }} />
            <stop offset="1" style={{ stopColor: heat, stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        <path d={SEGS.slice(lit).join(' ')} fill={a.off} />
        {glow && lit > 1 && (
          <path
            d={SEGS.slice(0, lit - 1).join(' ')}
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ stroke: heat, strokeOpacity: 0.26 }}
          />
        )}
        <path d={SEGS.slice(0, Math.max(0, lit - 1)).join(' ')} fill={`url(#${grad})`} />
        {lead && (
          // The newest segment is the needle: brighter, and breathing while the screen is held.
          <g className={m.live ? 'afx-breath' : undefined}>
            {glow && (
              <path
                d={lead}
                fill="none"
                strokeWidth="3"
                strokeLinejoin="round"
                style={{ stroke: heat, strokeOpacity: 0.32 }}
              />
            )}
            <path d={lead} style={{ fill: m.night ? `color-mix(in srgb, ${heat} 62%, #FFFFFF)` : heat }} />
          </g>
        )}
        <path className={D} d={STOPS} strokeWidth="1.5" strokeLinecap="round" stroke={a.stop} />
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
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: a.lab,
          }}
        >
          {label(m)}
        </span>
        <span
          style={{
            fontFamily: DISPLAY,
            fontStretch: '112%',
            // Sized to clear the arc's inner edge (232 wide at the readout) with the slant included.
            fontSize: fit(m, m.long ? 54 : 68, 48),
            whiteSpace: 'nowrap',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            transform: 'skewX(-9deg)',
            fontVariantNumeric: 'tabular-nums',
            // The readout is lit from within at night; printed ink by day.
            textShadow: m.night ? `0 0 18px ${alpha(acc, 0x38)}` : undefined,
          }}
        >
          {m.digits}
        </span>
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(13),
            letterSpacing: '.06em',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            color: acc,
          }}
        >
          {m.indef ? 'NO END' : `END ${m.endShort}`}
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
        <Lamp a={a} on={m.awake} color={m.lampValue} glow={glow}>
          SCREEN
        </Lamp>
        <Lamp a={a} on={m.st === 'fallback'} color={a.video} glow={glow}>
          VIDEO
        </Lamp>
        <Lamp a={a} on={m.st === 'paused' || m.st === 'blocked'} color={m.accentValue} glow={glow}>
          HOLD
        </Lamp>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 332,
          height: 282,
          background: a.sheen,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

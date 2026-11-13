import { useId } from 'react';
import { BLACK, fxInk, fxInk2, NAVY, WHITE } from '../art';
import { dash, P, ticks } from '../geometry';
import { D, type IDrawProps, L, lmin, MONO, PLATE, Stars, type TStar, Svg } from '../kit';
import { FACE_PALETTE, stateColour, type TFaceModel } from '../model';

// A pale blue daytime sky with a chalk-white moon by day; a night sky with warm moonlight at night.
const ART = {
  light: {
    sky: 'radial-gradient(circle at 50% 118%, rgba(255,214,232,.45), transparent 52%), radial-gradient(circle at 50% 30%, #EDF3FD 0%, #E2EBF8 56%, #D6E1F3 100%)',
    shadow: `inset 0 1px 0 #FFFFFF, inset 0 -22px 40px ${NAVY(0.05)}, 0 18px 36px ${NAVY(0.16)}, 0 0 0 1px #D9DEEA`,
    track: NAVY(0.1),
    minor: NAVY(0.14),
    major: NAVY(0.3),
    // By day the unlit side is almost the sky itself, as the real daytime moon is.
    dark: ['rgba(120,140,180,.10)', 'rgba(120,140,180,.04)'],
    edge: NAVY(0.12),
    lit: ['#FFFFFF', '#F1F3F8', '#D9DFEA'],
    mare: 'rgba(96,114,152,.30)',
    crater: 'rgba(80,96,130,.28)',
    terminator: 'rgba(70,86,122,.55)',
    glow: 'radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,0) 66%)',
  },
  night: {
    sky: 'radial-gradient(circle at 50% 30%, rgba(255,240,205,.10), transparent 46%), radial-gradient(circle at 50% 120%, rgba(61,245,142,.10), transparent 55%), radial-gradient(circle at 50% 30%, #161C30 0%, #0B0F1D 58%, #05070F 100%)',
    shadow: `inset 0 1px 0 ${WHITE(0.08)}, inset 0 -24px 44px ${BLACK(0.35)}, 0 22px 44px ${BLACK(0.5)}, 0 0 0 1px #2A2D38`,
    track: WHITE(0.08),
    minor: WHITE(0.12),
    major: WHITE(0.3),
    // Earthshine: the unlit side keeps a faint blue-grey light reflected from the Earth.
    dark: ['rgba(150,170,220,.10)', 'rgba(150,170,220,.035)'],
    edge: WHITE(0.12),
    lit: ['#FFFDF6', '#ECE5D0', '#BFB497'],
    mare: 'rgba(84,72,48,.34)',
    crater: 'rgba(70,60,40,.34)',
    terminator: 'rgba(28,24,16,.7)',
    glow: 'radial-gradient(circle, rgba(255,246,220,.30), rgba(255,246,220,0) 66%)',
  },
};
// True black around the moonlight on OLED.
const OLED = {
  sky: 'radial-gradient(circle at 50% 30%, rgba(255,240,205,.08), transparent 46%), #000000',
  shadow: `inset 0 1px 0 ${WHITE(0.06)}, 0 0 0 1px #1A2236`,
};
const STAR_SKY = '#A9D0FF';
const STARS: readonly TStar[] = [
  [40, 70, 2],
  [70, 40, 3],
  [230, 48, 2],
  [252, 96, 2],
  [30, 140, 2],
  [262, 160, 3],
  [206, 34, 2],
  [96, 22, 2],
  [24, 196, 2],
  [258, 204, 2],
  [120, 260, 2],
  [180, 270, 2],
  [60, 230, 3],
  [240, 240, 2],
];
const STAR_COLOURS = ['#FFFFFF', STAR_SKY, '#D9CCFF', '#FFFFFF', '#FFC8E4'];
const RING = 140;
const C140 = 2 * Math.PI * RING;
const MINOR = ticks(131, 134, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(129, 134, 12);
const MR = 56;
const MCX = 180;
const MCY = 104;

// The dark seas, as offsets from the moon's centre in moon radii: [x, y, rx, ry].
const MARIA: readonly (readonly [number, number, number, number])[] = [
  [-0.36, -0.3, 0.26, 0.22],
  [0.12, -0.3, 0.17, 0.16],
  [0.26, -0.04, 0.22, 0.17],
  [0.6, -0.22, 0.12, 0.11],
  [0.46, 0.24, 0.13, 0.17],
  [-0.58, 0.04, 0.24, 0.38],
  [-0.16, 0.4, 0.2, 0.13],
];
// Craters, shaded on the inner wall nearest the light and lit on the far wall: [x, y, r].
const CRATERS: readonly (readonly [number, number, number])[] = [
  [-0.1, 0.72, 0.07],
  [-0.38, -0.02, 0.075],
  [-0.18, -0.68, 0.06],
  [0.34, 0.5, 0.05],
  [0.06, 0.12, 0.045],
];
const mx = (u: number): number => MCX + u * MR;
const my = (v: number): number => MCY + v * MR;

// The phase tag: warm moonlight (deep amber by day) while awake, starting or ready; the state colour otherwise.
const tagColour = (m: TFaceModel): string => {
  const light = !m.night;
  if (m.awake || m.st === 'starting') return light ? '#8A5A00' : '#E9DDB4';
  if (m.st === 'idle') return light ? '#4B5165' : '#E9DDB4';
  return stateColour(FACE_PALETTE[light ? 'light' : 'dark'], m.st, m.lampValue);
};

// The terminator, south pole to north: it bulges toward the lit limb for a crescent and away from it once gibbous.
const towardNorth = (mk: number): string =>
  ` A${(MR * Math.abs(1 - 2 * mk)).toFixed(2)} ${MR} 0 0 ${mk < 0.5 ? 1 : 0} ${MCX} ${MCY - MR}`;
const terminator = (mk: number): string => (mk >= 0.995 || mk <= 0.005 ? '' : `M${MCX} ${MCY + MR}${towardNorth(mk)}`);

// The lit part, on the left limb as a waning moon is: a full disc, then a shrinking crescent as the session runs.
export function moonPath(mk: number): string {
  if (mk >= 0.995)
    return `M${MCX} ${MCY - MR} A${MR} ${MR} 0 1 1 ${MCX} ${MCY + MR} A${MR} ${MR} 0 1 1 ${MCX} ${MCY - MR} Z`;
  if (mk <= 0.005) return '';
  return `M${MCX} ${MCY - MR} A${MR} ${MR} 0 0 0 ${MCX} ${MCY + MR}${towardNorth(mk)} Z`;
}

// With no end there is nothing to wane toward, so the moon stays full and names no share.
const phase = (m: TFaceModel): string =>
  m.st === 'up' ? 'New moon' : m.st === 'idle' || m.indef ? 'Full moon' : `${Math.round(m.ringFrac * 100)}% lit`;

// The moon wanes from full to new as the session runs down: a night sky in dark, a pale daytime sky in light.
export default function Moon({ m }: IDrawProps) {
  const gid = `af-moon-${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const mk = m.indef ? 1 : m.ringFrac;
  const lit = moonPath(mk);
  const edge = terminator(mk);
  const a = m.night ? ART.night : ART.light;
  const oled = m.theme === 'oled';
  const rest = m.st === 'idle' || m.indef;
  const [hx, hy] = P(RING, 0);
  // The brightest point slides toward the lit limb as the moon wanes, always up and to the left.
  const sunX = (MCX - MR * (0.15 + 0.75 * (1 - mk))).toFixed(1);
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 34,
          top: 9,
          width: 292,
          height: 292,
          borderRadius: '50%',
          overflow: 'hidden',
          background: oled ? OLED.sky : a.sky,
          boxShadow: oled ? OLED.shadow : a.shadow,
        }}
      >
        {m.night && <Stars pts={STARS} colors={STAR_COLOURS} />}
        <div
          style={{
            position: 'absolute',
            left: 56,
            top: 5,
            width: 180,
            height: 180,
            opacity: 0.2 + 0.8 * mk,
          }}
        >
          <div
            className="afx-breath"
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: a.glow }}
          />
        </div>
      </div>
      <Svg>
        <defs>
          <radialGradient id={`${gid}-l`} gradientUnits="userSpaceOnUse" cx={sunX} cy={MCY - 18} r={MR * 1.5}>
            <stop offset="0" style={{ stopColor: a.lit[0] }} />
            <stop offset=".55" style={{ stopColor: a.lit[1] }} />
            <stop offset="1" style={{ stopColor: a.lit[2] }} />
          </radialGradient>
          <radialGradient id={`${gid}-d`} gradientUnits="userSpaceOnUse" cx={MCX - 14} cy={MCY - 16} r={MR * 1.3}>
            <stop offset="0" style={{ stopColor: a.dark[0] }} />
            <stop offset="1" style={{ stopColor: a.dark[1] }} />
          </radialGradient>
          <radialGradient id={`${gid}-m`}>
            <stop offset="0" style={{ stopColor: a.mare }} />
            <stop offset=".6" style={{ stopColor: a.mare, stopOpacity: 0.7 }} />
            <stop offset="1" style={{ stopColor: a.mare, stopOpacity: 0 }} />
          </radialGradient>
          <filter
            id={`${gid}-s`}
            filterUnits="userSpaceOnUse"
            x={MCX - MR - 20}
            y={MCY - MR - 20}
            width={2 * MR + 40}
            height={2 * MR + 40}
          >
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          {lit && (
            <clipPath id={`${gid}-c`}>
              <path d={lit} />
            </clipPath>
          )}
        </defs>
        <g className={D}>
          <path d={MINOR} strokeWidth="1" style={{ stroke: a.minor }} />
          <path d={MAJOR} strokeWidth="1.5" strokeLinecap="round" style={{ stroke: a.major }} />
        </g>
        <circle cx="180" cy="155" r={RING} fill="none" strokeWidth="3" style={{ stroke: a.track }} />
        <circle
          className="af-tr"
          cx="180"
          cy="155"
          r={RING}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={rest ? 0.35 : mk === 0 ? 0 : 1}
          style={{ stroke: m.mc1, strokeDasharray: dash(C140, mk) }}
        />
        {!rest && mk > 0 && (
          <g
            className="af-tr"
            style={{ transform: `rotate(${(360 * mk).toFixed(2)}deg)`, transformOrigin: '180px 155px' }}
          >
            {m.night && <circle cx={hx} cy={hy} r="7" opacity=".22" style={{ fill: m.mc1 }} />}
            <circle
              cx={hx}
              cy={hy}
              r={m.night ? 3.5 : 4}
              strokeWidth="1.5"
              style={{ fill: m.mc1, stroke: m.night ? 'none' : '#FFFFFF' }}
            />
          </g>
        )}
        <circle cx={MCX} cy={MCY} r={MR} strokeWidth="1" style={{ fill: `url(#${gid}-d)`, stroke: a.edge }} />
        {lit && (
          <g clipPath={`url(#${gid}-c)`}>
            <rect x={MCX - MR} y={MCY - MR} width={2 * MR} height={2 * MR} fill={`url(#${gid}-l)`} />
            <g className={D}>
              {MARIA.map(([u, v, rx, ry], i) => (
                <ellipse key={i} cx={mx(u)} cy={my(v)} rx={rx * MR} ry={ry * MR} fill={`url(#${gid}-m)`} />
              ))}
              {CRATERS.map(([u, v, r], i) => (
                <g key={i}>
                  <circle cx={mx(u)} cy={my(v)} r={r * MR} style={{ fill: a.crater }} />
                  <circle
                    cx={mx(u) + r * MR * 0.28}
                    cy={my(v) + r * MR * 0.22}
                    r={r * MR * 0.74}
                    fill={`url(#${gid}-l)`}
                  />
                </g>
              ))}
            </g>
            {edge && (
              <path d={edge} fill="none" strokeWidth="16" filter={`url(#${gid}-s)`} style={{ stroke: a.terminator }} />
            )}
          </g>
        )}
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 168,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: m.long ? 34 : 46,
            fontWeight: 300,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            color: fxInk(!m.night),
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: fxInk2(!m.night) }}>
          {m.endLine}
        </span>
        <span
          className={L}
          style={{
            marginTop: 3,
            fontFamily: MONO,
            fontSize: lmin(12),
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: tagColour(m),
          }}
        >
          {phase(m)}
        </span>
      </div>
    </>
  );
}

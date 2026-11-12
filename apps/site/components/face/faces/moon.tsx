import { useId } from 'react';
import { BLACK, fxInk, fxInk2, NAVY, WHITE } from '../art';
import { dash } from '../geometry';
import { type IDrawProps, L, lmin, MONO, Stars, type TStar, Svg, PLATE } from '../kit';
import { FACE_PALETTE, stateColour, type TFaceModel } from '../model';

// A pale daytime sky by day, a night sky at night.
const ART = {
  light: {
    sky: 'radial-gradient(circle at 50% 120%, rgba(17,122,59,.10), transparent 55%), radial-gradient(circle at 50% 30%, #FFFFFF 0%, #EEF1F8 58%, #DFE4F0 100%)',
    shadow: `0 18px 36px ${NAVY(0.18)}, 0 0 0 1px #D9D9E5`,
    track: NAVY(0.1),
    dark: NAVY(0.07),
    edge: NAVY(0.16),
    lit: ['#FFFDF6', '#E9E1C9', '#B9AD8E'],
  },
  night: {
    sky: 'radial-gradient(circle at 50% 30%, rgba(255,240,205,.10), transparent 46%), radial-gradient(circle at 50% 120%, rgba(61,245,142,.10), transparent 55%), radial-gradient(circle at 50% 30%, #161C30 0%, #0B0F1D 58%, #05070F 100%)',
    shadow: `0 22px 44px ${BLACK(0.5)}, 0 0 0 1px #2A2D38`,
    track: WHITE(0.08),
    dark: WHITE(0.06),
    edge: WHITE(0.14),
    lit: ['#FFFDF6', '#ECE5D0', '#C8BFA6'],
  },
};
const GLOW = 'radial-gradient(circle, rgba(255,246,220,.30), rgba(255,246,220,0) 66%)';
const CRATER = (a: number) => `rgba(60,50,30,${a})`;
const STAR_SKY = '#A9D0FF';
const STARS: readonly TStar[] = [
  [40, 70, 2],
  [70, 40, 3],
  [230, 48, 2],
  [252, 96, 2],
  [30, 140, 2],
  [262, 160, 3],
  [214, 26, 2],
  [96, 22, 2],
  [24, 196, 2],
  [270, 210, 2],
  [120, 260, 2],
  [180, 270, 2],
  [60, 230, 3],
  [240, 240, 2],
];
const STAR_COLOURS = ['#FFFFFF', STAR_SKY, '#D9CCFF', '#FFFFFF', '#FFC8E4'];
const C140 = 2 * Math.PI * 140;
const MR = 56;
const MCX = 180;
const MCY = 104;

// The phase tag: warm moonlight (deep amber by day) while awake, starting or ready; the state colour otherwise.
const tagColour = (m: TFaceModel): string => {
  const light = !m.night;
  if (m.awake || m.st === 'starting') return light ? '#8A5A00' : '#E9DDB4';
  if (m.st === 'idle') return light ? '#4B5165' : '#E9DDB4';
  return stateColour(FACE_PALETTE[light ? 'light' : 'dark'], m.st, m.lampValue);
};

// The lit part of the moon: a full disc, then a shrinking crescent as the session runs down.
export function moonPath(mk: number): string {
  if (mk >= 0.995)
    return `M${MCX} ${MCY - MR} A${MR} ${MR} 0 1 1 ${MCX} ${MCY + MR} A${MR} ${MR} 0 1 1 ${MCX} ${MCY - MR} Z`;
  if (mk <= 0.005) return '';
  const rx = (MR * Math.abs(1 - 2 * mk)).toFixed(2);
  return `M${MCX} ${MCY - MR} A${MR} ${MR} 0 0 1 ${MCX} ${MCY + MR} A${rx} ${MR} 0 0 ${mk < 0.5 ? 0 : 1} ${MCX} ${MCY - MR} Z`;
}

const phase = (m: TFaceModel): string =>
  m.st === 'up' ? 'New moon' : m.st === 'idle' ? 'Full moon' : `${Math.round(m.ringFrac * 100)}% lit`;

// The moon wanes from full to new as the session runs down: a night sky in dark, a pale daytime sky in light.
export default function Moon({ m }: IDrawProps) {
  const gid = `af-moon-${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const lit = moonPath(m.ringFrac);
  const a = m.night ? ART.night : ART.light;
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
          background: a.sky,
          boxShadow: a.shadow,
        }}
      >
        {m.night && <Stars pts={STARS} colors={STAR_COLOURS} />}
        <div
          className="afx-breath"
          style={{
            position: 'absolute',
            left: 56,
            top: 5,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: GLOW,
          }}
        />
      </div>
      <Svg>
        <defs>
          <radialGradient id={gid} cx="42%" cy="36%" r="72%">
            <stop offset="0" style={{ stopColor: a.lit[0] }} />
            <stop offset=".62" style={{ stopColor: a.lit[1] }} />
            <stop offset="1" style={{ stopColor: a.lit[2] }} />
          </radialGradient>
        </defs>
        <circle cx="180" cy="155" r="140" fill="none" strokeWidth="3" style={{ stroke: a.track }} />
        <circle
          className="af-tr"
          cx="180"
          cy="155"
          r="140"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90 180 155)"
          opacity={m.st === 'idle' ? 0.35 : m.ringFrac === 0 ? 0 : 1}
          style={{ stroke: m.mc1, strokeDasharray: dash(C140, m.ringFrac) }}
        />
        <circle cx="180" cy="104" r="56" strokeWidth="1" style={{ fill: a.dark, stroke: a.edge }} />
        {lit && <path className="af-tr" d={lit} fill={`url(#${gid})`} />}
        <circle cx="167" cy="88" r="8" style={{ fill: CRATER(0.08) }} />
        <circle cx="195" cy="116" r="11" style={{ fill: CRATER(0.07) }} />
        <circle cx="184" cy="82" r="5" style={{ fill: CRATER(0.08) }} />
        <circle cx="162" cy="121" r="6" style={{ fill: CRATER(0.07) }} />
      </Svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 170,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: m.long ? 34 : 44,
            fontWeight: 300,
            letterSpacing: '-0.04em',
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
          style={{ marginTop: 2, fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.08em', color: tagColour(m) }}
        >
          {phase(m)}
        </span>
      </div>
    </>
  );
}

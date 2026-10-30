import { useId } from 'react';
import { BLACK, NAVY, SNOW, WHITE } from '../art';
import '../face-art.css';
import { dash } from '../geometry';
import { type IDrawProps, L, lmin, MONO, Stars, type TStar, Svg } from '../kit';
import type { TFaceModel, TFaceState } from '../model';

const SKY =
  'radial-gradient(circle at 82% 104%, rgba(193,177,254,.34), transparent 52%), radial-gradient(circle at 8% 92%, rgba(124,187,255,.24), transparent 48%), radial-gradient(circle at 50% 28%, #1B2452 0%, #0D1332 56%, #070A1C 100%)';
const SHADOW = {
  light: `0 18px 36px ${NAVY(0.18)}, 0 0 0 1px #DCD7CC`,
  night: `0 22px 44px ${BLACK(0.5)}, 0 0 0 1px #26314A`,
};
const GLOW = 'radial-gradient(circle, rgba(255,246,220,.30), rgba(255,246,220,0) 66%)';
const MOON_LIGHT = ['#FFFDF6', '#ECE5D0', '#C8BFA6'] as const;
const MOON_INK = '#B9C2D6';
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

// On a light page the sky stays night, so its phase tag takes the dark theme's status colours (its root carries .dark).
const NIGHT_TAG: Readonly<Partial<Record<TFaceState, string>>> = {
  idle: 'var(--muted-foreground-strong)',
  paused: 'var(--warning)',
  blocked: 'var(--destructive)',
  unsupported: 'var(--info)',
  up: 'var(--ended)',
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
  m.st === 'up'
    ? 'New moon · ended'
    : m.st === 'idle'
      ? 'Full moon · ready'
      : `${Math.round(m.ringFrac * 100)}% lit · ${m.awake || m.st === 'starting' ? 'waning' : 'on hold'}`;

// The moon wanes from full to new as the session runs down, under an aurora sky.
export default function Moon({ m }: IDrawProps) {
  const gid = `af-moon-${useId().replace(/[^a-zA-Z0-9_-]/gu, '')}`;
  const lit = moonPath(m.ringFrac);
  const tag = m.night ? m.mc2 : m.multi ? STAR_SKY : (NIGHT_TAG[m.st] ?? STAR_SKY);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 34,
          top: 9,
          width: 292,
          height: 292,
          borderRadius: '50%',
          overflow: 'hidden',
          background: SKY,
          boxShadow: m.night ? SHADOW.night : SHADOW.light,
        }}
      >
        <Stars pts={STARS} colors={STAR_COLOURS} />
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
            <stop offset="0" style={{ stopColor: MOON_LIGHT[0] }} />
            <stop offset=".62" style={{ stopColor: MOON_LIGHT[1] }} />
            <stop offset="1" style={{ stopColor: MOON_LIGHT[2] }} />
          </radialGradient>
        </defs>
        <circle cx="180" cy="155" r="140" fill="none" strokeWidth="3" style={{ stroke: WHITE(0.08) }} />
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
        <circle cx="180" cy="104" r="56" strokeWidth="1" style={{ fill: WHITE(0.06), stroke: WHITE(0.14) }} />
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
          top: 176,
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
            color: SNOW,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {m.digits}
        </span>
        <span className={L} style={{ fontSize: lmin(13), color: MOON_INK }}>
          {m.endLine}
        </span>
        <span
          className={m.night ? L : `${L} dark`}
          style={{ marginTop: 2, fontFamily: MONO, fontSize: lmin(12), letterSpacing: '.08em', color: tag }}
        >
          {phase(m)}
        </span>
      </div>
    </>
  );
}

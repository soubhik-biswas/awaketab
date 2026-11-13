import { BLACK, NAVY, SNOW, type TThemed, WHITE } from '../art';
import { alpha, arc, f1, P, ticks } from '../geometry';
import { D, DialLabel, hand, type IDrawProps, L, lmin, MONO, Svg, windowAt } from '../kit';

// The ceramic insert stays dark in every theme, like the real object, glazed by light from the top left.
const INSERT: TThemed<string> = {
  light: `radial-gradient(120% 120% at 28% 16%, ${WHITE(0.13)}, transparent 46%), linear-gradient(180deg, #1C1F29, #121A2E)`,
  dark: `radial-gradient(120% 120% at 28% 16%, ${WHITE(0.09)}, transparent 46%), linear-gradient(180deg, #1A2238, #0A0B10)`,
  oled: '#0B0F1A',
};
// Brushed steel catches the light at the top left and falls away at the bottom right.
const STEEL =
  'conic-gradient(from 0deg, #A9B0BD, #7D8595 60deg, #4E5566 135deg, #8A92A1 200deg, #BCC3CE 270deg, #E6E9EF 315deg, #A9B0BD)';
const STEEL_RING: TThemed<string> = {
  light: STEEL,
  dark: STEEL,
  oled: 'conic-gradient(from 0deg, #3A404C, #262B35 135deg, #3A404C 270deg, #5A616E 315deg, #3A404C)',
};
const GLAZE = `linear-gradient(135deg, ${WHITE(0.12)} 0%, ${WHITE(0)} 38%, ${BLACK(0)} 62%, ${BLACK(0.24)} 100%)`;
// A sunburst dial throws two soft wedges of light; OLED keeps the dial black.
const DIAL: TThemed<{ background: string; boxShadow: string }> = {
  light: {
    background: `conic-gradient(from 0deg, transparent 0 10deg, ${NAVY(0.035)} 45deg, transparent 80deg 190deg, ${NAVY(0.03)} 225deg, transparent 260deg)`,
    boxShadow: `inset 2px 3px 7px ${NAVY(0.16)}, inset -1px -1px 0 #FFFFFF`,
  },
  dark: {
    background: `conic-gradient(from 0deg, ${WHITE(0.02)}, transparent 45deg 100deg, ${WHITE(0.035)} 135deg, transparent 170deg 280deg, ${WHITE(0.045)} 315deg, ${WHITE(0.02)})`,
    boxShadow: `inset 2px 3px 7px ${BLACK(0.55)}, inset -1px -1px 0 ${WHITE(0.05)}`,
  },
  oled: { background: 'transparent', boxShadow: `inset 2px 3px 7px ${BLACK(0.8)}` },
};
const LUME: TThemed<string> = { light: '#F5F2E6', dark: '#E4F3E8', oled: '#CDEFD8' };
const SURROUND: TThemed<string> = { light: '#1A1F2E', dark: '#BAC1CD', oled: '#8E96A4' };
// Faceted hands: the left facet takes the light, the right one falls into shade.
const FACET: TThemed<readonly [string, string]> = {
  light: ['#4A5163', '#0B1020'],
  dark: ['#F4F6FA', '#A3ABB9'],
  oled: ['#D9DEE6', '#8A92A0'],
};
const CROWN: TThemed<readonly [string, string]> = {
  light: ['#E6E9EF', '#8A92A1'],
  dark: ['#E6E9EF', '#8A92A1'],
  oled: ['#5A616E', '#2E333D'],
};
const PILL: TThemed<{ background: string; rim: string; drop: string }> = {
  light: { background: 'linear-gradient(180deg, #FFFFFF, #F1F2F7)', rim: '#C9CDD8', drop: NAVY(0.14) },
  dark: { background: 'linear-gradient(180deg, #151821, #0B0D12)', rim: '#3A3F4C', drop: BLACK(0.4) },
  oled: { background: '#000000', rim: '#262B35', drop: BLACK(0.4) },
};
const BEZEL_INK = SNOW;
// Bezel marks that sit on the bright night arc turn dark; by day the arc is deep enough for the light marks.
const ON_ARC = '#0A0B10';
const ringMask = (inner: number): string => `radial-gradient(circle, transparent 0 ${inner}px, #000 ${inner + 0.5}px)`;
const INSERT_MASK = ringMask(117.5);
const EDGE_MASK = ringMask(141);

// A dive bezel counts every minute of the first quarter hour, then every five.
const bezelMinutes = (keep: (deg: number) => boolean): string =>
  ticks(134, 139.5, 60, (i) => i > 0 && i < 15 && i % 5 !== 0 && keep(i * 6));
const bezelFives = (keep: (deg: number) => boolean): string => ticks(125, 138, 60, (i) => i % 10 === 5 && keep(i * 6));
const KNURL = ticks(142.4, 146, 120);
const MIN_TRACK = ticks(109, 113, 60, (i) => i % 5 !== 0);
const FIVE_TRACK = ticks(107.5, 113, 60, (i) => i % 5 === 0);
const NUMS = [10, 20, 30, 40, 50];

const dot = (deg: number): string => {
  const [x, y] = P(99.5, deg);
  return `M${f1(x - 5.5)} ${f1(y)}a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0 -11 0Z`;
};
const bar = (deg: number): string => {
  const q = ((deg - 90) * Math.PI) / 180;
  const vx = -Math.sin(q) * 4;
  const vy = Math.cos(q) * 4;
  const [ax, ay] = P(87, deg);
  const [bx, by] = P(105, deg);
  return `M${f1(ax + vx)} ${f1(ay + vy)}L${f1(bx + vx)} ${f1(by + vy)}L${f1(bx - vx)} ${f1(by - vy)}L${f1(ax - vx)} ${f1(ay - vy)}Z`;
};
// Lume plots: a triangle at 12, batons at 3, 6 and 9, round plots for the other hours.
const PLOTS =
  'M169.5 50H190.5L180 70Z' +
  Array.from({ length: 11 }, (_, i) => (i + 1) * 30)
    .map((deg) => (deg % 90 === 0 ? bar(deg) : dot(deg)))
    .join('');

const SWORD_H = 'polygon(50% 0, 100% 13%, 100% 100%, 0 100%, 0 13%)';
const SWORD_M = 'polygon(50% 0, 100% 7%, 100% 100%, 0 100%, 0 7%)';
const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}]*$/u;

// A dive watch: the bezel arc is the minutes left, the lumed hands keep real time.
export default function Dive({ m }: IDrawProps) {
  const { t, accent, theme } = m;
  const lume = LUME[theme];
  const [hi, lo] = FACET[theme];
  const [crownHi, crownLo] = CROWN[theme];
  const pill = PILL[theme];
  const mins = Math.min(60, (m.st === 'idle' ? m.total : m.r) / 60);
  const onArc = (deg: number): boolean => m.night && deg < mins * 6;
  const arcInk = m.night ? `color-mix(in srgb, ${accent} 84%, #0A0B10)` : accent;
  const facet = `linear-gradient(90deg, ${hi} 0 50%, ${lo} 50%)`;
  const word = m.indef && m.awake ? 'awake' : m.topWord;
  const shout = LATIN.test(word) ? word.toUpperCase() : word;
  const readout = m.st === 'up' ? shout.replace("'", '’') : `${m.digits} ${shout}`;
  // Longer readouts step down so the pill stays clear of the 4 and 8 o'clock plots.
  const readoutPx = readout.length > 15 ? 12 : readout.length > 13 ? 13 : 15;
  return (
    <>
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 62,
          top: 37,
          width: 236,
          height: 236,
          borderRadius: '50%',
          ...DIAL[theme],
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 34,
          top: 9,
          width: 292,
          height: 292,
          borderRadius: '50%',
          background: INSERT[theme],
          WebkitMaskImage: INSERT_MASK,
          maskImage: INSERT_MASK,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 34,
          top: 9,
          width: 292,
          height: 292,
          borderRadius: '50%',
          background: STEEL_RING[theme],
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
        }}
      />
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 326,
          top: 147,
          width: 6,
          height: 16,
          background: `linear-gradient(180deg, ${crownHi}, ${crownLo})`,
        }}
      />
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 330,
          top: 140,
          width: 11,
          height: 30,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${WHITE(0.22)}, transparent 45%, ${BLACK(0.35)}), repeating-linear-gradient(180deg, ${crownHi} 0 1.6px, ${crownLo} 1.6px 3.2px)`,
          boxShadow: `0 2px 4px ${BLACK(0.35)}`,
        }}
      />
      <Svg>
        <path d={arc(129.5, 0, mins * 6)} fill="none" strokeWidth="22" style={{ stroke: arcInk }} />
        <circle cx="180" cy="155" r="141.2" fill="none" strokeWidth=".8" style={{ stroke: BLACK(0.55) }} />
        <circle
          cx="180"
          cy="155"
          r="118"
          fill="none"
          strokeWidth=".8"
          style={{ stroke: m.night ? BLACK(0.6) : NAVY(0.3) }}
        />
        <path className={D} d={KNURL} strokeWidth="1.2" style={{ stroke: BLACK(0.4) }} />
        <path
          className={D}
          d={bezelMinutes((deg) => !onArc(deg))}
          strokeWidth="1.2"
          opacity=".8"
          style={{ stroke: BEZEL_INK }}
        />
        <path className={D} d={bezelMinutes(onArc)} strokeWidth="1.2" opacity=".7" style={{ stroke: ON_ARC }} />
        <path d={bezelFives((deg) => !onArc(deg))} strokeWidth="3" opacity=".9" style={{ stroke: BEZEL_INK }} />
        <path d={bezelFives(onArc)} strokeWidth="3" opacity=".75" style={{ stroke: ON_ARC }} />
        <path
          d="M169 16H191L180 33Z"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ fill: BEZEL_INK, stroke: ON_ARC }}
        />
        {m.night && <circle cx="180" cy="22" r="5" opacity=".22" style={{ fill: lume }} />}
        <circle cx="180" cy="22" r="3.2" strokeWidth=".8" style={{ fill: lume, stroke: ON_ARC }} />
        <path className={D} d={MIN_TRACK} strokeWidth="1" opacity=".6" style={{ stroke: t.ink2 }} />
        <path d={FIVE_TRACK} strokeWidth="1.8" style={{ stroke: t.ink }} />
        <circle
          className={D}
          cx="180"
          cy="155"
          r="113.6"
          fill="none"
          strokeWidth=".6"
          opacity=".5"
          style={{ stroke: t.ink2 }}
        />
        {m.night && (
          <path
            d={PLOTS}
            strokeWidth="5"
            strokeLinejoin="round"
            opacity={theme === 'oled' ? 0.24 : 0.14}
            style={{ fill: lume, stroke: lume }}
          />
        )}
        <path d={PLOTS} strokeWidth="1.4" strokeLinejoin="round" style={{ fill: lume, stroke: SURROUND[theme] }} />
      </Svg>
      <div
        className={D}
        style={{
          position: 'absolute',
          left: 39,
          top: 14,
          width: 282,
          height: 282,
          borderRadius: '50%',
          background: GLAZE,
          WebkitMaskImage: INSERT_MASK,
          maskImage: INSERT_MASK,
        }}
      />
      {NUMS.map((n) => (
        <DialLabel
          key={n}
          m={m}
          text={String(n)}
          rr={130}
          deg={n * 6}
          fs={13}
          color={onArc(n * 6) ? ON_ARC : BEZEL_INK}
          extra={{ fontFamily: MONO, fontWeight: 600, letterSpacing: '-0.02em' }}
        />
      ))}
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 105,
          top: 84,
          width: 150,
          textAlign: 'center',
          textWrap: 'balance',
          lineHeight: 1.15,
          fontSize: lmin(12),
          fontWeight: 500,
          letterSpacing: '.01em',
          color: t.ink2,
        }}
      >
        {m.endLine}
      </span>
      <div className="afx-h" style={hand(64, 14, 12, m.hourDeg, m.hourDeg0, facet, { clipPath: SWORD_H })}>
        <span
          style={{
            position: 'absolute',
            left: 3,
            top: 8,
            width: 6,
            height: 40,
            background: lume,
            clipPath: 'polygon(50% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)',
          }}
        />
      </div>
      <div className="afx-m" style={hand(104, 16, 9, m.minDeg, m.minDeg0, facet, { clipPath: SWORD_M })}>
        <span
          style={{
            position: 'absolute',
            left: 2,
            top: 7,
            width: 5,
            height: 80,
            background: lume,
            clipPath: 'polygon(50% 0, 100% 8%, 100% 100%, 0 100%, 0 8%)',
          }}
        />
      </div>
      <div className="afx-s" style={hand(112, 28, 2, m.secDeg, m.secDeg0, accent)}>
        <span
          style={{
            position: 'absolute',
            left: -5,
            top: 22,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            background: lume,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: -2,
            top: 124,
            width: 6,
            height: 14,
            borderRadius: 3,
            background: accent,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 173,
          top: 148,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: `radial-gradient(circle at 42% 38%, ${hi} 0 1px, transparent 2px), radial-gradient(circle, ${lo} 0 3px, ${accent} 3.5px)`,
          boxShadow: `0 1px 2px ${BLACK(0.45)}`,
        }}
      />
      {m.night && (
        <div
          className={D}
          style={{
            position: 'absolute',
            left: 62,
            top: 37,
            width: 236,
            height: 236,
            borderRadius: '50%',
            background: `radial-gradient(70% 50% at 30% 18%, ${WHITE(theme === 'oled' ? 0.04 : 0.07)}, transparent 70%)`,
          }}
        />
      )}
      <span
        className={L}
        style={{
          ...windowAt(180, 196, 124, 32),
          padding: '0 7px',
          borderRadius: 11,
          background: pill.background,
          boxShadow: `inset 0 0 0 1px ${alpha(accent, 0x40)}, inset 0 1px 0 ${m.night ? WHITE(0.06) : '#FFFFFF'}, 0 0 0 1.5px ${pill.rim}, 0 6px 14px ${pill.drop}`,
          fontFamily: MONO,
          fontSize: lmin(readoutPx),
          fontWeight: 500,
          letterSpacing: '.04em',
          color: accent,
          fontVariantNumeric: 'tabular-nums',
          zIndex: 3,
        }}
      >
        {readout}
      </span>
    </>
  );
}

import { BLACK, CARD_SHADOW, NAVY } from '../art';
import { alpha, f1 } from '../geometry';
import { type IDrawProps, L, mono, PLATE } from '../kit';
import type { TFaceModel } from '../model';

// The bezel stays dark in every theme, like the real object.
const BEZEL = {
  light: 'linear-gradient(180deg, #2A3550, #1C1F29)',
  night: 'linear-gradient(180deg, #1C2438, #0C1120)',
};
const NB = 20;

// One seven-segment cell: 46 × 80 with 9-wide bars, drawn once and scaled to the reading's length.
const W = 46;
const H = 80;
const T = 9;
const GAP = 10;
const COLON = 12;
const SLANT = Math.tan((7 * Math.PI) / 180);
// The widest row the screen takes, leaving its 18 px margins and the slant clear.
const ROW_MAX = 252;
const ROW_MID = 92;

const bar = (x0: number, x1: number, y: number): string =>
  `M${f1(x0)} ${f1(y)}L${f1(x0 + T / 2)} ${f1(y - T / 2)}H${f1(x1 - T / 2)}L${f1(x1)} ${f1(y)}L${f1(x1 - T / 2)} ${f1(y + T / 2)}H${f1(x0 + T / 2)}Z`;
const post = (x: number, y0: number, y1: number): string =>
  `M${f1(x)} ${f1(y0)}L${f1(x + T / 2)} ${f1(y0 + T / 2)}V${f1(y1 - T / 2)}L${f1(x)} ${f1(y1)}L${f1(x - T / 2)} ${f1(y1 - T / 2)}V${f1(y0 + T / 2)}Z`;
const NICK = 1.2;
const SEG = {
  a: bar(T / 2 + NICK, W - T / 2 - NICK, T / 2),
  b: post(W - T / 2, T / 2 + NICK, H / 2 - NICK),
  c: post(W - T / 2, H / 2 + NICK, H - T / 2 - NICK),
  d: bar(T / 2 + NICK, W - T / 2 - NICK, H - T / 2),
  e: post(T / 2, H / 2 + NICK, H - T / 2 - NICK),
  f: post(T / 2, T / 2 + NICK, H / 2 - NICK),
  g: bar(T / 2 + NICK, W - T / 2 - NICK, H / 2),
} as const;
type TSeg = keyof typeof SEG;
const LIT: Readonly<Record<string, string>> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abfgcd',
  '-': 'g',
};
const cell = (lit: string): string =>
  lit
    .split('')
    .map((s) => SEG[s as TSeg])
    .join('');
const ALL = cell('abcdefg');
const DOTS = [H * 0.32, H * 0.68].map((y) => `M${f1(COLON / 2 - T / 2)} ${f1(y - T / 2)}h${T}v${T}h${-T}Z`).join('');

// The corner tag says AWAKE only while the screen is held and PAUSE only when the person paused; every other state
// reads in the face's own top word (not awake, starting).
const tagWord = (m: TFaceModel): string => {
  if (m.awake) return 'AWAKE';
  if (m.st === 'idle') return 'READY';
  if (m.st === 'up') return 'END';
  if (m.st === 'paused' && !m.needs) return 'PAUSE';
  return m.topWord;
};

// Slanted segments over a faint 88:88 ghost, like a bedside clock.
export default function Lcd({ m }: IDrawProps) {
  const { accent } = m;
  // A session still running keeps its last bar lit until the end.
  const onB = m.frac > 0 && m.st !== 'up' ? Math.max(1, Math.round(m.frac * NB)) : 0;
  // No end has no reading to count down from before it starts: the screen shows dashes.
  const chars = (/^[\d:]+$/u.test(m.digits) ? m.digits : '--:--').split('');
  const xs: number[] = [];
  let row = 0;
  for (const ch of chars) {
    xs.push(row);
    row += (ch === ':' ? COLON : W) + GAP;
  }
  row -= GAP;
  const k = Math.min(1, ROW_MAX / (row + H * SLANT));
  const x0 = 150 - (k * row) / 2 + (k * H * SLANT) / 2;
  const y0 = ROW_MID - (k * H) / 2;
  const place = `translate(${f1(x0)} ${f1(y0)}) scale(${k.toFixed(3)}) skewX(-7)`;
  const ghost = alpha(accent, m.night ? 0x14 : 0x17);
  // A lit segment glows on the dark screen; on the pale one it is ink that casts a soft shadow on the backing.
  const lit = m.night ? `drop-shadow(0 0 5px ${alpha(accent, 0x66)})` : `drop-shadow(1.5px 2px 0.6px ${NAVY(0.16)})`;
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 18,
        top: 38,
        width: 324,
        height: 220,
        borderRadius: 26,
        background: m.night ? BEZEL.night : BEZEL.light,
        boxShadow: CARD_SHADOW[m.theme],
        padding: 12,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 196,
          borderRadius: 16,
          background: `radial-gradient(ellipse at 50% 40%, ${alpha(accent, 0x14)}, transparent 70%), ${m.t.lcdS}`,
          boxShadow: `inset 0 2px 12px ${BLACK(m.night ? 0.35 : 0.2)}`,
          overflow: 'hidden',
        }}
      >
        <span className={L} style={{ position: 'absolute', left: 18, top: 14, ...mono(12, '.16em', accent) }}>
          {m.h > 0 ? 'H · MIN · SEC' : 'MIN · SEC'}
        </span>
        <span
          className={L}
          style={{
            position: 'absolute',
            right: 18,
            top: 12,
            padding: '1px 6px',
            border: `1px solid ${accent}`,
            borderRadius: 4,
            ...mono(12, '.14em', accent),
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {tagWord(m)}
        </span>
        <svg
          style={{ position: 'absolute', left: 0, top: 0 }}
          width={300}
          height={196}
          viewBox="0 0 300 196"
          aria-hidden="true"
        >
          <g transform={place}>
            <g style={{ fill: ghost }}>
              {chars.map((ch, i) => (
                <path key={i} transform={`translate(${xs[i] ?? 0} 0)`} d={ch === ':' ? DOTS : ALL} />
              ))}
            </g>
            <g style={{ fill: accent, filter: lit }}>
              {chars.map((ch, i) => (
                <path
                  key={i}
                  className={ch === ':' ? 'afx-blink' : undefined}
                  transform={`translate(${xs[i] ?? 0} 0)`}
                  d={ch === ':' ? DOTS : cell(LIT[ch] ?? '')}
                />
              ))}
            </g>
          </g>
        </svg>
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 40, display: 'flex', gap: 3 }}>
          {Array.from({ length: NB }, (_, i) => (
            <span
              key={i}
              style={{
                display: 'block',
                flex: 1,
                height: 8,
                borderRadius: 1,
                background: i < onB ? accent : alpha(accent, 0x22),
              }}
            />
          ))}
        </div>
        <span className={L} style={{ position: 'absolute', left: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
          {m.indef ? 'NO END' : `END ${m.endShort}`}
        </span>
        {!m.indef && (
          <span className={L} style={{ position: 'absolute', right: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
            {m.pctLabel}
          </span>
        )}
      </div>
    </div>
  );
}

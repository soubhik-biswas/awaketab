import { BLACK, NAVY, WHITE } from '../art';
import { alpha, f1 } from '../geometry';
import { D, DISPLAY, type IDrawProps, L, mono, PLATE } from '../kit';
import type { TFaceModel, TFaceTheme } from '../model';

// The moulded housing stays dark in every theme, like the real object, lit from the top left.
const BEZEL: Readonly<Record<TFaceTheme, string>> = {
  light: 'linear-gradient(180deg, #2A3550, #1C1F29)',
  dark: 'linear-gradient(180deg, #1C2438, #0C1120)',
  oled: 'linear-gradient(180deg, #121826, #05070C)',
};
const DROP: Readonly<Record<TFaceTheme, string>> = {
  light: `0 22px 44px ${NAVY(0.2)}, 0 3px 6px ${NAVY(0.12)}, 0 0 0 1px #161B28`,
  dark: `0 28px 60px ${BLACK(0.55)}, 0 0 0 1px #262A35`,
  oled: '0 0 0 1px #1A2236',
};
const MOULD = `inset 0 1px 0 ${WHITE(0.14)}, inset 1px 0 0 ${WHITE(0.05)}, inset 0 -2px 0 ${BLACK(0.4)}, inset -1px 0 0 ${BLACK(0.25)}`;
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

// Slanted segments over a faint 88:88 ghost behind glass, in a bedside clock's housing.
export default function Lcd({ m }: IDrawProps) {
  const { accent, night } = m;
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
  const ghost = alpha(accent, night ? 0x14 : 0x17);
  // Backlit at night, a lit segment glows tight to itself; on the reflective day screen it is ink sitting on the front
  // glass, casting a soft shadow down and right onto the backing.
  const lit = night ? `drop-shadow(0 0 3px ${alpha(accent, 0x73)})` : `drop-shadow(1.5px 2px 0.8px ${NAVY(0.18)})`;
  const cellLit = night ? `0 0 3px ${alpha(accent, 0x59)}` : `1px 1.5px 0.5px ${NAVY(0.16)}`;
  const screen = night
    ? `radial-gradient(90% 75% at 50% 42%, ${alpha(accent, 0x1a)}, transparent 72%), radial-gradient(130% 110% at 50% 45%, transparent 55%, ${BLACK(0.4)}), ${m.t.lcdS}`
    : `linear-gradient(180deg, ${NAVY(0.07)}, transparent 24%), radial-gradient(130% 110% at 50% 45%, transparent 60%, ${NAVY(0.06)}), ${m.t.lcdS}`;
  return (
    <div
      className={PLATE}
      style={{
        position: 'absolute',
        left: 18,
        top: 30,
        width: 324,
        height: 248,
        borderRadius: 26,
        background: `radial-gradient(120% 70% at 18% 0%, ${WHITE(0.09)}, transparent 55%), ${BEZEL[m.theme]}`,
        boxShadow: `${DROP[m.theme]}, ${MOULD}`,
        padding: '12px 12px 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 196,
          borderRadius: 14,
          background: screen,
          boxShadow: `inset 0 2px 10px ${night ? BLACK(0.55) : NAVY(0.3)}, inset 0 0 0 1px ${BLACK(0.5)}, 0 1px 0 ${WHITE(0.08)}`,
          overflow: 'hidden',
        }}
      >
        <span
          className={D}
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: 10,
            border: `1px solid ${alpha(accent, night ? 0x14 : 0x1c)}`,
          }}
        />
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
                background: i < onB ? accent : alpha(accent, night ? 0x1c : 0x1f),
                boxShadow: i < onB ? cellLit : undefined,
              }}
            />
          ))}
        </div>
        <span
          className={D}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 14,
            background: `linear-gradient(160deg, ${WHITE(night ? 0.07 : 0.3)} 0%, ${WHITE(night ? 0.02 : 0.08)} 30%, transparent 48%)`,
            boxShadow: `inset 0 1px 0 ${WHITE(night ? 0.06 : 0.4)}`,
          }}
        />
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
        <span className={L} style={{ position: 'absolute', left: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
          {m.indef ? 'NO END' : `END ${m.endShort}`}
        </span>
        {!m.indef && (
          <span className={L} style={{ position: 'absolute', right: 18, bottom: 14, ...mono(13, '.1em', accent) }}>
            {m.pctLabel}
          </span>
        )}
      </div>
      <span
        className={`${L} ${D}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 222,
          width: 324,
          textAlign: 'center',
          fontFamily: DISPLAY,
          fontStretch: '125%',
          fontSize: 9,
          fontWeight: 600,
          lineHeight: '12px',
          letterSpacing: '.34em',
          textIndent: '.34em',
          color: WHITE(0.5),
        }}
      >
        AWAKETAB
      </span>
    </div>
  );
}

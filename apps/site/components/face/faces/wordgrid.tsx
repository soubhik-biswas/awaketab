import { BLACK, CARD_SHADOW, NAVY, WHITE } from '../art';
import { alpha } from '../geometry';
import { D, type IDrawProps, Kicker, L, lmin, MONO, PLATE } from '../kit';
import type { TFaceModel } from '../model';

const GRID = [
  'ABOUTKUNDERZ',
  'TWENTYTHIRTY',
  'FORTYMFIFTYP',
  'FIFTEENFIVEW',
  'THREEFOURTEN',
  'ONETWOHOURSV',
  'MINUTESZLEFT',
];
// Each word's row, first column and length in the grid.
const AT: Readonly<Record<string, readonly [number, number, number]>> = {
  ABOUT: [0, 0, 5],
  UNDER: [0, 6, 5],
  TWENTY: [1, 0, 6],
  THIRTY: [1, 6, 6],
  FORTY: [2, 0, 5],
  FIFTY: [2, 6, 5],
  FIFTEEN: [3, 0, 7],
  FIVE: [3, 7, 4],
  THREE: [4, 0, 5],
  FOUR: [4, 5, 4],
  TEN: [4, 9, 3],
  ONE: [5, 0, 3],
  TWO: [5, 3, 3],
  HOUR: [5, 6, 4],
  HOURS: [5, 6, 5],
  MINUTE: [6, 0, 6],
  MINUTES: [6, 0, 7],
  LEFT: [6, 8, 4],
};
const NUMW: Readonly<Record<number, string>> = {
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
  10: 'TEN',
  15: 'FIFTEEN',
  20: 'TWENTY',
  30: 'THIRTY',
  40: 'FORTY',
  50: 'FIFTY',
};
// A lit-through letter plate: graphite at night, frosted porcelain by day, flat black in OLED.
const GROUND = {
  light:
    'radial-gradient(120% 80% at 18% 0%, #FFFFFF, transparent 58%), linear-gradient(168deg, #FBFBFD 0%, #F1F1F7 62%, #E9E9F2 100%)',
  dark: `radial-gradient(120% 75% at 18% 0%, ${WHITE(0.07)}, transparent 55%), linear-gradient(168deg, #151B2E 0%, #0D1019 58%, #08090D 100%)`,
  oled: '#000000',
};
const SHADE = {
  light: `${CARD_SHADOW.light}, inset 0 -18px 36px ${NAVY(0.045)}`,
  dark: `${CARD_SHADOW.dark}, inset 0 -24px 48px ${BLACK(0.4)}`,
  oled: CARD_SHADOW.oled,
};
// Unlit letters read as etched into the plate: a light lip below them by day, a dark one at night.
const OFF = {
  light: { color: NAVY(0.15), textShadow: `0 1px 0 ${WHITE(0.9)}` },
  dark: { color: 'rgba(238,242,250,.13)', textShadow: `0 -1px 0 ${BLACK(0.55)}` },
  oled: { color: 'rgba(238,242,250,.12)', textShadow: undefined },
};
const COLS = 12;
const CELL_W = 24;
const CELL_H = 26;
// The 12 × 7 grid on the 332 × 282 plate, its header above and the end line below, all on one 288 px measure.
const X0 = 36;
const GRID_TOP = 58;

// The words the grid lights for the time left: "about forty minutes left", "under one minute left". With no end it
// lights the time awake without "left", and nothing before the start.
export function gridWords(m: TFaceModel): string[] {
  const mm = m.shownSec / 60;
  const wl: string[] = [];
  if (m.st === 'up' || (m.indef && m.st === 'idle')) return wl;
  const hr = Math.max(1, Math.round(mm / 60));
  // The grid spells one to five and ten: six to nine hours read "under ten", past ten just "hours".
  if (mm >= 57.5 && hr > 10) wl.push('HOURS');
  else if (mm >= 57.5 && hr > 5 && mm < 570) wl.push('UNDER', 'TEN', 'HOURS');
  else if (mm >= 57.5) {
    const n = hr > 5 ? 10 : hr;
    if (Math.abs(mm - n * 60) > 0.5) wl.push('ABOUT');
    wl.push(NUMW[n] ?? 'TEN', n > 1 ? 'HOURS' : 'HOUR');
  } else if (mm < 1) wl.push('UNDER', 'ONE', 'MINUTE');
  else if (mm < 4.5) {
    const n = Math.round(mm);
    if (Math.abs(mm - n) > 0.01) wl.push('ABOUT');
    wl.push(NUMW[n] ?? '', n > 1 ? 'MINUTES' : 'MINUTE');
  } else {
    const r5 = Math.round(mm / 5) * 5;
    if (Math.abs(mm - r5) > 0.01) wl.push('ABOUT');
    const w = NUMW[r5];
    if (w) wl.push(w);
    else wl.push(NUMW[Math.floor(r5 / 10) * 10] ?? '', 'FIVE');
    wl.push('MINUTES');
  }
  if (!m.indef) wl.push('LEFT');
  return wl;
}

// A letter grid that lights the words for the time left.
export default function WordGrid({ m }: IDrawProps) {
  const { t } = m;
  const lit = new Map<number, string>();
  for (const w of gridWords(m)) {
    const at = AT[w];
    if (!at) continue;
    const col =
      w === 'ABOUT' || w === 'UNDER'
        ? m.mc2
        : w === 'LEFT'
          ? m.mc3
          : w.startsWith('HOUR') || w.startsWith('MINUTE')
            ? t.ink
            : m.mc1;
    for (let j = 0; j < at[2]; j++) lit.set(at[0] * COLS + at[1] + j, col);
  }
  const off = OFF[m.theme];
  const rule = m.night ? WHITE(0.07) : NAVY(0.08);
  const row = { position: 'absolute', left: X0, width: COLS * CELL_W } as const;
  return (
    <>
      <div
        className={PLATE}
        style={{
          position: 'absolute',
          left: 14,
          top: 14,
          width: 332,
          height: 282,
          borderRadius: 36,
          background: GROUND[m.theme],
          boxShadow: SHADE[m.theme],
        }}
      >
        <div
          className={D}
          style={{
            position: 'absolute',
            inset: 7,
            borderRadius: 29,
            boxShadow: `inset 0 0 0 1px ${m.night ? WHITE(0.045) : NAVY(0.05)}`,
          }}
        />
      </div>
      <div
        style={{
          ...row,
          top: 26,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Kicker m={m} color={m.accent} style={{ lineHeight: 1, whiteSpace: 'nowrap' }} />
        <span
          className={L}
          style={{
            fontFamily: MONO,
            fontSize: lmin(14),
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            color: t.ink,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {m.digits}
        </span>
      </div>
      <span className={D} style={{ ...row, top: 51, height: 1, background: rule }} />
      <div
        style={{
          ...row,
          top: GRID_TOP,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL_W}px)`,
          gridAutoRows: CELL_H,
        }}
      >
        {GRID.flatMap((letters, ri) =>
          letters.split('').map((ch, ci) => {
            const col = lit.get(ri * COLS + ci);
            return (
              <span
                key={ri * COLS + ci}
                className={col ? undefined : D}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: lmin(16),
                  fontWeight: col ? 650 : 500,
                  lineHeight: 1,
                  ...(col ? { color: col, textShadow: m.night ? `0 0 9px ${alpha(col, 0x66)}` : undefined } : off),
                }}
              >
                {ch}
              </span>
            );
          }),
        )}
      </div>
      <span className={D} style={{ ...row, top: GRID_TOP + 7 * CELL_H + 6, height: 1, background: rule }} />
      <span
        className={L}
        style={{
          ...row,
          top: GRID_TOP + 7 * CELL_H + 10,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          textWrap: 'balance',
          lineHeight: 1.2,
          fontSize: lmin(13),
          color: t.ink2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {m.endLine}
      </span>
    </>
  );
}

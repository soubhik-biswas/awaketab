import { CARD_SHADOW } from '../art';
import { alpha } from '../geometry';
import { type IDrawProps, L, lmin, MONO } from '../kit';
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
const GROUND = {
  light: 'linear-gradient(160deg, #FFFFFF, #F3F0E9)',
  dark: 'linear-gradient(160deg, #131C33, #0A0F1C)',
  oled: '#000000',
};
const OFF = { light: 'rgba(11,16,32,.16)', night: 'rgba(238,242,250,.15)' };

// The words the grid lights for the time left: "about forty minutes left", "under one minute left".
export function gridWords(m: TFaceModel): string[] {
  const mm = m.shownSec / 60;
  const wl: string[] = [];
  if (m.st === 'up') return wl;
  if (mm >= 57.5) {
    const hr = Math.max(1, Math.round(mm / 60));
    if (Math.abs(mm - hr * 60) > 0.5) wl.push('ABOUT');
    wl.push(NUMW[Math.min(hr, 5)] ?? 'FIVE', hr > 1 ? 'HOURS' : 'HOUR', 'LEFT');
  } else if (mm < 1) wl.push('UNDER', 'ONE', 'MINUTE', 'LEFT');
  else if (mm < 4.5) {
    const n = Math.round(mm);
    if (Math.abs(mm - n) > 0.01) wl.push('ABOUT');
    wl.push(NUMW[n] ?? '', n > 1 ? 'MINUTES' : 'MINUTE', 'LEFT');
  } else {
    const r5 = Math.round(mm / 5) * 5;
    if (Math.abs(mm - r5) > 0.01) wl.push('ABOUT');
    const w = NUMW[r5];
    if (w) wl.push(w);
    else wl.push(NUMW[Math.floor(r5 / 10) * 10] ?? '', 'FIVE');
    wl.push('MINUTES', 'LEFT');
  }
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
    for (let j = 0; j < at[2]; j++) lit.set(at[0] * 12 + at[1] + j, col);
  }
  const off = m.night ? OFF.night : OFF.light;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 22,
          width: 328,
          height: 258,
          borderRadius: 24,
          background: GROUND[m.theme],
          boxShadow: CARD_SHADOW[m.theme],
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 36,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 25px)',
          gridAutoRows: 29,
        }}
      >
        {GRID.flatMap((row, ri) =>
          row.split('').map((ch, ci) => {
            const col = lit.get(ri * 12 + ci);
            return (
              <span
                key={ri * 12 + ci}
                className={L}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: lmin(16),
                  fontWeight: col ? 700 : 500,
                  color: col ?? off,
                  textShadow: col && m.night ? `0 0 12px ${alpha(col, 0x88)}` : undefined,
                }}
              >
                {ch}
              </span>
            );
          }),
        )}
      </div>
      <span
        className={L}
        style={{
          position: 'absolute',
          left: 16,
          top: 248,
          width: 328,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: lmin(13),
          color: t.ink2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ color: t.ink, fontWeight: 600 }}>{m.digits}</span> · {m.endLine}
      </span>
    </>
  );
}

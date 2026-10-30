import { type Draw, esc, mx, type V } from '../base.js';
import { each, hw, num, nv, wh } from '../kit.js';

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const kick = (v: V) =>
  `font-family: var(--at-font-mono); font-size: max(12px, var(--lmin)); letter-spacing: .16em; text-transform: uppercase; color: ${v.t.ink2}`;

// Time in a sentence. The sentences are English grammar; other locales keep the English words for now.
const sentence = (v: V): [string, string, string] => {
  const { h, m, eh, em } = v;
  const endW =
    em === 0
      ? `${hw(eh)} o’clock`
      : em === 15
        ? `quarter past ${hw(eh)}`
        : em === 30
          ? `half past ${hw(eh)}`
          : em === 45
            ? `quarter to ${hw(eh + 1)}`
            : em < 30
              ? `${num(em)} past ${hw(eh)}`
              : `${num(60 - em)} to ${hw(eh + 1)}`;
  const remW =
    h > 0
      ? `${num(h)} hour${h > 1 ? 's' : ''}${m ? ` ${num(m)} min` : ''}`
      : m > 0
        ? `${num(m)} minute${m > 1 ? 's' : ''}`
        : 'less than a minute';
  const tm = Math.round(v.total / 60);
  switch (v.st) {
    case 'fallback':
      return [cap(remW), 'left,', `until ${endW} — via the video fallback.`];
    case 'starting':
      return ['Asking', 'the browser to keep the screen on…', ''];
    case 'paused':
      return ['Paused', `with ${remW} left.`, 'Come back to this tab to continue.'];
    case 'blocked':
      return ['Not awake.', 'The browser refused the lock.', 'The fix is one tap away.'];
    case 'unsupported':
      return ['Not awake yet.', 'This browser has no wake lock.', 'Tap to use the video fallback.'];
    case 'up':
      return ['Time’s up.', '', `Ended at ${endW}.`];
    case 'idle':
      return [
        `${cap(tm >= 60 ? `${num(Math.floor(tm / 60))} hour${tm >= 120 ? 's' : ''}` : `${num(tm)} minutes`)},`,
        'whenever you’re ready.',
        `It would end at ${endW}.`,
      ];
    default:
      return [cap(remW), 'left,', `until ${endW}.`];
  }
};

const words: Draw = (v) => {
  const { t, accent } = v;
  const [a, b, c] = sentence(v).map(esc);
  const serif = "font-family: 'IBM Plex Serif', georgia, serif; font-weight: 300;";
  return `<div style="position: absolute; left: 34px; right: 34px; top: 0; height: 310px; display: flex; flex-direction: column; justify-content: center; gap: 18px"><span style="${kick(v)}">${v.topWord}</span><p style="margin: 0; ${serif} font-size: 38px; line-height: 1.12; letter-spacing: -0.01em; text-wrap: balance"><span style="color: ${accent}">${a}</span> ${b}<span class="afx-blink" style="display: inline-block; width: 3px; height: 30px; margin-left: 6px; vertical-align: -3px; background: ${accent}; opacity: ${v.liveOp}"></span></p><p style="margin: 0; ${serif} font-style: italic; font-size: 20px; line-height: 1.3; color: ${t.ink2}">${c}</p><div style="position: relative; height: 2px; border-radius: 1px; background: ${t.track}"><div class="af-tr" style="position: absolute; left: 0; top: 0; height: 2px; width: ${v.fracPct}; background: ${accent}"></div></div></div>`;
};

const GRID = [
  'ABOUTKUNDERZ',
  'TWENTYTHIRTY',
  'FORTYMFIFTYP',
  'FIFTEENFIVEW',
  'THREEFOURTEN',
  'ONETWOHOURSV',
  'MINUTESZLEFT',
];
const AT: Record<string, [number, number, number]> = {
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
const NUMW: Record<number, string> = {
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

// The words the grid lights for the time left: "about forty minutes left", "under one minute left".
function gridWords(st: V['st'], sec: number): string[] {
  const mm = sec / 60;
  const wl: string[] = [];
  if (st === 'up') return wl;
  if (mm >= 57.5) {
    const hr = Math.max(1, Math.round(mm / 60));
    if (Math.abs(mm - hr * 60) > 0.5) wl.push('ABOUT');
    wl.push(NUMW[Math.min(hr, 5)] ?? 'FIVE', hr > 1 ? 'HOURS' : 'HOUR', 'LEFT');
  } else if (mm < 1) wl.push('UNDER', 'ONE', 'MINUTE', 'LEFT');
  else if (mm < 4.5) {
    const n = Math.round(mm);
    if (Math.abs(mm - n) > 0.01) wl.push('ABOUT');
    wl.push(NUMW[n] ?? 'ONE', n > 1 ? 'MINUTES' : 'MINUTE', 'LEFT');
  } else {
    const r5 = Math.round(mm / 5) * 5;
    if (Math.abs(mm - r5) > 0.01) wl.push('ABOUT');
    const w = NUMW[r5];
    if (w) wl.push(w);
    else wl.push(NUMW[Math.floor(r5 / 10) * 10] ?? 'FIFTY', 'FIVE');
    wl.push('MINUTES', 'LEFT');
  }
  return wl;
}

const wordgrid: Draw = (v) => {
  const { t, mc1, mc2, mc3 } = v;
  const lit: Record<number, string> = {};
  for (const w of gridWords(v.st, v.st === 'idle' ? v.total : v.r)) {
    const q = AT[w];
    if (!q) continue;
    const c =
      w === 'ABOUT' || w === 'UNDER'
        ? mc2
        : w === 'LEFT'
          ? mc3
          : w.startsWith('HOUR') || w.startsWith('MINUTE')
            ? t.ink
            : mc1;
    for (let j = 0; j < q[2]; j++) lit[q[0] * 12 + q[1] + j] = c;
  }
  const off = v.night ? mx('var(--at-fc-snow)', 15) : nv(16);
  const cells = each(GRID, (row, ri) =>
    each(row.split(''), (ch, ci) => {
      const c = lit[ri * 12 + ci];
      return `<span style="display: flex; align-items: center; justify-content: center; font-family: var(--at-font-mono); font-size: max(16px, var(--lmin)); font-weight: ${c ? 700 : 500}; color: ${c ?? off};${c && v.night ? ` text-shadow: 0 0 12px ${mx(c, 53)};` : ''}">${ch}</span>`;
    }),
  );
  return `<div style="position: absolute; left: 16px; top: 22px; width: 328px; height: 258px; border-radius: 24px; background: var(--at-fc-wg-${v.th}); box-shadow: ${v.cardShadow}"></div><div style="position: absolute; left: 30px; top: 36px; display: grid; grid-template-columns: repeat(12, 25px); grid-auto-rows: 29px">${cells}</div><span style="position: absolute; left: 16px; top: 248px; width: 328px; text-align: center; font-family: var(--at-font-mono); font-size: max(13px, var(--lmin)); color: ${t.ink2}; font-variant-numeric: tabular-nums"><span style="color: ${t.ink}; font-weight: 600">${v.digits}</span> · ${v.endLine}</span>`;
};

// Each digit is six little clocks; their two hands point to draw the digit's strokes (225° hides a hand).
const DIG: Record<string, [number, number][]> = {
  0: [
    [90, 180],
    [270, 180],
    [0, 180],
    [0, 180],
    [0, 90],
    [0, 270],
  ],
  1: [
    [225, 225],
    [180, 180],
    [225, 225],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  2: [
    [90, 90],
    [270, 180],
    [90, 180],
    [0, 270],
    [0, 90],
    [270, 270],
  ],
  3: [
    [90, 90],
    [270, 180],
    [90, 90],
    [0, 180],
    [90, 90],
    [0, 270],
  ],
  4: [
    [180, 180],
    [180, 180],
    [0, 90],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  5: [
    [90, 180],
    [270, 270],
    [0, 90],
    [270, 180],
    [90, 90],
    [0, 270],
  ],
  6: [
    [90, 180],
    [270, 270],
    [0, 180],
    [270, 180],
    [0, 90],
    [0, 270],
  ],
  7: [
    [90, 90],
    [270, 180],
    [225, 225],
    [0, 180],
    [225, 225],
    [0, 0],
  ],
  8: [
    [90, 180],
    [270, 180],
    [0, 90],
    [270, 180],
    [0, 90],
    [0, 270],
  ],
  9: [
    [90, 180],
    [270, 180],
    [0, 90],
    [0, 180],
    [90, 90],
    [0, 270],
  ],
};
const BASE = [14, 95, 192, 273];

const clocks: Draw = (v) => {
  const { t, mc1, FILL } = v;
  const cells = each(v.four, (d, di) =>
    each(DIG[String(d)] ?? DIG[0] ?? [], (pr, ci) => {
      const blank = pr[0] === 225 && pr[1] === 225;
      const hc = blank ? t.ink2 : di < 2 ? t.ink : mc1;
      const op = blank ? 0.28 : 1;
      const hs = (deg: number) =>
        `<span style="position: absolute; left: 16px; top: 0; width: 4px; height: 18px; border-radius: 2px; background: ${hc}; opacity: ${op}; transform-origin: 50% 100%; transform: rotate(${deg}deg); transition: transform .9s cubic-bezier(.65,0,.25,1);"></span>`;
      return `<div style="position: absolute; left: ${(BASE[di] ?? 0) + (ci % 2) * 37}px; top: ${80 + Math.floor(ci / 2) * 37}px; width: 36px; height: 36px; border-radius: 50%; background: var(--at-fc-mini-${v.th}); box-shadow: inset 0 1px 0 ${wh(6)}, 0 0 0 1px ${t.line};">${hs(pr[0])}${hs(pr[1])}<span style="position: absolute; left: 14px; top: 14px; width: 8px; height: 8px; border-radius: 50%; background: ${hc}; opacity: ${op};"></span></div>`;
    }),
  );
  const heat = v.multi
    ? `linear-gradient(90deg, ${FILL.ember}, ${FILL.amber} 12%, ${FILL.lime} 35%, ${v.lamp} 70%)`
    : v.accent;
  const blink = (tp: number) =>
    `<span class="afx-blink" style="position: absolute; left: 176px; top: ${tp}px; width: 8px; height: 8px; border-radius: 50%; background: ${mc1}"></span>`;
  return `<div style="position: absolute; left: 0; top: 36px; width: 360px; height: 240px; border-radius: 26px; background: var(--at-fc-cc-${v.th}); box-shadow: ${v.cardShadow}"></div><span style="position: absolute; left: 0; top: 52px; width: 360px; text-align: center; ${kick(v)}">${v.topWord}</span>${cells}${blink(110)}${blink(148)}<div style="position: absolute; left: 40px; top: 214px; width: 280px; height: 4px; border-radius: 2px; background: ${t.track}; overflow: hidden"><div class="af-tr" style="height: 4px; width: ${v.fracPct}; border-radius: 2px; background: ${heat}"></div></div><span style="position: absolute; left: 0; top: 230px; width: 360px; text-align: center; font-size: max(14px, var(--lmin)); color: ${t.ink2}">${v.endLine}</span>`;
};

export default { words, wordgrid, clocks };

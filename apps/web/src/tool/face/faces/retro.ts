import { type Draw, esc, tx, type V } from '../base.js';
import { bk, each, lx, wh } from '../kit.js';

const col = 'display: flex; flex-direction: column';
const end = (v: V, extra = '') =>
  `<span style="${extra}font-size: max(15px, var(--lmin)); color: ${v.t.ink2}">${v.endLine}</span>`;
const units = (v: V): [string, string] => (v.h > 0 ? ['HR', 'MIN'] : ['MIN', 'SEC']);
const glow = (v: V) => (v.st === 'idle' ? v.t.ink2 : v.accent);

const flip: Draw = (v) => {
  const k = v.theme === 'light' ? 'l' : 'd';
  const top = `var(--at-fc-flip-top-${k})`;
  const card = `position: relative; width: 140px; height: 176px; border-radius: 16px; background: linear-gradient(180deg, ${top} 0 50%, var(--at-fc-flip-bot-${k}) 50% 100%); color: ${v.t.cardInk}; display: flex; align-items: center; justify-content: center; font-size: 116px; font-weight: 600; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; box-shadow: 0 14px 28px ${bk(28)}, inset 0 1px 0 ${wh(8)}; overflow: hidden`;
  const sheen = `<div style="position: absolute; left: 0; right: 0; top: 0; height: 88px; background: linear-gradient(180deg, ${wh(6)}, transparent)"></div>`;
  const split = `<div style="position: absolute; left: 0; right: 0; top: 87px; height: 2px; background: ${bk(55)}; box-shadow: 0 1px 0 ${wh(6)}"></div>`;
  const dot = `<span class="afx-breath" style="width: 10px; height: 10px; border-radius: 50%; background: ${v.accent}"></span>`;
  const [ua, ub] = units(v);
  return `<div style="position: absolute; left: 0; top: 30px; width: 360px; ${col}; align-items: center; gap: 12px"><div style="display: flex; align-items: center; gap: 12px"><div style="${card}">${sheen}<span style="position: relative">${v.ga}</span>${split}</div><div style="${col}; gap: 22px">${dot}${dot}</div><div style="${card}; perspective: 600px">${sheen}<span style="position: relative">${v.gb}</span>${split}<div class="afx-flap" style="position: absolute; left: 0; top: 0; width: 140px; height: 88px; overflow: hidden; border-radius: 16px 16px 0 0; background: ${top}; transform-origin: 50% 100%; opacity: ${v.liveOp}"><span style="position: absolute; left: 0; width: 140px; top: 0; height: 176px; display: flex; align-items: center; justify-content: center; color: ${v.t.cardInk}">${v.gb}</span></div></div></div><div style="display: flex; gap: 140px; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; color: ${v.t.ink2}"><span>${ua}</span><span>${ub}</span></div>${end(v)}</div>`;
};

const rolling: Draw = (v) => {
  const mods = v.h > 0 ? [10, 10, 6, 10] : [6, 10, 6, 10];
  const drum = `position: relative; width: 66px; height: 156px; border-radius: 12px; background: ${v.t.card}; color: ${v.t.cardInk}; overflow: hidden; box-shadow: 0 10px 22px ${bk(25)}, inset 0 0 0 1px ${wh(5)}`;
  const n = (d: number, tp: number, w: number, op: string) =>
    `<span style="position: absolute; left: 0; right: 0; top: ${tp}px; text-align: center; font-size: 80px; line-height: 100px; font-weight: ${w};${op}">${d}</span>`;
  const drums = each(v.four, (d, i) => {
    const md = mods[i] ?? 10;
    return `<div style="display: flex; align-items: center; gap: 8px"><div style="${drum}"><div class="${i === 3 ? 'afx-roll' : ''}" style="position: absolute; left: 0; top: 0; width: 66px; height: 156px">${n((d + 1) % md, -72, 400, ' opacity: .4')}${n(d, 28, 500, '')}${n((d + md - 1) % md, 128, 400, ' opacity: .4')}</div><div style="position: absolute; inset: 0; background: linear-gradient(180deg, ${bk(55)}, transparent 32%, transparent 68%, ${bk(55)}); pointer-events: none"></div></div>${i === 1 ? `<span class="afx-blink" style="font-size: 56px; font-weight: 300; color: ${v.accent}">:</span>` : ''}</div>`;
  });
  return `<div style="position: absolute; left: 0; top: 50px; width: 360px; ${col}; align-items: center; gap: 20px"><div style="position: relative; display: flex; align-items: center; gap: 8px">${drums}<div style="position: absolute; left: -10px; right: -10px; top: 46px; height: 64px; border-top: 1px solid ${v.a(60)}; border-bottom: 1px solid ${v.a(60)}; pointer-events: none"></div></div>${end(v)}</div>`;
};

const nixie: Draw = (v) => {
  const { accent } = v;
  const c = glow(v);
  const pip = `<span class="afx-blink" style="width: 8px; height: 8px; border-radius: 50%; background: ${accent}; box-shadow: 0 0 10px ${accent}"></span>`;
  const tubes = each(
    v.four,
    (d, i) =>
      `<div style="display: flex; align-items: center; gap: 8px"><div class="afx-flick" style="position: relative; width: 66px; height: 166px; border-radius: 33px 33px 10px 10px; background-color: var(--at-fc-tube); border: 1px solid var(--at-fc-tube-line); overflow: hidden; background-image: radial-gradient(ellipse at 50% 18%, ${wh(10)}, transparent 60%), repeating-linear-gradient(60deg, ${wh(4)} 0 1px, transparent 1px 7px), repeating-linear-gradient(-60deg, ${wh(4)} 0 1px, transparent 1px 7px); animation-delay: ${i * 1.3}s;"><span style="position: absolute; left: 0; right: 0; top: 32px; text-align: center; font-size: 96px; line-height: 110px; font-weight: 200; color: ${wh(5)}">8</span><span style="position: absolute; left: 0; right: 0; top: 32px; text-align: center; font-size: 96px; line-height: 110px; font-weight: 200; color: ${c}; text-shadow: 0 0 4px ${accent}, 0 0 18px ${v.a(60)}, 0 0 40px ${v.a(25)}">${d}</span><div style="position: absolute; left: 10px; top: 10px; width: 10px; height: 64px; border-radius: 6px; background: linear-gradient(180deg, ${wh(16)}, transparent)"></div></div>${i === 1 ? `<div style="${col}; gap: 26px">${pip}${pip}</div>` : ''}</div>`,
  );
  return `<div style="position: absolute; left: 0; top: 34px; width: 360px; ${col}; align-items: center"><div style="display: flex; align-items: flex-end; gap: 8px">${tubes}</div><div style="position: relative; width: 336px; height: 22px; border-radius: 6px; background: linear-gradient(180deg, var(--at-fc-base-1), var(--at-fc-base-2)); box-shadow: inset 0 1px 0 ${wh(12)}, 0 8px 18px ${bk(35)}"><span class="afx-breath" style="position: absolute; right: 12px; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: ${accent}; box-shadow: 0 0 8px ${accent}"></span></div>${end(v, 'margin-top: 16px; ')}</div>`;
};

const LCD_TAG: Partial<Record<V['st'], [string, string]>> = {
  paused: ['lcd.paused', 'PAUSE'],
  up: ['lcd.up', 'END'],
  idle: ['lcd.idle', 'READY'],
};

const lcd: Draw = (v) => {
  const { accent } = v;
  const on = Math.round(v.frac * 20);
  const bar = each(
    Array.from({ length: 20 }),
    (_x, i) =>
      `<span style="display: block; flex: 1; height: 8px; border-radius: 1px; background: ${i < on ? accent : v.a(13)};"></span>`,
  );
  const tag = LCD_TAG[v.st] ?? ['lcd.awake', 'AWAKE'];
  const m13 = `${v.mono} font-size: max(13px, var(--lmin)); letter-spacing: .1em; color: ${accent}`;
  const seg = (s: string) =>
    `<span style="position: relative; color: ${accent}; text-shadow: 0 0 10px ${v.a(25)}">${s}</span>`;
  return `<div style="position: absolute; left: 18px; top: 38px; width: 324px; height: 220px; border-radius: 26px; background: var(--at-fc-bezel-${v.theme === 'light' ? 'l' : 'd'}); box-shadow: ${v.cardShadow}; padding: 12px"><div style="position: relative; width: 300px; height: 196px; border-radius: 16px; background: radial-gradient(ellipse at 50% 40%, ${v.a(8)}, transparent 70%), ${v.t.lcdS}; box-shadow: inset 0 2px 12px ${bk(35)}; overflow: hidden"><span style="position: absolute; left: 18px; top: 14px; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; color: ${accent}">${v.h > 0 ? 'H · MIN · SEC' : 'MIN · SEC'}</span><span style="position: absolute; right: 18px; top: 12px; padding: 1px 6px; border: 1px solid ${accent}; border-radius: 4px; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .14em; color: ${accent}">${lx(tag[0], tag[1])}</span><div style="position: absolute; left: 0; right: 0; top: 44px; display: flex; justify-content: center; ${v.mono} font-weight: 500; font-size: ${v.long ? 56 : 82}px; line-height: 1; letter-spacing: -0.03em; transform: skewX(-7deg); font-variant-numeric: tabular-nums"><span style="position: absolute; color: ${v.a(15)}">${v.long ? '8:88:88' : '88:88'}</span>${seg(v.dL)}${v.dR ? `<span class="afx-blink" style="position: relative; color: ${accent}">:</span>${seg(v.dR)}` : ''}</div><div style="position: absolute; left: 18px; right: 18px; bottom: 40px; display: flex; gap: 3px">${bar}</div><span style="position: absolute; left: 18px; bottom: 14px; ${m13}">${lx('lcd.end', 'END {time}', { time: v.endShort })}</span><span style="position: absolute; right: 18px; bottom: 14px; ${m13}">${v.pctLabel}</span></div></div>`;
};

const led: Draw = (v) => {
  const c = glow(v);
  const on = Math.round(v.frac * 24);
  const dots = each(
    Array.from({ length: 24 }),
    (_x, i) =>
      `<span style="display: block; width: 7px; height: 7px; border-radius: 50%; background: ${i < on ? v.accent : 'var(--at-fc-led-off)'}; ${i < on ? `box-shadow: 0 0 6px ${v.a(60)};` : ''}"></span>`,
  );
  const line = esc(
    `${tx(`cap.${v.st}`)} · ${v.digits} ${lx('led.left', 'left')} · ${tx('end.until', { time: v.endShort })}`.toUpperCase(),
  );
  const font = "font-family: 'DotGothic16', var(--at-font-mono);";
  return `<div style="position: absolute; left: 14px; top: 34px; width: 332px; height: 236px; border-radius: 16px; background-color: var(--at-fc-led); background-image: radial-gradient(circle, ${wh(7)} 1.2px, transparent 1.6px); background-size: 7px 7px; border: 1px solid var(--at-fc-led-line); overflow: hidden; box-shadow: 0 16px 36px ${bk(40)}"><div style="position: absolute; left: 0; right: 0; top: 14px; height: 24px; overflow: hidden; border-bottom: 1px solid var(--at-fc-led-rule)"><div class="afx-marq" style="display: flex; width: max-content; white-space: nowrap; ${font} font-size: 17px; letter-spacing: .12em; color: ${c}; opacity: .8; padding-left: 18px"><span style="padding-right: 48px">${line}</span><span style="padding-right: 48px">${line}</span></div></div><div style="position: absolute; left: 0; right: 0; top: 52px; text-align: center; ${font} font-size: ${v.long ? 64 : 92}px; line-height: 1.1; color: ${c}; text-shadow: 0 0 6px ${v.a(60)}, 0 0 20px ${v.a(25)}">${v.digits}</div><div style="position: absolute; left: 22px; right: 22px; bottom: 18px; display: flex; gap: 5px; justify-content: center">${dots}</div><div class="afx-scan" style="position: absolute; left: 0; right: 0; top: 0; height: 24px; background: linear-gradient(180deg, transparent, ${wh(4)}, transparent); opacity: ${v.liveOp}"></div></div>`;
};

const BOARD_WORD: Record<V['st'], string> = {
  idle: 'READY',
  starting: 'START',
  running: 'AWAKE',
  fallback: 'VIDEO',
  paused: 'PAUSED',
  blocked: 'BLOCKED',
  unsupported: 'NOLOCK',
  up: 'ENDED',
};
// The board is always a dark panel, so on a light page it keeps the dark theme's status colours.
const BOARD_DARK: Partial<Record<V['st'], string>> = {
  idle: 'var(--at-fc-dk-idle)',
  paused: 'var(--at-fc-dk-warn)',
  blocked: 'var(--at-fc-dk-bad)',
  unsupported: 'var(--at-fc-dk-info)',
  up: 'var(--at-fc-dk-ended)',
};

const board: Draw = (v) => {
  const lampSet = v.lampVal !== 'var(--at-accent)';
  const acc = v.night ? v.accent : (BOARD_DARK[v.st] ?? (lampSet ? v.lamp : 'var(--at-fc-dk-lamp)'));
  const fit = (s: string) => s.padEnd(8, ' ').slice(0, 8);
  const left = v.digits.length <= 5 ? ` ${v.digits}  `.slice(0, 8) : fit(v.digits);
  const k = `flex: none; width: 56px; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .02em; color: var(--at-fc-board-ink)`;
  const row = (key: string, str: string, c: string, flapLast: boolean) => {
    const cells = each(str.split(''), (ch, i, n = str.length) => {
      const fl = flapLast && i === n - 3;
      return `<span style="position: relative; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 38px; border-radius: 4px; background: var(--at-fc-board-cell); color: ${c}; ${v.mono} font-size: 24px; font-weight: 500; overflow: hidden;"><span style="position: relative; z-index: 1">${ch === ' ' ? '' : esc(ch)}</span><span style="position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: ${bk(60)}"></span><span class="${fl ? 'afx-flap' : ''}" style="position: absolute; left: 0; right: 0; top: 0; height: 50%; background: var(--at-fc-board-flap); transform-origin: 50% 100%; opacity: ${fl && v.live ? 1 : 0}"></span></span>`;
    });
    return `<div style="display: flex; align-items: center; gap: 8px"><span style="${k}">${key}</span><div style="display: flex; gap: 3px">${cells}</div></div>`;
  };
  const done = `${Math.round(100 * (1 - v.frac))}%`;
  return `<div style="position: absolute; left: 14px; top: 34px; width: 332px; height: 240px; border-radius: 18px; background: var(--at-fc-board); box-shadow: ${v.cardShadow}; padding: 16px 18px; ${col}; gap: 12px"><div style="display: flex; justify-content: space-between; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; color: var(--at-fc-board-ink)"><span>AWAKETAB</span><span>${v.t12(v.nowSec)}</span></div>${row(lx('board.left', 'LEFT'), left, 'var(--at-fc-snow)', true)}${row(lx('board.ends', 'ENDS'), fit(v.endShort.replace(' ', '')), 'var(--at-fc-snow)', false)}${row(lx('board.state', 'STATE'), fit(lx(`board.${v.st}`, BOARD_WORD[v.st])), acc, false)}<div style="margin-top: auto; display: flex; align-items: center; gap: 10px"><span style="${k}">${lx('board.done', 'DONE')}</span><div style="flex: 1; height: 6px; border-radius: 3px; background: var(--at-fc-board-flap); overflow: hidden"><div class="af-tr" style="height: 6px; width: ${done}; border-radius: 3px; background: ${acc}"></div></div><span style="${v.mono} font-size: max(12px, var(--lmin)); color: var(--at-fc-board-done); font-variant-numeric: tabular-nums">${done}</span></div></div>`;
};

export default { flip, rolling, nixie, lcd, led, board };

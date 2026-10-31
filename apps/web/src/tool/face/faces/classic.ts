import { type TDraw, f1, mx, pad, type TV } from '../base.js';
import { bk, each, lx, nv, wh } from '../kit.js';

const box = 'position: absolute; left: 0; top: 0; width: 360px; height: 310px';
const col = 'display: flex; flex-direction: column';
const kick = (v: TV, color: string) =>
  `<span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; text-transform: uppercase; color: ${color}">${v.topWord}</span>`;
const big = (fs: string | number, w: number, extra = '') =>
  `font-size: ${fs}${typeof fs === 'number' ? 'px' : ''}; font-weight: ${w}; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums;${extra}`;
const end = (v: TV, fs: number, extra = '') =>
  `<span style="${extra}font-size: max(${fs}px, var(--lmin)); color: ${v.t.ink2}">${v.endLine}</span>`;

const bold: TDraw = (v) => {
  const on = Math.round(v.frac * 30);
  const segs = each(Array.from({ length: 30 }), (_x, i) => {
    const cur = v.live && i === on - 1;
    return `<span class="${cur ? 'afx-breath' : ''}" style="display: block; width: 5px; height: 16px; border-radius: 2px; background: ${i < on ? v.accent : v.t.track};"></span>`;
  });
  // A no-end session at rest shows ∞ alone, with no colon after it.
  const colon = v.dR
    ? `<span class="afx-blink" style="color: ${v.accent}; margin: 0 2px">:</span><span>${v.dR}</span>`
    : '';
  return `<div style="${box}; ${col}; align-items: center; justify-content: center; gap: 16px">${kick(v, v.accent)}<span style="display: flex; align-items: baseline; font-weight: 800; font-size: ${v.long ? 92 : 132}px; line-height: .86; letter-spacing: -0.06em; font-variant-numeric: tabular-nums"><span>${v.dL}</span>${colon}</span><div style="display: flex; gap: 3px">${segs}</div>${end(v, 16)}</div>`;
};

const STARS = [
  [30, 30],
  [72, 58],
  [118, 22],
  [160, 70],
  [96, 110],
  [40, 96],
  [186, 36],
] as const;

const horizon: TDraw = (v) => {
  const { th } = v;
  const stars = v.night
    ? each(
        STARS,
        (q, i) =>
          `<span class="afx-twinkle" style="position: absolute; left: ${q[0]}px; top: ${q[1]}px; width: 3px; height: 3px; border-radius: 50%; background: var(--at-fc-white); animation-delay: ${i * 0.5}s;"></span>`,
      )
    : '';
  const sky =
    th === 'l'
      ? `linear-gradient(180deg, var(--at-fc-hz-l1) 0%, var(--at-fc-hz-l2) 70%, ${v.a(33)} 100%)`
      : th === 'o'
        ? `linear-gradient(180deg, var(--at-fc-black) 30%, ${v.a(20)} 100%)`
        : `linear-gradient(180deg, var(--at-fc-hz-d1) 0%, var(--at-fc-hz-d2) 65%, ${v.a(27)} 100%)`;
  const shim = (l: number, tp: number, w: number, d: number) =>
    `<span class="afx-shim" style="position: absolute; left: ${l}px; top: ${tp}px; width: ${w}px; height: 3px; border-radius: 2px; background: ${v.accent}${d ? `; animation-delay: ${d}s` : ''}"></span>`;
  return `<div style="position: absolute; left: 20px; top: 8px; width: 320px; height: 300px; overflow: hidden; border-radius: 28px; background: var(--at-fc-hz-sea-${th}); box-shadow: ${v.cardShadow}"><div style="position: absolute; left: 0; top: 0; width: 320px; height: 184px; overflow: hidden; background: ${sky}">${stars}<div class="af-tr" style="position: absolute; left: 214px; top: ${Math.round(184 - 32 - 122 * v.frac)}px; width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, ${v.night ? 'var(--at-fc-sun)' : 'var(--at-fc-white)'}, ${v.accent} 70%); box-shadow: 0 0 0 10px ${v.a(15)}, 0 0 60px ${v.a(60)}"></div></div><div style="position: absolute; left: 0; right: 0; top: 183px; height: 1px; background: ${v.accent}; opacity: .7"></div>${shim(222, 192, 48, 0)}${shim(230, 202, 32, 0.6)}${shim(237, 212, 18, 1.2)}<div style="position: absolute; left: 24px; top: 196px; ${col}; gap: 4px"><span style="${big(v.long ? 44 : 56, 300)}">${v.digits}</span>${end(v, 14)}</div></div>`;
};

const tide: TDraw = (v) => {
  const { t, th, accent } = v;
  const shadow =
    th === 'l'
      ? `inset 0 0 0 2px ${t.line}, 0 16px 30px ${nv(10)}`
      : `inset 0 0 0 2px ${t.line}, 0 18px 36px ${bk(40)}`;
  const bubble = (l: number, b: number, sz: number, d: number) =>
    `<span class="afx-rise" style="position: absolute; left: ${l}px; bottom: ${b}px; width: ${sz}px; height: ${sz}px; border-radius: 50%; border: 1.5px solid ${accent}${d ? `; animation-delay: ${d}s` : ''}"></span>`;
  const scale = each(
    [0, 0.25, 0.5, 0.75, 1],
    (q) =>
      `<span style="position: absolute; left: 278px; top: ${Math.round(296 - 286 * q - 8)}px; ${v.mono} font-size: max(12px, var(--lmin)); color: ${t.ink2};">${Math.round((v.total / 60) * q)}</span>`,
  );
  return `<div style="position: absolute; left: 92px; top: 10px; width: 176px; height: 290px; border-radius: 48px; overflow: hidden; background: var(--at-fc-glass-${th}); box-shadow: ${shadow}"><div class="af-tr" style="position: absolute; left: 0; right: 0; bottom: 0; height: ${Math.round(286 * v.frac)}px; background: linear-gradient(180deg, ${v.a(25)}, ${v.a(15)})"><svg class="afx-wave" style="position: absolute; left: 0; top: -14px" width="352" height="18" viewBox="0 0 352 18" aria-hidden="true"><path d="M0 9 Q22 0 44 9 T88 9 T132 9 T176 9 T220 9 T264 9 T308 9 T352 9 V18 H0 Z" fill="${v.a(25)}"></path></svg><svg class="afx-wave2" style="position: absolute; left: 0; top: -10px" width="352" height="14" viewBox="0 0 352 14" aria-hidden="true"><path d="M0 7 Q22 14 44 7 T88 7 T132 7 T176 7 T220 7 T264 7 T308 7 T352 7 V14 H0 Z" fill="${accent}" opacity=".35"></path></svg>${bubble(40, 10, 6, 0)}${bubble(112, 4, 8, 1.6)}${bubble(76, 16, 5, 3)}</div><div style="position: absolute; left: 14px; top: 18px; width: 14px; height: 120px; border-radius: 7px; background: linear-gradient(180deg, ${wh(22)}, transparent)"></div><div style="position: absolute; inset: 0; ${col}; align-items: center; justify-content: center; gap: 6px"><span style="${big(v.long ? 40 : 54, 300)}">${v.digits}</span>${end(v, 14)}</div></div>${scale}`;
};

const type: TDraw = (v) => {
  const { t, accent } = v;
  const dot = (cls: string, op: string) =>
    `<span class="${cls}" style="position: absolute; top: -5px; left: ${v.fracPct}; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: ${accent}${op}"></span>`;
  return `<div style="position: absolute; left: 34px; top: 30px; width: 292px; height: 250px; ${col}; justify-content: center"><div style="display: flex; align-items: flex-start; gap: 10px"><span style="font-size: ${v.h > 0 ? 116 : 196}px; font-weight: 700; letter-spacing: -0.07em; line-height: .82; font-variant-numeric: tabular-nums">${v.h > 0 ? `${v.h}:${pad(v.m)}` : String(v.m)}</span><span style="${col}; gap: 6px; padding-top: 10px"><span style="font-size: 44px; font-weight: 300; letter-spacing: -0.03em; line-height: 1; color: ${accent}; font-variant-numeric: tabular-nums">${pad(v.s)}</span><span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .14em; color: ${t.ink2}">${v.h > 0 ? lx('type.h', 'H:MIN LEFT') : lx('type.m', 'MIN LEFT')}</span></span></div><div style="position: relative; margin-top: 22px; height: 2px; background: ${t.track}"><div class="af-tr" style="position: absolute; left: 0; top: 0; height: 2px; width: ${v.fracPct}; background: ${accent}"></div>${dot('af-tr', '')}${dot('afx-pulse-d', `; opacity: ${v.haloOp}`)}</div>${end(v, 15, 'margin-top: 14px; ')}</div>`;
};

const stack: TDraw = (v) => {
  const { t, accent } = v;
  const unit = (l: number, tp: number, w: number, s: string) =>
    `<span style="position: absolute; left: ${l}px; top: ${tp}px; width: ${w}px; text-align: center; ${v.mono} font-size: max(12px, var(--lmin)); color: ${t.ink2}">${s}</span>`;
  const n = (txt: string, w: number, c = '') =>
    `<span style="font-size: 150px; font-weight: ${w}; letter-spacing: -0.08em; line-height: .8;${c} font-variant-numeric: tabular-nums">${txt}</span>`;
  return `<div style="position: absolute; left: 70px; top: 14px; width: 220px; height: 290px; ${col}; justify-content: center">${n(v.h > 0 ? `${v.h}h` : pad(v.m), 800)}${n(v.h > 0 ? pad(v.m) : pad(v.s), 200, ` color: ${accent};`)}${end(v, 14, 'margin-top: 14px; ')}</div><div style="position: absolute; left: 296px; top: 40px; width: 6px; height: 230px; border-radius: 3px; background: ${t.track}; overflow: hidden"><div class="af-tr" style="position: absolute; left: 0; bottom: 0; width: 6px; height: ${v.fracPct}; border-radius: 3px; background: ${accent}"></div></div>${unit(286, 18, 26, v.h > 0 ? 'HR' : 'MIN')}${unit(280, 276, 38, v.h > 0 ? 'MIN' : 'SEC')}`;
};

const bars: TDraw = (v) => {
  const { t, st } = v;
  const now = Math.min(29, Math.floor((1 - v.frac) * 30));
  const list = each(Array.from({ length: 30 }), (_x, i) => {
    const spent = st !== 'idle' && i < now;
    const cur = st !== 'idle' && st !== 'up' && i === now;
    const hgt = 40 + Math.round(70 * (0.5 + 0.5 * Math.sin(i * 0.55)));
    return `<span class="${cur && v.live ? 'afx-breath' : ''}" style="display: block; width: 6px; height: ${cur ? 110 : hgt}px; border-radius: 3px; background: ${st === 'up' || spent ? t.track : v.heat((30 - i) / 30)}; opacity: ${spent || cur ? 1 : 0.85};"></span>`;
  });
  return `<div style="position: absolute; left: 0; top: 34px; width: 360px; ${col}; align-items: center; gap: 16px"><span style="${big(58, 300)}">${v.digits}</span><div style="display: flex; align-items: flex-end; gap: 3px; height: 110px">${list}</div><div style="width: 267px; display: flex; justify-content: space-between; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .06em; color: ${t.ink2}"><span>${v.t12(v.nowSec - (v.total - v.r))}</span><span>${v.endShort}</span></div></div>`;
};

const battery: TDraw = (v) => {
  const { t, frac } = v;
  const w = Math.max(6, Math.round(232 * frac));
  const fill = v.heatT(frac);
  return `<div style="position: absolute; left: 0; top: 40px; width: 360px; ${col}; align-items: center; gap: 18px"><div style="display: flex; align-items: center; gap: 6px"><div style="position: relative; width: 264px; height: 118px; border-radius: 26px; border: 4px solid ${t.ink}; padding: 8px; box-sizing: border-box"><div class="af-tr" style="position: relative; height: 94px; width: ${w}px; border-radius: 16px; background: linear-gradient(90deg, ${fill}, ${mx(fill, 85)}); overflow: hidden; display: flex; align-items: center; justify-content: flex-end"><span class="afx-sheen" style="position: absolute; left: 0; top: 0; width: 60px; height: 94px; background: linear-gradient(90deg, transparent, ${wh(35)}, transparent); opacity: ${v.liveOp}"></span></div><span style="position: absolute; top: 0; bottom: 0; left: ${frac > 0.45 ? 28 : w + 24}px; display: flex; align-items: center; font-size: 38px; font-weight: 600; letter-spacing: -0.03em; color: ${frac > 0.45 ? 'var(--at-on-accent)' : t.ink}; font-variant-numeric: tabular-nums">${v.pctLabel}</span></div><div style="width: 12px; height: 40px; border-radius: 0 6px 6px 0; background: ${t.ink}"></div></div><span style="${big(52, 300)}">${v.digits}</span>${end(v, 15)}</div>`;
};

const hourglass: TDraw = (v) => {
  const { t, accent } = v;
  const ft = v.st === 'idle' ? 1 : v.frac;
  const topY = 44 + 108 * (1 - ft);
  const wTop = 52 * ft;
  const sandTop = ft > 0.01 ? `M${f1(110 - wTop)} ${f1(topY)} H${f1(110 + wTop)} L112 148 H108 Z` : '';
  const bh = 70 * (1 - ft);
  const sandBot = bh > 1 ? `M62 264 Q110 ${f1(264 - bh * 1.6)} 158 264 Z` : '';
  return `<svg style="position: absolute; left: 0; top: 0" width="360" height="310" viewBox="0 0 360 310" aria-hidden="true"><rect x="44" y="34" width="132" height="10" rx="5" fill="${t.ink}"></rect><rect x="44" y="266" width="132" height="10" rx="5" fill="${t.ink}"></rect><path d="M58 44 H162 L116 152 L162 266 H58 L104 152 Z" fill="${v.night ? wh(3) : nv(3)}" stroke="${t.line}" stroke-width="2" stroke-linejoin="round"></path><path d="${sandTop}" fill="${accent}"></path><path d="${sandBot}" fill="${accent}" opacity=".85"></path><line class="afx-stream" x1="110" y1="152" x2="110" y2="${f1(264 - bh * 0.8)}" stroke="${accent}" stroke-width="2.5" stroke-dasharray="6 6" opacity="${v.liveOp}"></line></svg><div style="position: absolute; left: 196px; top: 0; width: 150px; height: 310px; ${col}; justify-content: center; gap: 6px">${kick(v, t.ink2)}<span style="${big(v.long ? 40 : 52, 300)}">${v.digits}</span>${end(v, 14)}<span style="margin-top: 8px; ${v.mono} font-size: max(12px, var(--lmin)); color: ${accent}">${lx('hg.left', '{pct} remaining', { pct: v.pctLabel })}</span></div>`;
};

export default { bold, horizon, tide, type, stack, bars, battery, hourglass };

import { type TDraw, f1, P, ticks, type TV } from '../base.js';
import { arc, bk, each, hand, lbl, lx, nv, sectorPath, svg, wh } from '../kit.js';

const span = (v: TV) => (v.st === 'idle' ? Math.min(359.9, v.total / 10) : Math.min(359.9, v.r / 10));
const pin = (l: number, tp: number, sz: number, bg: string, border: string) =>
  `<div style="position: absolute; left: ${l}px; top: ${tp}px; width: ${sz}px; height: ${sz}px; border-radius: 50%; background: ${bg}; border: ${border}"></div>`;
const subBg = (v: TV) => `var(--at-fc-sub-${v.th})`;
const DAUPHINE = 'clip-path: polygon(50% 0, 100% 82%, 50% 100%, 0 82%);';
const SWORD = 'clip-path: polygon(50% 0, 100% 10%, 100% 100%, 0 100%, 0 10%);';
const box = (l: number, tp: number, w: number, h: number, r: number, v: TV, extra: string, body: string) =>
  `<div style="position: absolute; left: ${l}px; top: ${tp}px; width: ${w}px; height: ${h}px; border-radius: ${r}px; background: ${subBg(v)}; border: 1px solid ${v.t.line}; display: flex; align-items: center; justify-content: center; ${extra}">${body}</div>`;

const hands = (v: TV, sec: string) =>
  `<div class="afx-h" style="${hand(70, 14, 8, v.hourDeg, v.hourDeg0, v.t.ink, 'border-radius: 4px;')}"></div><div class="afx-m" style="${hand(110, 16, 6, v.minDeg, v.minDeg0, v.t.ink, 'border-radius: 3px;')}"></div><div class="afx-s" style="${hand(124, 30, 2, v.secDeg, v.secDeg0, v.accent)}">${sec}</div>`;

// Analog (minimal) and Analog luxe share a dial: real time on the hands, the lamp sector running to the end time.
const dial =
  (luxe: boolean): TDraw =>
  (v) => {
    const { t, accent } = v;
    const sp = span(v);
    const e = P(136, v.minDeg + sp);
    const sectorC = luxe ? v.a(13) : v.a(v.theme === 'light' ? 16.5 : 22);
    const inkH = luxe ? `linear-gradient(90deg, ${t.ink} 50%, ${t.ink2} 50%)` : t.ink;
    const sun = luxe
      ? `<div style="position: absolute; left: 34px; top: 9px; width: 292px; height: 292px; border-radius: 50%; background: repeating-conic-gradient(${v.night ? wh(2.8) : nv(2.5)} 0 2deg, transparent 2deg 4deg)"></div>`
      : '';
    const rings = luxe
      ? `<circle cx="180" cy="155" r="130" fill="none" stroke="${t.line}" stroke-width="1"></circle><circle cx="180" cy="155" r="100" fill="none" stroke="${t.line}" stroke-width="1" opacity=".6"></circle>`
      : '';
    const art = svg(
      `<path d="${sectorPath(luxe ? 62 : 96, 134, v.minDeg, v.minDeg + sp)}" fill="${sectorC}"></path>${rings}<path d="${ticks(luxe ? 126 : 124, 130, 60, (i) => i % 5 !== 0)}" stroke="${t.ink2}" stroke-width="1.3" stroke-linecap="round" opacity=".5"></path><path d="${luxe ? ticks(114, 130, 12, (i) => i % 3 !== 0) : ticks(108, 130, 12, () => true)}" stroke="${t.ink}" stroke-width="${luxe ? 4 : 5}" stroke-linecap="round"></path><circle cx="${f1(e[0])}" cy="${f1(e[1])}" r="6" fill="${accent}"></circle><circle class="afx-pulse" cx="${f1(e[0])}" cy="${f1(e[1])}" r="6" fill="${accent}" opacity="${v.haloOp}"></circle>`,
    );
    const extra = luxe
      ? `${each(
          [
            ['12', 0],
            ['3', 90],
            ['9', 270],
          ] as const,
          ([n, d]) => lbl(v, n, 110, d, 26, t.ink, "font-family: 'IBM Plex Serif', georgia, serif; font-weight: 300;"),
        )}<div style="position: absolute; left: 136px; top: 206px; width: 88px; height: 30px; border-radius: 6px; background: ${t.panel}; border: 1px solid ${t.line}; display: flex; align-items: center; justify-content: center; gap: 6px; ${v.mono} font-size: max(13px, var(--lmin)); font-variant-numeric: tabular-nums; box-shadow: inset 0 1px 3px ${bk(25)}"><span style="color: ${accent}">●</span>${v.digits}</div>`
      : `<span style="position: absolute; left: 0; width: 360px; top: 196px; display: flex; justify-content: center"><span style="display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; background: ${v.a(15)}; color: ${accent}; font-size: max(14px, var(--lmin)); font-weight: 600; font-variant-numeric: tabular-nums">${
          v.st === 'up'
            ? v.capText
            : v.h > 0
              ? lx('analog.h', '{h} h {m} min left', { h: v.h, m: v.m })
              : lx('analog.m', '{m} min left', { m: v.m || 1 })
        }</span></span>`;
    const hh = luxe
      ? hand(72, 0, 14, v.hourDeg, v.hourDeg0, inkH, DAUPHINE)
      : hand(70, 14, 8, v.hourDeg, v.hourDeg0, inkH, 'border-radius: 4px;');
    const mm = luxe
      ? hand(112, 0, 12, v.minDeg, v.minDeg0, inkH, DAUPHINE)
      : hand(110, 16, 6, v.minDeg, v.minDeg0, inkH, 'border-radius: 3px;');
    return `${sun}${art}${extra}<div class="afx-h" style="${hh}"></div><div class="afx-m" style="${mm}"></div><div class="afx-s" style="${hand(124, 30, 2, v.secDeg, v.secDeg0, accent)}"><span style="position: absolute; left: -4px; bottom: 14px; width: 10px; height: 10px; border-radius: 50%; background: ${accent}"></span></div>${pin(173, 148, 14, accent, `3px solid ${v.capRing}`)}`;
  };

const dive: TDraw = (v) => {
  const { t, accent } = v;
  const mins = v.st === 'idle' ? Math.min(60, v.total / 60) : Math.min(60, v.r / 60);
  const snow = 'var(--at-fc-snow)';
  const mask = 'radial-gradient(circle, transparent 0 117px, #000 118px)';
  const art = svg(
    `<path d="${arc(129, 0, mins * 6)}" fill="none" stroke="${accent}" stroke-width="22" opacity=".9"></path><path d="${ticks(140, 144, 60, (i) => i % 5 !== 0 && i !== 0)}" stroke="${snow}" stroke-width="2" stroke-linecap="round" opacity=".7"></path><path d="M180 14 L172 28 H188 Z" fill="${snow}"></path><path d="${ticks(96, 110, 12, () => true)}" stroke="${t.ink}" stroke-width="6" stroke-linecap="round"></path><path d="${ticks(110, 114, 60, (i) => i % 5 !== 0)}" stroke="${t.ink2}" stroke-width="1.2" stroke-linecap="round" opacity=".55"></path>`,
  );
  const nums = each([10, 20, 30, 40, 50], (n) =>
    lbl(v, String(n), 131, n * 6, 13, snow, `${v.mono} font-weight: 500;`),
  );
  return `<div style="position: absolute; left: 34px; top: 9px; width: 292px; height: 292px; border-radius: 50%; background: var(--at-fc-dive-${v.th}); -webkit-mask-image: ${mask}; mask-image: ${mask}"></div>${art}${nums}<span style="position: absolute; left: 0; width: 360px; top: 196px; text-align: center; ${v.mono} font-size: max(13px, var(--lmin)); letter-spacing: .08em; color: ${accent}; font-variant-numeric: tabular-nums">${lx('dive.left', '{time} LEFT', { time: v.digits })}</span>${hands(v, `<span style="position: absolute; left: -5px; top: 22px; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid ${accent}; background: ${t.panel}"></span>`)}${pin(173, 148, 14, t.ink, `3px solid ${accent}`)}`;
};

const chrono: TDraw = (v) => {
  const { t, accent } = v;
  const mDeg = Math.min(v.m, 59.9) * 6;
  const sl = P(30, mDeg, 124, 160);
  const art = svg(
    `<path d="${ticks(128, 134, 60, (i) => i % 5 !== 0)}" stroke="${t.ink2}" stroke-width="1.2" opacity=".55"></path><path d="${ticks(124, 134, 60, (i) => i % 5 === 0)}" stroke="${t.ink}" stroke-width="2.4"></path><circle cx="124" cy="160" r="38" fill="${subBg(v)}" stroke="${t.line}" stroke-width="1"></circle><circle cx="236" cy="160" r="38" fill="${subBg(v)}" stroke="${t.line}" stroke-width="1"></circle><path d="${ticks(32, 36, 12, () => true, 124, 160)}" stroke="${t.ink2}" stroke-width="1.4" opacity=".7"></path><path d="${ticks(32, 36, 12, () => true, 236, 160)}" stroke="${t.ink2}" stroke-width="1.4" opacity=".7"></path><path d="${arc(26, 0, mDeg, 124, 160)}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"></path><line x1="124" y1="160" x2="${f1(sl[0])}" y2="${f1(sl[1])}" stroke="${t.ink}" stroke-width="3" stroke-linecap="round"></line><circle cx="124" cy="160" r="4" fill="${t.ink}"></circle>`,
  );
  const nums = each(Array.from({ length: 12 }), (_x, i) =>
    lbl(v, String((i + 1) * 5), 116, (i + 1) * 30, 12, t.ink2, v.mono),
  );
  const sub = (l: number, s: string) =>
    `<span style="position: absolute; left: ${l}px; width: 76px; top: 204px; text-align: center; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .12em; color: ${t.ink2}">${s}</span>`;
  const sweep = (l: number, tp: number, w: number, h: number, o: string, extra: string) =>
    `<div class="afx-s" style="position: absolute; left: ${l}px; top: ${tp}px; width: ${w}px; height: ${h}px; ${extra}background: ${accent}; transform-origin: 50% ${o}; transform: rotate(${v.secDeg.toFixed(2)}deg); --a: ${v.secDeg0.toFixed(2)}deg"></div>`;
  return `${art}${nums}${sub(86, lx('chrono.min', 'MIN'))}${sub(198, lx('chrono.sec', 'SEC'))}${sweep(234, 126, 4, 44, '77.3%', 'border-radius: 2px; ')}<div style="position: absolute; left: 232px; top: 156px; width: 8px; height: 8px; border-radius: 50%; background: ${accent}"></div>${box(130, 82, 100, 36, 8, v, 'font-size: 22px; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums', v.digits)}<span style="position: absolute; left: 0; width: 360px; top: 219px; text-align: center; font-size: max(14px, var(--lmin)); color: ${t.ink2}">${v.endLine}</span>${sweep(179, 25, 2, 160, '81.25%', `opacity: ${v.liveOp}; `)}${pin(174, 149, 12, accent, `2px solid ${v.capRing}`)}`;
};

const pilot: TDraw = (v) => {
  const { t, accent } = v;
  const sword = `linear-gradient(90deg, ${t.ink} 30%, ${accent} 30% 70%, ${t.ink} 70%)`;
  const art = svg(
    `<path d="${ticks(126, 132, 60, (i) => i % 5 !== 0)}" stroke="${t.ink2}" stroke-width="1.4" opacity=".6"></path><path d="${ticks(120, 132, 60, (i) => i % 5 === 0 && i !== 0)}" stroke="${t.ink}" stroke-width="3"></path><path d="M180 30 L170 48 H190 Z" fill="${t.ink}"></path><circle cx="166" cy="34" r="2.6" fill="${accent}"></circle><circle cx="194" cy="34" r="2.6" fill="${accent}"></circle><path d="${sectorPath(96, 134, v.minDeg, v.minDeg + span(v))}" fill="${v.a(15)}"></path>`,
  );
  const nums = each(Array.from({ length: 11 }), (_x, i) =>
    lbl(v, String(i + 1), 97, (i + 1) * 30, 24, t.ink, 'font-weight: 600; letter-spacing: -0.02em;'),
  );
  return `${art}${nums}${box(146, 196, 68, 26, 6, v, `${v.mono} font-size: max(13px, var(--lmin)); color: ${accent}; font-variant-numeric: tabular-nums`, v.digits)}<div class="afx-h" style="${hand(72, 10, 12, v.hourDeg, v.hourDeg0, sword, SWORD)}"></div><div class="afx-m" style="${hand(112, 12, 10, v.minDeg, v.minDeg0, sword, SWORD)}"></div><div class="afx-s" style="${hand(124, 30, 2, v.secDeg, v.secDeg0, accent)}"></div>${pin(172, 147, 16, t.ink, `3px solid ${accent}`)}`;
};

const dual: TDraw = (v) => {
  const { t, accent } = v;
  const one = (cx: number, cy: number, sec: number, lab: string, hc: string, ring: boolean) => {
    const H = P(36, ((sec / 3600) % 12) * 30, cx, cy);
    const M = P(54, ((sec / 60) % 60) * 6, cx, cy);
    return `<div style="position: absolute; left: ${cx - 74}px; top: ${cy - 74}px; width: 148px; height: 148px; border-radius: 50%; ${v.plate}${ring ? ` outline: 2px solid ${accent}; outline-offset: 3px;` : ''}"></div>${svg(`<path d="${ticks(60, 68, 12, () => true, cx, cy)}" stroke="${t.ink2}" stroke-width="2" stroke-linecap="round" opacity=".7"></path><line x1="${cx}" y1="${cy}" x2="${f1(H[0])}" y2="${f1(H[1])}" stroke="${hc}" stroke-width="5" stroke-linecap="round"></line><line x1="${cx}" y1="${cy}" x2="${f1(M[0])}" y2="${f1(M[1])}" stroke="${hc}" stroke-width="3.5" stroke-linecap="round"></line><circle cx="${cx}" cy="${cy}" r="4.5" fill="${hc}"></circle>`)}<span style="position: absolute; left: ${cx - 60}px; top: ${cy - 104}px; width: 120px; text-align: center; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; color: ${ring ? accent : t.ink2};">${lab}</span><span style="position: absolute; left: ${cx - 60}px; top: ${cy + 82}px; width: 120px; text-align: center; font-size: max(15px, var(--lmin)); font-weight: 600; color: ${ring ? accent : t.ink};">${v.t12(sec)}</span>`;
  };
  return `${one(96, 128, v.nowSec, lx('dual.now', 'NOW'), t.ink, false)}${one(264, 128, v.endSec, lx('dual.ends', 'ENDS'), accent, true)}${svg(`<path d="M164 122 H196 M188 114 L196 122 L188 130" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>`)}<div style="position: absolute; left: 0; top: 234px; width: 360px; display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 44px; font-weight: 300; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums">${v.digits}</span><span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; text-transform: uppercase; color: ${t.ink2}">${v.topWord}</span></div>`;
};

const GX = 180;
const GY = 175;
const gA = (f: number) => -120 + 240 * f;
const gTicks = (r1: number, r2: number, n: number, every: number) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    if (every && i % every !== 0) continue;
    if (!every && i % 10 === 0) continue;
    const A = P(r1, gA(i / n), GX, GY);
    const B = P(r2, gA(i / n), GX, GY);
    d += `M${f1(A[0])} ${f1(A[1])}L${f1(B[0])} ${f1(B[1])}`;
  }
  return d;
};

const gauge: TDraw = (v) => {
  const { t, accent } = v;
  const fr = v.st === 'idle' ? 1 : v.frac;
  const warn = v.total > 0 ? Math.min(1, 300 / v.total) : 0;
  const g = (f: number) => arc(130, gA(0) + 360, gA(f) + 360, GX, GY);
  const art = svg(
    `<path d="${g(1)}" fill="none" stroke="${t.track}" stroke-width="16" stroke-linecap="round"></path><path d="${g(warn)}" fill="none" stroke="var(--at-warn)" stroke-width="16" opacity=".35"></path><path d="${g(Math.max(0.002, fr))}" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"></path><path d="${gTicks(112, 118, 40, 0)}" stroke="${t.ink2}" stroke-width="1.4" opacity=".55"></path><path d="${gTicks(104, 118, 40, 10)}" stroke="${t.ink}" stroke-width="2.6"></path>`,
  );
  const nums = each([0, 0.25, 0.5, 0.75, 1], (q) =>
    lbl(v, String(Math.round((v.total / 60) * q)), 96, gA(q), 13, t.ink2, v.mono, GX, GY),
  );
  const o = `transform-origin: ${GX}px ${GY}px`;
  return `${art}${nums}<div class="af-tr" style="position: absolute; left: 0; top: 0; width: 360px; height: 310px; ${o}; transform: rotate(${gA(fr).toFixed(2)}deg)"><div class="afx-jit" style="position: absolute; left: 0; top: 0; width: 360px; height: 310px; ${o}"><div style="position: absolute; left: 177px; top: 63px; width: 6px; height: 130px; border-radius: 3px; background: linear-gradient(180deg, ${accent}, ${t.ink} 70%)"></div></div></div><div style="position: absolute; left: 166px; top: 161px; width: 28px; height: 28px; border-radius: 50%; background: ${t.ink}; border: 4px solid ${t.panel}; box-shadow: 0 0 0 2px ${t.line}"></div><div style="position: absolute; left: 0; top: 206px; width: 360px; display: flex; flex-direction: column; align-items: center; gap: 4px"><span style="font-size: 46px; font-weight: 400; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums">${v.digits}</span><span style="font-size: max(14px, var(--lmin)); color: ${t.ink2}">${v.endLine}</span></div>`;
};

export default { analog: dial(false), luxe: dial(true), dive, chrono, pilot, dual, gauge };

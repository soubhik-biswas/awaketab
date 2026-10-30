import { type Draw, f1, mx, P, ticks, type V } from '../base.js';
import { arc, bk, dash, each, lbl, lx, stars, svg, wh } from '../kit.js';

const box = 'position: absolute; left: 0; top: 0; width: 360px; height: 310px';
const col = 'display: flex; flex-direction: column';
const kick = (v: V) =>
  `<span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; text-transform: uppercase; color: ${v.t.ink2}">${v.topWord}</span>`;
const num = (fs: number, w = 300, extra = '') =>
  `font-size: ${fs}px; font-weight: ${w}; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums;${extra}`;
const end = (v: V, fs: number, c = v.t.ink2) =>
  `<span style="font-size: max(${fs}px, var(--lmin)); color: ${c}">${v.endLine}</span>`;
const ringOp = (v: V) => (v.st === 'idle' ? 0.35 : v.ringFrac === 0 ? 0 : 1);
const sweep = (v: V, l: number, tp: number, sz: number, op: number, body: string, extra = '') =>
  `<div class="afx-s" style="position: absolute; left: ${l}px; top: ${tp}px; width: ${sz}px; height: ${sz}px; ${extra}transform: rotate(${v.secDeg.toFixed(2)}deg); --a: ${v.secDeg0.toFixed(2)}deg; opacity: ${op}">${body}</div>`;
const rot = 'transform="rotate(-90 180 155)"';

const C1 = 2 * Math.PI * 128;
const C2 = 2 * Math.PI * 104;
const C3 = 2 * Math.PI * 80;

const rings: Draw = (v) => {
  const { t, accent, mc2, mc3, st } = v;
  const idle = st === 'idle';
  const ring = (r: number, track: string, c: string, d: string, op: number | string) =>
    `<circle cx="180" cy="155" r="${r}" fill="none" stroke="${track}" stroke-width="18"></circle><circle class="af-tr" cx="180" cy="155" r="${r}" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round" style="stroke-dasharray: ${d}" ${rot} opacity="${op}"></circle>`;
  return `${svg(
    ring(128, v.a(15), accent, dash(C1, idle ? 1 : v.frac), 1) +
      ring(104, mx(mc2, 15), mc2, dash(C2, idle ? 1 : (v.m + v.s / 60) / 60), v.multi ? 1 : 0.72) +
      ring(80, mx(mc3, 15), mc3, dash(C3, idle ? 1 : v.s / 60), v.multi ? 1 : 0.48),
  )}${sweep(v, 100, 75, 160, v.liveOp, `<span style="position: absolute; left: 76px; top: -4px; width: 8px; height: 8px; border-radius: 50%; background: ${t.ink}; box-shadow: 0 0 10px ${accent}"></span>`)}<div style="${box}; ${col}; align-items: center; justify-content: center; gap: 4px"><span style="${num(v.long ? 34 : 46, 400)} letter-spacing: -0.03em">${v.digits}</span><span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .1em; color: ${t.ink2}">${v.endShort}</span></div>`;
};

const radar: Draw = (v) => {
  const { accent, th } = v;
  const blip = P(110, 360 * (v.st === 'idle' ? 1 : v.frac));
  const pill = th === 'l' ? wh(90) : mx('var(--at-fc-deep)', 85);
  return `<div style="position: absolute; left: 44px; top: 19px; width: 272px; height: 272px; border-radius: 50%; overflow: hidden; background: var(--at-fc-radar-${th}); box-shadow: ${v.cardShadow}"><div class="afx-radar" style="position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, ${v.a(60)} 0deg, ${v.a(15)} 40deg, transparent 90deg 360deg); opacity: ${v.live || v.st === 'idle' ? 1 : 0.35}; transform: rotate(${(360 * (1 - v.frac)).toFixed(1)}deg)"></div></div>${svg(
    `<circle cx="180" cy="155" r="45" fill="none" stroke="${v.a(25)}" stroke-width="1"></circle><circle cx="180" cy="155" r="90" fill="none" stroke="${v.a(25)}" stroke-width="1"></circle><circle cx="180" cy="155" r="135" fill="none" stroke="${v.a(60)}" stroke-width="1.5"></circle><path d="M180 20 V290 M45 155 H315" stroke="${v.a(25)}" stroke-width="1"></path><path d="${ticks(128, 135, 36, () => true)}" stroke="${accent}" stroke-width="1.4" opacity=".7"></path><circle class="afx-pulse" cx="${f1(blip[0])}" cy="${f1(blip[1])}" r="9" fill="${accent}" opacity="${v.haloOp}"></circle><circle cx="${f1(blip[0])}" cy="${f1(blip[1])}" r="5" fill="${accent}"></circle>`,
  )}<div style="position: absolute; left: 116px; top: 128px; width: 128px; height: 54px; border-radius: 12px; background: ${pill}; border: 1px solid ${v.a(25)}; ${col}; align-items: center; justify-content: center"><span style="${num(26, 500)} letter-spacing: -0.03em">${v.digits}</span><span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .08em; color: ${accent}">${v.endShort}</span></div>`;
};

const labels = (v: V, gap: number, fs: number, endFs: number) =>
  `<div style="${box}; ${col}; align-items: center; justify-content: center; gap: ${gap}px">${kick(v)}<span style="${num(fs)}">${v.digits}</span>${end(v, endFs)}</div>`;

const dots: Draw = (v) => {
  const lit = v.st === 'idle' ? 60 : Math.round(v.frac * 60);
  const list = each(Array.from({ length: 60 }), (_x, i) => {
    const q = P(128, i * 6);
    const on = i < lit;
    const cur = v.live && i === lit - 1;
    const big = i % 5 === 0;
    const sz = big ? 9 : 6;
    const c = v.heat((i + 1) / 60);
    return `<span class="${cur ? 'afx-breath' : ''}" style="position: absolute; left: ${f1(q[0] - sz / 2)}px; top: ${f1(q[1] - sz / 2)}px; width: ${sz}px; height: ${sz}px; border-radius: 50%; background: ${on ? c : v.t.track};${on && big ? ` box-shadow: 0 0 8px ${mx(c, 40)};` : ''}"></span>`;
  });
  return list + labels(v, 6, v.long ? 52 : 72, 15);
};

const C134 = 2 * Math.PI * 134;
const ORBIT_STARS = [
  [118, 70, 2],
  [240, 76, 3],
  [92, 150, 2],
  [262, 190, 2],
  [140, 232, 3],
  [226, 236, 2],
  [200, 50, 2],
  [70, 112, 2],
  [286, 120, 2],
  [110, 200, 2],
] as const;

const orbit: Draw = (v) => {
  const { t, mc1, mc2, mc3, st } = v;
  const p = P(134, 360 * v.ringFrac);
  const ang = st === 'idle' ? 359.9 : Math.min(359.9, ((v.m % 60) + v.s / 60) * 6);
  const mo = P(110, ang);
  const d = st === 'starting' ? '10 16' : dash(C134, v.ringFrac);
  const mask = 'radial-gradient(circle, transparent 0 86px, #000 86.5px 89.5px, transparent 90px)';
  return `${stars(ORBIT_STARS, [t.ink2, mc2, mc3, t.ink2])}${svg(
    `<circle cx="180" cy="155" r="134" fill="none" stroke="${t.line}" stroke-width="1.5"></circle><circle cx="180" cy="155" r="110" fill="none" stroke="${t.line}" stroke-width="1.2" stroke-dasharray="2 5"></circle><circle cx="180" cy="155" r="88" fill="none" stroke="${t.line}" stroke-width="1"></circle><circle class="af-tr" cx="180" cy="155" r="134" fill="none" stroke="${mc1}" stroke-width="4" stroke-linecap="round" ${rot} style="stroke-dasharray: ${d}" opacity="${ringOp(v)}"></circle><path d="${arc(110, 0, ang)}" fill="none" stroke="${mc2}" stroke-width="3" stroke-linecap="round" opacity=".6"></path><circle class="afx-pulse" cx="${f1(p[0])}" cy="${f1(p[1])}" r="14" fill="${mc1}" opacity="${v.haloOp}"></circle><circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="9" fill="${mc1}" stroke="${t.panel}" stroke-width="3"></circle><circle cx="${f1(mo[0])}" cy="${f1(mo[1])}" r="7" fill="${mc2}" stroke="${t.panel}" stroke-width="2.5"></circle>`,
  )}${sweep(v, 90, 65, 180, v.liveOp, `<div style="position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg 250deg, ${mx(mc3, 80)} 360deg); -webkit-mask-image: ${mask}; mask-image: ${mask}"></div><span style="position: absolute; left: 84px; top: -4px; width: 12px; height: 12px; border-radius: 50%; background: ${mc3}; box-shadow: 0 0 12px ${mx(mc3, 80)}"></span>`, 'border-radius: 50%; ')}${labels(v, 5, v.long ? 36 : 48, 13)}`;
};

const disc: Draw = (v) => {
  const { t, th, FILL, lamp, accent } = v;
  const deg = 360 * (v.st === 'idle' ? 1 : v.frac);
  const dq = (sec: number) => Math.min(359, (360 * sec) / Math.max(1, v.total)).toFixed(1);
  const fill = v.multi
    ? `conic-gradient(from 0deg, ${FILL.ember} 0deg, ${FILL.amber} ${dq(300)}deg, ${FILL.lime} ${dq(900)}deg, ${lamp} ${dq(1800)}deg, ${lamp} 360deg)`
    : `radial-gradient(circle, ${accent}, ${v.a(80)})`;
  const mask = `conic-gradient(#000 0deg ${deg.toFixed(2)}deg, transparent ${deg.toFixed(2)}deg 360deg)`;
  const e = P(105, deg);
  const edge = deg > 1 && deg < 359 ? 1 : 0;
  const nums = each(Array.from({ length: 12 }), (_x, i) =>
    lbl(v, String(Math.round(((v.total / 60) * i) / 12)), 128, i * 30, 12, t.ink2, `${v.mono} font-weight: 500;`),
  );
  const masked = (bg: string, cls = '') =>
    `<div class="${cls}" style="position: absolute; left: 76px; top: 51px; width: 208px; height: 208px; border-radius: 50%; background: ${bg}; -webkit-mask-image: ${mask}; mask-image: ${mask}"></div>`;
  const light = th === 'l';
  return `${svg(
    `<circle cx="180" cy="155" r="105" fill="var(--at-fc-well-${th})"></circle><path d="${ticks(110, 115, 60, (i) => i % 5 !== 0)}" stroke="${t.ink2}" stroke-width="1.2" opacity=".55"></path><path d="${ticks(108, 117, 12, () => true)}" stroke="${t.ink}" stroke-width="2.4" stroke-linecap="round"></path>`,
  )}${nums}${masked(fill, 'af-tr')}${masked(`radial-gradient(circle at 50% 22%, ${wh(22)}, transparent 58%)`)}${svg(
    `<line x1="180" y1="155" x2="${f1(e[0])}" y2="${f1(e[1])}" stroke="${t.panel}" stroke-width="3" stroke-linecap="round" opacity="${edge}"></line><line x1="180" y1="155" x2="180" y2="50" stroke="${t.panel}" stroke-width="3" stroke-linecap="round" opacity="${edge}"></line>`,
  )}<div style="position: absolute; left: 162px; top: 137px; width: 36px; height: 36px; border-radius: 50%; background: var(--at-fc-knob-${light ? 'l' : 'd'}); box-shadow: 0 4px 12px ${bk(35)}, inset 0 1px 0 ${wh(25)}; display: flex; align-items: center; justify-content: center"><span style="width: 10px; height: 10px; border-radius: 50%; background: ${v.mc1}"></span></div><div style="position: absolute; left: 110px; top: 190px; width: 140px; height: 56px; border-radius: 18px; background: ${light ? wh(94) : mx('var(--at-fc-abyss)', 90)}; border: 1px solid ${t.line}; box-shadow: 0 10px 24px ${bk(25)}; ${col}; align-items: center; justify-content: center; gap: 2px"><span style="font-size: ${v.long ? 22 : 28}px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; color: ${t.ink}">${v.digits}</span><span style="${v.mono} font-size: max(12px, var(--lmin)); color: ${t.ink2}">${v.endLine}</span></div>`;
};

const C140 = 2 * Math.PI * 140;
const MOON_STARS = [
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
] as const;
const MOON_COLS = [
  'var(--at-fc-white)',
  'var(--at-fc-star-sky)',
  'var(--at-fc-star-violet)',
  'var(--at-fc-white)',
  'var(--at-fc-star-pink)',
];
const MOON_DARK: Partial<Record<V['st'], string>> = {
  idle: 'var(--at-fc-dk-idle)',
  paused: 'var(--at-fc-dk-warn)',
  blocked: 'var(--at-fc-dk-bad)',
  unsupported: 'var(--at-fc-dk-info)',
  up: 'var(--at-fc-dk-ended)',
};

const moon: Draw = (v) => {
  const { st } = v;
  const mk = st === 'idle' ? 1 : v.frac;
  const R = 56;
  let lit = '';
  if (mk >= 0.995) lit = `M180 ${104 - R} A${R} ${R} 0 1 1 180 ${104 + R} A${R} ${R} 0 1 1 180 ${104 - R} Z`;
  else if (mk > 0.005)
    lit = `M180 ${104 - R} A${R} ${R} 0 0 1 180 ${104 + R} A${(R * Math.abs(1 - 2 * mk)).toFixed(2)} ${R} 0 0 ${mk < 0.5 ? 0 : 1} 180 ${104 - R} Z`;
  const phase =
    st === 'up'
      ? lx('moon.up', 'New moon · ended')
      : st === 'idle'
        ? lx('moon.idle', 'Full moon · ready')
        : lx(
            v.live || st === 'starting' ? 'moon.waning' : 'moon.hold',
            v.live || st === 'starting' ? '{pct}% lit · waning' : '{pct}% lit · on hold',
            {
              pct: Math.round(mk * 100),
            },
          );
  const tag = v.night ? v.mc2 : (MOON_DARK[st] ?? 'var(--at-fc-star-sky)');
  const crater = (cx: number, cy: number, r: number, o: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${mx('var(--at-fc-crater)', o)}"></circle>`;
  return `<div style="position: absolute; left: 34px; top: 9px; width: 292px; height: 292px; border-radius: 50%; overflow: hidden; background: var(--at-fc-moon-sky); box-shadow: var(--at-fc-moon-shadow-${v.night ? 'd' : 'l'})">${stars(MOON_STARS, MOON_COLS)}<div class="afx-breath" style="position: absolute; left: 56px; top: 5px; width: 180px; height: 180px; border-radius: 50%; background: var(--at-fc-moon-glow)"></div></div>${svg(
    `<defs><radialGradient id="af-moon-lit" cx="42%" cy="36%" r="72%"><stop offset="0" stop-color="var(--at-fc-moon-1)"></stop><stop offset=".62" stop-color="var(--at-fc-moon-2)"></stop><stop offset="1" stop-color="var(--at-fc-moon-3)"></stop></radialGradient></defs><circle cx="180" cy="155" r="140" fill="none" stroke="${wh(8)}" stroke-width="3"></circle><circle class="af-tr" cx="180" cy="155" r="140" fill="none" stroke="${v.mc1}" stroke-width="3" stroke-linecap="round" ${rot} style="stroke-dasharray: ${dash(C140, v.ringFrac)}" opacity="${ringOp(v)}"></circle><circle cx="180" cy="104" r="56" fill="${wh(6)}" stroke="${wh(14)}" stroke-width="1"></circle><path class="af-tr" d="${lit}" fill="url(#af-moon-lit)"></path>${crater(167, 88, 8, 8)}${crater(195, 116, 11, 7)}${crater(184, 82, 5, 8)}${crater(162, 121, 6, 7)}`,
  )}<div style="position: absolute; left: 0; top: 176px; width: 360px; ${col}; align-items: center; gap: 4px"><span style="${num(v.long ? 34 : 44)} color: var(--at-fc-snow)">${v.digits}</span>${end(v, 13, 'var(--at-fc-moon-ink)')}<span style="margin-top: 2px; ${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .08em; color: ${tag}">${phase}</span></div>`;
};

const PX = 14;

const tape: Draw = (v) => {
  const { t, FILL, lamp, accent } = v;
  const tm = Math.max(5, Math.min(180, Math.ceil(v.total / 60)));
  const shown = v.st === 'idle' ? v.total : v.r;
  const tw = tm * PX;
  const tp = (min: number) => `${Math.min(100, (100 * min * PX) / tw).toFixed(1)}%`;
  const heat = v.multi
    ? `linear-gradient(90deg, ${FILL.ember} 0%, ${FILL.amber} ${tp(5)}, ${FILL.lime} ${tp(15)}, ${lamp} ${tp(30)}, ${lamp} 100%)`
    : accent;
  let marks = '';
  for (let i = 0; i <= tm; i++) {
    const maj = i % 5 === 0;
    marks += `<span style="position: absolute; left: ${i * PX - (maj ? 1 : 0.75)}px; top: ${maj ? 12 : 18}px; width: ${maj ? 2 : 1.5}px; height: ${maj ? 24 : 12}px; border-radius: 1px; background: ${maj ? t.ink : t.ink2}; opacity: ${maj ? 0.9 : 0.5};"></span>`;
    if (maj)
      marks += `<span style="position: absolute; left: ${i * PX - 20}px; top: 44px; width: 40px; text-align: center; ${v.mono} font-size: max(12px, var(--lmin)); color: ${t.ink2};">${i}</span>`;
  }
  const fade = 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)';
  const spent = mx(v.theme === 'light' ? 'var(--at-fc-paper)' : 'var(--at-fc-deep)', 62);
  return `<div style="position: absolute; left: 0; top: 22px; width: 360px; ${col}; align-items: center; gap: 6px">${kick(v)}<span style="${num(v.long ? 52 : 72)} letter-spacing: -0.045em">${v.digits}</span>${end(v, 14)}</div><div style="position: absolute; left: 20px; top: 172px; width: 320px; height: 96px; border-radius: 18px; background: var(--at-fc-tape-${v.th}); box-shadow: ${v.cardShadow}; overflow: hidden"><div style="position: absolute; inset: 0; -webkit-mask-image: ${fade}; mask-image: ${fade}"><div class="af-tr" style="position: absolute; top: 0; left: ${(160 - (shown / 60) * PX).toFixed(1)}px; width: ${tw}px; height: 96px">${marks}<div style="position: absolute; left: 0; top: 72px; width: ${tw}px; height: 6px; border-radius: 3px; background: ${heat}"></div></div><div style="position: absolute; left: 160px; top: 0; right: 0; bottom: 0; background: ${spent}"></div></div><div style="position: absolute; left: 159px; top: 0; width: 2px; height: 96px; background: ${v.mc1}; box-shadow: 0 0 12px ${mx(v.mc1, 60)}"></div><svg style="position: absolute; left: 150px; top: 0" width="20" height="12" viewBox="0 0 20 12" aria-hidden="true"><path d="M0 0 H20 L10 11 Z" fill="${v.mc1}"></path></svg></div>`;
};

const timeline: Draw = (v) => {
  const { t, accent } = v;
  const f = v.st === 'idle' ? 0 : 1 - v.frac;
  const x = `${(22 + 280 * f).toFixed(1)}px`;
  const lab = (s: string) =>
    `<span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .14em; color: ${t.ink2}">${s}</span>`;
  const mark = (cls: string, extra: string) =>
    `<span class="${cls}" style="position: absolute; top: 96px; left: ${x}; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: ${accent}; ${extra}"></span>`;
  const notch = (side: string) =>
    `<span style="position: absolute; ${side}: -11px; top: 126px; width: 22px; height: 22px; border-radius: 50%; background: ${t.ground}"></span>`;
  return `<div style="position: absolute; left: 18px; top: 22px; width: 324px; height: 266px; border-radius: 24px; background: ${t.panel}; box-shadow: ${v.cardShadow}; overflow: hidden"><div style="position: absolute; left: 22px; top: 20px; ${col}; gap: 2px">${lab(lx('tl.now', 'NOW'))}<span style="font-size: 24px; font-weight: 500; letter-spacing: -0.02em">${v.t12(v.nowSec)}</span></div><div style="position: absolute; right: 22px; top: 20px; ${col}; align-items: flex-end; gap: 2px">${lab(lx('tl.ends', 'ENDS'))}<span style="font-size: 24px; font-weight: 500; letter-spacing: -0.02em; color: ${accent}">${v.endShort}</span></div><div style="position: absolute; left: 22px; right: 22px; top: 104px; height: 2px; background-image: linear-gradient(90deg, ${t.ink2} 50%, transparent 50%); background-size: 8px 2px; opacity: .5"></div><div class="af-tr" style="position: absolute; left: 22px; top: 103px; height: 4px; border-radius: 2px; width: ${(280 * f).toFixed(1)}px; background: ${t.ink2}; opacity: .55"></div><span style="position: absolute; left: 16px; top: 98px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${t.ink2}; background: ${t.panel}"></span><span style="position: absolute; right: 16px; top: 98px; width: 12px; height: 12px; border-radius: 50%; background: ${accent}"></span>${mark('af-tr', `box-shadow: 0 0 0 4px ${v.a(15)}`)}${mark('afx-pulse-d', `opacity: ${v.haloOp}`)}<div style="position: absolute; left: 0; right: 0; top: 136px; height: 1px; background-image: linear-gradient(90deg, ${t.line} 50%, transparent 50%); background-size: 10px 1px"></div>${notch('left')}${notch('right')}<div style="position: absolute; left: 0; right: 0; top: 156px; ${col}; align-items: center; gap: 4px"><span style="${num(60)}">${v.digits}</span>${kick(v)}</div></div>`;
};

export default { rings, radar, dots, orbit, disc, moon, tape, timeline };

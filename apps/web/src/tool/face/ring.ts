import { type Draw, f1, P, ticks } from './base.js';

const C = 2 * Math.PI * 138;
const MINOR = ticks(124, 129, 60, (i) => i % 5 !== 0);
const MAJOR = ticks(118, 129, 60, (i) => i % 5 === 0);

// Ring, the signature face: the lamp rides the end of the arc and every other state takes its status colour.
export const ring: Draw = (v) => {
  const { t, accent, ringFrac } = v;
  const dot = P(138, 360 * ringFrac);
  const dash = v.st === 'starting' ? '10 16' : `${(C * Math.max(0.0001, ringFrac)).toFixed(1)} ${C.toFixed(1)}`;
  const op = v.st === 'idle' ? 0.35 : ringFrac === 0 ? 0 : 1;
  const mask = 'radial-gradient(circle, transparent 0 109px, #000 109.5px 112px, transparent 112.5px)';
  return `<svg style="position: absolute; left: 0; top: 0" width="360" height="310" viewBox="0 0 360 310" aria-hidden="true"><path d="${MINOR}" stroke="${t.ink2}" stroke-width="1.4" stroke-linecap="round" opacity=".35"></path><path d="${MAJOR}" stroke="${t.ink}" stroke-width="2.4" stroke-linecap="round" opacity=".55"></path><circle cx="180" cy="155" r="138" fill="none" stroke="${t.track}" stroke-width="7"></circle><circle class="af-tr" cx="180" cy="155" r="138" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" transform="rotate(-90 180 155)" style="stroke-dasharray: ${dash}" opacity="${op}"></circle><circle class="afx-pulse" cx="${f1(dot[0])}" cy="${f1(dot[1])}" r="12" fill="${accent}" opacity="${v.haloOp}"></circle><circle cx="${f1(dot[0])}" cy="${f1(dot[1])}" r="7" fill="${v.hollow ? t.panel : accent}" stroke="${accent}" stroke-width="3"></circle></svg><div class="afx-s" style="position: absolute; left: 68px; top: 43px; width: 224px; height: 224px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg 290deg, ${v.a(60)} 360deg); -webkit-mask-image: ${mask}; mask-image: ${mask}; transform: rotate(${v.secDeg.toFixed(2)}deg); --a: ${v.secDeg0.toFixed(2)}deg; opacity: ${v.liveOp}"></div><div style="position: absolute; left: 0; top: 0; width: 360px; height: 310px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px"><span style="${v.mono} font-size: max(12px, var(--lmin)); letter-spacing: .16em; text-transform: uppercase; color: ${t.ink2}">${v.topWord}</span><span style="font-size: ${v.long ? 52 : 72}px; font-weight: 300; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1">${v.digits}</span><span style="font-size: max(15px, var(--lmin)); color: ${t.ink2}">${v.endLine}</span></div>`;
};

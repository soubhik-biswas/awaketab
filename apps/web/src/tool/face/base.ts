import { FACE_IDS, type TFace } from '@awaketab/core';

export type FaceId = TFace;
export type FaceState = 'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'blocked' | 'unsupported' | 'up';
export type FaceTheme = 'light' | 'dark' | 'oled';

export interface FaceProps {
  face: FaceId;
  theme: FaceTheme;
  state: FaceState;
  remain: number;
  total: number;
  nowSec: number;
  size: number;
  lamp?: string;
  bare?: boolean;
  indef?: boolean;
  motion?: 'auto' | 'off';
  lblTop?: string;
  lblEnd?: string;
  fmt?: 12 | 24;
}

// English defaults for the words drawn on the faces; setFaceText swaps in a locale's strings (face.t.* in en.json).
export const TX: Record<string, string> = {
  'top.idle': 'ready',
  'top.starting': 'starting',
  'top.running': 'left',
  'top.fallback': 'left',
  'top.paused': 'paused',
  'top.blocked': 'not awake',
  'top.unsupported': 'not awake',
  'top.up': 'time’s up',
  'top.awakeFor': 'awake for',
  'cap.idle': 'Ready',
  'cap.starting': 'Starting…',
  'cap.running': 'Screen awake',
  'cap.fallback': 'Awake via video fallback',
  'cap.paused': 'Paused — tab hidden',
  'cap.blocked': 'Blocked — here’s the fix',
  'cap.unsupported': 'Tap to use the fallback',
  'cap.up': 'Time’s up',
  'end.until': 'until {time}',
  'end.ended': 'Ended {time}',
  'end.idle': '{min} min · ends {time}',
  'end.indefIdle': 'until you stop it',
  'end.indef': 'no end · until you stop',
  'aria.left': '{time} remaining',
  'aria.h': '{h} h {m} min',
  'aria.m': '{m} min',
  am: 'AM',
  pm: 'PM',
};

export function setFaceText(next: Record<string, string>): void {
  Object.assign(TX, next);
}

export const tx = (k: string, vars?: Record<string, string | number>): string =>
  (TX[k] ?? k).replace(/\{(\w+)\}/gu, (_m, n: string) => String(vars?.[n] ?? ''));

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: string): string => s.replace(/[&<>"]/gu, (c) => ESC[c] ?? c);
export const pad = (n: number): string => String(n).padStart(2, '0');
export const f1 = (n: number): string => n.toFixed(1);
export const mx = (col: string, pct: number): string => `color-mix(in srgb, ${col} ${pct}%, transparent)`;
export const CX = 180;
export const CY = 155;

export const P = (rr: number, deg: number, cx = CX, cy = CY): [number, number] => {
  const q = ((deg - 90) * Math.PI) / 180;
  return [cx + rr * Math.cos(q), cy + rr * Math.sin(q)];
};

export const ticks = (r1: number, r2: number, n: number, keep: (i: number) => boolean, cx = CX, cy = CY): string => {
  let d = '';
  for (let i = 0; i < n; i++) {
    if (!keep(i)) continue;
    const deg = (360 * i) / n;
    const A = P(r1, deg, cx, cy);
    const B = P(r2, deg, cx, cy);
    d += `M${f1(A[0])} ${f1(A[1])}L${f1(B[0])} ${f1(B[1])}`;
  }
  return d;
};

interface Pal {
  ink: string;
  ink2: string;
  line: string;
  track: string;
  panel: string;
  card: string;
  cardInk: string;
  ground: string;
  lcdS: string;
}

// Face colours are page tokens; the theme prop only picks the few roles where the OLED face differs from the page.
const pal = (theme: FaceTheme): Pal => {
  const o = theme === 'oled';
  return {
    ink: 'var(--at-ink)',
    ink2: 'var(--at-ink-2)',
    line: o ? 'var(--at-surface-3)' : 'var(--at-line)',
    track: o ? 'var(--at-surface-2)' : 'var(--at-surface-3)',
    panel: o ? 'var(--at-ground)' : 'var(--at-surface)',
    card: o ? 'var(--at-fc-card-o)' : 'var(--at-fc-card)',
    cardInk: 'var(--at-fc-snow)',
    ground: 'var(--at-ground)',
    lcdS: theme === 'light' ? 'var(--at-lamp-soft)' : `var(--at-fc-lcd-${o ? 'o' : 'd'})`,
  };
};

const STATUS: Record<FaceState, string> = {
  idle: 'var(--at-ink-2)',
  starting: 'var(--fl)',
  running: 'var(--fl)',
  fallback: 'var(--fl)',
  paused: 'var(--at-warn)',
  blocked: 'var(--at-bad)',
  unsupported: 'var(--at-info)',
  up: 'var(--at-ended)',
};

const sky = 'var(--at-face-sky)';
const violet = 'var(--at-face-violet)';
const FILL = {
  amber: 'var(--at-face-fill-amber)',
  lime: 'var(--at-face-fill-lime)',
  ember: 'var(--at-face-fill-ember)',
};
const TONE = { amber: 'var(--at-face-amber)', lime: 'var(--at-face-lime)', ember: 'var(--at-face-ember)' };

export type V = ReturnType<typeof vals>;
export type Draw = (v: V) => string;

export const isFace = (id: unknown): id is FaceId => (FACE_IDS as readonly unknown[]).includes(id);

export function vals(p: FaceProps, t0: number) {
  const face: FaceId = isFace(p.face) ? p.face : 'ring';
  const theme: FaceTheme = p.theme === 'light' || p.theme === 'oled' ? p.theme : 'dark';
  const th = theme === 'light' ? 'l' : theme === 'oled' ? 'o' : 'd';
  const st: FaceState = p.state in STATUS ? p.state : 'running';
  const total = Number(p.total) || 0;
  let remain = Number(p.remain) || 0;
  if (st === 'idle') remain = total;
  if (st === 'up') remain = 0;
  const size = Number(p.size) || 360;
  const nowSec = Number(p.nowSec) || 0;
  const fmt = p.fmt === 24 ? 24 : 12;
  // 240 px and up keep every label at 12 px or more on screen; below 170 px the face is compact (digits, graphics).
  const LMIN = size >= 240 && size < 360 ? (12 * 360) / size : 0;
  const t = pal(theme);
  const night = theme !== 'light';
  const lampVal = p.lamp && /^#[0-9a-f]{6}$/iu.test(p.lamp) ? p.lamp : 'var(--at-accent)';
  const lamp = 'var(--fl)';
  const accent = 'var(--fa)';
  const a = (pct: number) => mx(accent, pct);
  const live = (st === 'running' || st === 'fallback') && p.motion !== 'off';
  const multi = live || st === 'starting';
  const mc1 = multi ? lamp : accent;
  const mc2 = multi ? sky : accent;
  const mc3 = multi ? violet : accent;
  // Heat scale for time left: green over 50 %, lime to 25 %, amber to 8 %, ember for the last stretch.
  const heat = (q: number) =>
    !multi ? accent : q <= 0.084 ? FILL.ember : q <= 0.25 ? FILL.amber : q <= 0.5 ? FILL.lime : lamp;
  const heatT = (q: number) =>
    !multi ? accent : q <= 0.084 ? TONE.ember : q <= 0.25 ? TONE.amber : q <= 0.5 ? TONE.lime : lamp;

  const r = Math.max(0, Math.round(remain));
  const h = Math.floor(r / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;
  const digitsRaw = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  const indef = p.indef === true;
  const digits = indef && st === 'idle' ? '∞' : digitsRaw;
  const long = digits.length > 5;
  const lc = digits.lastIndexOf(':');
  const dL = lc > 0 ? digits.slice(0, lc) : digits;
  const dR = lc > 0 ? digits.slice(lc + 1) : '';
  const frac = total > 0 ? Math.min(1, r / total) : 1;
  const t12 = (sec: number) => {
    const x = ((sec % 86_400) + 86_400) % 86_400;
    const hh = Math.floor(x / 3600);
    const mm = Math.floor((x % 3600) / 60);
    return fmt === 12 ? `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? TX.am : TX.pm}` : `${pad(hh)}:${pad(mm)}`;
  };
  const endSec = nowSec + r;
  const endShort = t12(endSec);
  const eh = Math.floor((endSec % 86_400) / 3600);
  const em = Math.floor((endSec % 3600) / 60);
  let endLine =
    st === 'up'
      ? tx('end.ended', { time: endShort })
      : st === 'idle'
        ? tx('end.idle', { min: Math.round(total / 60), time: endShort })
        : tx('end.until', { time: endShort });
  let topWord = tx(`top.${st}`);
  if (indef) {
    endLine = tx(st === 'idle' ? 'end.indefIdle' : 'end.indef');
    if (st === 'running' || st === 'fallback') topWord = tx('top.awakeFor');
  }
  if (p.lblTop) topWord = p.lblTop;
  if (p.lblEnd) endLine = p.lblEnd;
  const capText = tx(`cap.${st}`);
  const mins = Math.ceil(r / 60);
  const left =
    st === 'up' || indef
      ? ''
      : tx('aria.left', {
          time: mins >= 60 ? tx('aria.h', { h: Math.floor(mins / 60), m: mins % 60 }) : tx('aria.m', { m: mins }),
        });
  const aria = [capText, left, endLine].filter(Boolean).join(', ');

  const ringFrac = st === 'idle' ? 1 : frac;
  const hourDeg = ((nowSec / 3600) % 12) * 30;
  const minDeg = ((nowSec / 60) % 60) * 6;
  const secDeg = (nowSec % 60) * 6;
  const hourDeg0 = ((t0 / 3600) % 12) * 30;
  const minDeg0 = ((t0 / 60) % 60) * 6;
  const secDeg0 = (t0 % 60) * 6;
  const ga = h > 0 ? pad(h) : pad(m);
  const gb = h > 0 ? pad(m) : pad(s);

  return {
    face,
    theme,
    th,
    st,
    total,
    size,
    nowSec,
    fmt,
    LMIN,
    t,
    night,
    lampVal,
    accentVal: STATUS[st],
    lamp,
    accent,
    a,
    live,
    still: p.motion === 'off',
    multi,
    mc1,
    mc2,
    mc3,
    sky,
    violet,
    FILL,
    TONE,
    heat,
    heatT,
    r,
    h,
    m,
    s,
    digits,
    long,
    dL,
    dR,
    frac,
    t12,
    endSec,
    endShort,
    eh,
    em,
    endLine: esc(endLine),
    topWord: esc(topWord),
    capText: esc(capText),
    aria,
    indef,
    ringFrac,
    haloOp: live ? 0.6 : 0,
    liveOp: live ? 1 : 0,
    hollow: st === 'paused' || st === 'idle' || st === 'blocked' || st === 'unsupported',
    hourDeg,
    minDeg,
    secDeg,
    hourDeg0,
    minDeg0,
    secDeg0,
    ga,
    gb,
    four: (ga + gb).split('').map(Number),
    pctLabel: `${Math.round(frac * 100)}%`,
    fracPct: `${(frac * 100).toFixed(1)}%`,
    plate: `background: var(--at-fc-plate-${th}); box-shadow: var(--at-fc-plate-shadow-${th});`,
    cardShadow: `var(--at-fc-card-shadow-${th})`,
    capRing: theme === 'light' ? 'var(--at-surface)' : t.panel,
    mono: 'font-family: var(--at-font-mono);',
  };
}

const PLATED = new Set<FaceId>(['ring', 'analog', 'luxe', 'rings', 'dive', 'chrono', 'pilot', 'dots', 'orbit', 'disc']);

const ic = (body: string) => `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;

const ICON: Record<FaceState, (c: string) => string> = {
  running: (c) =>
    ic(
      `<circle class="afx-pulse" cx="8" cy="8" r="5" fill="${c}" opacity=".5"></circle><circle cx="8" cy="8" r="4" fill="${c}"></circle>`,
    ),
  starting: (c) =>
    ic(`<circle cx="8" cy="8" r="6" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3 3"></circle>`),
  fallback: (c) =>
    ic(
      `<rect x="1.5" y="3" width="13" height="10" rx="2.5" fill="none" stroke="${c}" stroke-width="1.8"></rect><path d="M6.5 6 L10.5 8 L6.5 10 Z" fill="${c}"></path>`,
    ),
  paused: (c) =>
    ic(
      `<rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="${c}"></rect><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="${c}"></rect>`,
    ),
  blocked: (c) =>
    ic(
      `<circle cx="8" cy="8" r="6.2" fill="none" stroke="${c}" stroke-width="1.8"></circle><path d="M3.8 12.2 L12.2 3.8" stroke="${c}" stroke-width="1.8"></path>`,
    ),
  unsupported: (c) =>
    ic(
      `<path d="M8 1.5 L14.5 13.5 H1.5 Z" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"></path><path d="M8 6 V9.5 M8 11.2 V11.6" stroke="${c}" stroke-width="1.8" stroke-linecap="round"></path>`,
    ),
  up: (c) =>
    ic(
      `<path d="M4 11 V7.5 a4 4 0 0 1 8 0 V11 L13 12.5 H3 Z" fill="none" stroke="${c}" stroke-width="1.7" stroke-linejoin="round"></path><path d="M6.6 14 h2.8" stroke="${c}" stroke-width="1.7" stroke-linecap="round"></path>`,
    ),
  idle: (c) => ic(`<circle cx="8" cy="8" r="5.5" fill="none" stroke="${c}" stroke-width="1.8"></circle>`),
};

// SVG presentation attributes may not take var() or color-mix() in every engine, so colours move into style; an
// <svg>'s size goes there too, so no page rule for svg (inline-size: 100%) can stretch a face's drawing.
const PAINT = /\s(fill|stroke|stop-color)="([^"]*\b(?:var|color-mix)\([^"]*)"/gu;
const svgPaint = (html: string): string =>
  html.replace(/<(svg|circle|path|line|rect|stop)\b([^>]*)>/gu, (tag, name: string, attrs: string) => {
    let decl = '';
    const rest = attrs.replace(PAINT, (_m, k: string, val: string) => {
      decl += `${k}: ${val}; `;
      return '';
    });
    if (name === 'svg') {
      const w = /\swidth="(\d+)"/u.exec(attrs)?.[1];
      const h = /\sheight="(\d+)"/u.exec(attrs)?.[1];
      if (w && h) decl += `width: ${w}px; height: ${h}px; `;
    }
    if (!decl) return tag;
    return rest.includes(' style="')
      ? `<${name}${rest.replace(' style="', ` style="${decl}`)}>`
      : `<${name}${rest} style="${decl.trim()}">`;
  });

// The face's root: the 360 × 360 artboard scaled to size, the dial plate, the drawing and the status caption.
export function frame(v: V, body: string, bare?: boolean, aria = v.aria): string {
  const cls = `af${v.live ? ' af-live' : ''}${v.still ? ' af-still' : ''}${v.size < 170 ? ' af-compact' : ''}`;
  const plate = PLATED.has(v.face)
    ? `<div style="position: absolute; left: 34px; top: 9px; width: 292px; height: 292px; border-radius: 50%; ${v.plate}"></div>`
    : '';
  const cap = bare
    ? ''
    : `<div style="position: absolute; left: 0; top: 318px; width: 360px; height: 34px; display: flex; align-items: center; justify-content: center; gap: 8px; color: ${v.accent}; font-size: max(15px, var(--lmin)); font-weight: 500">${ICON[v.st](v.accent)}<span>${v.capText}</span></div>`;
  return `<div class="${cls}" role="timer" aria-label="${esc(aria)}" style="width: ${v.size}px; height: ${v.size}px; --lmin: ${v.LMIN.toFixed(2)}px; --fl: ${v.lampVal}; --fa: ${v.accentVal}"><div class="af-a" aria-hidden="true" style="transform: scale(${v.size / 360})">${plate}${svgPaint(body + cap)}</div></div>`;
}

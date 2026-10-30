import { pad } from './geometry';

export type TFaceTheme = 'light' | 'dark' | 'oled';
export type TFaceState = 'idle' | 'starting' | 'running' | 'fallback' | 'paused' | 'blocked' | 'unsupported' | 'up';
export type TFaceMotion = 'auto' | 'off';

export interface IFaceProps {
  face: TFaceId;
  theme?: TFaceTheme;
  state?: TFaceState;
  remain?: number;
  total?: number;
  nowSec?: number;
  size?: number;
  lamp?: string;
  bare?: boolean;
  indef?: boolean;
  motion?: TFaceMotion;
  lblTop?: string;
  lblEnd?: string;
  fmt?: 12 | 24;
  // Draws the gallery's watch-glass case behind the face (faces with their own card keep it).
  framed?: boolean;
  className?: string;
}

// The sheet order of the 49 faces (the same list as FACE_IDS in @awaketab/core).
export const FACE_IDS = [
  'ring',
  'bold',
  'horizon',
  'tide',
  'flip',
  'rolling',
  'analog',
  'luxe',
  'rings',
  'words',
  'nixie',
  'lcd',
  'led',
  'dive',
  'chrono',
  'gauge',
  'type',
  'bars',
  'timeline',
  'pilot',
  'dual',
  'radar',
  'dots',
  'hourglass',
  'battery',
  'stack',
  'board',
  'orbit',
  'disc',
  'clocks',
  'wordgrid',
  'tape',
  'moon',
  'aurora',
  'glass',
  'neon',
  'liquid',
  'eclipse',
  'skeleton',
  'bauhaus',
  'poster',
  'eink',
  'terminal',
  'pulse',
  'waveform',
  'blob',
  'hud',
  'constellation',
  'halo',
] as const;

export type TFaceId = (typeof FACE_IDS)[number];

export const FACE_STATES: readonly TFaceState[] = [
  'idle',
  'starting',
  'running',
  'fallback',
  'paused',
  'blocked',
  'unsupported',
  'up',
];

// The session every board tile shows: 42:18 left at 10:47:42 AM, ending at 11:30 AM.
export const FACE_DEFAULTS = { remain: 2538, total: 3600, nowSec: 38_862, size: 360 } as const;

export const isFaceId = (id: unknown): id is TFaceId => (FACE_IDS as readonly unknown[]).includes(id);

const LAMP = 'var(--fl)';
const ACCENT = 'var(--fa)';

const STATUS: Readonly<Record<TFaceState, string>> = {
  idle: 'var(--muted-foreground-strong)',
  starting: LAMP,
  running: LAMP,
  fallback: LAMP,
  paused: 'var(--warning)',
  blocked: 'var(--destructive)',
  unsupported: 'var(--info)',
  up: 'var(--ended)',
};

const TOP: Readonly<Record<TFaceState, string>> = {
  idle: 'ready',
  starting: 'starting',
  running: 'left',
  fallback: 'left',
  paused: 'paused',
  blocked: 'not awake',
  unsupported: 'not awake',
  up: "time's up",
};

const CAPTION: Readonly<Record<TFaceState, string>> = {
  idle: 'Ready',
  starting: 'Starting…',
  running: 'Screen awake',
  fallback: 'Awake via video fallback',
  paused: 'Paused — tab hidden',
  blocked: "Blocked — here's the fix",
  unsupported: 'Tap to use the fallback',
  up: "Time's up",
};

// The face palette as tokens; the face root carries its theme class, so these resolve to the face's own theme.
export interface IFacePalette {
  ink: string;
  ink2: string;
  line: string;
  track: string;
  panel: string;
  ground: string;
  paused: string;
}

const palette = (theme: TFaceTheme): IFacePalette => {
  const oled = theme === 'oled';
  return {
    ink: 'var(--foreground)',
    ink2: 'var(--muted-foreground-strong)',
    line: oled ? 'var(--surface-3)' : 'var(--border)',
    track: oled ? 'var(--secondary)' : 'var(--surface-3)',
    panel: oled ? 'var(--background)' : 'var(--card)',
    ground: 'var(--background)',
    paused: 'var(--warning)',
  };
};

// Layer colours (green · sky · violet) and the heat scale for time left, only while awake.
const TONE = {
  sky: 'var(--face-sky)',
  violet: 'var(--face-violet)',
  lime: 'var(--face-lime)',
  amber: 'var(--face-amber)',
  ember: 'var(--face-ember)',
} as const;
const FILL = {
  lime: 'var(--face-fill-lime)',
  amber: 'var(--face-fill-amber)',
  ember: 'var(--face-fill-ember)',
} as const;

export const isHexColour = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/iu.test(c);

export function clock(sec: number, fmt: 12 | 24): string {
  const x = ((sec % 86_400) + 86_400) % 86_400;
  const hh = Math.floor(x / 3600);
  const mm = Math.floor((x % 3600) / 60);
  return fmt === 12 ? `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? 'AM' : 'PM'}` : `${pad(hh)}:${pad(mm)}`;
}

export interface IFaceOptions {
  t0?: number;
  reduced?: boolean;
}

export function faceModel(p: IFaceProps, opts: IFaceOptions = {}) {
  const face: TFaceId = isFaceId(p.face) ? p.face : 'ring';
  const theme: TFaceTheme = p.theme === 'light' || p.theme === 'oled' ? p.theme : 'dark';
  const st: TFaceState = p.state && p.state in STATUS ? p.state : 'running';
  const total = Number(p.total ?? FACE_DEFAULTS.total);
  let remain = Number(p.remain ?? FACE_DEFAULTS.remain);
  if (st === 'idle') remain = total;
  if (st === 'up') remain = 0;
  const size = Number(p.size ?? FACE_DEFAULTS.size);
  const nowSec = Number(p.nowSec ?? FACE_DEFAULTS.nowSec);
  const t0 = opts.t0 ?? nowSec;
  const fmt = p.fmt === 24 ? 24 : 12;
  // 240 px and up keep every label at 12 px or more on screen; below 170 px the face is compact.
  const LMIN = size >= 240 && size < 360 ? (12 * 360) / size : 0;
  const night = theme !== 'light';
  const t = palette(theme);
  const lampValue = isHexColour(p.lamp) ? p.lamp : 'var(--lamp)';
  const accentValue = STATUS[st];
  const awake = st === 'running' || st === 'fallback';
  const still = p.motion === 'off' || opts.reduced === true;
  const live = awake && !still;
  const multi = awake || st === 'starting';
  const accent = ACCENT;
  const lamp = LAMP;
  const mc1 = multi ? lamp : accent;
  const mc2 = multi ? TONE.sky : accent;
  const mc3 = multi ? TONE.violet : accent;
  const heat = (q: number): string =>
    !multi ? accent : q <= 0.084 ? FILL.ember : q <= 0.25 ? FILL.amber : q <= 0.5 ? FILL.lime : lamp;
  const heatT = (q: number): string =>
    !multi ? accent : q <= 0.084 ? TONE.ember : q <= 0.25 ? TONE.amber : q <= 0.5 ? TONE.lime : lamp;

  const r = Math.max(0, Math.round(remain));
  const h = Math.floor(r / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;
  const indef = p.indef === true;
  const digits = indef && st === 'idle' ? '∞' : h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  const long = digits.length > 5;
  const lc = digits.lastIndexOf(':');
  const dL = lc > 0 ? digits.slice(0, lc) : digits;
  const dR = lc > 0 ? digits.slice(lc + 1) : '';
  const frac = total > 0 ? Math.min(1, r / total) : 1;
  const t12 = (sec: number) => clock(sec, fmt);
  const endSec = nowSec + r;
  const endShort = t12(endSec);
  let endLine =
    st === 'up'
      ? `Ended ${endShort}`
      : st === 'idle'
        ? `${Math.round(total / 60)} min · ends ${endShort}`
        : `until ${endShort}`;
  let topWord = TOP[st];
  if (indef) {
    endLine = st === 'idle' ? 'until you stop it' : 'no end · until you stop';
    if (awake) topWord = 'awake for';
  }
  if (p.lblTop) topWord = p.lblTop;
  if (p.lblEnd) endLine = p.lblEnd;
  const capText = CAPTION[st];
  // Whole minutes, rounded up, so the label changes at most once a minute.
  const mins = Math.ceil(r / 60);
  const left =
    st === 'up' || indef
      ? ''
      : `${mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`} remaining`;
  const aria = [capText, left, endLine].filter(Boolean).join(', ');

  const ga = h > 0 ? pad(h) : pad(m);
  const gb = h > 0 ? pad(m) : pad(s);

  return {
    face,
    theme,
    st,
    total,
    size,
    nowSec,
    fmt,
    LMIN,
    night,
    t,
    lampValue,
    accentValue,
    accent,
    lamp,
    awake,
    live,
    still,
    multi,
    mc1,
    mc2,
    mc3,
    tone: TONE,
    fill: FILL,
    heat,
    heatT,
    r,
    h,
    m,
    s,
    indef,
    digits,
    long,
    dL,
    dR,
    frac,
    t12,
    endSec,
    endShort,
    eh: Math.floor((endSec % 86_400) / 3600),
    em: Math.floor((endSec % 3600) / 60),
    endLine,
    topWord,
    capText,
    aria,
    ringFrac: st === 'idle' ? 1 : frac,
    shownSec: st === 'idle' ? total : r,
    haloOp: live ? 0.6 : 0,
    liveOp: live ? 1 : 0,
    hollow: st === 'paused' || st === 'idle' || st === 'blocked' || st === 'unsupported',
    hourDeg: ((nowSec / 3600) % 12) * 30,
    minDeg: ((nowSec / 60) % 60) * 6,
    secDeg: (nowSec % 60) * 6,
    hourDeg0: ((t0 / 3600) % 12) * 30,
    minDeg0: ((t0 / 60) % 60) * 6,
    secDeg0: (t0 % 60) * 6,
    ga,
    gb,
    four: (ga + gb).split('').map(Number),
    pctLabel: `${Math.round(frac * 100)}%`,
    fracPct: `${(frac * 100).toFixed(1)}%`,
    nowShort: t12(nowSec),
    startShort: t12(nowSec - (total - r)),
  };
}

export type TFaceModel = ReturnType<typeof faceModel>;

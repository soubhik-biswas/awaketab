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
  // Draws the watch-glass case behind the face (faces with their own card keep it); the box stays square.
  framed?: boolean;
  className?: string;
}

// The gallery order of the 46 Glance faces (the same list as FACE_IDS in @awaketab/core).
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

// The artboard every face is drawn on, scaled to size with one transform; the caption sits below it.
export const ART_W = 360;
export const ART_H = 315;
// At this size and under (the dock's 44 px button) a face keeps only its main shape and digits.
const THUMB_MAX = 64;

// The session every board tile shows: 42:18 left at 10:47:42 AM, ending at 11:30 AM.
const FACE_DEFAULTS = { remain: 2538, total: 3600, nowSec: 38_862, size: 360 } as const;

export const isFaceId = (id: unknown): id is TFaceId => (FACE_IDS as readonly unknown[]).includes(id);

// Faces Glance retired, and the face a stored id draws instead (the same map as migrateFace in @awaketab/core).
export const RETIRED_FACES: Readonly<Record<string, TFaceId>> = { led: 'lcd', terminal: 'lcd', pulse: 'waveform' };

// Any stored or linked id as a face that exists: retired ids move to their closest face, anything else is Ring.
export const toFaceId = (id: unknown): TFaceId =>
  isFaceId(id) ? id : typeof id === 'string' ? (RETIRED_FACES[id] ?? 'ring') : 'ring';

const LAMP = 'var(--fl)';
const ACCENT = 'var(--fa)';

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

// The face palette of Face.dc.html (graphite v2 at night), per theme.
export interface IFacePalette {
  ink: string;
  ink2: string;
  line: string;
  track: string;
  lamp: string;
  panel: string;
  card: string;
  cardInk: string;
  ground: string;
  lcdS: string;
  paused: string;
  blocked: string;
  unsup: string;
  up: string;
  idle: string;
}

export const FACE_PALETTE: Readonly<Record<TFaceTheme, IFacePalette>> = {
  light: {
    ink: '#0B1020',
    ink2: '#4B5165',
    line: '#D9D9E5',
    track: '#E3E3EE',
    lamp: '#117A3B',
    panel: '#FFFFFF',
    card: '#FFFFFF',
    cardInk: '#0B1020',
    ground: '#F5F5FA',
    lcdS: '#E2F6E8',
    paused: '#8A5A00',
    blocked: '#C21D3E',
    unsup: '#1C64B8',
    up: '#4B5165',
    idle: '#4B5165',
  },
  dark: {
    ink: '#EEF2FA',
    ink2: '#A9B3C7',
    line: '#2A2D38',
    track: '#1C1F29',
    lamp: '#3DF58E',
    panel: '#0F1117',
    card: '#1C1F29',
    cardInk: '#EEF2FA',
    ground: '#07080C',
    lcdS: '#06180D',
    paused: '#FFC53D',
    blocked: '#FF6B81',
    unsup: '#7CBBFF',
    up: '#C9D1E0',
    idle: '#A9B3C7',
  },
  oled: {
    ink: '#EEF2FA',
    ink2: '#A9B3C7',
    line: '#16181F',
    track: '#0F1117',
    lamp: '#3DF58E',
    panel: '#000000',
    card: '#0F1117',
    cardInk: '#EEF2FA',
    ground: '#000000',
    lcdS: '#030D07',
    paused: '#FFC53D',
    blocked: '#FF6B81',
    unsup: '#7CBBFF',
    up: '#C9D1E0',
    idle: '#A9B3C7',
  },
};

// The state's colour; amber, red, sky and the ended grey override the lamp (or a Face studio accent).
export const stateColour = (t: IFacePalette, st: TFaceState, lamp: string): string =>
  ({
    idle: t.idle,
    starting: lamp,
    running: lamp,
    fallback: lamp,
    paused: t.paused,
    blocked: t.blocked,
    unsupported: t.unsup,
    up: t.up,
  })[st];

// Layer colours (sky · violet) and the heat scale for time left (lime · amber · ember), only while awake.
interface ITones {
  sky: string;
  violet: string;
  lime: string;
  amber: string;
  ember: string;
}
const NIGHT_TONES: ITones = { sky: '#7CBBFF', violet: '#C1B1FE', lime: '#B8F25A', amber: '#FFB547', ember: '#FF6A3D' };
const DAY_TONES: ITones = { sky: '#1D5FB8', violet: '#6D4AD0', lime: '#4D7C0F', amber: '#A15C00', ember: '#C2410C' };
const DAY_FILLS: ITones = { sky: '#3B7DD8', violet: '#7C5CE0', lime: '#4F9A1F', amber: '#C47A00', ember: '#E0531F' };

const isHexColour = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/iu.test(c);

function clock(sec: number, fmt: 12 | 24): string {
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
  const face: TFaceId = toFaceId(p.face);
  const theme: TFaceTheme = p.theme === 'light' || p.theme === 'oled' ? p.theme : 'dark';
  const st: TFaceState = p.state && FACE_STATES.includes(p.state) ? p.state : 'running';
  const total = p.total ?? FACE_DEFAULTS.total;
  let remain = p.remain ?? FACE_DEFAULTS.remain;
  if (st === 'idle') remain = total;
  if (st === 'up') remain = 0;
  const size = p.size ?? FACE_DEFAULTS.size;
  const nowSec = p.nowSec ?? FACE_DEFAULTS.nowSec;
  const t0 = opts.t0 ?? nowSec;
  const fmt = p.fmt === 24 ? 24 : 12;
  // 240 px and up keep every label at 12 px or more on screen; below 200 px the face is compact, as the boards draw it.
  const LMIN = size >= 240 && size < 360 ? (12 * 360) / size : 0;
  const bare = p.bare === true;
  const framed = p.framed === true;
  const night = theme !== 'light';
  const t = FACE_PALETTE[theme];
  const TONE = night ? NIGHT_TONES : DAY_TONES;
  const FILL = night ? NIGHT_TONES : DAY_FILLS;
  const lampValue = isHexColour(p.lamp) ? p.lamp : t.lamp;
  const accentValue = stateColour(t, st, lampValue);
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
    bare,
    framed,
    // A bare face is its 360 × 315 artboard; with the caption or the watch-glass case it is square.
    boxH: bare && !framed ? Math.round((size * ART_H) / ART_W) : size,
    compact: size < 200,
    thumb: size <= THUMB_MAX,
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

import type { ILicenseRecord, ILicenseState, TFeatureGate, TPlanId } from '@awaketab/core';
import type { TFaceId } from '@/components/face';

export type TKioskScreen = 'dark' | 'oled';
type TKioskDays = 'weekdays' | 'everyday';

export interface IKioskSchedule {
  days: TKioskDays;
  from: string;
  to: string;
}

export interface IKioskConfig {
  face: TKioskFace;
  screen: TKioskScreen;
  kicker: string;
  msg: string;
  line: string;
  schedule: IKioskSchedule | null;
  logo: string | null;
}

// The seven faces the kiosk board offers, in its order.
export const KIOSK_FACES = [
  'led',
  'luxe',
  'bold',
  'nixie',
  'disc',
  'clocks',
  'moon',
] as const satisfies readonly TFaceId[];
type TKioskFace = (typeof KIOSK_FACES)[number];

export const KIOSK_SCREENS: readonly TKioskScreen[] = ['dark', 'oled'];

// Burn-in care: the layout steps through these offsets, one a minute.
const DRIFT: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [6, -4],
  [-5, 5],
  [4, 6],
];
export const DRIFT_MS = 60_000;
export const HOLD_MS = 3000;
export const RELOCK_MS = 30_000;
export const KIOSK_STAGE = { width: 960, height: 540, face: 420 } as const;

const DEFAULT_SCHEDULE: IKioskSchedule = { days: 'weekdays', from: '08:00', to: '18:00' };

const KIOSK_PLANS: readonly TPlanId[] = ['biz_kiosk_site', 'biz_kiosk_5'];
const KIOSK_LOGO_MAX = 512;
const TEXT_MAX = 80;
const TOKEN_RE = /^#lic=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/u;
const WALL_RE = /^([01]\d|2[0-3])[:-]([0-5]\d)$/u;

export function cleanText(raw: string | null | undefined): string {
  if (!raw) return '';
  const clean = raw
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return Array.from(clean).slice(0, TEXT_MAX).join('');
}

function parseWall(raw: string | null | undefined): string | null {
  const m = WALL_RE.exec(raw ?? '');
  return m ? `${m[1] ?? '00'}:${m[2] ?? '00'}` : null;
}

export function parseLogo(raw: string | null | undefined): string | null {
  if (!raw || raw.length > KIOSK_LOGO_MAX) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function readLicHash(hash: string): string | null {
  return TOKEN_RE.exec(hash)?.[1] ?? null;
}

const isFace = (v: string | null): v is TKioskFace => (KIOSK_FACES as readonly string[]).includes(v ?? '');

// The kiosk link: ?face=led&screen=oled&days=weekdays&from=08-00&to=18-00&kicker=…&msg=…&line=…&logo=https://…
// `days=always` keeps the screen awake all day; the texts default to the board's reception sign.
export function parseKioskQuery(search: string, defaults: Pick<IKioskConfig, 'kicker' | 'msg' | 'line'>): IKioskConfig {
  const q = new URLSearchParams(search);
  const face = q.get('face');
  const days = q.get('days');
  const from = parseWall(q.get('from'));
  const to = parseWall(q.get('to'));
  let schedule: IKioskSchedule | null = DEFAULT_SCHEDULE;
  if (days === 'always') schedule = null;
  else if (days === 'weekdays' || days === 'everyday') {
    schedule = { days, from: from ?? DEFAULT_SCHEDULE.from, to: to ?? DEFAULT_SCHEDULE.to };
  }
  return {
    face: isFace(face) ? face : 'led',
    screen: q.get('screen') === 'oled' ? 'oled' : 'dark',
    kicker: cleanText(q.get('kicker')) || defaults.kicker,
    msg: cleanText(q.get('msg')) || defaults.msg,
    line: cleanText(q.get('line')) || defaults.line,
    schedule,
    logo: parseLogo(q.get('logo')),
  };
}

export function kioskQuery(cfg: IKioskConfig, defaults: Pick<IKioskConfig, 'kicker' | 'msg' | 'line'>): string {
  const q = new URLSearchParams();
  q.set('face', cfg.face);
  q.set('screen', cfg.screen);
  if (cfg.schedule) {
    q.set('days', cfg.schedule.days);
    q.set('from', cfg.schedule.from.replace(':', '-'));
    q.set('to', cfg.schedule.to.replace(':', '-'));
  } else q.set('days', 'always');
  if (cfg.kicker !== defaults.kicker) q.set('kicker', cfg.kicker);
  if (cfg.msg !== defaults.msg) q.set('msg', cfg.msg);
  if (cfg.line !== defaults.line) q.set('line', cfg.line);
  if (cfg.logo) q.set('logo', cfg.logo);
  return q.toString();
}

const at = (base: Date, wall: string, dayOffset = 0): number => {
  const [h, m] = wall.split(':').map(Number);
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
};

const openOn = (s: IKioskSchedule, day: number) => s.days === 'everyday' || (day >= 1 && day <= 5);

export interface IKioskWindow {
  inside: boolean;
  start: number | null;
  end: number | null;
  next: number | null;
}

// Where now falls in the schedule: inside a window (and when it ends) or outside (and when the next one opens).
// A window that ends before it starts runs past midnight.
export function kioskWindow(s: IKioskSchedule | null, now: number): IKioskWindow {
  if (!s) return { inside: true, start: null, end: null, next: null };
  const today = new Date(now);
  for (let back = 1; back >= 0; back--) {
    const startDay = new Date(now);
    startDay.setDate(today.getDate() - back);
    if (!openOn(s, startDay.getDay())) continue;
    const start = at(startDay, s.from);
    let end = at(startDay, s.to);
    if (end <= start) end = at(startDay, s.to, 1);
    if (now >= start && now < end) return { inside: true, start, end, next: null };
  }
  for (let ahead = 0; ahead <= 7; ahead++) {
    const day = new Date(now);
    day.setDate(today.getDate() + ahead);
    if (!openOn(s, day.getDay())) continue;
    const start = at(day, s.from);
    if (start > now) return { inside: false, start: null, end: null, next: start };
  }
  return { inside: false, start: null, end: null, next: null };
}

export function driftAt(step: number): readonly [number, number] {
  return DRIFT[((step % DRIFT.length) + DRIFT.length) % DRIFT.length] ?? [0, 0];
}

export type TKioskLicence = 'none' | 'stored' | 'invalid';

// A #lic= token from the licence email: verified on the device, kept as the licence record, then removed from the
// address bar so it never lingers in history or a screenshot.
export async function applyKioskHash(
  hash: string,
  verify: (token: string) => Promise<ILicenseState>,
  write: (record: ILicenseRecord) => void,
  now: () => number = Date.now,
): Promise<TKioskLicence> {
  if (!hash.startsWith('#lic=')) return 'none';
  const token = readLicHash(hash);
  const state = token ? await verify(token) : null;
  const plan = state?.plan as TPlanId | null | undefined;
  if (!token || !state?.valid || !plan || !KIOSK_PLANS.includes(plan) || state.exp === null) return 'invalid';
  write({
    v: 1,
    token,
    plan,
    features: state.features,
    exp: state.exp,
    lastValidatedAt: now(),
    deviceId: '',
    deviceLabel: 'kiosk',
  });
  return 'stored';
}

export function licenceAllows(
  record: Pick<ILicenseRecord, 'features' | 'exp'> | null,
  gate: TFeatureGate,
  now = Date.now(),
) {
  return !!record && record.exp * 1000 > now && record.features.includes(gate);
}

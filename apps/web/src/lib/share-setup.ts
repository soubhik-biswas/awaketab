// A shared setup link carries the length, the face and the chime only (handoff §11): /s/<face>-<minutes>-<chime|quiet>.
export const SETUP_FACES = [
  'ring', 'bold', 'horizon', 'tide', 'flip', 'rolling', 'analog', 'luxe', 'rings', 'words', 'nixie', 'lcd', 'led',
  'dive', 'chrono', 'gauge', 'type', 'bars', 'timeline', 'pilot', 'dual', 'radar', 'dots', 'hourglass', 'battery',
  'stack', 'board', 'orbit', 'disc', 'clocks', 'wordgrid', 'tape', 'moon',
] as const;
export type TSetupFace = (typeof SETUP_FACES)[number];

// Lengths a link may carry, each with the tool's preset id (docs/00 §7 `preset=`); 0 means "until I stop".
const LENGTHS: Record<number, string> = { 15: 'p15', 30: 'p30', 45: 'p45', 60: 'p60', 120: 'p120', 240: 'p240', 0: 'pinf' };

export interface ISetup {
  face: TSetupFace;
  minutes: number;
  chime: boolean;
}

export function parseSetup(code: string): ISetup | null {
  const m = /^([a-z]+)-(\d{1,3})-(chime|quiet)$/u.exec(code.trim().toLowerCase());
  if (!m) return null;
  const face = m[1] as TSetupFace;
  const minutes = Number(m[2]);
  if (!SETUP_FACES.includes(face) || !(minutes in LENGTHS)) return null;
  return { face, minutes, chime: m[3] === 'chime' };
}

export function setupCode(setup: ISetup): string {
  return `${setup.face}-${String(setup.minutes)}-${setup.chime ? 'chime' : 'quiet'}`;
}

export function setupFromPath(pathname: string): ISetup | null {
  const m = /^\/s\/([^/?#]+)\/?$/u.exec(pathname);
  return m?.[1] ? parseSetup(decodeURIComponent(m[1])) : null;
}

// The tool URL a setup opens: the home starts on its own, `autostart=0` lets the visitor change it first.
export function setupToolHref(setup: ISetup, start: boolean): string {
  const q = new URLSearchParams({ preset: LENGTHS[setup.minutes] ?? 'p30', face: setup.face, chime: setup.chime ? 'on' : 'off' });
  if (!start) q.set('autostart', '0');
  return `/?${q.toString()}`;
}

const pad = (n: number): string => String(n).padStart(2, '0');

// "11:32 AM", or the tomorrow template ("{time} tomorrow") when the end falls after midnight.
export function endsAt(from: Date, minutes: number, tomorrow: string, locale = 'en'): string {
  const end = new Date(from.getTime() + minutes * 60_000);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(end).replace(/\u202f/gu, ' ');
  const nextDay = `${String(end.getFullYear())}${pad(end.getMonth())}${pad(end.getDate())}` !==
    `${String(from.getFullYear())}${pad(from.getMonth())}${pad(from.getDate())}`;
  return nextDay ? tomorrow.replace('{time}', time) : time;
}

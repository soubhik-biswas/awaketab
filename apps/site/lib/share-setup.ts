import { RETIRED_FACES } from '@/components/face/model';

// A shared setup link carries the length, the face and the chime only (handoff §11): /s/<face>-<minutes>-<chime|quiet>.
const SETUP_FACES = [
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
] as const;
type TSetupFace = (typeof SETUP_FACES)[number];

// Lengths a link may carry, each with the tool's preset id (docs/00 §7 `preset=`); 0 means "until I stop".
const SETUP_LENGTHS: Record<number, string> = {
  15: 'p15',
  30: 'p30',
  45: 'p45',
  60: 'p60',
  120: 'p120',
  240: 'p240',
  0: 'pinf',
};

export interface ISetup {
  face: TSetupFace;
  minutes: number;
  chime: boolean;
}

export function parseSetup(code: string): ISetup | null {
  const m = /^([a-z]+)-(\d{1,3})-(chime|quiet)$/u.exec(code.trim().toLowerCase());
  if (!m) return null;
  // Links shared before a face was retired open its closest face.
  const face = ((m[1] && RETIRED_FACES[m[1]]) ?? m[1]) as TSetupFace;
  const minutes = Number(m[2]);
  if (!SETUP_FACES.includes(face) || !(minutes in SETUP_LENGTHS)) return null;
  return { face, minutes, chime: m[3] === 'chime' };
}

// The tool URL a setup opens: the home starts on its own, `autostart=0` lets the visitor change it first.
export function setupToolHref(setup: ISetup, start: boolean): string {
  const q = new URLSearchParams({
    preset: SETUP_LENGTHS[setup.minutes] ?? 'p30',
    face: setup.face,
    chime: setup.chime ? 'on' : 'off',
  });
  if (!start) q.set('autostart', '0');
  return `/?${q.toString()}`;
}

import { isFaceId, RETIRED_FACES, toFaceId, type TFaceId } from '@/components/face';

// A shared setup link carries the length, the face and the chime only: /s/<face>-<minutes>-<chime|quiet>.

// Lengths a link may carry, each with the tool's preset id; 0 means "until I stop".
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
  face: TFaceId;
  minutes: number;
  chime: boolean;
}

export function parseSetup(code: string): ISetup | null {
  const m = /^([a-z]+)-(\d{1,3})-(chime|quiet)$/u.exec(code.trim().toLowerCase());
  if (!m) return null;
  const id = m[1] ?? '';
  const minutes = Number(m[2]);
  // Links shared before a face was retired open its closest face; an unknown face is a removed setup.
  if (!(isFaceId(id) || id in RETIRED_FACES) || !(minutes in SETUP_LENGTHS)) return null;
  return { face: toFaceId(id), minutes, chime: m[3] === 'chime' };
}

// The tool URL a setup opens: `autostart=1` starts it straight away, `autostart=0` lets the visitor change it first.
export function setupToolHref(setup: ISetup, start: boolean): string {
  const q = new URLSearchParams({
    preset: SETUP_LENGTHS[setup.minutes] ?? 'p30',
    face: setup.face,
    chime: setup.chime ? 'on' : 'off',
    autostart: start ? '1' : '0',
  });
  return `/?${q.toString()}`;
}

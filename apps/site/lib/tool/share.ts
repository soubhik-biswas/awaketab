import { FACE_IDS, type TFace } from '@awaketab/core';

export const SHARE_LENGTHS = [15, 30, 45, 60, 120, 240, 0] as const;

export interface IShareSetup {
  face: TFace;
  minutes: number;
  chime: boolean;
}

// A shared setup carries the length, face and chime only, never a label or a device name.
export function sharePath(s: IShareSetup): string {
  return `/s/${s.face}-${Math.max(0, Math.round(s.minutes))}-${s.chime ? 'chime' : 'quiet'}`;
}

export function parseShareCode(code: string): IShareSetup | null {
  const m = /^([a-z]+)-(\d{1,4})-(chime|quiet)$/u.exec(code);
  if (!m) return null;
  const [, face, min, chime] = m;
  if (!face || !(FACE_IDS as readonly string[]).includes(face)) return null;
  const minutes = Number(min);
  if (!(SHARE_LENGTHS as readonly number[]).includes(minutes)) return null;
  return { face: face as TFace, minutes, chime: chime === 'chime' };
}

export interface IToolQuery {
  totalSec?: number;
  face?: TFace;
  chime?: boolean;
  autostart?: boolean;
  untilAt?: number;
}

const PRESET_SEC: Record<string, number> = { p15: 900, p30: 1800, p45: 2700, p60: 3600, p120: 7200, p240: 14400, pinf: 0 };

// The tool's address options: ?preset=p45&face=flip&chime=on&autostart=0&until=HH-MM.
export function readToolQuery(search: string, now = Date.now()): IToolQuery {
  const q = new URLSearchParams(search);
  const out: IToolQuery = {};
  const preset = q.get('preset');
  if (preset && preset in PRESET_SEC) out.totalSec = PRESET_SEC[preset];
  const face = q.get('face');
  if (face && (FACE_IDS as readonly string[]).includes(face)) out.face = face as TFace;
  const chime = q.get('chime');
  if (chime === 'on' || chime === 'off') out.chime = chime === 'on';
  const auto = q.get('autostart');
  if (auto === '1' || auto === '0') out.autostart = auto === '1';
  const until = /^(\d{2})-(\d{2})$/u.exec(q.get('until') ?? '');
  if (until) {
    const d = new Date(now);
    d.setHours(Number(until[1]), Number(until[2]), 0, 0);
    if (d.getTime() <= now + 30_000) d.setDate(d.getDate() + 1);
    out.untilAt = d.getTime();
  }
  return out;
}

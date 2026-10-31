import { FACE_IDS, type TFace } from '@awaketab/core';
import { VIBES, type TVibe } from '@/lib/tool/settings';
import { PRO_ENABLED } from '@/lib/features';

interface IToolQuery {
  totalSec?: number;
  face?: TFace;
  chime?: boolean;
  vibe?: TVibe;
  autostart?: boolean;
  untilAt?: number;
  open?: TOpenPanel;
}

// Panels the website links straight into (Send feedback, Settings, the faces store, vibes).
const OPEN_PANELS = ['feedback', 'settings', 'faces', 'vibes', 'recents', 'language', 'pro'] as const;
type TOpenPanel = (typeof OPEN_PANELS)[number];

const PRESET_SEC: Record<string, number> = {
  p15: 900,
  p30: 1800,
  p45: 2700,
  p60: 3600,
  p120: 7200,
  p240: 14400,
  pinf: 0,
};

const presetFor = (sec: number): string | null => Object.entries(PRESET_SEC).find(([, v]) => v === sec)?.[0] ?? null;

// The tool's address options: ?preset=p45&face=flip&vibe=night&chime=on&autostart=1&until=HH-MM.
export function readToolQuery(search: string, now = Date.now()): IToolQuery {
  const q = new URLSearchParams(search);
  const out: IToolQuery = {};
  const preset = q.get('preset');
  if (preset && preset in PRESET_SEC) out.totalSec = PRESET_SEC[preset];
  const face = q.get('face');
  if (face && (FACE_IDS as readonly string[]).includes(face)) out.face = face as TFace;
  const vibe = VIBES.find((v) => v === q.get('vibe'));
  if (vibe) out.vibe = vibe;
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
  const open = OPEN_PANELS.find((x) => x === q.get('open'));
  if (open && (open !== 'pro' || PRO_ENABLED)) out.open = open;
  return out;
}

interface IShareSetup {
  face: TFace;
  vibe: TVibe;
  totalSec: number;
  look: boolean;
  length: boolean;
  start: boolean;
}

// A shared setup opens the tool ready to start. It carries the look and the length only, never a name,
// history, device or place.
export function shareLink(origin: string, s: IShareSetup): string {
  const q = new URLSearchParams();
  const preset = presetFor(s.totalSec);
  if (s.length && preset) q.set('preset', preset);
  if (s.look) {
    q.set('face', s.face);
    q.set('vibe', s.vibe);
  }
  if (s.start) q.set('autostart', '1');
  const query = q.toString();
  return `${origin}/${query ? `?${query}` : ''}`;
}

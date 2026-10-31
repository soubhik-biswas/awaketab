import { FACE_IDS, migrateFace, type TFace } from '@awaketab/core';
import { VIBES, type TVibe } from '@/lib/tool/settings';
import { createLocalStore, isRecord, uid, useLocalStore } from '@/lib/tool/store';

export type TPresetIcon = 'presentation' | 'chef' | 'reading' | 'coffee' | 'infinity' | 'night' | 'timer';

export interface IPreset {
  id: string;
  label: string;
  icon: TPresetIcon;
  totalSec: number;
  face: TFace;
  chime: boolean;
  vibe?: TVibe;
}

const PRESETS_KEY = 'at.v1.presets';
const MAX_PRESETS = 20;
const ICONS: readonly TPresetIcon[] = ['presentation', 'chef', 'reading', 'coffee', 'infinity', 'night', 'timer'];

// The four presets the boards draw; the dev tray shows them, a first visit starts with none saved.
export const SAMPLE_PRESETS: IPreset[] = [
  { id: 'sample-kitchen', label: 'Kitchen', icon: 'chef', totalSec: 2700, face: 'bold', chime: true },
  { id: 'sample-slides', label: 'Slides', icon: 'presentation', totalSec: 3600, face: 'pilot', chime: true },
  { id: 'sample-night', label: 'Night desk', icon: 'night', totalSec: 0, face: 'moon', chime: false },
  { id: 'sample-wall', label: 'Wall board', icon: 'timer', totalSec: 14400, face: 'hud', chime: false },
];

function parsePreset(v: unknown): IPreset | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.label !== 'string') return null;
  const sec = Number(v.totalSec);
  if (!Number.isFinite(sec) || sec < 0) return null;
  return {
    id: v.id,
    label: v.label.slice(0, 40),
    icon: ICONS.includes(v.icon as TPresetIcon) ? (v.icon as TPresetIcon) : 'timer',
    totalSec: Math.round(sec),
    face: (FACE_IDS as readonly string[]).includes(String(v.face)) ? (v.face as TFace) : migrateFace(v.face),
    chime: v.chime !== false,
    vibe: VIBES.find((x) => x === v.vibe),
  };
}

function parse(raw: unknown): IPreset[] {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return [];
  const seen = new Set<string>();
  const out: IPreset[] = [];
  for (const item of raw.items) {
    const p = parsePreset(item);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out.slice(0, MAX_PRESETS);
}

const presetsStore = createLocalStore<IPreset[]>(PRESETS_KEY, parse, (items) => ({ v: 1, items }));

const EMPTY: IPreset[] = [];

export function usePresets(): IPreset[] {
  return useLocalStore(presetsStore, EMPTY);
}

function iconFor(label: string, sec: number): TPresetIcon {
  const l = label.toLowerCase();
  if (sec === 0) return 'infinity';
  if (/present|slide|talk|demo|board/u.test(l)) return 'presentation';
  if (/cook|recipe|bak|kitchen/u.test(l)) return 'chef';
  if (/read|book|study/u.test(l)) return 'reading';
  if (/break|coffee|tea/u.test(l)) return 'coffee';
  if (/night|desk|late/u.test(l)) return 'night';
  return 'timer';
}

export function savePreset(input: {
  label: string;
  totalSec: number;
  face: TFace;
  chime: boolean;
  vibe: TVibe;
}): IPreset {
  const list = presetsStore.get();
  const label = input.label.trim() || `Preset ${list.length + 1}`;
  const preset: IPreset = {
    id: uid(),
    label,
    icon: iconFor(label, input.totalSec),
    totalSec: input.totalSec,
    face: input.face,
    chime: input.chime,
    vibe: input.vibe,
  };
  presetsStore.set([...list, preset].slice(-MAX_PRESETS));
  return preset;
}

export function iconForLabel(label: string, sec: number): TPresetIcon {
  return iconFor(label, sec);
}

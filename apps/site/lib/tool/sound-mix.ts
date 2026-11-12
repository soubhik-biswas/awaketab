import { useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import { SETTINGS_KEY } from '@/lib/tool/settings';
import { isRecord } from '@/lib/tool/store';

export const LAYERS = [
  'rain',
  'ocean',
  'stream',
  'wind',
  'crickets',
  'thunder',
  'cafe',
  'fire',
  'train',
  'fan',
  'brown',
  'pink',
  'white',
  'pad',
  'keys',
  'drone',
  'bells',
] as const;

export type TLayer = (typeof LAYERS)[number];
export type TMix = Record<TLayer, number>;

export interface ISound {
  mix: TMix;
  master: number;
}

export const SILENCE: TMix = {
  rain: 0,
  ocean: 0,
  stream: 0,
  wind: 0,
  crickets: 0,
  thunder: 0,
  cafe: 0,
  fire: 0,
  train: 0,
  fan: 0,
  brown: 0,
  pink: 0,
  white: 0,
  pad: 0,
  keys: 0,
  drone: 0,
  bells: 0,
};

// A first visit opens on the Deep focus scene, so the first tap on play is heard.
export const DEFAULT_SOUND: ISound = { mix: { ...SILENCE, pad: 70, drone: 50, brown: 35 }, master: 80 };

const step = (v: number) => (Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v / 5) * 5)) : 0);

function readRaw(): Record<string, unknown> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as unknown;
    return isRecord(raw) ? raw : null;
  } catch {
    return null;
  }
}

// Levels live in at.v1.settings.focusSound.mix and the master volume in focusSound.master, both as 0–1.
function read(): ISound {
  const raw = readRaw();
  const fs = raw && isRecord(raw.focusSound) ? raw.focusSound : null;
  const saved = fs && isRecord(fs.mix) ? fs.mix : null;
  const mix = { ...SILENCE };
  let heard = false;
  for (const k of LAYERS) {
    const v = saved ? saved[k] : 0;
    if (typeof v !== 'number' || !(v > 0 && v <= 1)) continue;
    mix[k] = step(v * 100);
    heard ||= mix[k] > 0;
  }
  // An empty mix is a first visit, unless the person had switched sound on with every layer down.
  const fresh = !heard && raw?.ambientOn !== true;
  const master = fs && typeof fs.master === 'number' && fs.master >= 0 && fs.master <= 1 ? step(fs.master * 100) : 80;
  return { mix: fresh ? { ...DEFAULT_SOUND.mix } : mix, master };
}

function write(sound: ISound) {
  const raw = readRaw() ?? { v: 1 };
  const fs = isRecord(raw.focusSound) ? raw.focusSound : {};
  const mix: Record<string, number> = {};
  for (const k of LAYERS) if (sound.mix[k] > 0) mix[k] = sound.mix[k] / 100;
  const focusSound = { ...DEFAULT_SETTINGS.focusSound, ...fs, mix, master: sound.master / 100 };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...raw, focusSound }));
  } catch {
    // Blocked storage: the mix lasts for this visit only.
  }
}

const subs = new Set<() => void>();
let state: ISound | null = null;
let listening = false;

const same = (a: ISound, b: ISound) => a.master === b.master && LAYERS.every((k) => a.mix[k] === b.mix[k]);

export function getSound(): ISound {
  if (typeof window === 'undefined') return DEFAULT_SOUND;
  state ??= read();
  return state;
}

function commit(next: ISound) {
  if (same(next, getSound())) return;
  state = next;
  write(next);
  for (const cb of subs) cb();
}

export function setLayer(key: TLayer, value: number) {
  const sound = getSound();
  commit({ ...sound, mix: { ...sound.mix, [key]: step(value) } });
}

export function setMix(mix: TMix) {
  const next = { ...SILENCE };
  for (const k of LAYERS) next[k] = step(mix[k]);
  commit({ ...getSound(), mix: next });
}

export function setMaster(value: number) {
  commit({ ...getSound(), master: step(value) });
}

// Another tab changing the mix is heard here too.
function onStorage(e: StorageEvent) {
  if (e.key !== SETTINGS_KEY && e.key !== null) return;
  const next = read();
  if (state && same(next, state)) return;
  state = next;
  for (const cb of subs) cb();
}

export function subscribeSound(cb: () => void) {
  subs.add(cb);
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    window.addEventListener('storage', onStorage);
  }
  return () => {
    subs.delete(cb);
  };
}

export function useSound(): ISound {
  return useSyncExternalStore(subscribeSound, getSound, () => DEFAULT_SOUND);
}

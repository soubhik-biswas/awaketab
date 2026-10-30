import { useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import { SETTINGS_KEY } from '@/lib/tool/settings';
import { isRecord } from '@/lib/tool/store';
import type { TDeviceKind, TDeviceStatus, TIdentity } from '@/components/product/device-presence';

export type { TDeviceStatus };
export type TMixKey = 'rain' | 'cafe' | 'fire' | 'brown';
type TProPlan = 'monthly' | 'yearly' | 'lifetime';

export interface IProDevice {
  id: string;
  name: string;
  kind: TDeviceKind;
  identity: TIdentity;
  status: TDeviceStatus;
  detail: string;
  current: boolean;
}

export interface IProAccount {
  name: string;
  email: string;
  plan: TProPlan;
  renewsOn: string;
}

export interface IStudioSettings {
  lamp: '' | `#${string}`;
  glow: number;
}

export type ISoundMix = Record<TMixKey, number>;

export interface IProSnapshot {
  isPro: boolean;
  account: IProAccount | null;
  devices: IProDevice[];
  maxDevices: number;
  studio: IStudioSettings;
  mix: ISoundMix;
}

// What the tool needs from Pro. The placeholder below keeps everything on this device; the Pro build
// replaces it with setProSource() and the views do not change.
export interface IProSource {
  getSnapshot(): IProSnapshot;
  subscribe(cb: () => void): () => void;
  setStudio(patch: Partial<IStudioSettings>): void;
  saveStudio(): Promise<void>;
  setMix(key: TMixKey, value: number): void;
  addDevice(): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  exportData(): Promise<Blob>;
  billingUrl(): string;
}

export const STUDIO_KEY = 'at.v1.studio';
export const MIX_KEYS: readonly TMixKey[] = ['rain', 'cafe', 'fire', 'brown'];

const DEFAULT_STUDIO: IStudioSettings = { lamp: '', glow: 70 };
const DEFAULT_MIX: ISoundMix = { rain: 40, cafe: 0, fire: 25, brown: 0 };

const PLACEHOLDER_DEVICES: IProDevice[] = [
  { id: 'this', name: 'Work laptop', kind: 'laptop', identity: 'cobalt', status: 'awake', detail: '', current: true },
  {
    id: 'ipad',
    name: 'Kitchen iPad',
    kind: 'tablet',
    identity: 'bubblegum',
    status: 'awake',
    detail: 'Cooking · until 6:00 PM',
    current: false,
  },
  {
    id: 'phone',
    name: 'Phone',
    kind: 'phone',
    identity: 'denim',
    status: 'paused',
    detail: 'Tab hidden since 10:58 AM',
    current: false,
  },
];

const PLACEHOLDER_ACCOUNT: IProAccount = {
  name: '[YOUR NAME]',
  email: '[YOUR EMAIL]',
  plan: 'monthly',
  renewsOn: '[DATE]',
};

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked storage: the choice lasts for this visit only.
  }
}

function readStudio(): IStudioSettings {
  const raw = readJson(STUDIO_KEY);
  if (!isRecord(raw)) return { ...DEFAULT_STUDIO };
  const lamp = typeof raw.lamp === 'string' && /^#[0-9a-f]{6}$/iu.test(raw.lamp) ? (raw.lamp as `#${string}`) : '';
  const glow = Number(raw.glow);
  return { lamp, glow: Number.isFinite(glow) ? Math.min(100, Math.max(0, Math.round(glow / 5) * 5)) : 70 };
}

// The mixer levels live in at.v1.settings.focusSound.mix (0–1), where the old sound pack kept them.
function readMix(): ISoundMix {
  const raw = readJson(SETTINGS_KEY);
  const fs = isRecord(raw) && isRecord(raw.focusSound) ? raw.focusSound : null;
  if (!fs || !isRecord(fs.mix)) return { ...DEFAULT_MIX };
  const mix = fs.mix;
  const out = { ...DEFAULT_MIX };
  for (const k of MIX_KEYS) {
    const v = Number(mix[k]);
    out[k] = Number.isFinite(v) && v >= 0 && v <= 1 ? Math.round(v * 20) * 5 : 0;
  }
  return out;
}

function writeMix(mix: ISoundMix) {
  const raw = readJson(SETTINGS_KEY);
  const base = isRecord(raw) ? raw : { ...DEFAULT_SETTINGS };
  const fs = isRecord(base.focusSound) ? base.focusSound : DEFAULT_SETTINGS.focusSound;
  const m: Record<string, number> = {};
  for (const k of MIX_KEYS) if (mix[k] > 0) m[k] = mix[k] / 100;
  writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...base, focusSound: { ...fs, mix: m } });
}

function createPlaceholder(): IProSource {
  const subs = new Set<() => void>();
  let snap: IProSnapshot | null = null;
  const load = (): IProSnapshot => {
    snap ??= {
      isPro: true,
      account: PLACEHOLDER_ACCOUNT,
      devices: PLACEHOLDER_DEVICES,
      maxDevices: 5,
      studio: typeof window === 'undefined' ? DEFAULT_STUDIO : readStudio(),
      mix: typeof window === 'undefined' ? DEFAULT_MIX : readMix(),
    };
    return snap;
  };
  const set = (patch: Partial<IProSnapshot>) => {
    snap = { ...load(), ...patch };
    for (const cb of subs) cb();
  };
  return {
    getSnapshot: load,
    subscribe(cb) {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    setStudio(patch) {
      set({ studio: { ...load().studio, ...patch } });
    },
    saveStudio() {
      writeJson(STUDIO_KEY, { v: 1, ...load().studio });
      return Promise.resolve();
    },
    setMix(key, value) {
      const mix = { ...load().mix, [key]: Math.min(100, Math.max(0, Math.round(value / 5) * 5)) };
      writeMix(mix);
      set({ mix });
    },
    addDevice: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
    deleteAccount: () => Promise.resolve(),
    exportData() {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith('at.v1.') && k !== 'at.v1.license') data[k] = readJson(k);
      }
      return Promise.resolve(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    },
    billingUrl: () => '/pro',
  };
}

let source: IProSource = createPlaceholder();
const swaps = new Set<() => void>();

export function setProSource(next: IProSource) {
  source = next;
  for (const cb of swaps) cb();
}

export const pro = {
  setStudio: (patch: Partial<IStudioSettings>) => source.setStudio(patch),
  saveStudio: () => source.saveStudio(),
  setMix: (key: TMixKey, value: number) => source.setMix(key, value),
  addDevice: () => source.addDevice(),
  signOut: () => source.signOut(),
  deleteAccount: () => source.deleteAccount(),
  exportData: () => source.exportData(),
  billingUrl: () => source.billingUrl(),
};

const SERVER: IProSnapshot = {
  isPro: true,
  account: PLACEHOLDER_ACCOUNT,
  devices: PLACEHOLDER_DEVICES,
  maxDevices: 5,
  studio: DEFAULT_STUDIO,
  mix: DEFAULT_MIX,
};

function subscribe(cb: () => void) {
  let off = source.subscribe(cb);
  const onSwap = () => {
    off();
    off = source.subscribe(cb);
    cb();
  };
  swaps.add(onSwap);
  return () => {
    swaps.delete(onSwap);
    off();
  };
}

export function usePro(): IProSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => source.getSnapshot(),
    () => SERVER,
  );
}

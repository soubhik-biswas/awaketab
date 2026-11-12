import { useSyncExternalStore } from 'react';
import { DEFAULT_SOUND, getSound, setLayer, subscribeSound } from '@/lib/tool/sound-mix';
import { isRecord } from '@/lib/tool/store';
import type { TDeviceKind, TDeviceStatus, TIdentity } from '@/components/product/device-presence';

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

// The signed-in account as the tool shows it: how the person signed in, and the plan only while Pro is on.
export interface IProAccount {
  name: string;
  method: 'google' | 'github' | 'passkey';
  plan: TProPlan;
  renewsOn: string;
}

export interface IStudioSettings {
  lamp: '' | `#${string}`;
  glow: number;
}

export type TSoundMix = Record<TMixKey, number>;

export interface IProSnapshot {
  isPro: boolean;
  account: IProAccount | null;
  // A sign-in this device remembered has ended on the server, so signing in again is the next step.
  expired: boolean;
  devices: IProDevice[];
  maxDevices: number;
  studio: IStudioSettings;
  mix: TSoundMix;
}

// What the tool needs from Pro. Until the Pro client connects, nothing is claimed: no plan, no account, no screens.
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

function createPlaceholder(): IProSource {
  const subs = new Set<() => void>();
  let snap: IProSnapshot | null = null;
  const load = (): IProSnapshot => {
    snap ??= {
      isPro: false,
      account: null,
      expired: false,
      devices: [],
      maxDevices: 5,
      studio: typeof window === 'undefined' ? DEFAULT_STUDIO : readStudio(),
      mix: getSound().mix,
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
      setLayer(key, value);
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
  // Face studio is free: the look is saved on this device whatever the plan.
  saveStudio: () => writeJson(STUDIO_KEY, { v: 1, ...source.getSnapshot().studio }),
  // Every layer of the mix, the newer ones too, is kept by the sound store; the snapshot below mirrors it.
  setMix: (key: TMixKey, value: number) => setLayer(key, value),
  addDevice: () => source.addDevice(),
  signOut: () => source.signOut(),
  deleteAccount: () => source.deleteAccount(),
  exportData: () => source.exportData(),
  billingUrl: () => source.billingUrl(),
};

const SERVER: IProSnapshot = {
  isPro: false,
  account: null,
  expired: false,
  devices: [],
  maxDevices: 5,
  studio: DEFAULT_STUDIO,
  mix: DEFAULT_SOUND.mix,
};

let seen: IProSnapshot | null = null;
let merged: IProSnapshot | null = null;

function snapshot(): IProSnapshot {
  const base = source.getSnapshot();
  const mix = getSound().mix;
  if (!merged || base !== seen || merged.mix !== mix) merged = { ...base, mix };
  seen = base;
  return merged;
}

function subscribe(cb: () => void) {
  const offSound = subscribeSound(cb);
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
    offSound();
  };
}

export function usePro(): IProSnapshot {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}

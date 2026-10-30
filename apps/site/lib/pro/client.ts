'use client';

import { DEFAULT_SETTINGS } from '@awaketab/core';
import { identityFor } from '@/components/product/device-presence';
import { authClient, signOutEverywhere } from '@/lib/auth/client';
import { SETTINGS_KEY } from '@/lib/tool/settings';
import { isRecord } from '@/lib/tool/store';
import {
  MIX_KEYS,
  STUDIO_KEY,
  type IProAccount,
  type IProDevice,
  type IProSnapshot,
  type IProSource,
  type ISoundMix,
  type IStudioSettings,
  type TMixKey,
  setProSource,
} from '@/lib/tool/pro';
import { forgetAccount, readAccount, writeAccount, type TSignInMethod } from './account';
import { deviceKind } from './device';
import {
  fetchActivations,
  isProActive,
  LICENSE_KEY,
  readLicense,
  renewsAt,
  sha256Hex,
  type IActivation,
} from './license';
import { longDate, MAX_DEVICES, portalUrl } from './plans';

const DEFAULT_STUDIO: IStudioSettings = { lamp: '', glow: 70 };
const DEFAULT_MIX: ISoundMix = { rain: 40, cafe: 0, fire: 25, brown: 0 };

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
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

function readMix(): ISoundMix {
  const raw = readJson(SETTINGS_KEY);
  const fs = isRecord(raw) && isRecord(raw.focusSound) ? raw.focusSound : null;
  if (!fs || !isRecord(fs.mix)) return { ...DEFAULT_MIX };
  const out = { ...DEFAULT_MIX };
  for (const k of MIX_KEYS) {
    const v = Number(fs.mix[k]);
    out[k] = Number.isFinite(v) && v >= 0 && v <= 1 ? Math.round(v * 20) * 5 : 0;
  }
  return out;
}

function writeMix(mix: ISoundMix): void {
  const raw = readJson(SETTINGS_KEY);
  const base = isRecord(raw) ? raw : { ...DEFAULT_SETTINGS };
  const fs = isRecord(base.focusSound) ? base.focusSound : DEFAULT_SETTINGS.focusSound;
  const m: Record<string, number> = {};
  for (const k of MIX_KEYS) if (mix[k] > 0) m[k] = mix[k] / 100;
  writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...base, focusSound: { ...fs, mix: m } });
}

function accountFrom(): IProAccount | null {
  const acct = readAccount();
  if (!acct) return null;
  const lic = readLicense();
  const renews = lic ? renewsAt(lic) : null;
  return {
    name: acct.name || acct.email,
    email: acct.email,
    plan: lic?.plan === 'pro_lifetime' ? 'lifetime' : 'yearly',
    renewsOn: renews ? longDate(renews) : '',
  };
}

// Other devices show when they were added: there is no presence service, so only this device is live.
async function devicesFrom(rows: IActivation[]): Promise<IProDevice[]> {
  const here = readLicense()?.deviceId;
  const hereHash = here ? await sha256Hex(here) : '';
  return rows.map((row, index) => ({
    id: row.devHash,
    name: row.label,
    kind: deviceKind(row.label),
    identity: identityFor(index),
    status: 'idle',
    detail: `Added ${longDate(row.at)}`,
    current: row.devHash === hereHash,
  }));
}

function methodOf(providers: string[]): TSignInMethod {
  if (providers.includes('google')) return 'google';
  if (providers.includes('github')) return 'github';
  return 'email';
}

// The real Pro data behind the tool's Pro views: licence and devices from the licence API, the account from the
// sign-in session (kept on the device as at.v1.account), Face studio and the mixer in local storage.
export function createProSource(): IProSource {
  const subs = new Set<() => void>();
  let snap: IProSnapshot | null = null;
  let devices: IProDevice[] = [];
  let loading: Promise<void> | null = null;

  const build = (): IProSnapshot => ({
    isPro: isProActive(),
    account: accountFrom(),
    devices,
    maxDevices: MAX_DEVICES,
    studio: readStudio(),
    mix: readMix(),
  });
  const emit = (patch?: Partial<IProSnapshot>) => {
    snap = { ...build(), ...(snap ? { studio: snap.studio, mix: snap.mix } : {}), ...patch };
    for (const cb of subs) cb();
  };
  const refreshDevices = () => {
    loading ??= (async () => {
      const list = await fetchActivations();
      if (list !== 'offline' && list !== 'none' && Array.isArray(list.activations))
        devices = await devicesFrom(list.activations);
      else if (list === 'none' || (list !== 'offline' && list.revoked)) devices = [];
      loading = null;
      emit();
    })();
  };
  const refreshSession = async () => {
    try {
      const { data } = await authClient.getSession();
      if (data?.user?.email) {
        const current = readAccount();
        if (current?.email !== data.user.email) {
          const accounts = await authClient.listAccounts().catch(() => null);
          const providers = Array.isArray(accounts?.data) ? accounts.data.map((a) => a.providerId) : [];
          writeAccount(data.user.email, methodOf(providers), data.user.name || '');
        }
      }
    } catch {
      // Offline: the account stored on this device stays.
    }
    emit();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === LICENSE_KEY) refreshDevices();
    emit();
  };
  const onLicense = () => {
    refreshDevices();
    emit();
  };
  const onAccount = () => emit();

  return {
    getSnapshot() {
      snap ??= build();
      return snap;
    },
    subscribe(cb) {
      subs.add(cb);
      if (subs.size === 1) {
        window.addEventListener('storage', onStorage);
        window.addEventListener('at:license', onLicense);
        window.addEventListener('at:account', onAccount);
        refreshDevices();
        void refreshSession();
      }
      return () => {
        subs.delete(cb);
        if (subs.size === 0) {
          window.removeEventListener('storage', onStorage);
          window.removeEventListener('at:license', onLicense);
          window.removeEventListener('at:account', onAccount);
        }
      };
    },
    setStudio(patch) {
      const current = snap ?? build();
      emit({ studio: { ...current.studio, ...patch } });
    },
    saveStudio() {
      // Without Pro the preview still changes, and saving leads to the Pro page instead.
      if (!isProActive()) {
        window.location.assign('/pro');
        return Promise.resolve();
      }
      writeJson(STUDIO_KEY, { v: 1, ...(snap ?? build()).studio });
      return Promise.resolve();
    },
    setMix(key: TMixKey, value: number) {
      const current = snap ?? build();
      const mix = { ...current.mix, [key]: Math.min(100, Math.max(0, Math.round(value / 5) * 5)) };
      writeMix(mix);
      emit({ mix });
    },
    addDevice() {
      window.location.assign('/pro/manage');
      return Promise.resolve();
    },
    async signOut() {
      await signOutEverywhere();
      forgetAccount();
      emit();
    },
    // Removes the sign-in account and this device's copy of the address; the purchase record stays with Polar.
    async deleteAccount() {
      try {
        await authClient.deleteUser();
      } catch {
        // Offline or no session: the device copy below is still removed.
      }
      forgetAccount();
      emit();
    },
    exportData() {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith('at.v1.') && k !== LICENSE_KEY) data[k] = readJson(k);
      }
      return Promise.resolve(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    },
    billingUrl: () => portalUrl(),
  };
}

let connected = false;

// Call once on the client (the tool does it on mount) to swap the tool's placeholder for the real data.
export function connectPro(): void {
  if (connected || typeof window === 'undefined') return;
  connected = true;
  setProSource(createProSource());
}

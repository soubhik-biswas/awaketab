import type { TPlanId } from '@awaketab/core';

export const LICENSE_KEY = 'at.v1.license';
const LICENSE_KEY_RE = /^[A-Z0-9-]{20,80}$/u;
const DAY_S = 86_400;

export interface IActivation {
  label: string;
  at: number;
  devHash: string;
}

export interface IStoredLicense {
  v: 1;
  token: string;
  plan: TPlanId;
  features: string[];
  exp: number;
  lastValidatedAt: number;
  deviceId: string;
  deviceLabel: string;
}

export type TActivateResult =
  | { ok: true; token: string; plan: TPlanId; features: string[]; exp: number; activations: IActivation[] }
  | { ok: false; error: string };

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`/api/license/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export function readLicense(): IStoredLicense | null {
  try {
    const row = JSON.parse(localStorage.getItem(LICENSE_KEY) ?? 'null') as Partial<IStoredLicense> | null;
    if (row && typeof row.token === 'string' && typeof row.plan === 'string' && typeof row.exp === 'number')
      return row as IStoredLicense;
  } catch {
    // A damaged record reads as no licence.
  }
  return null;
}

function writeLicense(record: IStoredLicense | null): void {
  try {
    if (record) localStorage.setItem(LICENSE_KEY, JSON.stringify(record));
    else localStorage.removeItem(LICENSE_KEY);
    window.dispatchEvent(new Event('at:license'));
  } catch {
    // Blocked storage: Pro lasts for this visit only.
  }
}

export function forgetLicense(): void {
  writeLicense(null);
}

export function deviceId(): string {
  const stored = readLicense()?.deviceId;
  if (stored) return stored;
  try {
    const raw = JSON.parse(localStorage.getItem(LICENSE_KEY) ?? '{}') as { deviceId?: string } | null;
    if (raw?.deviceId) return raw.deviceId;
  } catch {
    // fall through
  }
  return crypto.randomUUID();
}

export function normaliseLicenseKey(raw: string): string | null {
  const key = raw.trim().toUpperCase();
  return LICENSE_KEY_RE.test(key) ? key : null;
}

export function keyTail(key: string): string {
  return key.replace(/\s/gu, '').slice(-4).toUpperCase() || '····';
}

// Pro holds while the signed token is in date; yearly tokens already carry the 7-day grace in `exp`.
export function isProActive(record: IStoredLicense | null = readLicense(), now = Date.now()): boolean {
  return Boolean(record && record.exp * 1000 > now);
}

// Yearly tokens carry a 7-day grace past the period end, so the renewal date is exp − 7 days.
export function renewsAt(record: Pick<IStoredLicense, 'plan' | 'exp'>): number | null {
  return record.plan === 'pro_yearly' ? (record.exp - 7 * DAY_S) * 1000 : null;
}

export function lapseState(plan: string | undefined, expSec: number | undefined, now = Date.now()) {
  if (plan !== 'pro_yearly' || typeof expSec !== 'number' || !Number.isFinite(expSec)) return null;
  if (now >= expSec * 1000) return 'lapsed' as const;
  if (now >= (expSec - 7 * DAY_S) * 1000) return 'grace' as const;
  return null;
}

export async function activateLicense(input: {
  key?: string;
  checkoutId?: string;
  deviceId: string;
  deviceLabel: string;
}): Promise<TActivateResult> {
  try {
    const res = await post('activate', input);
    const data = (await res.json()) as {
      error?: string;
      token?: string;
      plan?: TPlanId;
      features?: string[];
      exp?: number;
      activations?: IActivation[];
    };
    if (!res.ok || !data.token || !data.plan || !data.features || !data.exp)
      return { ok: false, error: data.error ?? 'invalid_key' };
    writeLicense({
      v: 1,
      token: data.token,
      plan: data.plan,
      features: data.features,
      exp: data.exp,
      lastValidatedAt: Date.now(),
      deviceId: input.deviceId,
      deviceLabel: input.deviceLabel,
    });
    return {
      ok: true,
      token: data.token,
      plan: data.plan,
      features: data.features,
      exp: data.exp,
      activations: Array.isArray(data.activations) ? data.activations : [],
    };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

export async function lookupCheckoutKey(
  checkoutId: string,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  try {
    const res = await post('activate', { checkoutId, lookup: true });
    const data = (await res.json()) as { error?: string; key?: string };
    const key = res.ok && typeof data.key === 'string' ? normaliseLicenseKey(data.key) : null;
    return key ? { ok: true, key } : { ok: false, error: data.error ?? 'invalid_key' };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

export interface IDeviceList {
  revoked: boolean;
  plan?: string;
  exp?: number;
  activations?: IActivation[];
}

// The validate answer also refreshes the stored token, so a device list read keeps this browser's Pro current.
export async function fetchActivations(): Promise<IDeviceList | 'offline' | 'none'> {
  const record = readLicense();
  if (!record) return 'none';
  let res: Response;
  let data: IDeviceList & { token?: string; features?: string[]; reason?: string };
  try {
    res = await post('validate', { token: record.token });
    data = (await res.json()) as typeof data;
  } catch {
    return 'offline';
  }
  if (res.status === 401 || data.revoked) {
    forgetLicense();
    return { revoked: true };
  }
  if (!res.ok || !Array.isArray(data.activations)) return 'offline';
  if (typeof data.token === 'string' && typeof data.exp === 'number')
    writeLicense({
      ...record,
      token: data.token,
      exp: data.exp,
      features: Array.isArray(data.features) ? data.features : record.features,
      plan: (data.plan as TPlanId | undefined) ?? record.plan,
      lastValidatedAt: Date.now(),
    });
  return data;
}

export async function deactivateDevice(devHash: string): Promise<IActivation[] | null> {
  const record = readLicense();
  if (!record) return null;
  try {
    const res = await post('deactivate', { token: record.token, deviceId: devHash });
    const data = (await res.json()) as { ok?: boolean; activations?: IActivation[] };
    return res.ok && Array.isArray(data.activations) ? data.activations : null;
  } catch {
    return null;
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

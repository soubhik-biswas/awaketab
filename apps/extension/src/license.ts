import { needsRevalidation, type ILicenseRecord } from '@awaketab/core';

export const API_ORIGIN = 'https://awaketab.com';

type TFetch = (input: string, init?: RequestInit) => Promise<Response>;

// Everything in the extension is free; a Pro licence stored by an earlier version is only kept honest (refreshed,
// or dropped once revoked), never used to gate a feature.
export async function revalidate(
  record: ILicenseRecord,
  fetchFn: TFetch = fetch,
  now = Date.now(),
): Promise<{ status: 'fresh' | 'ok' | 'revoked' | 'offline'; record: ILicenseRecord | null }> {
  if (!needsRevalidation(record.plan, record.lastValidatedAt, now)) return { status: 'fresh', record };
  try {
    const res = await fetchFn(`${API_ORIGIN}/api/license/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: record.token }),
    });
    if (!res.ok) return { status: 'offline', record };
    const data = (await res.json()) as { revoked?: boolean };
    if (data.revoked) return { status: 'revoked', record: null };
    return { status: 'ok', record: { ...record, lastValidatedAt: now } };
  } catch {
    return { status: 'offline', record };
  }
}

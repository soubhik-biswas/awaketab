'use client';

import { authClient, readSession } from '@/lib/auth/client';
import type { TSignInMethod } from '@/lib/auth/shared';
import { forgetAccount, hasAccountRecord, readAccount, writeAccount, type IAccount } from './account';

const PENDING_KEY = 'at.v1.signin';

export type TAccountState =
  | { state: 'signed-in'; account: IAccount }
  | { state: 'signed-out'; expired: boolean }
  | { state: 'offline'; account: IAccount | null };

// Google and GitHub leave the page, so the button pressed is remembered for the trip there and back.
export function rememberMethod(method: TSignInMethod): void {
  try {
    sessionStorage.setItem(PENDING_KEY, method);
  } catch {
    // Without storage the method is read from the session instead.
  }
}

export function pendingMethod(): TSignInMethod | null {
  try {
    const value = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return value === 'google' || value === 'github' || value === 'passkey' ? value : null;
  } catch {
    return null;
  }
}

async function providerMethod(): Promise<TSignInMethod> {
  const res = await authClient.listAccounts().catch(() => null);
  const providers = Array.isArray(res?.data) ? res.data.map((a) => a.providerId) : [];
  if (providers.includes('google')) return 'google';
  if (providers.includes('github')) return 'github';
  return 'passkey';
}

// The one place the device's account note is brought in line with the server. A note the server no longer backs
// means the session expired: it is removed, and the caller can ask the person to sign in again.
export async function syncAccount(): Promise<TAccountState> {
  const had = hasAccountRecord();
  let session;
  try {
    session = await readSession();
  } catch {
    return { state: 'offline', account: readAccount() };
  }
  if (session.state === 'signed-out') {
    if (had) forgetAccount();
    return { state: 'signed-out', expired: had };
  }
  const stored = readAccount();
  const pending = pendingMethod();
  const method = session.method ?? pending ?? stored?.method ?? (await providerMethod());
  const account =
    stored && stored.method === method && stored.name === session.name
      ? stored
      : writeAccount(method, session.name, stored?.signedInAt || Date.now());
  return { state: 'signed-in', account };
}

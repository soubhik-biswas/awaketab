'use client';

import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { AUTH_BASE_PATH, SIGNIN_MINUTES, type IAuthStatus, type TSocialProvider } from './shared';

export const authClient = createAuthClient({ basePath: AUTH_BASE_PATH, plugins: [magicLinkClient()] });

export const OFFLINE_STATUS: IAuthStatus = {
  ready: false,
  google: false,
  github: false,
  email: false,
  minutes: SIGNIN_MINUTES,
};

export async function fetchAuthStatus(): Promise<IAuthStatus> {
  try {
    const res = await fetch(`${AUTH_BASE_PATH}/status`, { cache: 'no-store' });
    if (!res.ok) return OFFLINE_STATUS;
    return { ...OFFLINE_STATUS, ...((await res.json()) as Partial<IAuthStatus>) };
  } catch {
    return OFFLINE_STATUS;
  }
}

export type TSigninResult = 'sent' | 'bad_email' | 'rate_limited' | 'email_unavailable' | 'offline';

export async function requestSignin(email: string, callbackURL = '/signin'): Promise<TSigninResult> {
  try {
    const res = await fetch(`${AUTH_BASE_PATH}/sign-in/magic-link`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: email.trim(), callbackURL }),
    });
    if (res.ok) return 'sent';
    if (res.status === 429) return 'rate_limited';
    if (res.status === 400) return 'bad_email';
    return 'email_unavailable';
  } catch {
    return 'offline';
  }
}

// Spends a link token. Better Auth answers JSON when the token is good and a redirect when it is not, so the
// redirect is not followed: any answer but a JSON 200 means the link is used up or expired.
export async function verifySignin(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false; offline: boolean }> {
  try {
    const res = await fetch(`${AUTH_BASE_PATH}/magic-link/verify?token=${encodeURIComponent(token)}`, {
      credentials: 'same-origin',
      redirect: 'manual',
      cache: 'no-store',
    });
    if (res.status !== 200) return { ok: false, offline: false };
    const data = (await res.json()) as { user?: { email?: unknown } };
    const email = data.user?.email;
    return typeof email === 'string' ? { ok: true, email } : { ok: false, offline: false };
  } catch {
    return { ok: false, offline: !navigator.onLine };
  }
}

export async function signInWith(provider: TSocialProvider): Promise<'redirecting' | 'unavailable' | 'offline'> {
  try {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: '/signin',
      errorCallbackURL: '/signin?error=social',
    });
    return error ? 'unavailable' : 'redirecting';
  } catch {
    return 'offline';
  }
}

export async function signOutEverywhere(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Offline: the local copy below still forgets the address.
  }
}

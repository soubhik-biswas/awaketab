'use client';

import { lastLoginMethodClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { AUTH_BASE_PATH, isSignInMethod, type IAuthStatus, type TSignInMethod, type TSocialProvider } from './shared';

export const authClient = createAuthClient({ basePath: AUTH_BASE_PATH, plugins: [lastLoginMethodClient()] });

const NONE: IAuthStatus = { ready: false, google: false, github: false, passkey: false };

// Which ways in are set up; null when the server could not be asked.
export async function fetchAuthStatus(): Promise<IAuthStatus | null> {
  try {
    const res = await fetch(`${AUTH_BASE_PATH}/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    return { ...NONE, ...((await res.json()) as Partial<IAuthStatus>) };
  } catch {
    return null;
  }
}

export type TSignInResult = 'redirecting' | 'signed' | 'cancelled' | 'unavailable' | 'offline';

// Google and GitHub leave for the provider and come back to `callbackURL`; a refusal comes back with ?error=.
export async function signInWith(provider: TSocialProvider, callbackURL = '/signin'): Promise<TSignInResult> {
  const back = new URL(callbackURL, window.location.origin);
  back.searchParams.set('error', 'cancelled');
  try {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL,
      errorCallbackURL: `${back.pathname}${back.search}${back.hash}`,
    });
    return error ? 'unavailable' : 'redirecting';
  } catch {
    return navigator.onLine ? 'unavailable' : 'offline';
  }
}

// The passkey client pulls in the WebAuthn helpers, so it loads only when someone presses the passkey button.
async function passkeyClient() {
  const { passkeyClient: plugin } = await import('@better-auth/passkey/client');
  return createAuthClient({ basePath: AUTH_BASE_PATH, plugins: [plugin()] });
}

// A saved passkey signs in; when the browser has none to offer, `create` makes one, which also starts the account.
export async function signInWithPasskey(create = false): Promise<TSignInResult> {
  try {
    const client = await passkeyClient();
    const { error } = create
      ? await client.passkey.addPasskey({ createSession: true, name: 'AwakeTab' })
      : await client.signIn.passkey();
    if (!error) {
      await authClient.getSession({ query: { disableCookieCache: true } });
      return 'signed';
    }
    // The browser's dialog closing, no saved passkey and an unknown one all answer 4xx: nothing changed.
    return error.status >= 400 && error.status < 500 ? 'cancelled' : 'unavailable';
  } catch {
    return navigator.onLine ? 'unavailable' : 'offline';
  }
}

export type TSession = { state: 'signed-in'; method: TSignInMethod | null; name: string } | { state: 'signed-out' };

// What the server says right now. Throws when it cannot be reached, so callers keep what they knew.
export async function readSession(): Promise<TSession> {
  const { data, error } = await authClient.getSession();
  if (error) throw new Error(error.message ?? 'session');
  if (!data?.user) return { state: 'signed-out' };
  const last = authClient.getLastUsedLoginMethod();
  return { state: 'signed-in', method: isSignInMethod(last) ? last : null, name: data.user.name || '' };
}

export async function signOutEverywhere(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Offline: the copy on this device is still forgotten by the caller.
  }
}

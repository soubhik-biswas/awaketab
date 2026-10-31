export const AUTH_BASE_PATH = '/api/auth';

export type TSocialProvider = 'google' | 'github';
export type TSignInMethod = TSocialProvider | 'passkey';
export const SIGN_IN_METHODS: readonly TSignInMethod[] = ['google', 'github', 'passkey'];

export interface IAuthStatus {
  ready: boolean;
  google: boolean;
  github: boolean;
  passkey: boolean;
}

export function isSignInMethod(value: unknown): value is TSignInMethod {
  return typeof value === 'string' && (SIGN_IN_METHODS as readonly string[]).includes(value);
}

// A passkey-only account has no address of its own; Better Auth's user table still needs a unique value there,
// so it gets an undeliverable one under the reserved .invalid domain. It is never shown and never mailed.
export const PASSKEY_USER_DOMAIN = 'passkey.awaketab.invalid';

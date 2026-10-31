import { describe, expect, it } from 'vitest';
import { isSignInMethod, SIGN_IN_METHODS } from './shared';

describe('sign-in methods', () => {
  it('offers Google, GitHub and a passkey, in that order, and nothing that needs an address', () => {
    expect(SIGN_IN_METHODS).toEqual(['google', 'github', 'passkey']);
    expect(isSignInMethod('passkey')).toBe(true);
    expect(isSignInMethod('email')).toBe(false);
    expect(isSignInMethod('magic-link')).toBe(false);
    expect(isSignInMethod(undefined)).toBe(false);
  });
});

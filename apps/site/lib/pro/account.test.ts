import { describe, expect, it } from 'vitest';
import { forgetAccount, readAccount, writeAccount } from './account';

function memory(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const rows = new Map<string, string>();
  return {
    getItem: (k) => rows.get(k) ?? null,
    setItem: (k, v) => void rows.set(k, v),
    removeItem: (k) => void rows.delete(k),
  };
}

describe('the device account note', () => {
  it('keeps only how the person signed in, never an address', () => {
    const s = memory();
    writeAccount('passkey', '', 1000, s);
    expect(readAccount(s)).toEqual({ v: 1, method: 'passkey', name: '', signedInAt: 1000 });
    expect(s.getItem('at.v1.account')).not.toMatch(/@/u);
    forgetAccount(s);
    expect(readAccount(s)).toBeNull();
  });

  it('reads an old email-link record as signed out', () => {
    const s = memory();
    s.setItem('at.v1.account', JSON.stringify({ v: 1, email: 'sam@example.com', method: 'email', signedInAt: 1 }));
    expect(readAccount(s)).toBeNull();
  });
});

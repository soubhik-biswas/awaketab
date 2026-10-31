import { isSignInMethod, type TSignInMethod } from '@/lib/auth/shared';

const ACCOUNT_KEY = 'at.v1.account';

export type { TSignInMethod };

// This device's note that it is signed in, and how. No address or provider id is kept here.
export interface IAccount {
  v: 1;
  method: TSignInMethod;
  name: string;
  signedInAt: number;
}

type TStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const store = (): TStore | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

// Records from the email-link sign-in still hold an address; they read as signed out until the session is checked.
export function readAccount(s: TStore | null = store()): IAccount | null {
  try {
    const row = JSON.parse(s?.getItem(ACCOUNT_KEY) ?? 'null') as Partial<IAccount> | null;
    if (row && row.v === 1 && isSignInMethod(row.method))
      return {
        v: 1,
        method: row.method,
        name: typeof row.name === 'string' ? row.name : '',
        signedInAt: Number(row.signedInAt) || 0,
      };
  } catch {
    // A damaged record reads as signed out.
  }
  return null;
}

export function hasAccountRecord(s: TStore | null = store()): boolean {
  try {
    return Boolean(s?.getItem(ACCOUNT_KEY));
  } catch {
    return false;
  }
}

export function writeAccount(method: TSignInMethod, name = '', now = Date.now(), s: TStore | null = store()): IAccount {
  const row: IAccount = { v: 1, method, name, signedInAt: now };
  try {
    s?.setItem(ACCOUNT_KEY, JSON.stringify(row));
    window.dispatchEvent(new Event('at:account'));
  } catch {
    // Private mode: signed in for this page only.
  }
  return row;
}

export function forgetAccount(s: TStore | null = store()): void {
  try {
    s?.removeItem(ACCOUNT_KEY);
    window.dispatchEvent(new Event('at:account'));
  } catch {
    // Nothing stored, nothing to remove.
  }
}

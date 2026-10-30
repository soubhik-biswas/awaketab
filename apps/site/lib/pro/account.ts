import { validEmail } from '@/lib/auth/shared';

export const ACCOUNT_KEY = 'at.v1.account';

export type TSignInMethod = 'email' | 'google' | 'github';

export interface IAccount {
  v: 1;
  email: string;
  name: string;
  method: TSignInMethod;
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

const METHODS: readonly TSignInMethod[] = ['email', 'google', 'github'];

export function readAccount(s: TStore | null = store()): IAccount | null {
  try {
    const row = JSON.parse(s?.getItem(ACCOUNT_KEY) ?? 'null') as Partial<IAccount> | null;
    if (row && row.v === 1 && typeof row.email === 'string' && validEmail(row.email))
      return {
        v: 1,
        email: row.email,
        name: typeof row.name === 'string' ? row.name : '',
        method: METHODS.includes(row.method as TSignInMethod) ? (row.method as TSignInMethod) : 'email',
        signedInAt: Number(row.signedInAt) || 0,
      };
  } catch {
    // A damaged record reads as signed out.
  }
  return null;
}

export function writeAccount(
  email: string,
  method: TSignInMethod = 'email',
  name = '',
  now = Date.now(),
  s: TStore | null = store(),
): IAccount {
  const row: IAccount = { v: 1, email, name, method, signedInAt: now };
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

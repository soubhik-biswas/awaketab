export const ACCOUNT_KEY = 'at.v1.account';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
export const SIGNIN_MINUTES = 15;

export interface IAccount {
  v: 1;
  email: string;
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

export function validEmail(raw: string): boolean {
  const email = raw.trim();
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function readAccount(s: TStore | null = store()): IAccount | null {
  try {
    const row = JSON.parse(s?.getItem(ACCOUNT_KEY) ?? 'null') as Partial<IAccount> | null;
    if (row && row.v === 1 && typeof row.email === 'string' && validEmail(row.email))
      return { v: 1, email: row.email, signedInAt: Number(row.signedInAt) || 0 };
  } catch {
    // A damaged record reads as signed out.
  }
  return null;
}

export function writeAccount(email: string, now = Date.now(), s: TStore | null = store()): IAccount {
  const row: IAccount = { v: 1, email, signedInAt: now };
  try {
    s?.setItem(ACCOUNT_KEY, JSON.stringify(row));
  } catch {
    // Private mode: signed in for this page only.
  }
  return row;
}

export function signOut(s: TStore | null = store()): void {
  try {
    s?.removeItem(ACCOUNT_KEY);
  } catch {
    // Nothing stored, nothing to remove.
  }
}

export type TSigninResult = 'sent' | 'bad_email' | 'rate_limited' | 'email_unavailable' | 'offline';

export async function requestSignin(email: string): Promise<TSigninResult> {
  try {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (res.status === 202) return 'sent';
    if (res.status === 429) return 'rate_limited';
    if (res.status === 400) return 'bad_email';
    return 'email_unavailable';
  } catch {
    return 'offline';
  }
}

export async function verifySignin(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false; offline: boolean }> {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as { ok?: boolean; email?: string };
    if (res.ok && data.ok && typeof data.email === 'string') return { ok: true, email: data.email };
    return { ok: false, offline: false };
  } catch {
    return { ok: false, offline: true };
  }
}

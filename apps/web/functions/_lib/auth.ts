import { sha256Hex } from './license';
import { SIGNIN_MINUTES } from './email/templates';

export const SIGNIN_TTL_S = SIGNIN_MINUTES * 60;
// One email per address per minute, so the endpoint cannot be used to flood someone's inbox.
export const SIGNIN_COOLDOWN_S = 60;
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/u;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export interface ISigninRecord {
  v: 1;
  email: string;
  exp: number;
}

export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return [...email].some((ch) => (ch.codePointAt(0) ?? 0) < 32) ? null : email;
}

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/u, '');
}

export async function tokenKey(token: string): Promise<string> {
  return `auth:${await sha256Hex(token)}`;
}

export async function cooldownKey(email: string): Promise<string> {
  return `authmail:${await sha256Hex(email)}`;
}

export async function storeToken(kv: KVNamespace, token: string, email: string, now = Date.now()): Promise<void> {
  const record: ISigninRecord = { v: 1, email, exp: now + SIGNIN_TTL_S * 1000 };
  await kv.put(await tokenKey(token), JSON.stringify(record), { expirationTtl: SIGNIN_TTL_S });
}

// Deleted before it is checked, so a second use of the same link fails even if the first one was late.
export async function consumeToken(
  kv: KVNamespace,
  token: string,
  now = Date.now(),
): Promise<{ ok: true; email: string } | { ok: false; reason: 'expired' }> {
  if (!TOKEN_RE.test(token)) return { ok: false, reason: 'expired' };
  const key = await tokenKey(token);
  const raw = await kv.get(key);
  if (!raw) return { ok: false, reason: 'expired' };
  await kv.delete(key);
  let record: ISigninRecord;
  try {
    record = JSON.parse(raw) as ISigninRecord;
  } catch {
    return { ok: false, reason: 'expired' };
  }
  if (record.v !== 1 || typeof record.email !== 'string' || !(record.exp > now))
    return { ok: false, reason: 'expired' };
  return { ok: true, email: record.email };
}

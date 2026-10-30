const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return [...email].some((ch) => (ch.codePointAt(0) ?? 0) < 32) ? null : email;
}

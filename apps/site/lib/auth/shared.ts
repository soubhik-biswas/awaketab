export const AUTH_BASE_PATH = '/api/auth';
export const SIGNIN_MINUTES = 15;
export const SIGNIN_COOLDOWN_S = 60;
export const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/u;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

export type TSocialProvider = 'google' | 'github';

export interface IAuthStatus {
  ready: boolean;
  google: boolean;
  github: boolean;
  email: boolean;
  minutes: number;
}

export function validEmail(raw: string): boolean {
  const email = raw.trim();
  return email.length <= 254 && EMAIL_RE.test(email);
}

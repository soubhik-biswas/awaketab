import type { IEmail } from '@/emails';
import type { IEnv } from '../env';

export type TSendResult = { ok: true } | { ok: false; reason: 'not_configured' | 'failed' };

// No email provider is chosen yet, so every send answers "not configured" and callers say so plainly.
// A provider plugs in here and nowhere else: set emailConfigured() to its key check and send through its API.
export function emailConfigured(env: IEnv): boolean {
  void env;
  return false;
}

export async function sendEmail(env: IEnv, mail: IEmail): Promise<TSendResult> {
  if (!emailConfigured(env)) return { ok: false, reason: 'not_configured' };
  void mail;
  return { ok: false, reason: 'failed' };
}

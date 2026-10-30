import type { IEnv } from '../env';

export interface IEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type TSendResult = { ok: true } | { ok: false; reason: 'not_configured' | 'failed' };

// No email provider is chosen yet (docs/redesign/DECISIONS.md, Solar Green): every send answers "not configured"
// so callers stay honest about it. A provider plugs in here and nowhere else.
export async function sendEmail(env: IEnv, mail: IEmail): Promise<TSendResult> {
  void env;
  void mail;
  return { ok: false, reason: 'not_configured' };
}

import { describe, expect, it } from 'vitest';
import { signinEmail } from '@/emails';
import { emailConfigured, sendEmail } from './send';

describe('email adapter', () => {
  it('answers "not configured" until a provider is chosen', async () => {
    expect(emailConfigured({})).toBe(false);
    const mail = await signinEmail('sam@example.com', 'https://awaketab.com/auth/token');
    expect(await sendEmail({}, mail)).toEqual({ ok: false, reason: 'not_configured' });
  });

  it('writes the sign-in link out as a plain link as well as the button', async () => {
    const mail = await signinEmail('sam@example.com', 'https://awaketab.com/auth/abc', 15);
    expect(mail.html.match(/https:\/\/awaketab\.com\/auth\/abc/gu)?.length).toBeGreaterThanOrEqual(2);
    expect(mail.text).toContain('https://awaketab.com/auth/abc');
    expect(mail.html).toContain('max-width:600px');
  });
});

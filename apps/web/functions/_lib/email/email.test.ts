import { describe, expect, it } from 'vitest';

import { billingEmail } from './billing';
import { sendEmail } from './send';
import { receiptEmail, renewalFailedEmail, signinEmail } from './templates';

const PORTAL = 'https://polar.sh/awaketab/portal';

describe('email templates', () => {
  const mails = [
    signinEmail('sam@example.com', 'https://awaketab.com/auth/abc'),
    receiptEmail({
      to: 'sam@example.com',
      plan: 'pro_yearly',
      amount: '$12.00',
      date: 'Friday, 30 October 2026',
      renews: 'Saturday, 30 October 2027',
      manageUrl: PORTAL,
    }),
    renewalFailedEmail('sam@example.com', 'Friday, 6 November 2026', PORTAL),
  ];

  it.each(mails)('$subject: one action, written out as a plain link too, 600 px, 16 px body', (mail) => {
    const links = [...mail.html.matchAll(/href="([^"]+)"/gu)].map((m) => m[1]);
    expect(new Set(links).size).toBe(1);
    expect(mail.html).toContain('max-width:600px');
    expect(mail.html).toContain('font-size:16px;line-height:1.6');
    expect(mail.text).toContain(links[0]);
  });

  it.each(mails)('$subject: no tracking pixels, no images, no redirects', (mail) => {
    expect(mail.html).not.toMatch(/<img/iu);
    expect(mail.html).not.toMatch(/redirect|utm_/iu);
  });

  it('escapes what it is given', () => {
    const mail = signinEmail('sam@example.com', 'https://awaketab.com/auth/"><b>x');
    expect(mail.html).not.toContain('"><b>');
  });

  it('says the sign-in link works once for 15 minutes', () => {
    expect(mails[0]?.html).toContain('Works once, for 15 minutes.');
  });
});

describe('billing emails from Polar events', () => {
  const order = {
    customer: { email: 'sam@example.com' },
    billing_reason: 'subscription_create',
    total_amount: 1200,
    currency: 'usd',
    created_at: '2026-10-30T10:00:00Z',
    subscription: { current_period_end: '2027-10-30T10:00:00Z' },
    product: { metadata: { plan: 'pro_yearly' } },
  };

  it('sends a receipt for a first Pro purchase only', () => {
    const mail = billingEmail('order.paid', order, PORTAL);
    expect(mail?.subject).toBe('Receipt · AwakeTab Pro');
    expect(mail?.text).toContain('Amount: $12.00');
    expect(mail?.text).toContain('Saturday, 30 October 2027');
    expect(billingEmail('order.paid', { ...order, billing_reason: 'subscription_cycle' }, PORTAL)).toBeNull();
    expect(billingEmail('order.paid', { ...order, product: { metadata: { plan: 'biz_kiosk_site' } } }, PORTAL)).toBeNull();
  });

  it('warns when a yearly renewal fails, with the grace end date', () => {
    const mail = billingEmail(
      'subscription.past_due',
      { customer: { email: 'sam@example.com' }, current_period_end: '2026-10-30T10:00:00Z', product: { metadata: { plan: 'pro_yearly' } } },
      PORTAL,
    );
    expect(mail?.subject).toBe('Your Pro renewal didn’t go through');
    expect(mail?.text).toContain('Friday, 6 November 2026');
  });

  it('sends nothing without an address', () => {
    expect(billingEmail('order.paid', { ...order, customer: null }, PORTAL)).toBeNull();
  });

  it('the adapter answers not configured until a provider is chosen', async () => {
    await expect(sendEmail({}, signinEmail('a@b.co', 'https://awaketab.com/auth/x'))).resolves.toEqual({
      ok: false,
      reason: 'not_configured',
    });
  });
});

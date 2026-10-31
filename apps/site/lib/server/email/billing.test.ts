import { describe, expect, it } from 'vitest';
import { billingEmail, longDate } from './billing';

const PORTAL = 'https://polar.sh/awaketab/portal';

describe('billing emails', () => {
  it('sends a receipt for a first yearly order, with a plain-text copy', async () => {
    const mail = await billingEmail(
      'order.paid',
      {
        customer: { email: 'Sam@Example.com' },
        billing_reason: 'subscription_create',
        total_amount: 1200,
        currency: 'usd',
        created_at: '2026-10-31T10:00:00Z',
        subscription: { current_period_end: '2027-10-31T10:00:00Z' },
        metadata: { plan: 'pro_yearly' },
      },
      PORTAL,
    );
    expect(mail?.to).toBe('sam@example.com');
    expect(mail?.subject).toBe('Receipt · AwakeTab Pro');
    expect(mail?.html).toContain('$12.00');
    expect(mail?.html).toContain(PORTAL);
    expect(mail?.text).toContain('Manage billing');
    expect(mail?.html).not.toMatch(/<img/iu);
  });

  it('warns when a yearly renewal fails and names the last day of Pro', async () => {
    const mail = await billingEmail(
      'subscription.past_due',
      {
        customer: { email: 'sam@example.com' },
        current_period_end: '2026-10-31T00:00:00Z',
        metadata: { plan: 'pro_yearly' },
      },
      PORTAL,
    );
    expect(mail?.subject).toBe('Your Pro renewal didn’t go through');
    expect(mail?.text).toContain(longDate(Date.parse('2026-11-07T00:00:00Z')));
  });

  it('sends nothing for renewals, other plans or a missing address', async () => {
    expect(
      await billingEmail(
        'order.paid',
        { customer: { email: 'a@b.co' }, billing_reason: 'subscription_cycle', metadata: { plan: 'pro_yearly' } },
        PORTAL,
      ),
    ).toBeNull();
    expect(
      await billingEmail(
        'order.paid',
        { customer: { email: 'a@b.co' }, billing_reason: 'purchase', metadata: { plan: 'biz_kiosk_site' } },
        PORTAL,
      ),
    ).toBeNull();
    expect(
      await billingEmail('order.paid', { billing_reason: 'purchase', metadata: { plan: 'pro_lifetime' } }, PORTAL),
    ).toBeNull();
  });
});

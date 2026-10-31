import { normaliseEmail } from '../auth';
import type { IEmail } from './send';
import { longDate, receiptEmail, renewalFailedEmail } from './templates';

const GRACE_MS = 7 * 86_400_000;
const FIRST_ORDER = new Set(['purchase', 'subscription_create']);

export interface IBillingData {
  customer?: { email?: string } | null;
  billing_reason?: string;
  total_amount?: number;
  net_amount?: number;
  currency?: string;
  created_at?: string;
  current_period_end?: string | null;
  subscription?: { current_period_end?: string | null } | null;
  metadata?: { plan?: string };
  product?: { metadata?: { plan?: string } } | null;
}

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

const when = (iso: string | null | undefined): number | null => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(ms) ? ms : null;
};

// The only billing mail AwakeTab sends: a receipt for a first Pro purchase and a warning when a renewal fails.
export function billingEmail(type: string, data: IBillingData, portalUrl: string, now = Date.now()): IEmail | null {
  const to = normaliseEmail(data.customer?.email);
  const plan = data.metadata?.plan ?? data.product?.metadata?.plan;
  if (!to || (plan !== 'pro_yearly' && plan !== 'pro_lifetime')) return null;
  if (type === 'order.paid' && FIRST_ORDER.has(data.billing_reason ?? '')) {
    const cents = typeof data.total_amount === 'number' ? data.total_amount : (data.net_amount ?? 0);
    const end = when(data.subscription?.current_period_end);
    return receiptEmail({
      to,
      plan,
      amount: money(cents, data.currency ?? 'usd'),
      date: longDate(when(data.created_at) ?? now),
      renews: plan === 'pro_yearly' && end !== null ? longDate(end) : null,
      manageUrl: portalUrl,
    });
  }
  if (type === 'subscription.past_due' && plan === 'pro_yearly') {
    const end = when(data.current_period_end);
    return renewalFailedEmail(to, longDate((end ?? now) + GRACE_MS), portalUrl);
  }
  return null;
}

export function portalUrl(server: string | undefined): string {
  return server === 'production' ? 'https://polar.sh/awaketab/portal' : 'https://sandbox.polar.sh/awaketab/portal';
}

export type TProPlan = 'yearly' | 'monthly';

// The yearly price is the product's real one; monthly has no product price yet, so it stays a placeholder.
const PLAN_PRICES: Record<TProPlan, number | null> = { yearly: 12, monthly: null };

export const MAX_DEVICES = 5;
export const TRIAL_DAYS = 14;

export function priceLabel(plan: TProPlan): string {
  const amount = PLAN_PRICES[plan];
  return amount === null ? '—' : `$${String(amount)}`;
}

// Whole percent saved by paying yearly instead of twelve months; a dash until both prices exist.
export function yearlySaving(): string {
  const { yearly, monthly } = PLAN_PRICES;
  if (yearly === null || monthly === null || monthly <= 0) return '—';
  return String(Math.round((1 - yearly / (monthly * 12)) * 100));
}

export function planOf(raw: string | null | undefined): TProPlan {
  return raw === 'monthly' ? 'monthly' : 'yearly';
}

// Full dates everywhere in English: "Saturday, 31 October 2026".
export function longDate(ms: number, timeZone?: string): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', ...(timeZone ? { timeZone } : {}) });
  const rest = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  });
  return `${day}, ${rest}`;
}

const POLAR_PORTAL = {
  sandbox: 'https://sandbox.polar.sh/awaketab/portal',
  production: 'https://polar.sh/awaketab/portal',
} as const;

// The payment provider's own portal holds receipts, the card on file, plan changes and cancelling.
export function portalUrl(): string {
  return process.env.NEXT_PUBLIC_POLAR_SERVER === 'sandbox' ? POLAR_PORTAL.sandbox : POLAR_PORTAL.production;
}

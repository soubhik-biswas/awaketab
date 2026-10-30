export type TProPlan = 'pro_yearly' | 'pro_lifetime';

export const PLAN_PRICES = {
  pro_yearly: 12,
  pro_lifetime: 29,
  pro_lifetime_launch: 19,
  biz_embed_site_yearly: 29,
  biz_kiosk_site: 19,
  biz_kiosk_5: 49,
} as const;

export const PRO_LAUNCH_END = Date.parse('2026-12-08T00:00:00.000Z');
export const MAX_DEVICES = 5;

export function usd(amount: number): string {
  return `$${String(amount)}`;
}

export function launchOn(now = Date.now(), end = PRO_LAUNCH_END): boolean {
  return now < end;
}

export function lifetimePrice(now = Date.now()): number {
  return launchOn(now) ? PLAN_PRICES.pro_lifetime_launch : PLAN_PRICES.pro_lifetime;
}

export function planPrice(plan: TProPlan, now = Date.now()): number {
  return plan === 'pro_lifetime' ? lifetimePrice(now) : PLAN_PRICES.pro_yearly;
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

// PRO_LAUNCH_END is midnight UTC, so the last launch-price day is the one before it.
export function launchDay(end = PRO_LAUNCH_END): string {
  return longDate(end - 1, 'UTC');
}

export function renewalDate(now = Date.now()): string {
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + 1);
  return longDate(next.getTime());
}

export const POLAR_PORTAL = {
  sandbox: 'https://sandbox.polar.sh/awaketab/portal',
  production: 'https://polar.sh/awaketab/portal',
} as const;

export function portalUrl(): string {
  return process.env.NEXT_PUBLIC_POLAR_SERVER === 'sandbox' ? POLAR_PORTAL.sandbox : POLAR_PORTAL.production;
}

import type { TProPlan } from './plans';

export type TCheckoutStep = 'plans' | 'account' | 'check' | 'pay';
export const CHECKOUT_STEPS: readonly TCheckoutStep[] = ['plans', 'account', 'check', 'pay'];
export const STEP_INDEX: Record<TCheckoutStep, number> = { plans: 0, account: 1, check: 1, pay: 2 };
export const FLOW_KEY = 'at.v1.checkout';

export interface IFlow {
  plan: TProPlan;
  email: string;
  unsent?: boolean;
}

export function readFlow(): Partial<IFlow> {
  try {
    return (JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? '{}') as Partial<IFlow> | null) ?? {};
  } catch {
    return {};
  }
}

export function writeFlow(flow: IFlow): void {
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  } catch {
    // Private mode: the flow still works within this page.
  }
}

export function clearFlow(): void {
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {
    // Nothing to clear.
  }
}

// Only the plan and the address leave for Polar; the server route picks the product and checks the address.
export function checkoutUrl(plan: TProPlan, email: string): string {
  const q = new URLSearchParams({ plan: plan === 'pro_lifetime' ? 'lifetime' : 'yearly' });
  if (email) q.set('email', email.trim());
  return `/api/checkout?${q.toString()}`;
}

import type { TProPlan } from './plans';

export type TCheckoutStep = 'plans' | 'account' | 'pay';
export const CHECKOUT_STEPS: readonly TCheckoutStep[] = ['plans', 'account', 'pay'];
export const STEP_INDEX: Record<TCheckoutStep, number> = { plans: 0, account: 1, pay: 2 };

// Only the plan leaves for checkout; the server adds the signed-in account and picks the product.
export function checkoutUrl(plan: TProPlan): string {
  return `/api/checkout?${new URLSearchParams({ plan }).toString()}`;
}

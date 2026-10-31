// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkoutPlan, checkoutTarget } from './checkout';

describe('checkoutTarget', () => {
  it('uses the checkout API when a token and the product are set', () => {
    expect(checkoutTarget({ POLAR_ACCESS_TOKEN: 'tok', POLAR_PRODUCT_PRO_YEARLY: 'prod_y' }, 'pro_yearly')).toEqual({
      kind: 'sdk',
      token: 'tok',
      product: 'prod_y',
    });
    expect(checkoutTarget({ POLAR_ACCESS_TOKEN: 'tok', POLAR_PRODUCT_PRO_MONTHLY: 'prod_m' }, 'pro_monthly')).toEqual({
      kind: 'sdk',
      token: 'tok',
      product: 'prod_m',
    });
  });

  it('falls back to the sandbox checkout links', () => {
    const target = checkoutTarget({ PUBLIC_POLAR_SERVER: 'sandbox' }, 'pro_lifetime');
    expect(target?.kind).toBe('link');
  });

  it('reports monthly without its product, and production without products, as unavailable', () => {
    expect(checkoutTarget({ PUBLIC_POLAR_SERVER: 'sandbox' }, 'pro_monthly')).toBeNull();
    expect(checkoutTarget({ PUBLIC_POLAR_SERVER: 'production' }, 'pro_yearly')).toBeNull();
  });

  it('reads the plan from the query, yearly by default', () => {
    expect(checkoutPlan('monthly')).toBe('pro_monthly');
    expect(checkoutPlan('lifetime')).toBe('pro_lifetime');
    expect(checkoutPlan(null)).toBe('pro_yearly');
    expect(checkoutPlan('anything')).toBe('pro_yearly');
  });
});

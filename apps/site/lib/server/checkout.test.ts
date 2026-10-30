import { describe, expect, it } from 'vitest';
import { checkoutTarget } from './checkout';

describe('checkoutTarget', () => {
  it('uses the checkout API when a token and the product are set', () => {
    expect(checkoutTarget({ POLAR_ACCESS_TOKEN: 'tok', POLAR_PRODUCT_PRO_YEARLY: 'prod_y' }, 'pro_yearly')).toEqual({
      kind: 'sdk',
      token: 'tok',
      product: 'prod_y',
    });
  });

  it('falls back to the sandbox checkout links', () => {
    const target = checkoutTarget({ PUBLIC_POLAR_SERVER: 'sandbox' }, 'pro_lifetime');
    expect(target?.kind).toBe('link');
  });

  it('reports production without products as unavailable', () => {
    expect(checkoutTarget({ PUBLIC_POLAR_SERVER: 'production' }, 'pro_yearly')).toBeNull();
  });
});

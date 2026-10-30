import { describe, expect, it } from 'vitest';
import { launchDay, launchOn, lifetimePrice, longDate, planPrice, PRO_LAUNCH_END } from './plans';

describe('Pro prices', () => {
  it('charges the launch price for pay once until the launch ends', () => {
    expect(lifetimePrice(PRO_LAUNCH_END - 1)).toBe(19);
    expect(lifetimePrice(PRO_LAUNCH_END)).toBe(29);
    expect(launchOn(PRO_LAUNCH_END)).toBe(false);
    expect(planPrice('pro_yearly')).toBe(12);
  });

  it('writes full dates', () => {
    expect(longDate(Date.parse('2026-10-31T12:00:00Z'), 'UTC')).toBe('Saturday, 31 October 2026');
    expect(launchDay()).toBe('Monday, 7 December 2026');
  });
});

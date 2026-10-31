import { describe, expect, it } from 'vitest';
import { longDate, planOf, priceLabel, yearlySaving } from './plans';

describe('Pro plans', () => {
  it('shows the real yearly price and keeps the unset monthly price a placeholder', () => {
    expect(priceLabel('yearly')).toBe('$12');
    expect(priceLabel('monthly')).toBe('[PRICE]');
    expect(yearlySaving()).toBe('[NUMBER]');
  });

  it('reads yearly unless monthly is asked for', () => {
    expect(planOf('monthly')).toBe('monthly');
    expect(planOf('lifetime')).toBe('yearly');
    expect(planOf(null)).toBe('yearly');
  });

  it('writes full dates', () => {
    expect(longDate(Date.parse('2026-10-31T12:00:00Z'), 'UTC')).toBe('Saturday, 31 October 2026');
  });
});

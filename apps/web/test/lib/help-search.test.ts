import { describe, expect, it } from 'vitest';

import { searchHelp } from '../../src/lib/help-search';

const ENTRIES = [
  { title: 'My screen still goes dark', href: '/learn/honest-limits', words: 'battery saver sleep dim' },
  { title: 'Keep an iPhone or iPad awake', href: '/on/iphone-safari', words: 'ios safari low power' },
  { title: 'Pro, billing and refunds', href: '/pro', words: 'price cancel receipt' },
];

describe('help search', () => {
  it('finds nothing for an empty query', () => {
    expect(searchHelp(ENTRIES, '  ')).toEqual([]);
  });

  it('matches titles and keywords, case-insensitively', () => {
    expect(searchHelp(ENTRIES, 'iPad').map((e) => e.href)).toEqual(['/on/iphone-safari']);
    expect(searchHelp(ENTRIES, 'batt').map((e) => e.href)).toEqual(['/learn/honest-limits']);
    expect(searchHelp(ENTRIES, 'billing').map((e) => e.href)).toEqual(['/pro']);
  });

  it('needs every word of the query', () => {
    expect(searchHelp(ENTRIES, 'safari cancel')).toEqual([]);
  });
});

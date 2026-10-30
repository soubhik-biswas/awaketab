import { describe, expect, it } from 'vitest';
import { TOKEN_RE, validEmail } from './shared';

describe('sign-in helpers', () => {
  it('checks addresses like the form does', () => {
    expect(validEmail('sam@example.com')).toBe(true);
    expect(validEmail('sam@example')).toBe(false);
    expect(validEmail(`${'a'.repeat(250)}@b.co`)).toBe(false);
  });

  it('accepts only URL-safe link tokens', () => {
    expect(TOKEN_RE.test('AbcdEFGHijklMNOPqrstUVWXyzabcdEF')).toBe(true);
    expect(TOKEN_RE.test('../../etc/passwd')).toBe(false);
  });
});

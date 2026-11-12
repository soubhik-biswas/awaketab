import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { CRASH_COPY, crashLocale } from './crash-copy';

const messages = (locale: string) =>
  JSON.parse(readFileSync(`${import.meta.dirname}/../../messages/${locale}.json`, 'utf8')) as {
    tool: { glance: { crash: unknown; settings: Record<string, unknown> } };
  };

describe('the crash screen', () => {
  it.each(LOCALES)('%s uses the words in its message file', (locale) => {
    expect(CRASH_COPY[locale]).toEqual(messages(locale).tool.glance.crash);
  });

  it.each(LOCALES)('%s names the keep-controls switch', (locale) => {
    const { keep, keepD } = messages(locale).tool.glance.settings;
    expect(typeof keep === 'string' && keep.length > 0).toBe(true);
    expect(typeof keepD === 'string' && keepD.length > 0).toBe(true);
  });

  it('reads the language from the address', () => {
    expect(crashLocale('/')).toBe('en');
    expect(crashLocale('/guides/keep-awake')).toBe('en');
    expect(crashLocale('/de')).toBe('de');
    expect(crashLocale('/pt-br/faq')).toBe('pt-br');
    expect(crashLocale('/HI/')).toBe('hi');
  });
});

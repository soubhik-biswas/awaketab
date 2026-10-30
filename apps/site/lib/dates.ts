import { LOCALE_META, type TLocale } from '@/i18n/locales';

// Full dates everywhere ("Saturday, 26 September 2026"); other locales use their own full style.
export function fullDate(day: string, locale: TLocale = 'en'): string {
  const date = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  if (locale !== 'en')
    return new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, {
      dateStyle: 'full',
      timeZone: 'UTC',
      numberingSystem: 'latn',
    }).format(date);
  const part = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${part.weekday ?? ''}, ${part.day ?? ''} ${part.month ?? ''} ${part.year ?? ''}`;
}

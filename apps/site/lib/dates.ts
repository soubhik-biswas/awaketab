import { formatFullDate } from '@/lib/format';
import { LOCALE_META, type TLocale } from '@/i18n/locales';

// A calendar day ("2026-09-26") as a full date, built at local midnight so no time zone moves it a day.
export function fullDate(day: string, locale: TLocale = 'en'): string {
  const [y = 1970, m = 1, d = 1] = day.slice(0, 10).split('-').map(Number);
  return formatFullDate(new Date(y, m - 1, d), LOCALE_META[locale].htmlLang);
}

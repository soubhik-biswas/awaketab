import { defineRouting } from 'next-intl/routing';
import { LOCALES } from './locales';

// English at the root, the other locales under their prefix. No redirect by Accept-Language, no locale cookie and
// no Link header: the site sets no cookies, and unreviewed translations carry no hreflang (docs/07 §5).
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

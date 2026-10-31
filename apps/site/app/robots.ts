import type { MetadataRoute } from 'next';
import { LOCALES } from '@/i18n/locales';
import { SITE } from '@/lib/routes';

// The picture-in-picture popup, the embed iframe apps and the API stay out of search (docs/00 §7).
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV === 'play') return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/pip', ...LOCALES.filter((l) => l !== 'en').map((l) => `/${l}/pip`), '/embed/', '/dev'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}

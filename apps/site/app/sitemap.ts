import type { MetadataRoute } from 'next';
import { alternatesFor, articlePath, articles, changelog, isIndexable } from '@/lib/content';
import { CONTENT_KINDS, PRESET_ROUTES, ROUTES, SITE } from '@/lib/routes';

// English site pages, then every indexable article (English and reviewed translations) with the same reciprocal
// alternates its HTML emits. Locale homes join once their translation is reviewed.
export default function sitemap(): MetadataRoute.Sitemap {
  const latest = changelog()[0]?.date;
  const pages = [
    ROUTES.home,
    ...PRESET_ROUTES.map((p) => `/${p}`),
    ...CONTENT_KINDS.map((k) => `/${k}`),
    ROUTES.about,
    ROUTES.help,
    ROUTES.privacy,
    ROUTES.terms,
    ROUTES.changelog,
    ROUTES.pro,
    ROUTES.embed,
    ROUTES.kiosk,
    ROUTES.library,
    ROUTES.extension,
  ];
  const site: MetadataRoute.Sitemap = pages.map((path) => {
    const url = `${SITE}${path === '/' ? '/' : path}`;
    return {
      url,
      ...(path === ROUTES.changelog && latest ? { lastModified: latest } : {}),
      alternates: { languages: { en: url, 'x-default': url } },
    };
  });
  const content: MetadataRoute.Sitemap = CONTENT_KINDS.flatMap((kind) =>
    articles(kind)
      .filter(isIndexable)
      .map((a) => {
        const alternates = alternatesFor(kind, a.enSlug, a.locale);
        const english = alternates.find((x) => x.locale === 'en');
        const url = `${SITE}${articlePath(kind, a.enSlug, a.locale)}`;
        return {
          url,
          lastModified: a.updated ?? a.published,
          alternates: {
            languages: {
              ...Object.fromEntries(alternates.map((x) => [x.hreflang, x.href])),
              'x-default': english?.href ?? url,
            },
          },
        };
      }),
  );
  return [...site, ...content];
}

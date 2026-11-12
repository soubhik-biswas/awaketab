import type { TLocale } from '@/i18n/locales';
import { articleIn, articlePath } from '@/lib/content';
import { panelHref, ROADMAP_URL, ROUTES, SOURCE_URL, toolHref, type TContentKind } from '@/lib/routes';

type TFootGroup = 'product' | 'uses' | 'devices' | 'learn' | 'company';

type TFootLinkId =
  | 'timer'
  | 'faces'
  | 'vibes'
  | 'extension'
  | 'embed'
  | 'kiosk'
  | 'library'
  | 'cooking'
  | 'presenting'
  | 'dashboards'
  | 'nightdesk'
  | 'allUses'
  | 'support'
  | 'deviceGuides'
  | 'compare'
  | 'help'
  | 'guides'
  | 'how'
  | 'faq'
  | 'changelog'
  | 'about'
  | 'github'
  | 'roadmap'
  | 'privacy'
  | 'terms';

export interface IFootLink {
  id: TFootLinkId;
  href: string;
  // English-only pages, so a translated footer marks where its links lead.
  english?: boolean;
  fresh?: boolean;
  external?: boolean;
}

interface IFootGroup {
  id: TFootGroup;
  links: readonly IFootLink[];
}

// An article opens in the reader's language when it has been translated, otherwise in English.
function article(id: TFootLinkId, kind: TContentKind, slug: string, locale: TLocale): IFootLink {
  return articleIn(kind, slug, locale)
    ? { id, href: articlePath(kind, slug, locale) }
    : { id, href: `/${kind}/${slug}`, english: true };
}

const page = (id: TFootLinkId, href: string): IFootLink => ({ id, href, english: true });

export const supportLink = (locale: TLocale): IFootLink =>
  article('support', 'learn', 'browser-support-matrix', locale);

export function footGroups(locale: TLocale): readonly IFootGroup[] {
  return [
    {
      id: 'product',
      links: [
        { id: 'timer', href: toolHref(locale) },
        { id: 'faces', href: panelHref('faces', locale), fresh: true },
        { id: 'vibes', href: panelHref('vibes', locale), fresh: true },
        page('extension', ROUTES.extension),
        page('embed', ROUTES.embed),
        page('kiosk', ROUTES.kiosk),
        page('library', ROUTES.library),
      ],
    },
    {
      id: 'uses',
      links: [
        article('cooking', 'for', 'cooking', locale),
        article('presenting', 'for', 'presentations', locale),
        article('dashboards', 'for', 'dashboards', locale),
        article('nightdesk', 'for', 'night-clock', locale),
        page('allUses', ROUTES.useCases),
      ],
    },
    {
      id: 'devices',
      links: [supportLink(locale), page('deviceGuides', ROUTES.devices), page('compare', ROUTES.compare)],
    },
    {
      id: 'learn',
      links: [
        page('help', ROUTES.help),
        page('guides', ROUTES.guides),
        article('how', 'learn', 'how-awaketab-works', locale),
        article('faq', 'learn', 'faq', locale),
        page('changelog', ROUTES.changelog),
      ],
    },
    {
      id: 'company',
      links: [
        page('about', ROUTES.about),
        { id: 'github', href: SOURCE_URL, external: true },
        { id: 'roadmap', href: ROADMAP_URL, external: true },
        page('privacy', ROUTES.privacy),
        page('terms', ROUTES.terms),
      ],
    },
  ];
}

import type { Metadata } from 'next';
import type { TLocale } from '@/i18n/locales';
import type { TSceneKey } from '@/lib/content';
import { pageMetadata, titleFor } from '@/lib/seo';
import { HeroButtons, PageHero, type IHeroAction } from './page-hero';

// System pages stay out of search and share the default image; the title is their H1.
export function systemMetadata(h1: string, description: string, path: string, locale: TLocale = 'en'): Metadata {
  return pageMetadata({
    title: titleFor(h1),
    description,
    path,
    locale,
    noindex: true,
    og: { image: 'og-01', alt: 'AwakeTab clock showing 38:12 left' },
  });
}

// A system page says what happened and offers one next step, with its scene (system pages on the content boards).
export function SystemPage({
  eyebrow,
  h1,
  lead,
  scene,
  primary,
  secondary,
}: {
  eyebrow: string;
  h1: string;
  lead: string;
  scene: TSceneKey;
  primary: IHeroAction;
  secondary?: IHeroAction;
}) {
  return (
    <PageHero
      eyebrow={eyebrow}
      h1={h1}
      lead={lead}
      scene={scene}
      actions={<HeroButtons primary={primary} {...(secondary ? { secondary } : {})} />}
    />
  );
}

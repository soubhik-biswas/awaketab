import type { Metadata } from 'next';
import type { TSceneKey } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
import { HeroButtons, PageHero, type IHeroAction } from './page-hero';

export function systemMetadata(
  title: string,
  description: string,
  path: string,
  eyebrow: string,
  h1: string,
  scene: TSceneKey,
): Metadata {
  return pageMetadata({
    title,
    description,
    path,
    noindex: true,
    og: { kicker: eyebrow, title: h1, scene, tone: 'dark' },
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

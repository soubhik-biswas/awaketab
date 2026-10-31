import { getTranslations } from 'next-intl/server';
import { Scene } from '@/components/scene/scene';
import { articleIn, articlePath, type TSceneKey } from '@/lib/content';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { GlowCard } from '../effects/glow-card';
import { story } from '../styles';
import { StoryHead } from './story-head';

// Each use with its page, scene and glow colour (volt, violet, sky, warm amber).
const USES: ReadonlyArray<readonly [key: string, slug: string, scene: TSceneKey, glow: string]> = [
  ['cooking', 'cooking', 'cooking', 'var(--lamp)'],
  ['presenting', 'presentations', 'presenting', 'var(--primary)'],
  ['dashboards', 'dashboards', 'dashboard', '#7CBBFF'],
  ['nightdesk', 'night-clock', 'nightdesk', '#FFB547'],
];

// "The moments a dark screen gets in the way": four glow cards with scenes, linking to their use-case pages.
export async function MadeFor({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.uses' });
  return (
    <section aria-labelledby="home-uses-h" className={story.sec}>
      <StoryHead id="home-uses-h" eyebrow={t('eyebrow')} h={t('h')} accent={t('accent')} />
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 min-[700px]:grid-cols-2 min-[700px]:gap-4 min-[1100px]:grid-cols-4">
        {USES.map(([key, slug, scene, glow]) => {
          const translated = locale !== 'en' && articleIn('for', slug, locale) !== undefined;
          const href = translated ? articlePath('for', slug, locale) : `/for/${slug}`;
          return (
            <li key={key} className="flex">
              <GlowCard
                href={href}
                color={`color-mix(in srgb, ${glow} 14%, transparent)`}
                className={cn(story.card, 'flex flex-1 flex-col text-foreground no-underline')}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-1/2 h-[220px] w-80 -translate-x-1/2 opacity-[.094] dark:opacity-[.19]"
                  style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }}
                />
                <span className="relative flex justify-center pt-[18px]">
                  <Scene
                    scene={scene}
                    width={280}
                    decorative
                    className="h-auto w-[280px] max-w-full min-[700px]:w-[240px]"
                  />
                </span>
                <span className="relative flex flex-col gap-2.5 px-6 pt-[22px] pb-[26px]">
                  <strong className={story.cellH}>{t(`${key}.t`)}</strong>
                  <span className={story.cellD}>{t(`${key}.d`)}</span>
                  <span className="text-[15px] font-bold text-lamp">{t(`${key}.l`)} →</span>
                </span>
              </GlowCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

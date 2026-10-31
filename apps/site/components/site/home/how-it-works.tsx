import { getTranslations } from 'next-intl/server';
import { Scene } from '@/components/scene/scene';
import type { TLocale } from '@/i18n/locales';
import type { TSceneKey } from '@/lib/content';
import { cn } from '@/lib/utils';
import { story } from '../styles';
import { StoryHead } from './story-head';

const STEPS: ReadonlyArray<readonly [n: '1' | '2' | '3', scene: TSceneKey]> = [
  ['1', 'firstaction'],
  ['2', 'hero'],
  ['3', 'success'],
];

// "Three steps. Two are optional.": three cards, each with its scene above a numbered volt badge (home board).
export async function HowItWorks({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.how' });
  return (
    <section aria-labelledby="home-how-h" className={story.sec}>
      <StoryHead id="home-how-h" eyebrow={t('eyebrow')} h={t('h')} accent={t('accent')} />
      <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 min-[700px]:grid-cols-3 min-[700px]:gap-5">
        {STEPS.map(([n, scene]) => (
          <li key={n} className={cn(story.card, 'flex flex-col')}>
            <div className="flex justify-center bg-[var(--site-step-art)] pt-4">
              <Scene
                scene={scene}
                width={260}
                decorative
                className="h-auto w-[260px] max-w-full min-[700px]:w-[240px]"
              />
            </div>
            <div className="relative flex flex-col gap-2.5 px-6 pt-[22px] pb-[26px]">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-lamp text-[15px] font-bold text-[var(--site-badge-ink)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--lamp)_13%,transparent)]"
              >
                {n}
              </span>
              <h3 className={cn(story.cellH, 'm-0')}>
                <span className="sr-only">{n}. </span>
                {t(`${n}.t`)}
              </h3>
              <p className={cn(story.cellD, 'm-0')}>{t(`${n}.d`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { getTranslations } from 'next-intl/server';
import type { TFaceId } from '@/components/face';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { SAMPLE, SiteFace } from '../site-face';
import { story } from '../styles';
import { StoryHead } from './story-head';

// Each vibe with the face its preview card shows; the backgrounds (dark and light pastel) live in site.css.
const VIBES: ReadonlyArray<readonly [key: string, face: TFaceId]> = [
  ['aurora', 'aurora'],
  ['night', 'moon'],
  ['rain', 'liquid'],
  ['sunset', 'halo'],
  ['lava', 'blob'],
  ['calm', 'ring'],
];

// "Set the mood. Six living backgrounds.": six tall preview cards that follow the page theme (home board).
export async function Vibes({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.vibes' });
  return (
    <section aria-labelledby="home-vibes-h" className={story.sec}>
      <StoryHead id="home-vibes-h" eyebrow={t('eyebrow')} h={t('h')} accent={t('accent')} lead={t('lead')} />
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 min-[700px]:grid-cols-3 min-[700px]:gap-3.5 min-[1100px]:grid-cols-6">
        {VIBES.map(([key, face]) => (
          <li
            key={key}
            className="relative h-[260px] overflow-hidden rounded-[28px] border border-[rgba(11,16,32,.08)] shadow-[0_24px_50px_rgba(11,16,32,.10)] min-[700px]:h-[300px] dark:border-white/10 dark:shadow-[0_24px_50px_rgba(0,0,0,.45)]"
          >
            <div aria-hidden="true" className={cn('site-vibe absolute inset-0', `site-vibe-${key}`)} />
            <div className="absolute inset-x-0 top-[34px] flex justify-center">
              <SiteFace
                face={face}
                size={170}
                phoneSize={150}
                state="running"
                total={SAMPLE.total}
                remain={SAMPLE.remain}
                nowSec={SAMPLE.nowSec}
                bare
                motion="off"
              />
            </div>
            <span className="absolute inset-x-[18px] bottom-4 flex flex-col gap-0.5 text-[16px] text-[#0B1020] dark:text-white dark:[text-shadow:0_1px_8px_rgba(0,0,0,.4)]">
              <strong>{t(`items.${key}.name`)}</strong>
              <span className="text-[14px] text-[#4B5165] dark:text-white/[.78]">{t(`items.${key}.line`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

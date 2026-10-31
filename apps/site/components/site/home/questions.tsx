import { getTranslations } from 'next-intl/server';
import type { TLocale } from '@/i18n/locales';
import { panelHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Faq } from '../blocks';
import { pad, story } from '../styles';

const QUESTIONS = ['1', '2', '3', '4', '5'] as const;

// "Straight answers.": the head and the feedback pointer on the left, a real accordion on the right (home board).
export async function Questions({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.faq' });
  return (
    <section
      aria-labelledby="home-faq-h"
      className={cn('grid grid-cols-1 gap-6 min-[700px]:gap-16 min-[1100px]:grid-cols-[0.8fr_1.2fr]', pad)}
    >
      <div className="flex flex-col gap-3.5">
        <span className={story.eyebrow}>{t('eyebrow')}</span>
        <h2 id="home-faq-h" className={story.h2}>
          {t('h')}
        </h2>
        <p className={story.lead}>
          {t('before')}
          <a href={panelHref('feedback', locale)} className="text-inherit underline underline-offset-4">
            {t('link')}
          </a>
          {t('after')}
        </p>
      </div>
      <Faq variant="home" items={QUESTIONS.map((n) => ({ q: t(`${n}.q`), a: t(`${n}.a`) }))} />
    </section>
  );
}

import { Play } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { BorderBeam } from '@/components/ui-effects/border-beam';
import { GridPattern } from '@/components/ui-effects/grid-pattern';
import type { TLocale } from '@/i18n/locales';
import { startHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Accent } from '../accent';
import { display, story } from '../styles';

// "Your screen, awake in one tap.": a beam-bordered card with a masked grid texture and the one big button.
export async function FinalCta({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.cta' });
  return (
    <section aria-labelledby="home-cta-h" className={story.sec}>
      <div className="relative overflow-hidden rounded-[28px] border-[1.5px] border-border [background:var(--site-cta-card)] min-[700px]:rounded-[36px]">
        <BorderBeam size={360} duration={6} borderWidth={1.5} colorFrom="var(--lamp)" colorTo="var(--primary)" />
        <div className="relative flex flex-col items-center gap-[18px] overflow-hidden px-5 py-12 text-center min-[700px]:px-10 min-[700px]:py-[88px]">
          <GridPattern width={48} height={48} className="site-mask-center stroke-[var(--grid)]" />
          <h2
            id="home-cta-h"
            className={cn(
              display,
              'relative m-0 max-w-[900px] text-[38px] leading-[.98] font-bold tracking-[-0.045em] text-balance min-[700px]:text-[54px] min-[1100px]:text-[72px]',
            )}
          >
            {t('h')} <Accent>{t('accent')}</Accent>
          </h2>
          <p className={cn(story.lead, 'relative')}>{t('lead')}</p>
          <a
            href={startHref('p60', 'standard', locale)}
            className="site-act relative mt-2 inline-flex h-16 items-center gap-3 rounded-full px-8 text-[18px] font-bold no-underline shadow-[0_18px_50px_var(--primary-glow),inset_0_1px_0_rgba(255,255,255,.4)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring"
          >
            <Play className="size-5 fill-current" strokeWidth={0} aria-hidden="true" />
            {t('button')}
          </a>
        </div>
      </div>
    </section>
  );
}

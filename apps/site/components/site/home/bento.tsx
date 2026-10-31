import { CornerDownLeft, Play, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { Accent } from '../accent';
import { BentoCell, BentoGrid } from '../effects/bento-grid';
import { SAMPLE, SiteFace } from '../site-face';
import { display, story } from '../styles';
import { StoryHead } from './story-head';

const cell = cn(story.card, 'gap-5 p-[22px] min-[700px]:p-7');

const sample = { state: 'running', total: SAMPLE.total, remain: SAMPLE.remain, nowSec: SAMPLE.nowSec } as const;

function CellText({ h, d }: { h: string; d: string }) {
  return (
    <div className="relative flex max-w-[420px] flex-col gap-2">
      <h3 className={cn(story.cellH, 'm-0')}>{h}</h3>
      <p className={cn(story.cellD, 'm-0')}>{d}</p>
    </div>
  );
}

const PILLS = [
  ['awake', 'text-lamp border-lamp/[.33]', 'bg-lamp site-pulse', 'var(--halo)'],
  ['paused', 'text-warning border-warning/[.33]', 'bg-warning', ''],
  ['blocked', 'text-destructive border-destructive/[.33]', 'bg-destructive', ''],
] as const;

// "Touch it for three seconds. Trust it for an hour.": six cells, three columns from tablet landscape with the big
// face cell spanning two by two, two columns on tablet portrait and one on phones (home board).
export async function Bento({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.story.bento' });
  return (
    <section aria-labelledby="home-bento-h" className={story.sec}>
      <StoryHead id="home-bento-h" eyebrow={t('eyebrow')} h={t('h')} accent={t('accent')} />
      <BentoGrid className="grid-cols-1 gap-3 min-[700px]:grid-cols-2 min-[700px]:gap-4 min-[1100px]:auto-rows-[300px] min-[1100px]:grid-cols-3">
        <BentoCell
          className={cn(
            cell,
            'min-h-[440px] min-[700px]:col-span-2 min-[1100px]:row-span-2 min-[1100px]:min-h-0 min-[1100px]:flex-row min-[1100px]:items-center',
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-[20%] -right-[10%] h-[140%] w-[70%] bg-[radial-gradient(closest-side,var(--site-spot),transparent)]"
          />
          <CellText h={t('read.h')} d={t('read.d')} />
          <div className="relative flex flex-none justify-center">
            <SiteFace face="bold" size={440} tabletSize={340} phoneSize={280} bare {...sample} />
          </div>
        </BentoCell>
        <BentoCell className={cell}>
          <CellText h={t('tap.h')} d={t('tap.d')} />
          <div aria-hidden="true" className="relative flex justify-start">
            <span className="site-act inline-flex h-14 items-center gap-2.5 rounded-full px-6 text-[17px] font-bold shadow-[0_14px_36px_var(--primary-glow),inset_0_1px_0_rgba(255,255,255,.4)]">
              <Play className="size-[18px] fill-current" strokeWidth={0} />
              {t('tap.cta')}
            </span>
            <span className="absolute top-[34px] left-[150px] size-0 -rotate-[35deg] border-y-[7px] border-l-[9px] border-y-transparent border-l-foreground" />
          </div>
        </BentoCell>
        <BentoCell className={cell}>
          <CellText h={t('honest.h')} d={t('honest.d')} />
          <ul className="m-0 flex list-none flex-col items-start gap-2 p-0">
            {PILLS.map(([key, tone, dot, pulse]) => (
              <li
                key={key}
                className={cn(
                  'inline-flex h-9 items-center gap-2.5 rounded-full border bg-[var(--site-s1)] pr-3.5 pl-3 text-[14px] font-semibold',
                  tone,
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2 rounded-full',
                    dot,
                    key === 'paused' && 'rounded-[2px]',
                    key === 'blocked' && 'rotate-45 rounded-[1px]',
                  )}
                  style={pulse ? { ['--pulse' as string]: pulse } : undefined}
                />
                {t(`honest.${key}`)}
              </li>
            ))}
          </ul>
        </BentoCell>
        <BentoCell className={cell}>
          <CellText h={t('free.h')} d={t('free.d')} />
          <span className={cn(display, 'text-[96px] leading-[.9] min-[700px]:text-[120px]')}>
            <Accent>{t('free.zero')}</Accent>
          </span>
        </BentoCell>
        <BentoCell className={cn(cell, 'min-[700px]:max-[1100px]:col-span-2')}>
          <CellText h={t('devices.h')} d={t('devices.d')} />
          <div aria-hidden="true" className="flex items-end gap-3">
            <span className="flex h-32 w-[70px] items-center justify-center rounded-[18px] border-2 border-border-hi bg-[var(--site-device)]">
              <SiteFace face="ring" size={54} bare motion="off" {...sample} />
            </span>
            <span className="flex h-[140px] w-[104px] items-center justify-center rounded-[16px] border-2 border-border-hi bg-[var(--site-device)]">
              <SiteFace face="aurora" size={84} bare motion="off" {...sample} />
            </span>
            <span className="flex h-[104px] w-[156px] items-center justify-center rounded-[12px_12px_4px_4px] border-2 border-b-[10px] border-border-hi bg-[var(--site-device)]">
              <SiteFace face="neon" size={104} bare motion="off" {...sample} />
            </span>
          </div>
        </BentoCell>
        <BentoCell className={cell}>
          <CellText h={t('palette.h')} d={t('palette.d')} />
          <div
            aria-hidden="true"
            className="flex flex-col gap-1 rounded-[18px] border border-border bg-[var(--site-palette)] p-2"
          >
            <span className="flex h-10 items-center gap-2.5 border-b border-border px-2.5 text-[15px] text-foreground">
              <Search className="size-4" strokeWidth={2} />
              {t('palette.q')}
            </span>
            <span className="flex h-10 items-center justify-between rounded-[10px] bg-[var(--site-s2)] px-2.5 text-[14px] font-semibold">
              {t('palette.r1')}
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-[7px] border border-border bg-[var(--site-s1)] font-mono text-[12px] text-muted-foreground-strong">
                <CornerDownLeft className="size-3" strokeWidth={2} />
              </span>
            </span>
            <span className="flex h-10 items-center px-2.5 text-[14px] text-muted-foreground-strong">
              {t('palette.r2')}
            </span>
          </div>
        </BentoCell>
      </BentoGrid>
    </section>
  );
}

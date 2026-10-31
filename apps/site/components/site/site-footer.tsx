import { Github, MessageCircle, Play, Rss, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Mark } from '@/components/brand/mark';
import type { TLocale } from '@/i18n/locales';
import { panelHref, ROUTES, SITE, SOURCE_URL, toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Accent } from './accent';
import { GridPattern } from '@/components/ui-effects/grid-pattern';
import { FooterTheme } from './footer-theme';
import { LangMenu } from './header-client';
import { display, pad } from './styles';
import { PRO_ENABLED } from '@/lib/features';

// The same build that announces a maintenance window on /status also turns the footer pill amber.
const maintenance = (process.env.NEXT_PUBLIC_MAINTENANCE_UNTIL?.trim() ?? '') !== '';

interface IFootLink {
  label: string;
  href: string;
  tag?: string;
  // English-only pages, so a translated footer marks where its links lead.
  en?: boolean;
}

// The footer of the home page and every website page, always graphite whatever the page theme (home board).
export async function SiteFooter({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site.foot' });
  const tf = await getTranslations({ locale, namespace: 'footer' });
  const english = locale === 'en';
  const cols: ReadonlyArray<{ h: string; links: readonly IFootLink[] }> = [
    {
      h: t('product'),
      links: [
        { label: t('timer'), href: toolHref(locale) },
        { label: t('faces'), href: panelHref('faces', locale), tag: t('new') },
        { label: t('vibes'), href: panelHref('vibes', locale), tag: t('new') },
        ...(PRO_ENABLED ? [{ label: t('pro'), href: ROUTES.pro, en: true }] : []),
      ],
    },
    {
      h: t('uses'),
      links: [
        { label: t('cooking'), href: '/for/cooking', en: true },
        { label: t('presenting'), href: ROUTES.presenting, en: true },
        { label: t('dashboards'), href: '/for/dashboards', en: true },
        { label: t('nightdesk'), href: '/for/night-clock', en: true },
      ],
    },
    {
      h: t('learn'),
      links: [
        { label: t('help'), href: ROUTES.help, en: true },
        { label: t('support'), href: ROUTES.support, en: true },
        { label: t('guides'), href: ROUTES.guides, en: true },
        { label: t('changelog'), href: ROUTES.changelog, en: true },
      ],
    },
    {
      h: t('company'),
      links: [
        { label: t('about'), href: ROUTES.about, en: true },
        { label: tf('privacy'), href: ROUTES.privacy, en: true },
        { label: tf('terms'), href: ROUTES.terms, en: true },
        { label: t('statusLink'), href: ROUTES.status, en: true },
      ],
    },
  ];
  const social = [
    { label: t('social.github'), href: SOURCE_URL, Icon: Github },
    { label: t('social.x'), href: `https://x.com/intent/post?url=${encodeURIComponent(SITE)}`, Icon: X },
    { label: t('social.rss'), href: ROUTES.rss, Icon: Rss },
  ];
  return (
    <footer
      className={cn(
        'dark relative isolate flex flex-col gap-10 overflow-hidden bg-[#05060A] pt-12 pb-6 font-sans text-[#F2F4FA] min-[700px]:gap-14 min-[700px]:pt-[72px] min-[700px]:pb-7',
        pad,
      )}
    >
      <div aria-hidden="true" className="site-foot-glow absolute -z-10" />
      <GridPattern width={56} height={56} className="site-mask-top -z-10 stroke-white/[.04]" />
      <div aria-hidden="true" className="site-foot-line absolute inset-x-0 top-0 h-px" />
      <div className="site-foot-cta flex flex-col items-start justify-between gap-6 rounded-[28px] p-[22px] min-[700px]:px-8 min-[700px]:py-7 min-[1100px]:flex-row min-[1100px]:items-center">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-[12px] tracking-[0.16em] text-[#3DF58E]">{t('kicker')}</span>
          <strong
            className={cn(display, 'text-[26px] leading-[1.08] font-bold tracking-[-0.035em] min-[700px]:text-[34px]')}
          >
            {t('ctaH')} <Accent night>{t('ctaAccent')}</Accent>
          </strong>
          <span className="max-w-[420px] text-[15px] leading-[1.55] text-[#A6AFC2]">{t('ctaLine')}</span>
        </div>
        <div className="flex flex-none flex-wrap gap-2.5">
          <a
            href={toolHref(locale)}
            className="site-foot-act inline-flex h-[52px] items-center gap-2.5 rounded-full px-[22px] text-[16px] font-bold no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]"
          >
            <Play className="size-[18px] fill-current" strokeWidth={0} aria-hidden="true" />
            {t('timer')}
          </a>
          <a
            href={panelHref('feedback', locale)}
            className="inline-flex h-[52px] items-center gap-2.5 rounded-full border border-white/[.14] bg-white/5 px-5 text-[16px] font-semibold text-[#F2F4FA] no-underline hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]"
          >
            <MessageCircle className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            {t('feedback')}
          </a>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-9 min-[700px]:gap-12 min-[1100px]:grid-cols-[1.1fr_1.9fr]">
        <div className="flex flex-col items-start gap-4">
          <span className="flex items-center gap-2.5">
            <Mark size={30} tone="dark" label="" />
            <strong className={cn(display, 'text-[24px] font-bold tracking-[-0.03em]')}>AwakeTab</strong>
          </span>
          <span className="max-w-[420px] text-[15px] leading-[1.55] text-[#A6AFC2]">{t('tagline')}</span>
          <a
            href={ROUTES.status}
            hrefLang={english ? undefined : 'en'}
            className={cn(
              'relative inline-flex h-9 items-center gap-2.5 rounded-full border pr-3.5 pl-3 text-[13px] font-semibold no-underline after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]',
              maintenance
                ? 'border-[#FFC53D]/25 bg-[#FFC53D]/[.08] text-[#FFC53D]'
                : 'border-[#3DF58E]/25 bg-[#3DF58E]/[.08] text-[#3DF58E]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', maintenance ? 'bg-[#FFC53D]' : 'site-pulse bg-[#3DF58E]')}
              style={{ ['--pulse' as string]: 'rgba(61,245,142,.5)' }}
            />
            {maintenance ? t('statusDown') : t('status')}
          </a>
          <div className="flex gap-2">
            {social.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                {...(href.startsWith('http') ? { rel: 'noopener' } : {})}
                className="inline-flex size-11 items-center justify-center rounded-[14px] border border-white/[.09] bg-white/[.04] text-[#D5DAE6] hover:bg-white/[.08] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]"
              >
                <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 min-[700px]:grid-cols-4 min-[700px]:gap-6">
          {cols.map((col) => (
            <nav key={col.h} aria-label={col.h} className="flex flex-col gap-0.5">
              <span className="mb-2 font-mono text-[12px] tracking-[0.14em] text-[#8A93A8] uppercase">{col.h}</span>
              {col.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  hrefLang={l.en && !english ? 'en' : undefined}
                  className="relative inline-flex min-h-10 items-center gap-2 text-[15px] text-[#E6E9F2] no-underline after:absolute after:inset-x-0 after:-inset-y-0.5 hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7CBBFF]"
                >
                  {l.label}
                  {l.tag && (
                    <span className="rounded-full bg-[#3DF58E]/10 px-[7px] py-0.5 font-mono text-[12px] text-[#3DF58E]">
                      {l.tag}
                    </span>
                  )}
                </a>
              ))}
            </nav>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className={cn(display, 'site-giant pointer-events-none relative text-center font-bold')}>
        AwakeTab
      </div>
      <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/[.08] pt-5 text-[13px] text-[#8A93A8]">
        <span>{t('copyright')}</span>
        <span className="flex flex-wrap items-center gap-3.5">
          <span>{t('cookies')}</span>
          <FooterTheme
            label={t('theme.label')}
            names={{ system: t('theme.system'), light: t('theme.light'), dark: t('theme.dark') }}
          />
          <LangMenu locale={locale} label={tf('language._')} variant="pill" />
        </span>
      </div>
    </footer>
  );
}

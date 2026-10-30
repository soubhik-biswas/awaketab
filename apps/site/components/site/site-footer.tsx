import { getTranslations } from 'next-intl/server';
import { Mark } from '@/components/brand/mark';
import type { TLocale } from '@/i18n/locales';
import { changelog } from '@/lib/content';
import { fullDate } from '@/lib/dates';
import { CONTACT_EMAIL, CONTACT_MAILTO, ROUTES, toolHref } from '@/lib/routes';

// The footer is always the midnight band, in every theme (content-page board).
export async function SiteFooter({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const tf = await getTranslations({ locale, namespace: 'footer' });
  const cols = [
    {
      h: t('foot.product'),
      l: [
        [t('foot.timer'), toolHref(locale)],
        [t('nav.pro'), ROUTES.pro],
        [t('foot.changelog'), ROUTES.changelog],
        [t('signin'), ROUTES.signin],
      ],
    },
    {
      h: t('foot.learn'),
      l: [
        [t('foot.help'), ROUTES.help],
        [t('nav.uses'), ROUTES.useCases],
        [t('foot.presenting'), ROUTES.presenting],
        [t('nav.support'), ROUTES.support],
      ],
    },
    {
      h: t('foot.company'),
      l: [
        [t('foot.about'), ROUTES.about],
        [tf('privacy'), ROUTES.privacy],
        [tf('terms'), ROUTES.terms],
        [t('foot.status'), ROUTES.status],
      ],
    },
  ] as const;
  const latest = changelog()[0]?.date;
  // These pages exist in English only, so a translated footer marks where its links lead.
  const target = locale === 'en' ? undefined : 'en';
  return (
    <footer className="flex flex-col gap-7 bg-[var(--site-night)] px-5 py-8 text-[var(--site-night-ink)] min-[700px]:px-10 min-[700px]:py-14 min-[1100px]:px-16 min-[1300px]:px-24 dark:border-t dark:border-[var(--site-night-line)]">
      <div className="grid grid-cols-2 gap-6 min-[1100px]:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="inline-flex">
              <Mark size={28} small glow={false} tone="dark" />
            </span>
            <strong className="text-[17px] font-extrabold">AwakeTab</strong>
          </span>
          <span className="max-w-[320px] text-[14px] leading-normal text-[var(--site-night-muted)]">
            {t('foot.tagline')}
          </span>
        </div>
        {cols.map((col) => (
          <nav key={col.h} aria-label={col.h} className="flex flex-col gap-1">
            <span className="font-mono text-[12px] tracking-[0.1em] text-[var(--site-night-muted)] uppercase">
              {col.h}
            </span>
            {col.l.map(([label, href]) => (
              <a
                key={href}
                href={href}
                hrefLang={href === toolHref(locale) ? undefined : target}
                className="flex min-h-11 items-center text-left text-[15px] text-[var(--site-night-ink)] no-underline hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-4 border-t border-[var(--site-night-line)] pt-[18px] text-[13px] text-[var(--site-night-muted)]">
        <span>
          © [COMPANY NAME] · {t('foot.contact')}{' '}
          <a href={CONTACT_MAILTO} className="text-[var(--site-night-muted)] underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
        </span>
        <span>
          {latest ? `${t('foot.updated', { date: fullDate(latest, locale) })} · ` : null}
          {t('foot.cookies')}
        </span>
      </div>
    </footer>
  );
}

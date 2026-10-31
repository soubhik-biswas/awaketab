import { getTranslations } from 'next-intl/server';
import { Mark } from '@/components/brand/mark';
import { localePath, type TLocale } from '@/i18n/locales';
import { ROUTES, toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { LangMenu, MobileMenu, NavLinks, type INavLink } from './header-client';
import { display } from './styles';

// The floating glass pill of every website page: logo, the five links, language and sign-in from 1100 px, the
// violet "Open the timer" pill always, and a menu below 1100 px.
export async function SiteHeader({ locale }: { locale: TLocale }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const tf = await getTranslations({ locale, namespace: 'footer' });
  const th = await getTranslations({ locale, namespace: 'header' });
  const links: INavLink[] = [
    { href: ROUTES.useCases, label: t('nav.uses') },
    { href: ROUTES.guides, label: t('nav.guides') },
    { href: ROUTES.support, label: t('nav.support') },
    { href: ROUTES.help, label: t('nav.help') },
    { href: ROUTES.pro, label: t('nav.pro') },
  ];
  const signin: INavLink = { href: ROUTES.signin, label: t('signin') };
  const target = locale === 'en' ? undefined : 'en';
  return (
    <header className="site-nav relative z-[3] mx-2.5 mt-2.5 flex h-[60px] items-center gap-2 rounded-full pr-2 pl-[14px] min-[700px]:mx-auto min-[700px]:mt-4 min-[700px]:h-16 min-[700px]:max-w-[calc(100%-96px)] min-[700px]:pr-2.5 min-[700px]:pl-5">
      <a
        href={localePath(locale, '/')}
        aria-label={th('home')}
        className="flex min-h-11 items-center gap-2.5 text-foreground no-underline"
      >
        <Mark size={30} tone="auto" label="" />
        <span className={cn(display, 'text-[21px] font-bold tracking-[-0.03em]')}>AwakeTab</span>
      </a>
      <div className="hidden min-[1100px]:flex">
        <NavLinks links={links} label={t('nav.label')} hrefLang={target} />
      </div>
      <span className="flex-1" />
      <div className="hidden items-center gap-2 min-[1100px]:flex">
        <LangMenu locale={locale} label={tf('language._')} />
        <a
          href={signin.href}
          hrefLang={target}
          className="inline-flex h-11 items-center justify-center rounded-[12px] px-[18px] text-[15px] font-semibold text-foreground no-underline hover:bg-secondary"
        >
          {signin.label}
        </a>
      </div>
      <a
        href={toolHref(locale)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-[14px] text-[14px] font-semibold whitespace-nowrap text-primary-foreground no-underline hover:bg-primary-hover min-[700px]:px-[18px] min-[700px]:text-[15px]"
      >
        <span className="min-[700px]:hidden">{t('ctaShort')}</span>
        <span className="hidden min-[700px]:inline">{t('cta._')}</span>
      </a>
      <div className="min-[1100px]:hidden">
        <MobileMenu
          locale={locale}
          links={links}
          signin={signin}
          menuLabel={th('menu._')}
          navLabel={t('nav.label')}
          languageLabel={tf('language._')}
        />
      </div>
    </header>
  );
}

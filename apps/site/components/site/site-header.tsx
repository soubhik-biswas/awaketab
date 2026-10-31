import { getTranslations } from 'next-intl/server';
import { Mark } from '@/components/brand/mark';
import { Button } from '@/components/ui/button';
import { localePath, type TLocale } from '@/i18n/locales';
import { ROUTES, toolHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { LangMenu, MobileMenu, NavLinks, type INavLink } from './header-client';
import { btn, display } from './styles';

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
  return (
    <header className="relative flex h-[60px] items-center gap-2 border-b border-border pr-3 pl-4 min-[700px]:h-[76px] min-[700px]:px-12">
      <a
        href={localePath(locale, '/')}
        aria-label={th('home')}
        className="flex min-h-11 items-center gap-2.5 text-foreground no-underline"
      >
        <span aria-hidden="true" className="inline-flex">
          <Mark size={30} small glow={false} tone="auto" />
        </span>
        <span className={cn(display, 'text-[21px] font-extrabold tracking-[-0.03em]')}>AwakeTab</span>
      </a>
      <div className="hidden min-[1100px]:flex">
        <NavLinks links={links} label={t('nav.label')} hrefLang={locale === 'en' ? undefined : 'en'} />
      </div>
      <span className="flex-1" />
      <div className="hidden items-center gap-2 min-[1100px]:flex">
        <LangMenu locale={locale} label={tf('language._')} />
        <Button asChild variant="ghost" className={btn}>
          <a href={signin.href} hrefLang={locale === 'en' ? undefined : 'en'}>
            {signin.label}
          </a>
        </Button>
      </div>
      <Button asChild className={cn(btn, 'px-[14px] text-[14px] min-[700px]:px-[18px] min-[700px]:text-[15px]')}>
        <a href={toolHref(locale)}>
          <span className="min-[700px]:hidden">{t('ctaShort')}</span>
          <span className="hidden min-[700px]:inline">{t('cta._')}</span>
        </a>
      </Button>
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

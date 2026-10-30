'use client';

import { Globe, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from '@/i18n/navigation';
import { LOCALE_META, LOCALES, localePath, type TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { useLocaleLinks } from './locale-links';

export interface INavLink {
  href: string;
  label: string;
}

const navItem =
  'inline-flex h-11 items-center rounded-[10px] px-3 text-[15px] font-medium text-foreground no-underline hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-bold';

export function NavLinks({ links, label }: { links: readonly INavLink[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="ml-6 flex gap-1">
      {links.map((l) => (
        <a key={l.href} href={l.href} className={navItem} aria-current={pathname === l.href ? 'page' : undefined}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

function useLanguageTargets(): Array<{ locale: TLocale; href: string; label: string }> {
  const links = useLocaleLinks();
  return LOCALES.map((l) => ({ locale: l, href: links[l] ?? localePath(l, '/'), label: LOCALE_META[l].label }));
}

export function LangMenu({ locale, label }: { locale: TLocale; label: string }) {
  const targets = useLanguageTargets();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`${label}: ${LOCALE_META[locale].label}`}
          className="px-2.5 text-[14px] font-normal text-muted-foreground-strong"
        >
          <Globe className="size-4" strokeWidth={2} aria-hidden="true" />
          {LOCALE_META[locale].label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {targets.map((t) => (
          <DropdownMenuItem key={t.locale} asChild>
            <a
              href={t.href}
              lang={LOCALE_META[t.locale].htmlLang}
              hrefLang={LOCALE_META[t.locale].hreflang}
              aria-current={t.locale === locale ? 'true' : undefined}
              className="min-h-11 font-medium aria-[current=true]:font-bold"
            >
              {t.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileMenu({
  locale,
  links,
  menuLabel,
  navLabel,
  languageLabel,
  signin,
}: {
  locale: TLocale;
  links: readonly INavLink[];
  menuLabel: string;
  navLabel: string;
  languageLabel: string;
  signin: INavLink;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const targets = useLanguageTargets();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={menuLabel} className="rounded-[12px]">
          <Menu className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100vw-48px,360px)] gap-0 bg-background p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-[17px] font-bold">{menuLabel}</SheetTitle>
          <SheetDescription className="sr-only">{navLabel}</SheetDescription>
        </SheetHeader>
        <nav aria-label={navLabel} className="flex flex-col gap-1 p-3">
          {[...links, signin].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? 'page' : undefined}
              className={cn(navItem, 'h-12 text-[17px]')}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t p-3">
          <span className="px-3 pt-2 pb-1 font-mono text-[12px] tracking-[0.1em] text-muted-foreground-strong uppercase">
            {languageLabel}
          </span>
          {targets.map((t) => (
            <a
              key={t.locale}
              href={t.href}
              lang={LOCALE_META[t.locale].htmlLang}
              hrefLang={LOCALE_META[t.locale].hreflang}
              aria-current={t.locale === locale ? 'true' : undefined}
              className={cn(navItem, 'aria-[current=true]:bg-secondary aria-[current=true]:font-bold')}
            >
              <Globe className="mr-2 size-4" aria-hidden="true" />
              {t.label}
            </a>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

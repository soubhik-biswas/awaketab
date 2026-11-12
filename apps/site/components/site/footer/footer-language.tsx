'use client';

import { Check, ChevronUp, Globe } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { LOCALE_META, LOCALES, localePath, type TLocale } from '@/i18n/locales';
import { useLocaleLinks } from '../locale-links';

// The footer's language list: every language by its own name, each a plain link to this page's translation or to
// that language's home page when the page has none.
export function FooterLanguage({ locale, label }: { locale: TLocale; label: string }) {
  const links = useLocaleLinks();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const items = () => [...(root.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];

  useEffect(() => {
    if (!open) return;
    const all = items();
    (all.find((item) => item.hasAttribute('aria-current')) ?? all[0])?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    const all = items();
    const last = all.length - 1;
    const at = all.findIndex((item) => item === document.activeElement);
    const steps: Record<string, number> = {
      ArrowDown: at < last ? at + 1 : 0,
      ArrowUp: at > 0 ? at - 1 : last,
      Home: 0,
      End: last,
    };
    const next = all[steps[event.key] ?? -1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  // Safari does not focus a clicked button, so an empty target must not close the list before the click toggles it.
  const onBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <span ref={root} className="site-foot-lang" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        className="site-foot-lang-btn"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${LOCALE_META[locale].label}`}
        onClick={() => setOpen((was) => !was)}
      >
        <Globe className="site-foot-i" aria-hidden="true" />
        <span lang={LOCALE_META[locale].htmlLang}>{LOCALE_META[locale].label}</span>
        <ChevronUp className="site-foot-i site-foot-lang-chev" aria-hidden="true" />
      </button>
      <span id={id} className="site-foot-lang-pop" data-open={open ? '' : undefined}>
        <span id={`${id}-h`} className="site-foot-lang-pop-h">
          {label}
        </span>
        <ul aria-labelledby={`${id}-h`}>
          {LOCALES.map((l) => (
            <li key={l}>
              <a
                href={links[l] ?? localePath(l, '/')}
                lang={LOCALE_META[l].htmlLang}
                hrefLang={LOCALE_META[l].hreflang}
                aria-current={l === locale ? 'true' : undefined}
              >
                <Check className="site-foot-i" aria-hidden="true" />
                <span className="site-foot-lang-native">{LOCALE_META[l].label}</span>
                <span className="site-foot-lang-code" aria-hidden="true">
                  {l.toUpperCase()}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}

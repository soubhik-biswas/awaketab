'use client';

import { useId, useSyncExternalStore } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLocaleLinks } from '@/components/site/locale-links';
import { LOCALE_META, LOCALES, localePath, type TLocale } from '@/i18n/locales';
import { cn } from '@/lib/utils';
import { fill } from '@/lib/tool/chrome';
import type { TThemeChoice } from '@/lib/tool/settings';
import { useTool } from '@/components/tool/context';
import { BTN_DANGER_OUT, FIELD, Group, HELP, SEC_LABEL, Segments, SwitchLine } from '@/components/tool/kit';

const shortName = (l: TLocale) => LOCALE_META[l].label.replace(' (Brasil)', '');

const noopSubscribe = () => () => undefined;

// The page's own language, which can differ from the tool's (Spanish pages open the English tool).
function usePageLocale(fallback: string): TLocale {
  const lang = useSyncExternalStore(
    noopSubscribe,
    () => document.documentElement.lang,
    () => fallback,
  );
  return LOCALES.find((l) => LOCALE_META[l].htmlLang === lang) ?? 'en';
}

function LanguageField() {
  const { m } = useTool();
  const id = useId();
  const links = useLocaleLinks();
  const current = usePageLocale(m.lang);
  const others = LOCALES.filter((l) => l !== current).map(shortName);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={SEC_LABEL}>
        {m.c.language}
      </label>
      <span
        className={cn(
          FIELD,
          'relative focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
        )}
      >
        <Globe className="size-4 shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
        <select
          id={id}
          value={current}
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            const next = e.target.value as TLocale;
            window.location.assign(links[next] ?? localePath(next, '/'));
          }}
          className="h-full min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent p-0 pr-6 text-[15px] text-foreground outline-none"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l} lang={LOCALE_META[l].htmlLang} className="bg-[Canvas] text-[CanvasText]">
              {LOCALE_META[l].label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 size-4 shrink-0 text-muted-foreground-strong"
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
      <span id={`${id}-help`} className={HELP}>
        {fill(m.c.langHelp, { list: others.join(', ') })}
      </span>
    </div>
  );
}

export default function SettingsView() {
  const { settings, themeChoice, m, a } = useTool();
  const { s, c } = m;
  const themes: ReadonlyArray<[TThemeChoice, string]> = [
    ['auto', c.segAuto],
    ['light', c.segLight],
    ['dark', c.segDark],
    ['oled', 'OLED'],
  ];
  return (
    <>
      <Group label={c.gLook}>
        <Segments label={c.theme} options={themes} value={themeChoice} onChange={a.setTheme} />
      </Group>
      <Group label={c.clockSound}>
        <SwitchLine
          label={c.h12}
          desc={c.h12D}
          on={settings.h12}
          onToggle={() => a.updateSettings({ h12: !settings.h12 })}
        />
        <SwitchLine
          label={s.secs}
          desc={s.secsD}
          on={settings.secs}
          onToggle={() => a.updateSettings({ secs: !settings.secs })}
        />
        <SwitchLine
          label={s.sound}
          desc={s.soundD}
          on={settings.chime !== 'off'}
          onToggle={() => a.updateSettings({ chime: settings.chime === 'off' ? 'two' : 'off' })}
        />
        <SwitchLine
          label={s.dim}
          desc={s.dimD}
          on={settings.dim}
          onToggle={() => a.updateSettings({ dim: !settings.dim })}
        />
      </Group>
      <LanguageField />
      <Group label={c.motion}>
        <span className="text-[14px] leading-[1.5]">{c.motionD}</span>
      </Group>
      <Group label={c.data}>
        <Button type="button" variant="outline" onClick={() => a.go('clear')} className={BTN_DANGER_OUT}>
          {c.clearBtn}
        </Button>
        <span className={cn(HELP, '[&_a]:text-link [&_a]:underline')}>
          <Link href="/privacy" hrefLang={m.lang === 'en' ? undefined : 'en'}>
            {c.privacy}
          </Link>{' '}
          ·{' '}
          <Link href="/terms" hrefLang={m.lang === 'en' ? undefined : 'en'}>
            {c.terms}
          </Link>{' '}
          · © [COMPANY NAME] · {c.contact} [CONTACT EMAIL]
        </span>
      </Group>
    </>
  );
}

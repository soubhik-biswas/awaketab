'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SegmentedControl } from '@/components/product/segmented-control';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { LOCALE_META } from '@/i18n/locales';
import {
  EMBED_BOX,
  EMBED_CREDIT_URL,
  EMBED_LOCALES,
  EMBED_MODES,
  EMBED_PRESETS,
  EMBED_SIZES,
  EMBED_THEMES,
  embedPath,
  embedQuery,
  type TEmbedLocale,
} from '@/lib/embed/protocol';
import {
  DEFAULT_SNIPPET,
  iframeSnippet,
  loaderSnippet,
  SNIPPET_SANDBOX,
  type ISnippetOptions,
} from '@/lib/embed/snippet';

const LABEL = 'text-[14px] font-semibold';
const H2 = 'm-0 font-display text-[24px] font-bold tracking-[-0.03em]';
const CODE =
  'm-0 overflow-x-auto rounded-[18px] border border-border bg-field p-4 font-mono text-[14px] leading-[1.6] whitespace-pre-wrap break-all';
const LENGTHS = EMBED_PRESETS.filter((p) => p !== 'until');

const noop = () => () => undefined;
const useOrigin = () =>
  useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => 'https://awaketab.com',
  );

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('surfaces.embedPage');
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 self-start gap-2 rounded-[12px] px-4 text-[14px] font-semibold"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        });
      }}
    >
      {done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{done ? t('copied') : t('copy')}</span>
    </Button>
  );
}

// The embed page: pick the widget's look, see the real widget, copy the one-line snippet.
export function EmbedPage() {
  const t = useTranslations('surfaces.embedPage');
  const tf = useTranslations('embed');
  const origin = useOrigin();
  const [opts, setOpts] = useState<ISnippetOptions>(DEFAULT_SNIPPET);
  const set = (patch: Partial<ISnippetOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const lang: TEmbedLocale = opts.lang ?? 'en';
  const box = EMBED_BOX[opts.size];
  const src = useMemo(() => `${embedPath(lang)}?${embedQuery({ ...opts, lang }, '')}`, [opts, lang]);
  const snippet = loaderSnippet(opts, origin);
  const frameSnippet = iframeSnippet(opts, tf('frame.title'), origin, tf('attribution'));

  return (
    <div className="flex flex-col gap-10 px-5 py-10 min-[700px]:px-10 lg:px-16 xl:px-24">
      <header className="flex flex-col gap-3">
        <span className="font-mono text-[13px] tracking-[.14em] text-lamp uppercase">{t('eyebrow')}</span>
        <h1 className="m-0 font-display text-[36px] leading-[.98] font-bold tracking-[-0.04em] min-[700px]:text-[52px]">
          {t('h1')}
        </h1>
        <p className="m-0 max-w-[640px] text-[17px] text-muted-foreground-strong">{t('lead')}</p>
      </header>

      <section aria-labelledby="embed-builder" className="grid items-start gap-8 xl:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="embed-builder" className={H2}>
              {t('builder')}
            </h2>
            <p className="m-0 text-[15px] text-muted-foreground-strong">{t('builderSub')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span id="embed-mode" className={LABEL}>
              {t('mode._')}
            </span>
            <SegmentedControl
              aria-labelledby="embed-mode"
              value={opts.mode}
              onValueChange={(v) => set({ mode: v as ISnippetOptions['mode'] })}
              options={EMBED_MODES.map((m) => ({ value: m, label: t(`mode.${m}`) }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span id="embed-theme" className={LABEL}>
              {t('theme._')}
            </span>
            <SegmentedControl
              aria-labelledby="embed-theme"
              value={opts.theme}
              onValueChange={(v) => set({ theme: v as ISnippetOptions['theme'] })}
              options={EMBED_THEMES.map((m) => ({ value: m, label: t(`theme.${m}`) }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span id="embed-size" className={LABEL}>
              {t('size._')}
            </span>
            <SegmentedControl
              aria-labelledby="embed-size"
              value={opts.size}
              onValueChange={(v) => set({ size: v as ISnippetOptions['size'] })}
              options={EMBED_SIZES.map((m) => ({ value: m, label: t(`size.${m}`) }))}
            />
          </div>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t('lang._')}</span>
            <NativeSelect
              value={opts.lang ?? ''}
              onChange={(e) => set({ lang: (e.target.value || null) as TEmbedLocale | null })}
            >
              <NativeSelectOption value="">{t('lang.page')}</NativeSelectOption>
              {EMBED_LOCALES.map((l) => (
                <NativeSelectOption key={l} value={l}>
                  {LOCALE_META[l].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>{t('length._')}</span>
            <NativeSelect
              value={opts.preset}
              onChange={(e) => set({ preset: e.target.value as ISnippetOptions['preset'] })}
            >
              {LENGTHS.map((p) => (
                <NativeSelectOption key={p} value={p}>
                  {t(`length.${p}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className={H2}>{t('demo')}</h2>
            <p className="m-0 text-[15px] text-muted-foreground-strong">{t('demoNote')}</p>
            <div className="rounded-[28px] border border-border bg-background p-5">
              <iframe
                key={src}
                src={src}
                title={tf('frame.title')}
                allow="screen-wake-lock"
                referrerPolicy="strict-origin"
                sandbox={SNIPPET_SANDBOX}
                className="block max-w-full border-0"
                style={{ width: box.width, height: box.height, borderRadius: box.radius, colorScheme: 'light dark' }}
              />
              <div className="mt-4 h-6 truncate text-[13px] leading-6">
                <a href={EMBED_CREDIT_URL} rel="nofollow" className="text-inherit underline underline-offset-3">
                  {tf('attribution')}
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>{t('snippet')}</h2>
            <p className="m-0 text-[15px] text-muted-foreground-strong">{t('snippetNote')}</p>
            <pre className={CODE}>
              <code>{snippet}</code>
            </pre>
            <CopyButton text={snippet} />
          </div>
          <div id="allow" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className={H2}>{t('allow')}</h2>
            <p className="m-0 max-w-[720px] text-[15px] text-muted-foreground-strong">{t('allowBody')}</p>
            <pre className={CODE}>
              <code>{frameSnippet}</code>
            </pre>
            <CopyButton text={frameSnippet} />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>{t('api')}</h2>
            <p className="m-0 max-w-[720px] text-[15px] text-muted-foreground-strong">{t('apiBody')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className={H2}>{t('licence')}</h2>
            <p className="m-0 max-w-[720px] text-[15px] text-muted-foreground-strong">{t('licenceBody')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

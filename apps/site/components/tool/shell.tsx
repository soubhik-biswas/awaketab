'use client';

import type { CSSProperties } from 'react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppMark } from '@/components/brand/mark';
import { StateIcon } from '@/components/face';
import { cn } from '@/lib/utils';
import { useMounted } from '@/lib/surfaces/hooks';
import { STAGE_ID } from '@/lib/tool/stage-id';
import { isLatin, type TToolLang } from '@/lib/tool/strings';
import type { TT } from './context';

// "Keep this screen awake.": the last word carries the gradient, and the serif accent in Latin scripts.
export function Headline({
  lang,
  t,
  className,
  style,
}: {
  lang: TToolLang;
  t: TT;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <h1
      lang={lang}
      className={cn(
        'm-0 font-display leading-[.98] font-bold tracking-[-0.04em] text-balance [font-optical-sizing:auto]',
        className,
      )}
      style={style}
    >
      {t('set.h1a')}{' '}
      <span
        className={cn(
          'inline-block bg-clip-text whitespace-nowrap text-transparent [word-break:keep-all]',
          isLatin(lang) && 'pr-[.06em] font-accent text-[1.08em] font-normal tracking-[-0.01em] italic',
        )}
        style={{
          backgroundImage: 'linear-gradient(100deg, var(--tg-volt) 0%, var(--tg-mint) 45%, var(--tg-violet) 100%)',
        }}
      >
        {t('set.h1b')}
      </span>
    </h1>
  );
}

const PILL =
  'tg-glass tg-pill min-h-[38px] max-w-full flex-none items-center gap-2.5 rounded-full py-1 pr-4 pl-[13px] text-[14px] font-semibold tracking-[-0.005em]';

function RestPill({ t, className }: { t: TT; className: string }) {
  return (
    <span className={cn(PILL, className)}>
      <span aria-hidden="true" className="tg-glyph flex size-4 flex-none">
        <StateIcon state="idle" c="currentColor" />
      </span>
      {t('pill.idle')}
    </span>
  );
}

export const START_QUEUED = 'data-tg-queued';

// Runs as the page is read, before the tool's own code: a tap on the start button is remembered and the tool starts
// the session as soon as it is ready.
const QUEUE_START = `document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('[data-tg-start]'))document.documentElement.setAttribute('${START_QUEUED}','')},true)`;

// What the server sends and the first paint shows: Set mode at rest, with the headline, the start button and the
// skip link's target in the HTML. It is laid out by its own frame, in the tool's tiers (700, 1100, 1300) and with the
// same steps for short frames as the working tool (fit.ts), so nothing moves when the working tool takes over.
export function ToolShell({ lang }: { lang: TToolLang }) {
  const t: TT = useTranslations('tool.glance');
  const tt: TT = useTranslations('tool');
  const hydrated = useMounted();
  return (
    <div className="tg-shell">
      <header className="absolute inset-x-0 top-0 z-[5] flex h-16 items-center px-4 @min-[700px]:h-[76px] @min-[700px]:px-7">
        <AppMark size={30} wordSize={22} />
        <RestPill
          t={t}
          className="absolute top-1/2 left-[196px] hidden -translate-y-1/2 @min-[1100px]:inline-flex @min-[1300px]:left-[200px]"
        />
      </header>
      <main
        id={STAGE_ID}
        tabIndex={-1}
        aria-label={t('stage.label')}
        className="tg-shell-stage absolute inset-x-0 top-16 bottom-6 z-[1] flex flex-col items-center [justify-content:safe_center] gap-3.5 px-4 outline-none @min-[700px]:top-[76px] @min-[700px]:gap-5"
      >
        <RestPill t={t} className="tg-shell-pill inline-flex @min-[1100px]:hidden" />
        <div className="tg-shell-hero flex max-w-[350px] flex-none flex-col items-center gap-2 text-center @min-[700px]:max-w-[900px] @min-[700px]:gap-3">
          <span
            aria-hidden="true"
            className="tg-shell-eyebrow font-mono text-[12px] tracking-[.16em] uppercase @min-[700px]:text-[13px]"
          >
            &nbsp;
          </span>
          <Headline
            lang={lang}
            t={t}
            className="tg-shell-headline text-[36px] @min-[700px]:text-[60px] @min-[1100px]:text-[52px] @min-[1300px]:text-[64px]"
          />
        </div>
        <div aria-hidden="true" className="tg-shell-face" />
        <div className="flex w-full flex-none flex-col items-center gap-3.5 @min-[700px]:gap-[18px]">
          <div
            aria-hidden="true"
            className="tg-glass h-[54px] w-[350px] max-w-full rounded-full @min-[700px]:h-14 @min-[700px]:w-[520px]"
          />
          <div
            className="tg-field relative w-[353px] max-w-full overflow-hidden rounded-full p-[1.5px] @min-[700px]:w-auto"
            style={{ boxShadow: '0 18px 50px var(--tg-cta-glow)' }}
          >
            <button
              type="button"
              data-tg-start=""
              className="tg-btn relative inline-flex h-[60px] w-full items-center justify-center gap-3 overflow-hidden rounded-full border-0 px-5 text-[18px] font-bold tracking-[-0.01em] text-(--tg-on-violet) @min-[700px]:h-16 @min-[700px]:w-auto @min-[700px]:px-[34px] @min-[700px]:text-[19px]"
              style={{
                background:
                  'linear-gradient(180deg, var(--tg-cta-top) 0%, var(--tg-violet) 45%, var(--tg-violet2) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.12)',
              }}
            >
              <Play className="size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
              <span>{t('set.cta', { len: `1 ${t('unit.h')}` })}</span>
            </button>
          </div>
          <span aria-hidden="true" className="tg-shell-note text-[14px]">
            &nbsp;
          </span>
          <noscript>
            <span className="block max-w-[350px] text-center text-[14px] text-(--tg-t2)">{tt('noscript')}</span>
          </noscript>
        </div>
      </main>
      {hydrated ? null : <script dangerouslySetInnerHTML={{ __html: QUEUE_START }} />}
    </div>
  );
}

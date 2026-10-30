'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Scene } from '@/components/scene/scene';
import { Button } from '@/components/ui/button';
import * as s from '@/components/site/styles';
import { cn } from '@/lib/utils';
import { toolHref } from '@/lib/routes';

// The server-error system page; "Try again" re-renders the segment that failed.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('site');
  useEffect(() => {
    document.title = t('sys.error.title');
  }, [error, t]);
  return (
    <section className={cn('flex flex-col items-center gap-5 lg:flex-row lg:gap-12', s.pad)}>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[14px] self-stretch min-[700px]:gap-5 lg:self-auto">
        <span className={s.eyebrow}>{t('sys.error.eyebrow')}</span>
        <h1 className={cn(s.h1, s.h1Art)}>{t('sys.error.h1')}</h1>
        <p className={s.lead}>{t('sys.error.lead')}</p>
        <div className="flex w-full flex-wrap gap-2.5 min-[700px]:w-auto">
          <Button size="cta" className={s.btnXl} onClick={reset}>
            <Play className="size-5" aria-hidden="true" />
            {t('sys.retry')}
          </Button>
          <Button asChild variant="outline" size="cta" className={s.btnOutXl}>
            <a href={toolHref()}>{t('cta._')}</a>
          </Button>
        </div>
      </div>
      <div className="flex-none">
        <Scene scene="error" width={520} float decorative className="h-auto w-[350px] max-w-full min-[700px]:w-[520px]" />
      </div>
    </section>
  );
}

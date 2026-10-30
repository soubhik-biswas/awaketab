'use client';

import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/site/page-hero';
import * as s from '@/components/site/styles';
import { toolHref } from '@/lib/routes';

// The server-error system page; "Try again" re-renders the segment that failed.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('site');
  useEffect(() => {
    document.title = t('sys.error.title');
  }, [error, t]);
  return (
    <PageHero
      eyebrow={t('sys.error.eyebrow')}
      h1={t('sys.error.h1')}
      lead={t('sys.error.lead')}
      scene="error"
      actions={
        <div className="flex w-full flex-wrap gap-2.5 min-[700px]:w-auto">
          <Button size="cta" className={s.btnXl} onClick={reset}>
            <Play className="size-5" aria-hidden="true" />
            {t('sys.retry')}
          </Button>
          <Button asChild variant="outline" size="cta" className={s.btnOutXl}>
            <a href={toolHref()}>{t('cta._')}</a>
          </Button>
        </div>
      }
    />
  );
}

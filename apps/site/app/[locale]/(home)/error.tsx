'use client';

import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { PageHero } from '@/components/site/page-hero';
import * as s from '@/components/site/styles';
import { Button } from '@/components/ui/button';

// A failure in the story under the tool. The tool sits in the layout above this boundary and keeps running, so a
// session that is awake stays awake; the page says what happened and offers a reload.
export default function HomeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('site');
  const tg = useTranslations('tool.glance');
  useEffect(() => {
    document.title = `${t('sys.error.h1').replace(/\.$/u, '')} · AwakeTab`;
  }, [error, t]);
  return (
    <PageHero
      eyebrow={t('sys.error.eyebrow')}
      h1={t('sys.error.h1')}
      lead={t('sys.error.lead')}
      scene="error"
      actions={
        <div className="flex w-full flex-wrap gap-2.5 min-[700px]:w-auto">
          <Button size="cta" className={s.btnXl} onClick={() => window.location.reload()}>
            <RotateCw className="size-5" aria-hidden="true" />
            {tg('crash.btn')}
          </Button>
          <Button variant="outline" size="cta" className={s.btnOutXl} onClick={reset}>
            {t('sys.retry')}
          </Button>
        </div>
      }
    />
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SystemPage, systemMetadata } from '@/components/site/system-page';
import { PRO_ENABLED } from '@/lib/features';
import { ROUTES, toolHref } from '@/lib/routes';
import { englishOnly } from '@/lib/seo';

// Set NEXT_PUBLIC_MAINTENANCE_UNTIL ("2:00 PM") for the build that announces a window; without it the page never
// claims an outage that is not happening.
const until = process.env.NEXT_PUBLIC_MAINTENANCE_UNTIL?.trim() ?? '';
const down = until !== '';
// Sign-in and sync only exist with Pro, so the free build's copy leaves them out.
const FREE = PRO_ENABLED ? '' : 'Free';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'site.sys.status' });
  return systemMetadata(t(down ? 'h1' : 'okH1'), t(`description${FREE}`), '/status');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'site' });
  return (
    <SystemPage
      eyebrow={t(down ? 'sys.status.eyebrow' : 'sys.status.okEyebrow')}
      h1={t(down ? 'sys.status.h1' : 'sys.status.okH1')}
      lead={down ? t(`sys.status.lead${FREE}`, { time: until }) : t(`sys.status.okLead${FREE}`)}
      scene={down ? 'maintenance' : 'success'}
      primary={{ href: toolHref(), label: t('cta._') }}
      secondary={{ href: ROUTES.help, label: t('sys.help') }}
    />
  );
}

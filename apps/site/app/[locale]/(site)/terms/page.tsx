import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage, legalLink } from '@/components/site/legal-page';
import { PRO_ENABLED } from '@/lib/features';
import { panelHref, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

// Paid plans only exist with Pro, so the free build's terms leave them out.
const FREE = PRO_ENABLED ? '' : 'Free';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.terms' });
  return pageMetadata({
    title: titleFor('Terms of use'),
    description: t(`description${FREE}`),
    path: ROUTES.terms,
    og: { image: 'og-02', alt: 'AwakeTab: keep this screen awake' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'page.terms' });
  return (
    <LegalPage
      crumb={t('h1')}
      h1="Terms of use"
      lead="You may use AwakeTab to request that a supported browser keep a display awake while the relevant page remains eligible. Browser, operating-system and device power policy always remain in control."
      description={t(`description${FREE}`)}
      path={ROUTES.terms}
      updated="2026-11-13"
      effective="2026-11-13"
      other={['Privacy', ROUTES.privacy]}
      sections={[
        {
          id: 'guarantee',
          title: 'No guarantee of uninterrupted wakefulness',
          summary: 'trust the live status pill, not a promise. Do not rely on AwakeTab for safety-critical monitoring.',
          body: (
            <p className="m-0">
              AwakeTab cannot guarantee operation in a hidden tab, after closing a laptop lid, during low-power modes,
              after browser suspension, or when a device administrator blocks the API. Use the live status pill as the
              current result and do not rely on AwakeTab for safety-critical monitoring.
            </p>
          ),
        },
        {
          id: 'use',
          title: 'Responsible use',
          summary: 'use the shortest session you need, and do not use AwakeTab to fake activity or availability.',
          body: (
            <p className="m-0">
              Keeping a display on uses battery and may cause image retention on some screens. Follow device guidance,
              use the shortest suitable duration and stop a session when it is no longer needed. You must not use the
              service to misrepresent activity or availability.
            </p>
          ),
        },
        {
          id: 'licences',
          title: 'Software and licences',
          summary: PRO_ENABLED
            ? 'the website is provided as-is, open-source packages keep their own licence, and paid plans have a 14-day refund.'
            : 'the website is provided as-is and free to use, and open-source packages keep their own licence.',
          body: (
            <>
              <p className="m-0">
                The public website is provided as-is. You may use the free tool for personal and commercial purposes.
                Open-source packages are governed by the licence included with their source. Features and browser
                support may change as platforms change.
                {PRO_ENABLED &&
                  ' Paid product terms, activation limits and refund information shown at checkout apply in addition to these terms.'}
              </p>
              {PRO_ENABLED ? (
                <p className="m-0">
                  Paid plans include a 14-day refund, no questions asked. Ask from Settings → Account → Manage plan; the
                  payment provider&apos;s customer portal works too. Refunds end Pro on every device.
                </p>
              ) : (
                <p className="m-0">
                  Questions about these terms go through{' '}
                  <a href={panelHref('feedback')} className={legalLink}>
                    Settings → Send feedback
                  </a>{' '}
                  inside the tool.
                </p>
              )}
            </>
          ),
        },
      ]}
    />
  );
}

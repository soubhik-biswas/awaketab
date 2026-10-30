import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage, legalLink } from '@/components/site/legal-page';
import { CONTACT_EMAIL, CONTACT_MAILTO, ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'page.terms' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.terms,
    og: { kicker: 'Legal', title: 'Terms of use', tone: 'light' },
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
      description={t('description')}
      path={ROUTES.terms}
      updated="2026-09-09"
      effective="2026-09-09"
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
          summary: 'the website is provided as-is, open-source packages keep their own licence, and paid licences have a 14-day refund.',
          body: (
            <>
              <p className="m-0">
                The public website is provided as-is. Open-source packages are governed by the licence included with
                their source. Paid product terms, activation limits and refund information shown at checkout apply in
                addition to these terms. Features and browser support may change as platforms change.
              </p>
              <p className="m-0">
                Paid licences include a 14-day refund, no questions asked. Email{' '}
                <a href={CONTACT_MAILTO} className={legalLink}>
                  {CONTACT_EMAIL}
                </a>{' '}
                with your receipt or use the Polar customer portal. Refunds deactivate the licence key.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

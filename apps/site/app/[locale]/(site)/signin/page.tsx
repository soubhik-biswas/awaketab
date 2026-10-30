import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignIn } from '@/components/auth/sign-in';
import { Block, Callout } from '@/components/site/blocks';
import { PageHero } from '@/components/site/page-hero';
import { ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'account.signin' });
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: ROUTES.signin,
    noindex: true,
    og: { kicker: t('eyebrow'), title: t('h1'), tone: 'dark' },
  });
}

// The sign-in page: the site's hero, the account flow's form card (empty, error and sent states), then the note
// that only Pro needs it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  const t = await getTranslations({ locale: 'en', namespace: 'account.signin' });
  return (
    <>
      <PageHero eyebrow={t('eyebrow')} h1={t('h1')} lead={t('lead')} />
      <Block label={t('label')}>
        <SignIn />
      </Block>
      <Block label={t('callout.title')}>
        <Callout tone="info" title={t('callout.title')}>
          {t('callout.text')}
        </Callout>
      </Block>
    </>
  );
}

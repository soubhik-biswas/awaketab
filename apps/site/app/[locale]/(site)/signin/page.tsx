import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignIn } from '@/components/auth/sign-in';
import { ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata, titleFor } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'account.signin' });
  const ts = await getTranslations({ locale: 'en', namespace: 'site' });
  return pageMetadata({
    title: titleFor(t('h1')),
    description: ts('signinMeta'),
    path: ROUTES.signin,
    noindex: true,
    og: { image: 'og-04', alt: 'AwakeTab Pro: one setup, every screen' },
  });
}

// The sign-in page: the account flow draws its own hero for each state, the form card and the note that only Pro needs it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <SignIn />;
}

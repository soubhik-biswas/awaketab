import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignIn } from '@/components/auth/sign-in';
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

// Sign-in inside the site's header and footer; the account flow owns the form and its states.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <SignIn />;
}

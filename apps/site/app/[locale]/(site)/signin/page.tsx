import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Block, Callout } from '@/components/site/blocks';
import { PageHero } from '@/components/site/page-hero';
import { SigninForm, type TSigninState } from '@/components/site/signin-form';
import { ROUTES } from '@/lib/routes';
import { englishOnly, pageMetadata } from '@/lib/seo';

const MINUTES = 15;
const STATES: readonly TSigninState[] = ['empty', 'error', 'sent'];

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

// The sign-in shell; the account flow wires the email and the provider buttons. Outside production, `?form=error`
// and `?form=sent` open the board's other two states for review.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ form?: string }>;
}) {
  await englishOnly(params);
  const { form } = await searchParams;
  const t = await getTranslations({ locale: 'en', namespace: 'account.signin' });
  const review = process.env.NODE_ENV !== 'production' && STATES.includes(form as TSigninState);
  return (
    <>
      <PageHero eyebrow={t('eyebrow')} h1={t('h1')} lead={t('lead')} />
      <Block label={t('label')}>
        <SigninForm
          initial={review ? (form as TSigninState) : 'empty'}
          enabled={process.env.NEXT_PUBLIC_SIGNIN_ENABLED === '1'}
          labels={{
            label: t('label'),
            help: t('help'),
            error: t('error.email'),
            submit: t('submit'),
            note: t('note', { minutes: MINUTES }),
            sentTitle: t('sent.h'),
            sentBefore: t('sent.before'),
            sentAfter: t('sent.after'),
            reset: t('sent.reset'),
            unavailableTitle: t('unavailable.title'),
            unavailableText: t('unavailable.text'),
          }}
        />
      </Block>
      <Block label={t('callout.title')}>
        <Callout tone="info" title={t('callout.title')}>
          {t('callout.text')}
        </Callout>
      </Block>
    </>
  );
}

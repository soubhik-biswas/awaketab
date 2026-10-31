import type { Metadata } from 'next';
import { EmbedApp } from '@/components/embed/embed-app';
import { localeParam } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: 'Cook Mode — AwakeTab' },
  robots: { index: false, follow: false },
};

// The iframe app behind the website widget, in the language the loader asked for.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await localeParam(params);
  return (
    <>
      <h1 className="sr-only">Cook Mode</h1>
      <EmbedApp />
    </>
  );
}

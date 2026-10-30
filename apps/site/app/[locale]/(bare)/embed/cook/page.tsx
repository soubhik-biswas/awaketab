import type { Metadata } from 'next';
import { englishOnly } from '@/lib/seo';

export const metadata: Metadata = { title: { absolute: 'Cook Mode — AwakeTab' }, robots: { index: false, follow: false } };

// The iframe app behind the Cook Mode widget; the widget fills it.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return (
    <div data-embed-shell="cook" className="grid min-h-dvh place-items-center p-4">
      <h1 className="sr-only">Cook Mode</h1>
    </div>
  );
}

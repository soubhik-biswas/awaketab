import type { Metadata } from 'next';
import { HubPage, hubMetadata } from '@/components/site/hub-page';
import { englishOnly } from '@/lib/seo';

export function generateMetadata(): Promise<Metadata> {
  return hubMetadata('on');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  await englishOnly(params);
  return <HubPage kind="on" />;
}

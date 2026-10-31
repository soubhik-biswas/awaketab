import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ComponentGallery } from './gallery';

export const metadata: Metadata = { title: 'Components · AwakeTab', robots: { index: false, follow: false } };

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ComponentGallery />;
}

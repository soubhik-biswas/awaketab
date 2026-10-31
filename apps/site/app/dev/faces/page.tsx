import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FacesBoard } from './faces-board';

export const metadata: Metadata = {
  title: 'Clock faces · dev',
  robots: { index: false, follow: false },
};

// A review page for development builds only; production answers 404.
export default function DevFacesPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <FacesBoard />;
}

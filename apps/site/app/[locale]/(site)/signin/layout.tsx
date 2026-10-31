import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { PRO_ENABLED } from '@/lib/features';

// Pro and sign-in launch later; until the switch is on these pages do not exist.
export default function Layout({ children }: { children: ReactNode }) {
  if (!PRO_ENABLED) notFound();
  return children;
}

import type { ReactNode } from 'react';

// Surfaces without the site chrome: the picture-in-picture popup and the embed iframe app.
export default function BareLayout({ children }: { children: ReactNode }) {
  return <main className="min-h-dvh bg-background text-foreground">{children}</main>;
}

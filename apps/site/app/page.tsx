import { Mark } from '@/components/brand/mark';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background text-foreground">
      <Mark size={64} lockup="horizontal" tone="light" className="dark:hidden" />
      <Mark size={64} lockup="horizontal" tone="dark" className="hidden dark:inline-flex" />
    </main>
  );
}

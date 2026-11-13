import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AssetFrame } from './frames';
import { FRAME_IDS, FRAMES, isFrameId } from './sizes';

export const metadata: Metadata = {
  title: 'Marketing images · dev',
  robots: { index: false, follow: false },
};

// Development builds only: each marketing image as an exact-size frame for screenshots. Production answers 404.
export default async function DevAssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { frame } = await searchParams;
  if (isFrameId(frame)) return <AssetFrame id={frame} />;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <h1 className="font-display text-2xl font-bold">Marketing images</h1>
      <ul className="flex flex-col gap-2 font-mono text-sm">
        {FRAME_IDS.map((id) => (
          <li key={id}>
            <Link className="underline underline-offset-4" href={`/dev/assets?frame=${id}`}>
              {id}
            </Link>{' '}
            <span className="text-muted-foreground">
              {FRAMES[id].w} × {FRAMES[id].h} · {FRAMES[id].tone}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}

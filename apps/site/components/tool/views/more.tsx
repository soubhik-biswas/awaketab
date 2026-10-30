'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Laptop,
  LifeBuoy,
  Palette,
  Puzzle,
  Settings,
  Share2,
  Sparkles,
  User,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import type { TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { PRO_CHIP, ROW_BTN, TILE } from '@/components/tool/kit';

type TRow = { n: string; icon: LucideIcon; pro?: boolean } & ({ view: TToolView } | { href: string });

const ROWS: TRow[] = [
  { n: 'Face studio', icon: Palette, view: 'studio', pro: true },
  { n: 'Ambient sound', icon: Volume2, view: 'sound', pro: true },
  { n: 'Devices', icon: Laptop, view: 'devices', pro: true },
  { n: 'Account', icon: User, view: 'account' },
  { n: 'Settings', icon: Settings, view: 'settings' },
  { n: 'Help & fixes', icon: LifeBuoy, view: 'fix' },
  { n: 'Share this setup', icon: Share2, view: 'share' },
  { n: 'Get the extension', icon: Puzzle, href: '/extension' },
  { n: 'AwakeTab Pro', icon: Sparkles, href: '/pro', pro: true },
];

function RowInner({ r }: { r: TRow }) {
  const Icon = r.icon;
  return (
    <>
      <span className={TILE}>
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex-1 text-left text-[15px] font-semibold">{r.n}</span>
      {r.pro ? <span className={PRO_CHIP}>Pro</span> : null}
      <ChevronRight className="size-[18px] shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
    </>
  );
}

export default function MoreView() {
  const { a } = useTool();
  return (
    <nav aria-label="More" className="flex flex-col">
      {ROWS.map((r) =>
        'href' in r ? (
          <Link key={r.n} href={r.href} className={`${ROW_BTN} no-underline`}>
            <RowInner r={r} />
          </Link>
        ) : (
          <button key={r.n} type="button" className={ROW_BTN} onClick={() => a.go(r.view)}>
            <RowInner r={r} />
          </button>
        ),
      )}
    </nav>
  );
}

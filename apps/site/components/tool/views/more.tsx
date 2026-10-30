'use client';

import Link from 'next/link';
import {
  ChevronRight,
  History,
  Laptop,
  LifeBuoy,
  ListChecks,
  Moon,
  Palette,
  Puzzle,
  Search,
  Settings,
  Share2,
  Sparkles,
  Sun,
  User,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import type { TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { PRO_CHIP } from '@/components/tool/kit';

type TRow = { n: string; icon: LucideIcon; pro?: boolean; keys?: string } & (
  { view: TToolView } | { href: string } | { run: () => void }
);

const THEME_NAME = { light: 'light', dark: 'dark', oled: 'OLED black' } as const;

const ROW =
  'box-border flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[12px] border-0 bg-transparent p-0 text-left text-foreground no-underline outline-none transition-colors duration-glide ease-glide hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function RowInner({ r }: { r: TRow }) {
  const Icon = r.icon;
  return (
    <>
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary">
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex-1 text-left text-[15px] font-semibold whitespace-pre">{r.n}</span>
      {r.pro ? <span className={PRO_CHIP}>Pro</span> : null}
      <ChevronRight className="size-[18px] shrink-0 text-muted-foreground-strong" strokeWidth={2} aria-hidden="true" />
    </>
  );
}

// Everything that is not the session itself, one tap away, in the order the menu board draws.
export default function MoreView() {
  const { theme, a } = useTool();
  const rows: TRow[] = [
    { n: 'Presets', icon: ListChecks, view: 'presets' },
    { n: 'History', icon: History, view: 'history' },
    { n: 'Search and commands  ⌘K', icon: Search, view: 'palette', keys: 'Meta+K Control+K' },
    { n: `Theme: ${THEME_NAME[theme]}`, icon: theme === 'light' ? Sun : Moon, run: a.cycleTheme, keys: 'Shift+D' },
    { n: 'Settings', icon: Settings, view: 'settings' },
    { n: 'Help & fixes', icon: LifeBuoy, view: 'fix', keys: '?' },
    { n: 'Share this setup', icon: Share2, view: 'share' },
    { n: 'Face studio', icon: Palette, view: 'studio', pro: true },
    { n: 'Ambient sound', icon: Volume2, view: 'sound', pro: true },
    { n: 'Devices', icon: Laptop, view: 'devices', pro: true },
    { n: 'Account', icon: User, view: 'account' },
    { n: 'Get the browser extension', icon: Puzzle, href: '/extension' },
    { n: 'AwakeTab Pro', icon: Sparkles, href: '/pro', pro: true },
  ];
  return (
    <nav aria-label="Menu" className="flex flex-col">
      {rows.map((r) =>
        'href' in r ? (
          <Link key={r.n} href={r.href} className={ROW}>
            <RowInner r={r} />
          </Link>
        ) : (
          <button
            key={r.n}
            type="button"
            className={ROW}
            aria-keyshortcuts={r.keys}
            onClick={'view' in r ? () => a.go(r.view) : r.run}
          >
            <RowInner r={r} />
          </button>
        ),
      )}
    </nav>
  );
}

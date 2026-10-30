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
import { fill } from '@/lib/tool/chrome';
import type { TToolView } from '@/lib/tool/ui';
import { useTool } from '@/components/tool/context';
import { PRO_CHIP } from '@/components/tool/kit';

type TRow = { n: string; icon: LucideIcon; pro?: boolean; keys?: string; lang?: string } & (
  { view: TToolView } | { href: string } | { run: () => void }
);

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
  const { theme, m, a } = useTool();
  const { s, c } = m;
  const en = m.lang === 'en';
  const rows: TRow[] = [
    { n: s.presets, icon: ListChecks, view: 'presets' },
    { n: s.history, icon: History, view: 'history' },
    { n: `${c.searchCmds}  ⌘K`, icon: Search, view: 'palette', keys: 'Meta+K Control+K' },
    { n: fill(c.themeIs, { name: c[theme] }), icon: theme === 'light' ? Sun : Moon, run: a.cycleTheme, keys: 'Shift+D' },
    { n: s.settings, icon: Settings, view: 'settings' },
    { n: s.help, icon: LifeBuoy, view: 'fix', keys: '?' },
    { n: c.share, icon: Share2, view: 'share' },
    { n: s.studio, icon: Palette, view: 'studio', pro: true },
    { n: c.ambient, icon: Volume2, view: 'sound', pro: true },
    { n: s.devices, icon: Laptop, view: 'devices', pro: true },
    { n: c.account, icon: User, view: 'account' },
    // The extension and Pro pages are English only; hreflang says so before the visitor follows the link.
    { n: c.extension, icon: Puzzle, href: '/extension', lang: en ? undefined : 'en' },
    { n: 'AwakeTab Pro', icon: Sparkles, href: '/pro', pro: true, lang: en ? undefined : 'en' },
  ];
  return (
    <nav aria-label={c.menu} className="flex flex-col">
      {rows.map((r) =>
        'href' in r ? (
          <Link key={r.n} href={r.href} hrefLang={r.lang} className={ROW}>
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

'use client';

import { motion } from 'motion/react';
import { History, LayoutGrid, Search, SlidersVertical, Wand, type LucideIcon } from 'lucide-react';
import { AppMark } from '@/components/brand/mark';
import { cn } from '@/lib/utils';
import type { TPanel } from '@/lib/tool/ui';
import { useGlance } from './context';
import { StatusPill } from './status-pill';
import { EASE, Kbd } from './kit';

const PLACES: Array<[TPanel, string, LucideIcon]> = [
  ['vibes', 'top.vibe', Wand],
  ['faces', 'top.faces', LayoutGrid],
  ['recents', 'top.recents', History],
  ['settings', 'top.settings', SlidersVertical],
];

const iconBtn =
  'tg-btn inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border-0 text-[14px] font-semibold tracking-[-0.005em]';

// Logo, the status pill (in the stage on phone and tablet portrait) and one glass capsule: Search, Vibe, Faces,
// Recents, Settings. Labels show from 1300 px; below that the buttons are icons, still 44 px.
export function TopBar() {
  const g = useGlance();
  const { t, desk, phone, narrow, panel, hidden } = g;
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/u.test(navigator.platform || navigator.userAgent);
  return (
    <motion.header
      className="absolute inset-x-0 top-0 z-[5] flex items-center gap-3"
      style={{ height: g.topH, paddingInline: phone ? 16 : 28, pointerEvents: hidden ? 'none' : undefined }}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? 12 : 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      aria-hidden={hidden || undefined}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <AppMark size={30} wordSize={phone ? 20 : 22} label="AwakeTab" />
      </div>
      {!narrow ? (
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: desk ? 200 : 196 }}>
          <StatusPill />
        </div>
      ) : null}
      <div className="flex flex-1 items-center justify-end">
        <div className="tg-hair flex items-center gap-0.5 rounded-full p-1 shadow-[0_10px_30px_var(--tg-caps-shadow),inset_0_1px_0_var(--tg-inset-hi)]">
          {!phone ? (
            <button
              type="button"
              onClick={() => g.a.open('palette')}
              aria-label={t('top.searchLabel')}
              aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}
              className={cn(
                iconBtn,
                'pr-1.5 pl-3.5 font-medium text-(--tg-t2)',
                desk && 'mr-1 min-w-[168px] justify-start bg-(--tg-s1) shadow-[inset_0_0_0_1px_var(--tg-border)]',
              )}
            >
              <Search className="size-[18px]" strokeWidth={2} aria-hidden="true" />
              <span>{t('top.search')}</span>
              <Kbd className={cn(desk && 'ml-auto')}>{mac ? '⌘K' : 'Ctrl K'}</Kbd>
            </button>
          ) : null}
          {PLACES.map(([key, label, Icon]) => {
            const on = panel === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => (on ? g.a.close() : g.a.open(key))}
                aria-label={t(label)}
                aria-expanded={on}
                className={cn(
                  iconBtn,
                  desk ? 'px-3.5' : 'px-0',
                  on
                    ? 'bg-(--tg-s3) text-(--tg-text) shadow-[inset_0_0_0_1px_var(--tg-border-hi)]'
                    : 'bg-transparent text-(--tg-icon)',
                )}
              >
                <Icon className="size-[19px]" strokeWidth={1.9} aria-hidden="true" />
                {desk ? <span>{t(label)}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}

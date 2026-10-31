'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Command } from 'cmdk';
import {
  Globe,
  Headphones,
  History,
  LayoutGrid,
  LifeBuoy,
  Maximize,
  MessageCircle,
  Pause,
  PictureInPicture2,
  Play,
  Plus,
  Search,
  Share,
  SlidersVertical,
  Sparkle,
  Wand,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Dialog } from 'radix-ui';
import { PIP_EVENT } from '@/components/pip/pip-launcher';
import { ROUTES } from '@/lib/routes';
import { isLive } from '@/lib/wake';
import { useGlance, type IGlance } from './context';
import { EASE, Kbd } from './kit';

interface ICmd {
  id: string;
  label: string;
  icon: LucideIcon;
  keys?: string;
  words?: string[];
  run: () => void;
}

function commands(g: IGlance): Array<{ h: string; items: ICmd[] }> {
  const { t, a, st } = g;
  const live = isLive(st);
  const session: ICmd[] = [];
  if (live || st === 'ended')
    session.push({ id: 'extend', label: t('pal.extend'), icon: Plus, keys: '+', run: () => a.extend(900) });
  if (st === 'running' || st === 'fallback')
    session.push({ id: 'pause', label: t('dock.pause'), icon: Pause, keys: 'Space', run: a.pause });
  else if (st === 'paused' || st === 'needsyou')
    session.push({ id: 'resume', label: t('dock.resume'), icon: Play, keys: 'Space', run: a.resume });
  else session.push({ id: 'start', label: t('pal.start'), icon: Play, keys: '↵', run: a.start });
  if (live) session.push({ id: 'stop', label: t('dock.stop'), icon: X, keys: 'S', run: a.stop });
  session.push({ id: 'full', label: t('dock.full'), icon: Maximize, keys: '⇧F', run: a.fullscreen });
  const go: ICmd[] = [
    {
      id: 'faces',
      label: t('top.faces'),
      icon: LayoutGrid,
      keys: 'F',
      words: ['face', 'clock', 'gallery'],
      run: () => a.open('faces'),
    },
    {
      id: 'recents',
      label: t('top.recents'),
      icon: History,
      keys: 'R',
      words: ['history', 'presets'],
      run: () => a.open('recents'),
    },
    {
      id: 'settings',
      label: t('top.settings'),
      icon: SlidersVertical,
      keys: ',',
      words: ['theme', 'dark', 'light', 'oled'],
      run: () => a.open('settings'),
    },
    {
      id: 'vibe',
      label: t('top.vibe'),
      icon: Wand,
      keys: 'V',
      words: ['background', 'aurora', 'rain', 'night'],
      run: () => a.open('vibes'),
    },
    {
      id: 'ext',
      label: t('pal.extension'),
      icon: Sparkle,
      words: ['ext', 'extension', 'chrome', 'edge', 'firefox', 'add-on', 'addon', 'browser'],
      run: () => window.location.assign(ROUTES.extension),
    },
    {
      id: 'feedback',
      label: t('settings.feedback'),
      icon: MessageCircle,
      words: ['feedback', 'bug', 'idea', 'help'],
      run: () => a.feedback(),
    },
    {
      id: 'help',
      label: t('panel.help.t'),
      icon: LifeBuoy,
      words: ['help', 'fix', 'battery', 'problem'],
      run: () => a.open('help'),
    },
    {
      id: 'sound',
      label: t('settings.ambient'),
      icon: Headphones,
      words: ['sound', 'rain', 'noise', 'mixer'],
      run: () => a.open('sound'),
    },
    { id: 'share', label: t('settings.share'), icon: Share, words: ['share', 'link'], run: () => a.open('share') },
    {
      id: 'lang',
      label: t('settings.language'),
      icon: Globe,
      words: ['language', 'deutsch', '日本語', '中文', 'हिन्दी'],
      run: () => a.open('language'),
    },
    {
      id: 'pip',
      label: t('pal.pip'),
      icon: PictureInPicture2,
      words: ['mini', 'picture', 'pip', 'float'],
      run: () => window.dispatchEvent(new Event(PIP_EVENT)),
    },
  ];
  return [
    { h: t('pal.session'), items: session },
    { h: t('pal.goto'), items: go },
  ];
}

const ITEM =
  'flex h-12 cursor-pointer items-center gap-3 rounded-[12px] px-3 text-[15px] font-medium text-(--tg-text) outline-none data-[selected=true]:bg-(--tg-s2) data-[selected=true]:shadow-[inset_0_0_0_1px_var(--tg-border)]';

// ⌘K: every action without a mouse, grouped, with its key.
export function Palette() {
  const g = useGlance();
  const { t } = g;
  const open = g.panel === 'palette';
  const [q, setQ] = useState('');
  const groups = commands(g);
  const count = groups.reduce((n, gr) => n + gr.items.length, 0);
  const w = Math.min(g.W - 24, 640);
  const run = (c: ICmd) => {
    g.a.close();
    setQ('');
    c.run();
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setQ('');
          g.a.close();
        }
      }}
    >
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount container={g.root}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="absolute inset-0 z-[7] bg-(--tg-scrim) backdrop-blur-[6px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="tg-glass absolute z-[8] overflow-hidden rounded-[24px] bg-(--tg-panel)! shadow-(--tg-shadow) outline-none"
                style={{ left: Math.round((g.W - w) / 2), top: g.phone ? 72 : 120, width: w }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.42, ease: EASE }}
              >
                <Dialog.Title className="sr-only">{t('top.searchLabel')}</Dialog.Title>
                <Command label={t('top.searchLabel')} loop className="flex flex-col">
                  <div className="flex h-16 items-center gap-3 border-b border-(--tg-border) pr-4 pl-5 text-(--tg-t2)">
                    <Search className="size-5 flex-none" strokeWidth={2} aria-hidden="true" />
                    <Command.Input
                      value={q}
                      onValueChange={setQ}
                      placeholder={t('pal.placeholder')}
                      className="min-w-0 flex-1 bg-transparent text-[18px] text-(--tg-text) caret-(--tg-violet) outline-none placeholder:text-(--tg-t3)"
                    />
                    <Kbd>esc</Kbd>
                  </div>
                  <Command.List className="tg-scroll max-h-[min(60vh,520px)] overflow-y-auto p-2 [&_[cmdk-list-sizer]]:flex [&_[cmdk-list-sizer]]:flex-col [&_[cmdk-list-sizer]]:gap-0.5">
                    <Command.Empty className="px-3 py-6 text-center text-[15px] text-(--tg-t2)">
                      {t('pal.none', { q })}
                    </Command.Empty>
                    {groups.map((gr) => (
                      <Command.Group
                        key={gr.h}
                        heading={gr.h}
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:tracking-[.12em] [&_[cmdk-group-heading]]:text-(--tg-t2) [&_[cmdk-group-heading]]:uppercase"
                      >
                        {gr.items.map((c) => {
                          const Icon = c.icon;
                          return (
                            <Command.Item
                              key={c.id}
                              value={`${c.label} ${c.id}`}
                              keywords={c.words}
                              onSelect={() => run(c)}
                              className={ITEM}
                            >
                              <span className="flex size-[30px] flex-none items-center justify-center rounded-[9px] bg-(--tg-s2) text-(--tg-text)">
                                <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                              </span>
                              <span className="flex-1">{c.label}</span>
                              {c.keys ? <Kbd>{c.keys}</Kbd> : null}
                            </Command.Item>
                          );
                        })}
                      </Command.Group>
                    ))}
                  </Command.List>
                  <div className="flex h-12 items-center gap-4 border-t border-(--tg-border) px-4 text-[13px] text-(--tg-t2)">
                    <span>
                      <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t('pal.move')}
                    </span>
                    <span>
                      <Kbd>↵</Kbd> {t('pal.run')}
                    </span>
                    <span className="ml-auto">{t('pal.count', { n: count })}</span>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

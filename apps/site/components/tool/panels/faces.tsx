'use client';

import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Search } from 'lucide-react';
import { Dialog, RadioGroup, Tabs } from 'radix-ui';
import { Drawer as Vaul } from 'vaul';
import { Face } from '@/components/face';
import { cn } from '@/lib/utils';
import { COLLECTIONS, FILTERS, faceLabel, tagOf, type TFilter, type TGlanceFace } from '@/lib/tool/collections';
import { toolUi } from '@/lib/tool/ui';
import { useGlance } from '../context';
import { EASE, Tag } from '../kit';
import { faceTag, TAG_LABEL_KEY } from '@/lib/tool/face-tags';
import { CloseButton } from './shell';

const SCRIM = 'absolute inset-0 z-[7] bg-(--tg-scrim) backdrop-blur-[6px]';

type TText = ComponentType<{ className?: string; style?: CSSProperties; children?: ReactNode }>;

function Gallery({ title: Title, desc: Desc }: { title: TText; desc: TText }) {
  const g = useGlance();
  const { t, phone, tabP, tabL, W } = g;
  const [q, setQ] = useState('');
  const filter = g.ui.filter;
  const inset = phone ? 0 : 20;
  const padX = phone ? 16 : tabP ? 28 : 36;
  const cols = phone ? 2 : tabP ? 3 : tabL ? 5 : 6;
  const gap = phone ? 12 : 16;
  const colW = Math.floor((W - inset * 2 - padX * 2 - 16 - gap * (cols - 1)) / cols);
  const tilePx = colW - 28;
  const tileH = Math.round(14 + tilePx * 0.875 + 10 + 44);
  const needle = q.trim().toLowerCase();
  let keys: TGlanceFace[] = [...COLLECTIONS[filter]];
  if (needle) keys = COLLECTIONS.all.filter((k) => faceLabel(k).toLowerCase().includes(needle) || k.includes(needle));
  else if (filter === 'featured') keys = [g.face, ...keys.filter((k) => k !== g.face)];
  return (
    <>
      <div
        className="flex flex-none items-center gap-4"
        style={{ padding: phone ? '20px 16px 12px' : `28px ${padX}px 16px` }}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <Title
            className="m-0 font-display leading-none font-bold tracking-[-0.035em]"
            style={{ fontSize: phone ? 30 : 40 }}
          >
            {t('faces.title')}
          </Title>
          <Desc className="text-[14px] text-(--tg-t2)">{t('faces.sub', { n: COLLECTIONS.all.length })}</Desc>
        </div>
        {!phone ? (
          <label
            className="ml-auto flex h-12 items-center gap-2.5 rounded-[16px] border border-(--tg-border) bg-(--tg-s1) px-4 text-[15px] text-(--tg-t2)"
            style={{ width: tabP ? 220 : 320 }}
          >
            <Search className="size-[18px] flex-none" strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('faces.search', { n: COLLECTIONS.all.length })}
              aria-label={t('faces.search', { n: COLLECTIONS.all.length })}
              className="min-w-0 flex-1 bg-transparent text-(--tg-text) outline-none placeholder:text-(--tg-t2)"
            />
          </label>
        ) : null}
        <CloseButton label={t('faces.close')} className={phone ? 'ml-auto' : undefined} />
      </div>
      <Tabs.Root
        value={filter}
        onValueChange={(v) => {
          setQ('');
          toolUi.set({ filter: v as TFilter });
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List
          aria-label={t('faces.collections')}
          className="tg-noscroll flex flex-none gap-2 overflow-x-auto pt-1 pb-4"
          style={{
            paddingInline: padX,
            maskImage: phone ? 'linear-gradient(90deg, #000 82%, transparent)' : undefined,
          }}
        >
          {FILTERS.map((f) => {
            const on = filter === f && !needle;
            return (
              <Tabs.Trigger
                key={f}
                value={f}
                className={cn(
                  'tg-btn inline-flex h-11 flex-none items-center gap-2 rounded-full px-4 text-[15px] whitespace-nowrap',
                  on
                    ? 'border border-transparent bg-(--tg-text) font-bold text-(--tg-bg)'
                    : 'border border-(--tg-border) bg-(--tg-s1) font-semibold text-(--tg-text)',
                )}
              >
                {t(`faces.filter.${f}`)}
                <span
                  className={cn(
                    'rounded-full px-[7px] py-0.5 font-mono text-[12px]',
                    on ? 'bg-(--tg-cnt-on) text-(--tg-bg)' : 'bg-(--tg-s2) text-(--tg-t2)',
                  )}
                >
                  {COLLECTIONS[f].length}
                </span>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
        <Tabs.Content
          value={filter}
          className="tg-scroll min-h-0 flex-1 overflow-y-auto outline-none"
          style={{ padding: `8px ${padX - 8}px ${phone ? 40 : 32}px` }}
        >
          <RadioGroup.Root
            value={g.face}
            onValueChange={(v) => g.a.setFace(v as TGlanceFace)}
            aria-label={t('faces.label')}
            className="grid justify-center p-2"
            style={{ gridTemplateColumns: `repeat(${cols}, ${colW}px)`, gridAutoRows: tileH, gap }}
          >
            {keys.map((k, i) => {
              const on = k === g.face;
              const big = i === 0 && cols >= 3 && !needle;
              const w = big ? colW * 2 + gap : colW;
              const hgt = big ? tileH * 2 + gap : tileH;
              const px = big ? Math.min(w - 40, Math.round((hgt - 80) / 0.875)) : tilePx;
              return (
                <RadioGroup.Item
                  key={k}
                  value={k}
                  aria-label={faceLabel(k)}
                  className={cn(
                    'tg-btn tg-tile relative flex flex-col items-stretch gap-2.5 overflow-hidden px-3.5 pt-3.5 pb-3 text-left text-(--tg-text)',
                    big ? 'col-span-2 row-span-2 rounded-[32px]' : 'rounded-[24px]',
                    on ? 'border-2 border-(--tg-volt)' : 'border border-(--tg-border)',
                  )}
                  style={{
                    background: 'var(--tg-tile)',
                    boxShadow: `${on ? '0 0 0 4px var(--tg-volt-soft), ' : ''}var(--tg-tile-shadow)`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[38%] left-1/2 -translate-1/2 rounded-full"
                    style={{
                      width: Math.round(w * 0.9),
                      height: Math.round(w * 0.9),
                      background: `radial-gradient(closest-side, ${on ? 'var(--tg-volt-soft)' : 'var(--tg-tile-glow)'}, transparent)`,
                    }}
                  />
                  <span className="relative flex min-h-0 flex-1 items-center justify-center">
                    <Face
                      face={k}
                      theme={g.faceTheme}
                      state="running"
                      remain={2292}
                      total={3600}
                      nowSec={39828}
                      size={px}
                      bare
                      motion={big ? 'auto' : 'off'}
                    />
                  </span>
                  <span className="relative flex min-w-0 items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        'overflow-hidden text-ellipsis whitespace-nowrap',
                        big ? 'font-display text-[22px] font-bold tracking-[-0.02em]' : 'text-[15px] font-bold',
                      )}
                    >
                      {faceLabel(k)}
                    </span>
                    <span className="font-mono text-[12px] whitespace-nowrap text-(--tg-t2)">
                      {big
                        ? t('faces.featuredTag', { tag: t(`faces.filter.${tagOf(k)}`) })
                        : t(`faces.filter.${tagOf(k)}`)}
                    </span>
                  </span>
                  {faceTag(k) ? (
                    <span className="absolute top-3 left-3">
                      <Tag kind={faceTag(k) ?? 'new'}>{t(TAG_LABEL_KEY[faceTag(k) ?? 'new'])}</Tag>
                    </span>
                  ) : null}
                  {on ? (
                    <span className="absolute top-3 right-3 flex size-[26px] items-center justify-center rounded-full bg-(--tg-volt) text-(--tg-on-volt)">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : null}
                </RadioGroup.Item>
              );
            })}
          </RadioGroup.Root>
          {keys.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-(--tg-t2)">{t('faces.none', { q })}</p>
          ) : null}
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

const SURFACE =
  'tg-glass absolute z-[8] flex flex-col overflow-hidden bg-(--tg-panel)! shadow-(--tg-shadow) outline-none';

// The faces store fills the screen: a dialog inset 20 px on desktop and tablets, a sheet from 40 px on phone.
// Tapping a tile applies it live behind the panel.
export function FacesStore({ open }: { open: boolean }) {
  const g = useGlance();
  const close = () => g.a.close();
  if (g.phone) {
    return (
      <Vaul.Root open={open} onOpenChange={(o) => !o && close()}>
        <Vaul.Portal container={g.root}>
          <Vaul.Overlay className={SCRIM} />
          <Vaul.Content className={cn(SURFACE, 'inset-x-0 top-10 bottom-0 rounded-t-[28px]')}>
            <Gallery title={Vaul.Title} desc={Vaul.Description} />
          </Vaul.Content>
        </Vaul.Portal>
      </Vaul.Root>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount container={g.root}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={SCRIM}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.36 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.section
                className={cn(SURFACE, 'inset-5 rounded-[32px]')}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.42, ease: EASE }}
              >
                <Gallery title={Dialog.Title} desc={Dialog.Description} />
              </motion.section>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

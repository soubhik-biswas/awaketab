'use client';

import { AnimatePresence, motion } from 'motion/react';
import { PictureInPicture2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGlance } from '@/components/tool/context';
import { EASE } from '@/components/tool/kit';

// offer: a session just started where the mini clock opens only with a tap. missed: the browser was asked to open
// it when the tab was left and did not. open: the mini clock is showing, so this tab says so.
export type TMiniChip = 'offer' | 'missed' | 'open';

const RISE = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.42, ease: EASE },
} as const;

// The tool's side of the mini clock, top right under the top bar where the nudge sits. It rests with the controls.
export function MiniChip({
  kind,
  onOpen,
  onDismiss,
  onClose,
}: {
  kind: TMiniChip | null;
  onOpen: () => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const g = useGlance();
  const t = useTranslations('surfaces.pip');
  const quiet = !g.hidden && g.panel === 'none';
  const shown = kind === 'open' ? quiet : kind !== null && quiet && !g.isSet;
  const right = g.phone ? 16 : 28;
  return (
    <AnimatePresence>
      {shown && kind === 'open' ? (
        <motion.div
          key="open"
          role="status"
          {...RISE}
          className="tg-glass absolute z-[6] flex min-h-12 max-w-[calc(100%-32px)] items-center gap-2.5 rounded-full bg-(--tg-toast)! py-1 pr-1 pl-4 text-[14px] font-semibold text-(--tg-text) shadow-(--tg-shadow)"
          style={{ right, top: g.topH + 8 }}
        >
          <PictureInPicture2 className="size-[18px] flex-none text-(--tg-volt)" strokeWidth={2} aria-hidden="true" />
          <span className="min-w-0">{t('isOpen')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="tg-btn h-11 flex-none rounded-full border-0 bg-(--tg-s2) px-4 text-[14px] font-bold whitespace-nowrap text-(--tg-text)"
          >
            {t('closeShort')}
          </button>
        </motion.div>
      ) : shown ? (
        <motion.div
          key="offer"
          role="status"
          {...RISE}
          className="tg-glass absolute z-[6] flex gap-3.5 rounded-[22px] bg-(--tg-toast)! p-4 shadow-(--tg-shadow)"
          style={{ right, top: g.topH + 8, width: 'min(360px, calc(100% - 32px))' }}
        >
          <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-(--tg-violet-soft2) text-(--tg-violet)">
            <PictureInPicture2 className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <strong className="text-[15px] font-semibold text-(--tg-text)">{t('offer')}</strong>
            <span className="text-[13px] leading-[1.45] text-(--tg-t2)">
              {kind === 'missed' ? t('missedD') : t('offerD')}
            </span>
            <span className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpen}
                className="tg-btn h-11 rounded-[12px] border-0 bg-(--tg-violet) px-3.5 text-[14px] font-bold text-(--tg-on-violet)"
              >
                {t('open')}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="tg-btn h-11 rounded-[12px] border border-(--tg-border) bg-transparent px-3.5 text-[14px] font-semibold text-(--tg-text)"
              >
                {t('notNow')}
              </button>
            </span>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

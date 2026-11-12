'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MousePointer2, Sparkle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useGlance } from './context';
import { EASE } from './kit';

const TOASTER = 'tool';

// While the controls rest, a small pill says how to bring them back; a full-size catcher takes the tap.
export const ControlsHint = memo(function ControlsHint() {
  const g = useGlance();
  return (
    <AnimatePresence>
      {g.hidden ? (
        <>
          <motion.span
            key="hint"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="tg-glass absolute inset-x-0 bottom-6 z-[4] mx-auto flex h-[34px] w-max items-center gap-2 rounded-full px-3.5 text-[13px] whitespace-nowrap text-(--tg-t2)"
          >
            <MousePointer2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
            {g.touch ? g.t('hint.tap') : g.t('hint.move')}
          </motion.span>
          <button
            key="catcher"
            type="button"
            onClick={() => g.a.showControls()}
            aria-label={g.t('hint.show')}
            className="absolute inset-0 z-[3] cursor-default border-0 bg-transparent"
          />
        </>
      ) : null}
    </AnimatePresence>
  );
});

// One gentle nudge after real use: top right under the top bar on wide screens, above the dock on phone.
export function Nudge({ sessions, presets }: { sessions: number; presets: number }) {
  const g = useGlance();
  const { t, phone } = g;
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className="tg-glass absolute z-[6] flex gap-3.5 rounded-[22px] bg-(--tg-toast)! p-4 shadow-(--tg-shadow)"
      style={phone ? { left: 16, right: 16, bottom: g.dockH + 28 } : { right: 28, top: g.topH + 8, width: 380 }}
    >
      <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-(--tg-violet-soft2) text-(--tg-violet)">
        <Sparkle className="size-[18px]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <strong className="text-[15px] font-semibold text-(--tg-text)">{t('nudge.h')}</strong>
        <span className="text-[13px] leading-[1.45] text-(--tg-t2)">{t('nudge.d', { sessions, presets })}</span>
        <span className="mt-1.5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              g.a.quietNudge();
              g.a.open('pro');
            }}
            className="tg-btn h-11 rounded-[12px] border-0 bg-(--tg-violet) px-3.5 text-[14px] font-bold text-(--tg-on-violet)"
          >
            {t('nudge.try')}
          </button>
          <button
            type="button"
            onClick={() => g.a.quietNudge()}
            className="tg-btn h-11 rounded-[12px] border border-(--tg-border) bg-transparent px-3.5 text-[14px] font-semibold text-(--tg-text)"
          >
            {t('nudge.later')}
          </button>
        </span>
      </span>
    </motion.div>
  );
}

function ToastBody({
  id,
  text,
  undo,
  undoLabel,
}: {
  id: string | number;
  text: string;
  undo: () => void;
  undoLabel: string;
}) {
  return (
    <div className="tg-glass mx-auto flex min-h-12 w-max max-w-[calc(100vw-24px)] items-center gap-3 rounded-full bg-(--tg-toast)! py-0.5 pr-2 pl-4 text-[15px] font-semibold text-(--tg-text) shadow-(--tg-shadow)">
      <span aria-hidden="true" className="size-2 flex-none rounded-full bg-(--tg-volt)" />
      <span className="min-w-0">{text}</span>
      <button
        type="button"
        onClick={() => {
          undo();
          toast.dismiss(id);
        }}
        className="tg-btn h-11 flex-none rounded-full border-0 bg-(--tg-s2) px-3.5 text-[14px] font-bold whitespace-nowrap text-(--tg-text)"
      >
        {undoLabel}
      </button>
    </div>
  );
}

export function showExtended(text: string, undoLabel: string, undo: () => void) {
  toast.custom((id) => <ToastBody id={id} text={text} undo={undo} undoLabel={undoLabel} />, {
    id: 'extended',
    duration: 6000,
    unstyled: true,
    toasterId: TOASTER,
  });
}

export function showNote(text: string) {
  toast.custom(
    () => (
      <div className="tg-glass mx-auto flex h-12 w-max max-w-[calc(100vw-24px)] items-center gap-3 rounded-full bg-(--tg-toast)! px-4 text-[15px] font-semibold text-(--tg-text) shadow-(--tg-shadow)">
        <span aria-hidden="true" className="size-2 flex-none rounded-full bg-(--tg-volt)" />
        {text}
      </div>
    ),
    { id: 'note', duration: 4000, unstyled: true, toasterId: TOASTER },
  );
}

// Toasts sit centred just above the dock on every device.
export const ToolToaster = memo(function ToolToaster({ bottom }: { bottom: number }) {
  return (
    <Toaster
      id={TOASTER}
      position="bottom-center"
      offset={{ bottom: `${bottom}px` }}
      mobileOffset={{ bottom: `${bottom}px` }}
      toastOptions={{ unstyled: true, className: 'w-full flex justify-center' }}
      style={{ '--width': 'min(640px, calc(100vw - 24px))' } as React.CSSProperties}
    />
  );
});

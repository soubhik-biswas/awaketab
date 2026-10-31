'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Drawer as Vaul } from 'vaul';
import { cn } from '@/lib/utils';
import { useGlance } from '../context';
import { EASE } from '../kit';

const SCRIM = 'absolute inset-0 z-[7] bg-(--tg-scrim) backdrop-blur-[6px]';
const SURFACE = 'tg-glass z-[8] flex flex-col overflow-hidden bg-(--tg-panel)! shadow-(--tg-shadow) outline-none';

export function CloseButton({ label, className }: { label: string; className?: string }) {
  const g = useGlance();
  return (
    <button
      type="button"
      onClick={() => g.a.close()}
      aria-label={label}
      className={cn(
        'tg-btn inline-flex size-11 flex-none items-center justify-center rounded-[14px] border border-(--tg-border) bg-(--tg-s1) text-(--tg-text)',
        className,
      )}
    >
      <X className="size-5" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

function Head({ title, sub, sheet }: { title: string; sub: string; sheet: boolean }) {
  const g = useGlance();
  const Title = sheet ? Vaul.Title : Dialog.Title;
  const Desc = sheet ? Vaul.Description : Dialog.Description;
  return (
    <div
      className={cn('flex flex-none items-start justify-between gap-3', sheet ? 'px-5 pt-3.5 pb-3' : 'px-6 pt-6 pb-3')}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Title
          className="m-0 font-display leading-[1.05] font-bold tracking-[-0.03em]"
          style={{ fontSize: g.phone ? 26 : 30 }}
        >
          {title}
        </Title>
        <Desc className="text-[14px] text-(--tg-t2)">{sub}</Desc>
      </div>
      <CloseButton label={g.t('panel.close')} />
    </div>
  );
}

export function PanelBody({ children, className }: { children: ReactNode; className?: string }) {
  const g = useGlance();
  return (
    <div
      className={cn(
        'tg-scroll flex min-h-0 flex-col gap-3 overflow-y-auto pt-1 pb-6',
        g.narrow ? 'flex-initial px-5' : 'flex-1 px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface IFootAction {
  label: string;
  go: () => void;
  disabled?: boolean;
  danger?: boolean;
}

// The main action is pinned under the scrolling body, so it is never below the fold.
export function PanelFoot({ primary, secondary }: { primary: IFootAction; secondary?: IFootAction }) {
  const g = useGlance();
  return (
    <div
      className={cn(
        'flex flex-none flex-col gap-2 border-t border-(--tg-border) bg-(--tg-foot) pt-3.5',
        g.narrow ? 'px-5' : 'px-6',
      )}
      style={{ paddingBottom: g.phone ? 28 : 20 }}
    >
      <button
        type="button"
        onClick={primary.go}
        disabled={primary.disabled}
        aria-disabled={primary.disabled || undefined}
        className={cn(
          'tg-btn h-[52px] rounded-[16px] border-0 text-[16px] font-bold shadow-[0_10px_28px_color-mix(in_srgb,var(--tg-violet)_27%,transparent)] disabled:cursor-not-allowed disabled:opacity-45',
          primary.danger ? 'bg-(--tg-red) text-(--tg-on-red)' : 'bg-(--tg-violet) text-(--tg-on-violet)',
        )}
      >
        {primary.label}
      </button>
      {secondary ? (
        <button
          type="button"
          onClick={secondary.go}
          className="tg-btn h-12 rounded-[16px] border border-(--tg-border) bg-transparent text-[15px] font-semibold text-(--tg-text)"
        >
          {secondary.label}
        </button>
      ) : null}
    </div>
  );
}

// Every panel opens the same way: a right drawer (460 / 440 px, inset 16, radius 28) on desktop and tablet
// landscape, a Vaul bottom sheet on phone and tablet portrait (inset 24 there) that fits its content and swipes down.
export function PanelShell({
  open,
  title,
  sub,
  children,
}: {
  open: boolean;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  const g = useGlance();
  const close = () => g.a.close();
  if (g.narrow) {
    const inset = g.tabP ? 24 : 0;
    return (
      <Vaul.Root open={open} onOpenChange={(o) => !o && close()}>
        <Vaul.Portal container={g.root}>
          <Vaul.Overlay className={SCRIM} />
          <Vaul.Content
            className={cn(SURFACE, 'absolute')}
            style={{
              left: inset,
              right: inset,
              bottom: inset,
              maxHeight: Math.round(g.H * (g.phone ? 0.86 : 0.7)),
              borderRadius: g.tabP ? 32 : '28px 28px 0 0',
            }}
          >
            <span
              aria-hidden="true"
              className="mt-2.5 h-[5px] w-11 flex-none self-center rounded-full bg-(--tg-border-hi)"
            />
            <Head title={title} sub={sub} sheet />
            {children}
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
                transition={{ duration: 0.36, ease: EASE }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.aside
                className={cn(SURFACE, 'absolute top-4 right-4 bottom-4 rounded-[28px]')}
                style={{ width: g.desk ? 460 : 440 }}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.36, ease: EASE }}
              >
                <Head title={title} sub={sub} sheet={false} />
                {children}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

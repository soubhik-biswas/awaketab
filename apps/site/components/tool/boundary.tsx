'use client';

import { Component, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { wake } from '@/lib/wake';

// What the frame shows when the tool itself fails: what happened, what it means for the screen, and one way on.
function Crash() {
  const t = useTranslations('tool.glance');
  return (
    <div
      role="alert"
      className="absolute inset-0 z-[9] flex flex-col items-center [justify-content:safe_center] gap-3 overflow-y-auto bg-(--tg-bg) px-6 py-8 text-center text-(--tg-text)"
    >
      <h2 className="m-0 max-w-[560px] font-display text-[30px] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
        {t('crash.h')}
      </h2>
      <p className="m-0 max-w-[460px] text-[16px] leading-[1.5] text-(--tg-t2)">{t('crash.d')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="tg-btn mt-3 inline-flex h-14 items-center justify-center gap-2.5 rounded-full border-0 bg-(--tg-violet) px-7 text-[17px] font-bold text-(--tg-on-violet)"
      >
        <RotateCw className="size-5" strokeWidth={2} aria-hidden="true" />
        {t('crash.btn')}
      </button>
    </div>
  );
}

// A failure while drawing the tool must not leave the lock held with nothing on screen to show or stop it: the
// session is stopped, the screen may sleep again, and the frame says so.
export class ToolBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    wake.stop();
  }

  override render(): ReactNode {
    return this.state.failed ? <Crash /> : this.props.children;
  }
}

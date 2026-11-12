'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIsClient } from 'usehooks-ts';
import { consentChanged } from '@/lib/telemetry/client';

const SETTINGS = 'at.v1.settings';
const ONBOARDING = 'at.v1.onboarding';
const TIP = 'analytics';

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// The answer is the telemetry switch (docs/08 §2.1) plus one dismissed tip (§2.6); private mode keeps it per page.
function answer(allow: boolean): void {
  try {
    const settings = readJson(SETTINGS) ?? { v: 1 };
    settings.telemetry = allow;
    localStorage.setItem(SETTINGS, JSON.stringify(settings));
    const onboarding = readJson(ONBOARDING) ?? { v: 1, dismissedTips: [] };
    const tips = Array.isArray(onboarding.dismissedTips) ? (onboarding.dismissedTips as unknown[]) : [];
    if (!tips.includes(TIP)) tips.push(TIP);
    localStorage.setItem(ONBOARDING, JSON.stringify({ ...onboarding, v: 1, dismissedTips: tips }));
  } catch {
    return;
  } finally {
    document.documentElement.dataset.consent = '';
    consentChanged();
  }
}

function answered(): boolean {
  const onboarding = readJson(ONBOARDING);
  const tips = onboarding && Array.isArray(onboarding.dismissedTips) ? (onboarding.dismissedTips as unknown[]) : [];
  return tips.includes(TIP) || readJson(SETTINGS)?.telemetry === false;
}

// Both answers look the same and neither is focused or preselected (brief: "No thanks" is equal in weight).
const choice =
  'inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] border border-border bg-transparent px-3.5 text-[14px] font-semibold text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring';

const GAP = 12;
// The timer's dock and buttons: the card never sits on top of one of them.
const CONTROLS = '[data-slot="tool"] [role="toolbar"], [data-slot="tool"] button';

// How far above the bottom edge the card rests so it clears every timer control under it. When nothing is in the
// way that is the plain gap; when no clear spot fits on screen it stays at the bottom rather than leave the screen.
function restingBottom(card: HTMLElement): number {
  const box = card.getBoundingClientRect();
  const view = window.innerHeight;
  const controls = [...document.querySelectorAll<HTMLElement>(CONTROLS)]
    .filter((el) => !el.closest('[inert]'))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0 && r.left < box.right && r.right > box.left);
  let bottom = GAP;
  for (let pass = 0; pass < 6; pass += 1) {
    const top = view - bottom - box.height;
    const under = controls.filter((r) => r.top < view - bottom && r.bottom > top);
    if (under.length === 0) break;
    bottom = view - Math.min(...under.map((r) => r.top)) + GAP;
  }
  return bottom + box.height + GAP > view ? GAP : bottom;
}

// The analytics question as a small floating card at the bottom left, never in the page flow (home board). It is
// drawn straight into the body, so no page container can clip it or move it off screen, and it rises above the
// timer's dock when the two would overlap.
export function Consent({
  title,
  body,
  short,
  decline,
  allow,
}: {
  title: string;
  body: string;
  short: string;
  decline: string;
  allow: string;
}) {
  const [done, setDone] = useState(false);
  const [bottom, setBottom] = useState(GAP);
  const card = useRef<HTMLDivElement>(null);
  const mounted = useIsClient();
  const reduced = useReducedMotion();
  // A page React renders on the client (the 404) loses the boot script's mark on <html>, so the card checks too.
  useEffect(() => {
    if (answered()) setDone(true);
  }, []);
  useEffect(() => {
    const el = card.current;
    if (!mounted || done || !el) return;
    let frame = 0;
    let settle = 0;
    const measure = () => {
      frame = 0;
      setBottom(restingBottom(el));
    };
    // Once now, and once after the dock has finished sliding in or out.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      window.clearTimeout(settle);
      settle = window.setTimeout(measure, 500);
    };
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    const tool = document.querySelector('[data-slot="tool"]');
    const watch = tool ? new MutationObserver(schedule) : null;
    if (tool) watch?.observe(tool, { subtree: true, childList: true, attributeFilter: ['data-state', 'inert'] });
    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      watch?.disconnect();
      resize.disconnect();
    };
  }, [mounted, done]);
  const pick = (yes: boolean) => () => {
    answer(yes);
    setDone(true);
    document.getElementById('content')?.focus({ preventScroll: true });
  };
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {!done && (
        <motion.div
          ref={card}
          role="dialog"
          aria-modal="false"
          aria-labelledby="site-consent-h"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={reduced ? { duration: 0 } : { duration: 0.42, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom, 0px))` }}
          className="site-consent site-consent-card fixed right-3 left-3 z-[2147483000] box-border flex max-h-[calc(100dvh-24px)] flex-wrap items-center gap-3.5 overflow-y-auto rounded-[20px] p-4 font-sans text-foreground min-[700px]:right-auto min-[700px]:left-6 min-[700px]:w-[440px] min-[700px]:max-w-[calc(100vw-48px)]"
        >
          <span className="flex min-w-0 flex-1 basis-[160px] flex-col gap-1">
            <strong id="site-consent-h" className="text-[15px]">
              {title}
            </strong>
            <span className="hidden text-[16px] leading-[1.55] text-muted-foreground-strong min-[700px]:inline">
              {body}
            </span>
            <span className="text-[13px] text-muted-foreground-strong min-[700px]:hidden">{short}</span>
          </span>
          <span className="flex flex-none gap-2">
            <button type="button" className={choice} onClick={pick(false)}>
              {decline}
            </button>
            <button type="button" className={choice} onClick={pick(true)}>
              {allow}
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

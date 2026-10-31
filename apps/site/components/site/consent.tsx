'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

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

// The analytics question as a small floating card at the bottom left, never in the page flow (home board).
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
  const reduced = useReducedMotion();
  // A page React renders on the client (the 404) loses the boot script's mark on <html>, so the card checks too.
  useEffect(() => {
    if (answered()) setDone(true);
  }, []);
  const pick = (yes: boolean) => () => {
    answer(yes);
    setDone(true);
    document.getElementById('content')?.focus({ preventScroll: true });
  };
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="site-consent-h"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={reduced ? { duration: 0 } : { duration: 0.42, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="site-consent site-consent-card fixed right-3 bottom-3 left-3 z-50 box-border flex items-center gap-3.5 rounded-[20px] p-4 min-[700px]:right-auto min-[700px]:left-6 min-[700px]:w-[440px]"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
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
    </AnimatePresence>
  );
}

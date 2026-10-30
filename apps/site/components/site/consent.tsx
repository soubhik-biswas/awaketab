'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { btn } from './styles';

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

const choice = cn(btn, 'min-w-[110px] flex-1 border-input min-[700px]:flex-none');

export function Consent({
  title,
  body,
  decline,
  allow,
}: {
  title: string;
  body: string;
  decline: string;
  allow: string;
}) {
  const [done, setDone] = useState(false);
  // A page React renders on the client (the 404) loses the boot script's mark on <html>, so the box checks too.
  useEffect(() => {
    if (answered()) setDone(true);
  }, []);
  if (done) return null;
  const pick = (yes: boolean) => () => {
    answer(yes);
    setDone(true);
    document.getElementById('content')?.focus({ preventScroll: true });
  };
  return (
    <section
      aria-labelledby="site-consent-h"
      className="site-consent relative z-[5] mx-3 mt-3 box-border flex flex-col items-stretch gap-4 rounded-[20px] border border-border bg-card px-5 py-[18px] shadow-[0_24px_60px_var(--site-consent-shadow)] min-[700px]:mx-10 min-[700px]:mt-4 min-[700px]:flex-row min-[700px]:items-center min-[1100px]:mx-16 min-[1300px]:mx-24"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <strong id="site-consent-h" className="text-[16px]">
          {title}
        </strong>
        <span className="text-[14px] leading-normal text-muted-foreground-strong">{body}</span>
      </span>
      <span className="flex flex-wrap gap-2">
        <Button variant="secondary" className={choice} onClick={pick(false)}>
          {decline}
        </Button>
        <Button variant="secondary" className={choice} onClick={pick(true)}>
          {allow}
        </Button>
      </span>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { formatUntil } from '@/lib/format';

// The wall-clock end of a session started now ("11:32 AM", or "11:32 AM tomorrow"), in the visitor's own clock.
export function EndsAt({
  minutes,
  locale,
  tomorrow,
  fallback,
}: {
  minutes: number;
  locale: string;
  tomorrow: string;
  fallback: string;
}) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const word = tomorrow.replace('{time}', '').trim();
    const tick = (): void => {
      const now = Date.now();
      setText(formatUntil(now + minutes * 60_000, now, { locale, tomorrow: word }));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [minutes, locale, tomorrow]);
  return <span suppressHydrationWarning>{text ?? fallback}</span>;
}

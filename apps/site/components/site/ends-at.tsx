'use client';

import { useEffect, useState } from 'react';

const sameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

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
    const tick = (): void => {
      const now = new Date();
      const end = new Date(now.getTime() + minutes * 60_000);
      const time = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: locale.startsWith('en') ? true : undefined,
        numberingSystem: 'latn',
      })
        .format(end)
        .replace(/ /gu, ' ');
      setText(sameDay(now, end) ? time : tomorrow.replace('{time}', time));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [minutes, locale, tomorrow]);
  return <span suppressHydrationWarning>{text ?? fallback}</span>;
}

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { CRASH_COPY, crashLocale } from '@/components/tool/crash-copy';
import { LOCALE_META, type TLocale } from '@/i18n/locales';
import { wake } from '@/lib/wake';

const never = () => () => undefined;

const STYLES = `
html{color-scheme:light dark}
body{margin:0;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#f4f4f9;color:#0b1020;font-family:ui-sans-serif,system-ui,sans-serif}
main{display:flex;flex-direction:column;align-items:center;gap:12px;max-width:520px;text-align:center}
h1{margin:0;font-size:30px;line-height:1.1;letter-spacing:-0.02em}
p{margin:0;font-size:16px;line-height:1.5;color:#4b5165}
button{margin-top:12px;height:56px;padding:0 28px;border:0;border-radius:999px;background:#6633f5;color:#fff;font:inherit;font-size:17px;font-weight:700;cursor:pointer}
button:focus-visible{outline:2px solid #1c64b8;outline-offset:3px}
@media (prefers-color-scheme:dark){body{background:#05060a;color:#f2f4fa}p{color:#a6afc2}button{background:#9f7bff;color:#0b0718}button:focus-visible{outline-color:#7cbbff}}
`;

// The last screen, for a failure in the page's own layout. Nothing above it is left, so it brings its own words and
// styles; the session is stopped because nothing on screen could show or stop it any more.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const locale: TLocale = useSyncExternalStore(
    never,
    () => crashLocale(window.location.pathname),
    () => 'en',
  );
  const copy = CRASH_COPY[locale];
  useEffect(() => {
    wake.stop();
  }, [error]);
  return (
    <html lang={LOCALE_META[locale].htmlLang}>
      <head>
        <title>AwakeTab</title>
        <style>{STYLES}</style>
      </head>
      <body>
        <main role="alert">
          <h1>{copy.h}</h1>
          <p>{copy.d}</p>
          <button type="button" onClick={() => window.location.reload()}>
            {copy.btn}
          </button>
        </main>
      </body>
    </html>
  );
}

'use client';

import { SerwistProvider } from '@serwist/turbopack/react';

// The offline fallback and the widgets' worker; development builds skip it so a cached page never hides a change.
// Crawlers and audit tools refuse workers, and the refusal would be logged as a page error.
const AUTOMATED = /bot|crawl|spider|lighthouse|inspection|headless/iu;

export function ServiceWorker() {
  const automated = typeof navigator !== 'undefined' && AUTOMATED.test(navigator.userAgent);
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== 'production' || automated}
      reloadOnOnline={false}
      options={{ scope: '/', type: 'classic' }}
    />
  );
}

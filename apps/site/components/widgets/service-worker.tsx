'use client';

import { SerwistProvider } from '@serwist/turbopack/react';

// The offline fallback and the widgets' worker; development builds skip it so a cached page never hides a change.
export function ServiceWorker() {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== 'production'}
      reloadOnOnline={false}
      options={{ scope: '/', type: 'classic' }}
    />
  );
}

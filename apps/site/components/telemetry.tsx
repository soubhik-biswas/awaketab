'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { mountTelemetry, routeChanged } from '@/lib/telemetry/boot';

function Watch() {
  const pathname = usePathname();
  useEffect(() => mountTelemetry(), []);
  useEffect(() => {
    routeChanged();
  }, [pathname]);
  return null;
}

// Anonymous counts for people who pressed Allow on "Count this visit?"; it draws nothing.
export function Telemetry() {
  return (
    <Suspense fallback={null}>
      <Watch />
    </Suspense>
  );
}

'use client';

import { useIsClient } from 'usehooks-ts';

// Says what this browser can really do, so it is worked out after mount. Until then both lines hold the pill's
// space unseen and neither is claimed.
export function FooterStatus({
  href,
  hrefLang,
  native,
  fallback,
}: {
  href: string;
  hrefLang?: string | undefined;
  native: string;
  fallback: string;
}) {
  const mounted = useIsClient();
  if (!mounted)
    return (
      <span className="site-foot-pill" data-state="pending" aria-hidden="true">
        <span className="site-foot-pill-dot" />
        <span className="site-foot-pill-hold">
          <span>{native}</span>
          <span>{fallback}</span>
        </span>
      </span>
    );
  const held = 'wakeLock' in navigator;
  return (
    <a className="site-foot-pill" data-state={held ? 'native' : 'fallback'} href={href} hrefLang={hrefLang}>
      <span className="site-foot-pill-dot" aria-hidden="true" />
      <span>{held ? native : fallback}</span>
    </a>
  );
}

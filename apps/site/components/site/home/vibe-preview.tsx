'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { VibeScene } from '@/components/tool/vibe-scene';
import type { TVibe } from '@/lib/tool/settings';

// The tool's own scene, drawn in the browser once the card is near the screen so the page's HTML stays light; the
// card's gradient shows until then and without script.
export function VibePreview({ vibe }: { vibe: TVibe }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0">
      {near && resolvedTheme ? <VibeScene vibe={vibe} night={resolvedTheme !== 'light'} motion="calm" still /> : null}
    </div>
  );
}

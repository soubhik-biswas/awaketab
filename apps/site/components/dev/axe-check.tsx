'use client';

import { useEffect } from 'react';

const EVERY_MS = 4000;

// A development check behind NEXT_PUBLIC_AXE=1: logs WCAG 2.2 AA violations from axe-core as the page changes.
export function AxeCheck() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AXE !== '1') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let busy = false;
    let alive = true;
    const seen = new Set<string>();
    const run = async () => {
      if (busy || !alive) return;
      busy = true;
      try {
        const { default: axe } = await import('axe-core');
        const result = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        });
        for (const v of result.violations) {
          for (const node of v.nodes) {
            const key = `${v.id}|${node.target.join(' ')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            console.warn(`[axe] ${v.impact ?? 'minor'} · ${v.id}: ${v.help}`, node.target.join(' '), v.helpUrl);
          }
        }
      } finally {
        busy = false;
      }
    };
    // At most one run every few seconds: the countdown changes the page every second.
    const schedule = () => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        void run();
      }, EVERY_MS);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
      mo.disconnect();
    };
  }, []);
  return null;
}

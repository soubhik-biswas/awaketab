'use client';

import { useEffect, useRef } from 'react';
import { LENGTHS } from './set-controls';
import type { IGlance } from './context';

// Space and Enter belong to a focused control; on the stage they drive the session.
const CONTROLS = 'button, a[href], [role="radio"], [role="tab"], [role="switch"], [role="slider"], [role="checkbox"]';

function typing(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

// The keyboard map from the accessibility board. ⌘K / Ctrl K works anywhere; single keys only while the stage (or a
// control in the tool) has focus, no panel is open and nothing is being typed (WCAG 2.1.4). The skip link focuses the
// stage; with focus on the page itself, Space scrolls the story as usual.
export function useKeys(g: IGlance) {
  const ref = useRef(g);
  useEffect(() => {
    ref.current = g;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cur = ref.current;
      const { a } = cur;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cur.panel === 'palette') a.close();
        else a.open('palette');
        return;
      }
      if (cur.panel !== 'none' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const active = document.activeElement;
      if (typing(active)) return;
      if (!(active instanceof HTMLElement) || active === document.body || !cur.root?.contains(active)) return;
      const onControl = active.closest(CONTROLS) !== null;
      const inGroup = active.closest('[role="radiogroup"]') !== null;
      const key = e.key;
      let handled = true;
      if (key === ' ' && !onControl) a.toggle();
      else if (key === 'Enter' && !onControl && cur.isSet) a.start();
      else if ((key === 'ArrowLeft' || key === 'ArrowRight') && cur.isSet && !inGroup) {
        const i = Math.max(
          0,
          LENGTHS.findIndex((l) => l === cur.settings.totalSec),
        );
        const next = LENGTHS[Math.min(LENGTHS.length - 1, Math.max(0, i + (key === 'ArrowRight' ? 1 : -1)))];
        if (next !== undefined) a.setLength(next);
      } else if (key === '+' || key === '=' || e.code === 'NumpadAdd') a.extend(300);
      else if (key === '-' || key === '−' || e.code === 'NumpadSubtract') a.shorten(300);
      else if ((key === 'F' && e.shiftKey) || (key === 'f' && e.shiftKey)) a.fullscreen();
      else if (key === 'f' || key === 'F') a.open('faces');
      else if (key === 'v' || key === 'V') a.open('vibes');
      else if (key === 'r' || key === 'R') a.open('recents');
      else if (key === ',') a.open('settings');
      else if (key === '?') a.open('palette');
      else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

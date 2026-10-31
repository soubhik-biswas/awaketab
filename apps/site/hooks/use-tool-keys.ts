import { useEffect, useRef, type RefObject } from 'react';
import type { IToolContext } from '@/components/tool/context';
import { toolUi } from '@/lib/tool/ui';

function typing(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    el.getAttribute('role') === 'combobox'
  );
}

// The keyboard map from the accessibility board. ⌘K and Esc work anywhere; single keys only while the
// stage has focus, never while typing (WCAG 2.1.4).
export function useToolKeys(ctx: IToolContext, stageRef: RefObject<HTMLElement | null>) {
  const ref = useRef(ctx);
  ref.current = ctx;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { a, presets } = ref.current;
      const view = toolUi.get().view;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (view === 'palette') a.close();
        else a.go('palette');
        return;
      }
      if (e.key === 'Escape') {
        if (view !== 'timer') a.close();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const stage = stageRef.current;
      const active = document.activeElement;
      if (!stage || !active || !stage.contains(active) || typing(active)) return;
      const onStage = active === stage;
      if (e.key === ' ' || e.code === 'Space') {
        if (!onStage) return;
        e.preventDefault();
        a.toggle();
        return;
      }
      // German and Nordic layouts type + without Shift on BracketRight, so Shift there types * instead.
      const shiftPlus = e.shiftKey && e.key === '*' && e.code === 'BracketRight';
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || shiftPlus) {
        e.preventDefault();
        // The + key adds 15 minutes; with Shift (the + character on US layouts) it adds an hour.
        a.extend(e.shiftKey ? 3600 : 900);
        return;
      }
      const key = e.key;
      if (key === 'u' || key === 'U') a.go('extend');
      else if (key === 'f' || key === 'F') {
        if (view === 'focus') a.close();
        else a.go('focus');
      } else if (key === 'D' && e.shiftKey) a.cycleTheme();
      else if (key === '?') a.go('fix');
      else if (/^[1-9]$/u.test(key)) {
        const p = presets[Number(key) - 1];
        if (p) a.applyPreset(p, true);
        else return;
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stageRef]);
}

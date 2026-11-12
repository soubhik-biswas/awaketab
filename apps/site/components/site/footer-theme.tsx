'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useIsClient } from 'usehooks-ts';

type TChoice = 'system' | 'light' | 'dark';

const CHOICES: ReadonlyArray<readonly [TChoice, LucideIcon]> = [
  ['system', Monitor],
  ['light', Sun],
  ['dark', Moon],
];

// The footer's System / Light / Dark switch. OLED counts as Dark here; the four-card choice lives in the tool's
// Settings. Before mount nothing is marked, so the server never guesses the visitor's theme.
export function FooterTheme({ label, names }: { label: string; names: Record<TChoice, string> }) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  const group = useRef<HTMLSpanElement>(null);
  const [thumb, setThumb] = useState<{ x: number; width: number } | null>(null);
  const [ready, setReady] = useState(false);
  const current: TChoice | null = !mounted
    ? null
    : theme === 'light'
      ? 'light'
      : theme === 'system'
        ? 'system'
        : 'dark';

  // The marked segment carries its name, so its width changes with the choice and when the web font arrives.
  useEffect(() => {
    const el = group.current;
    if (!el || !current) return;
    const place = () => {
      const on = el.querySelector<HTMLElement>('[aria-checked="true"]');
      if (on) setThumb({ x: on.offsetLeft, width: on.offsetWidth });
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(el);
    return () => watch.disconnect();
  }, [current]);

  // The thumb slides only after it has been put in place once.
  const placed = thumb !== null;
  useEffect(() => {
    if (!placed) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [placed]);

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const radios = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const last = radios.length - 1;
    const at = radios.findIndex((radio) => radio === document.activeElement);
    const steps: Record<string, number> = {
      ArrowRight: at < last ? at + 1 : 0,
      ArrowDown: at < last ? at + 1 : 0,
      ArrowLeft: at > 0 ? at - 1 : last,
      ArrowUp: at > 0 ? at - 1 : last,
      Home: 0,
      End: last,
    };
    const next = radios[steps[event.key] ?? -1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.click();
  };

  return (
    <span
      ref={group}
      role="radiogroup"
      aria-label={label}
      className="site-foot-seg"
      data-ready={ready ? '' : undefined}
      onKeyDown={onKeyDown}
    >
      {thumb && (
        <span
          aria-hidden="true"
          className="site-foot-seg-thumb"
          style={{ width: thumb.width, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {CHOICES.map(([value, Icon], index) => {
        const on = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={names[value]}
            tabIndex={on || (current === null && index === 0) ? 0 : -1}
            onClick={() => setTheme(value)}
          >
            <Icon className="site-foot-i" aria-hidden="true" />
            {on && (
              <span className="site-foot-seg-label" aria-hidden="true">
                {names[value]}
              </span>
            )}
          </button>
        );
      })}
    </span>
  );
}

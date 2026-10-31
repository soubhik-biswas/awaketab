import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource/ibm-plex-serif/latin-300.css';
import '@fontsource/ibm-plex-serif/latin-300-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

// The v3.1 mark: a faint full track, the bold 300° arc from 12 o'clock and the bead on its end.
export function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="at-mark">
      <circle cx="16" cy="16" r="11" fill="none" stroke="var(--at-mark-ink)" strokeOpacity=".22" strokeWidth="4" />
      <path
        d="M16 5 A11 11 0 1 1 6.47 10.5"
        fill="none"
        stroke="var(--at-mark-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="6.47" cy="10.5" r="4.6" fill="var(--at-mark-bead)" />
    </svg>
  );
}

// A clock that ticks on the second, for the face and the minutes in the pill.
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => {
      window.clearTimeout(id);
    };
  }, []);
  return now;
}

export function secondsSinceMidnight(at: number): number {
  const d = new Date(at);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function mount(node: ReactNode): void {
  const root = document.getElementById('root');
  if (root) createRoot(root).render(<StrictMode>{node}</StrictMode>);
}

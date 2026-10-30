export type MarkState = 'awake' | 'paused' | 'blocked' | 'ended' | 'info' | 'off';

interface MarkOptions {
  size?: number;
  state?: MarkState;
  glow?: boolean;
  small?: boolean;
  hollow?: boolean;
  label?: string;
  className?: string;
}

const LAMP_VAR: Record<MarkState, string> = {
  awake: 'var(--at-accent)',
  paused: 'var(--at-warn)',
  blocked: 'var(--at-bad)',
  ended: 'var(--at-ended)',
  info: 'var(--at-info)',
  off: 'var(--at-input-border)',
};

const ARC = 'M32 11 A21 21 0 1 1 12.27 24.82';
const ARC_SMALL = 'M32 11 A21 21 0 1 1 11.12 29.8';

// The brand mark board's geometry: 64 grid, r 21, 70° gap (84° at the small optical cut), lamp at −125°.
export function markSvg(opts: MarkOptions = {}): string {
  const size = opts.size ?? 32;
  const state = opts.state ?? 'awake';
  const small = opts.small ?? size <= 20;
  const hollow = opts.hollow ?? (state === 'paused' || state === 'blocked');
  const glow = (opts.glow ?? true) && !small && !hollow && state !== 'off';
  const lx = small ? 17.9 : 19.95;
  const ly = small ? 16.4 : 14.8;
  const lr = small ? 6.2 : 5.6;
  const lamp = LAMP_VAR[state];
  const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
  const cls = ['at-mark', opts.className].filter(Boolean).join(' ');
  return (
    `<svg class="${cls}" data-state="${state}" width="${String(size)}" height="${String(size)}" viewBox="0 0 64 64" ${a11y} focusable="false">` +
    `<path d="${small ? ARC_SMALL : ARC}" fill="none" stroke="currentColor" stroke-width="${small ? '10' : '9'}" stroke-linecap="round"/>` +
    (glow
      ? `<circle class="at-mark-halo" cx="${String(lx)}" cy="${String(ly)}" r="11" fill="${lamp}" opacity="0.28"/>`
      : '') +
    `<circle class="at-mark-lamp" cx="${String(lx)}" cy="${String(ly)}" r="${String(lr)}" fill="${hollow ? 'none' : lamp}" stroke="${lamp}" stroke-width="${hollow ? '3' : '0'}"/>` +
    (glow
      ? `<circle cx="${(lx - 1.65).toFixed(2)}" cy="${(ly - 1.6).toFixed(2)}" r="1.6" fill="#ddffe9" opacity="0.9"/>`
      : '') +
    `</svg>`
  );
}

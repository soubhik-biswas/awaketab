let opener: HTMLElement | null = null;

// Remember what had focus when a sheet, dialog or the palette opened, so closing it can go back there.
export function rememberOpener() {
  if (typeof document === 'undefined') return;
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) opener = el;
}

export function returnFocus(fallback?: HTMLElement | null) {
  const el = opener?.isConnected ? opener : (fallback ?? null);
  opener = null;
  el?.focus({ preventScroll: true });
}

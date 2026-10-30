const STUDIO_KEY = 'at.v1.studio';
export const STUDIO_EVENT = 'at:studio';
const DEFAULT_GLOW = 70;

export interface IStudio {
  v: 1;
  lamp: string;
  glow: number;
}

const HEX = /^#[0-9a-f]{6}$/iu;

export function readStudio(raw: string | null = safeGet()): IStudio {
  try {
    const row = JSON.parse(raw ?? 'null') as Partial<IStudio> | null;
    const glow = Number(row?.glow);
    return {
      v: 1,
      lamp: typeof row?.lamp === 'string' && HEX.test(row.lamp) ? row.lamp : '',
      glow: Number.isFinite(glow) ? Math.min(100, Math.max(0, Math.round(glow / 5) * 5)) : DEFAULT_GLOW,
    };
  } catch {
    return { v: 1, lamp: '', glow: DEFAULT_GLOW };
  }
}

function safeGet(): string | null {
  try {
    return localStorage.getItem(STUDIO_KEY);
  } catch {
    return null;
  }
}

// The stage glow scales with Room glow; 70 % is the designed strength, so it maps to 1.
export function glowScale(glow: number): number {
  return Math.max(0, Math.min(100, glow)) / DEFAULT_GLOW;
}

// Face studio needs Pro; without it the face keeps the default green and the default glow.
export function applyStudio(studio: IStudio, pro: boolean, html: HTMLElement = document.documentElement): IStudio {
  const used = pro ? studio : { v: 1 as const, lamp: '', glow: DEFAULT_GLOW };
  html.style.setProperty('--at-room-glow', glowScale(used.glow).toFixed(2));
  if (used.lamp) html.dataset.studioLamp = used.lamp;
  else delete html.dataset.studioLamp;
  document.dispatchEvent(new CustomEvent<IStudio>(STUDIO_EVENT, { detail: used }));
  return used;
}

export function saveStudio(studio: IStudio): void {
  try {
    localStorage.setItem(STUDIO_KEY, JSON.stringify(studio));
  } catch {
    // Private mode: the look lasts for this page.
  }
}

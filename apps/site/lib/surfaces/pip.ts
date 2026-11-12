import { localePath, type TLocale } from '@/i18n/locales';
import { SETTINGS_KEY } from '@/lib/tool/settings';

export type TMiniSize = 'compact' | 'expanded';

// Content sizes of the floating window: a slim pill, or the face with its controls.
export const MINI_SIZE: Record<TMiniSize, { width: number; height: number }> = {
  compact: { width: 300, height: 84 },
  expanded: { width: 288, height: 340 },
};
const PIP_POPUP_NAME = 'awaketab-pip';
const AUTO_ACTION = 'enterpictureinpicture';

export type TPipSupport = 'document' | 'popup' | 'none';
// What the "mini clock when you leave" setting can promise: the browser may open it by itself, it opens with one
// tap, or this browser has no floating window at all.
type TMiniTier = 'auto' | 'tap' | 'none';

interface IDocPip {
  requestWindow(o: {
    width: number;
    height: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
  }): Promise<Window>;
  window?: Window | null;
}

interface IMediaSessionLike {
  setActionHandler(action: string, handler: (() => void) | null): void;
}

const docPip = (win: Window): IDocPip | undefined =>
  (win as Window & { documentPictureInPicture?: IDocPip }).documentPictureInPicture;

const mediaSession = (win: Window): IMediaSessionLike | undefined => {
  const nav: { mediaSession?: Partial<IMediaSessionLike> } = win.navigator;
  const ms = nav.mediaSession;
  return ms && typeof ms.setActionHandler === 'function' ? (ms as IMediaSessionLike) : undefined;
};

// Document Picture-in-Picture where the browser has it; a small popup on other desktop browsers that can talk to
// this tab; nothing on phones and tablets, where a popup would open as a full tab and hide the clock it mirrors.
export function pipSupport(win: Window | undefined = typeof window === 'undefined' ? undefined : window): TPipSupport {
  if (!win) return 'none';
  if (docPip(win)) return 'document';
  if (typeof BroadcastChannel === 'undefined') return 'none';
  const media: Partial<Pick<Window, 'matchMedia'>> = win;
  const coarse = media.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/u.test(win.navigator.userAgent);
  return coarse || mobile ? 'none' : 'popup';
}

function testTier(win: Window): TMiniTier {
  if (!docPip(win)) return 'none';
  const ms = mediaSession(win);
  if (!ms) return 'tap';
  try {
    ms.setActionHandler(AUTO_ACTION, null);
    return 'auto';
  } catch {
    return 'tap';
  }
}

const tiers = new WeakMap<Window, TMiniTier>();

// A browser that does not know the action throws on it, so clearing its handler is the feature test. It runs once
// per window, before any handler is set, so it never clears the one watchAutoPip sets.
export function miniTier(win: Window | undefined = typeof window === 'undefined' ? undefined : window): TMiniTier {
  if (!win) return 'none';
  const known = tiers.get(win);
  if (known) return known;
  const tier = testTier(win);
  tiers.set(win, tier);
  return tier;
}

// Asks the browser to open the mini clock by itself when the person leaves the tab. The browser decides: it calls
// back only where automatic picture-in-picture is allowed for this site, and the callback may open the window
// without a tap. Returns the undo.
export function watchAutoPip(onEnter: () => void, win: Window = window): () => void {
  const ms = mediaSession(win);
  if (!ms || miniTier(win) !== 'auto') return () => undefined;
  try {
    ms.setActionHandler(AUTO_ACTION, onEnter);
  } catch {
    return () => undefined;
  }
  return () => {
    try {
      ms.setActionHandler(AUTO_ACTION, null);
    } catch {
      // The browser dropped the action meanwhile; nothing is left to undo.
    }
  };
}

function pipPath(locale: TLocale = 'en'): string {
  return localePath(locale, '/pip');
}

// The floating window starts as about:blank: it gets this page's stylesheets, theme class and font variables.
export function dressWindow(pip: Window, from: Document = document): () => void {
  for (const node of from.querySelectorAll('style, link[rel="stylesheet"]')) {
    const copy = node.cloneNode(true);
    if (copy instanceof HTMLLinkElement && node instanceof HTMLLinkElement) copy.href = node.href;
    pip.document.head.append(copy);
  }
  const html = pip.document.documentElement;
  const sync = () => {
    html.className = from.documentElement.className;
    html.lang = from.documentElement.lang;
    html.style.colorScheme = from.documentElement.style.colorScheme;
  };
  sync();
  pip.document.body.style.margin = '0';
  pip.document.body.style.overflow = 'hidden';
  const mo = new MutationObserver(sync);
  mo.observe(from.documentElement, { attributes: true, attributeFilter: ['class', 'lang', 'style'] });
  return () => mo.disconnect();
}

// Calls requestWindow at once, with no wait before it, so it still counts as the tap or the browser's own call.
export async function openDocumentPip(size: TMiniSize, win: Window = window): Promise<Window | null> {
  const api = docPip(win);
  if (!api) return null;
  try {
    return await api.requestWindow({ ...MINI_SIZE[size], preferInitialWindowPlacement: true });
  } catch {
    return null;
  }
}

export function openPopup(locale: TLocale = 'en', win: Window = window): Window | null {
  const { width, height } = MINI_SIZE[readMiniSize()];
  try {
    return win.open(pipPath(locale), PIP_POPUP_NAME, `popup,width=${String(width)},height=${String(height)}`);
  } catch {
    return null;
  }
}

// The browser may refuse (no tap, or a window it will not resize); the view then reflows to the space it has.
export function resizeMini(win: Window, size: TMiniSize): void {
  const { width, height } = MINI_SIZE[size];
  const dw = win.outerWidth > 0 ? Math.max(0, win.outerWidth - win.innerWidth) : 0;
  const dh = win.outerHeight > 0 ? Math.max(0, win.outerHeight - win.innerHeight) : 0;
  try {
    win.resizeTo(width + dw, height + dh);
  } catch {
    // Refused: the content reflows instead.
  }
}

// From the mini clock, with its tap: browsers that allow it bring the AwakeTab tab to the front.
export function focusTab(tab: unknown): void {
  const target = tab as { focus?: unknown } | null;
  try {
    if (target && typeof target.focus === 'function') (target as Window).focus();
  } catch {
    // Not allowed here; the browser's own "back to tab" button still works.
  }
}

function readSettings(): Record<string, unknown> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as unknown;
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// The last size the person chose, kept in at.v1.settings as miniSize; the settings store keeps fields it does not own.
export function readMiniSize(): TMiniSize {
  return readSettings()?.miniSize === 'compact' ? 'compact' : 'expanded';
}

export function saveMiniSize(size: TMiniSize): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...(readSettings() ?? { v: 1 }), miniSize: size }));
  } catch {
    // Blocked storage: the size lasts for this visit only.
  }
}

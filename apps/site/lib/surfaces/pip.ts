import { localePath, type TLocale } from '@/i18n/locales';

const PIP_SIZE = { width: 320, height: 180 } as const;
const PIP_POPUP_NAME = 'awaketab-pip';

export type TPipSupport = 'document' | 'popup' | 'none';

interface IDocPip {
  requestWindow(o: { width: number; height: number; disallowReturnToOpener?: boolean }): Promise<Window>;
  window?: Window | null;
}

const docPip = (win: Window): IDocPip | undefined =>
  (win as Window & { documentPictureInPicture?: IDocPip }).documentPictureInPicture;

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
  const mo = new MutationObserver(sync);
  mo.observe(from.documentElement, { attributes: true, attributeFilter: ['class', 'lang', 'style'] });
  return () => mo.disconnect();
}

export async function openDocumentPip(win: Window = window): Promise<Window | null> {
  const api = docPip(win);
  if (!api) return null;
  try {
    return await api.requestWindow({ ...PIP_SIZE });
  } catch {
    return null;
  }
}

export function openPopup(locale: TLocale = 'en', win: Window = window): Window | null {
  return win.open(
    pipPath(locale),
    PIP_POPUP_NAME,
    `popup,width=${String(PIP_SIZE.width)},height=${String(PIP_SIZE.height)}`,
  );
}

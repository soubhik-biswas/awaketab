import {
  EMBED_BOX,
  EMBED_CREDIT_CLASS,
  EMBED_CREDIT_LINK_STYLE,
  EMBED_CREDIT_STYLE,
  EMBED_CREDIT_URL,
  EMBED_LOCALES,
  EMBED_MAX_HEIGHT,
  EMBED_MIN_HEIGHT,
  EMBED_MODES,
  EMBED_NARROW,
  EMBED_PATH,
  EMBED_PRESETS,
  EMBED_SIZES,
  EMBED_THEMES,
} from './protocol';
import { SNIPPET_SANDBOX } from './snippet';

export interface ILoaderConfig {
  titles: Record<string, string>;
  credits: Record<string, string>;
  box: typeof EMBED_BOX;
  narrow: typeof EMBED_NARROW;
  sandbox: string;
  creditUrl: string;
  creditClass: string;
  creditStyle: string;
  creditLinkStyle: string;
  minH: number;
  maxH: number;
  modes: readonly string[];
  themes: readonly string[];
  sizes: readonly string[];
  presets: readonly string[];
  locales: readonly string[];
  path: string;
}

export function loaderConfig(titles: Record<string, string>, credits: Record<string, string>): ILoaderConfig {
  return {
    titles,
    credits,
    box: EMBED_BOX,
    narrow: EMBED_NARROW,
    sandbox: SNIPPET_SANDBOX,
    creditUrl: EMBED_CREDIT_URL,
    creditClass: EMBED_CREDIT_CLASS,
    creditStyle: EMBED_CREDIT_STYLE,
    creditLinkStyle: EMBED_CREDIT_LINK_STYLE,
    minH: EMBED_MIN_HEIGHT,
    maxH: EMBED_MAX_HEIGHT,
    modes: EMBED_MODES,
    themes: EMBED_THEMES,
    sizes: EMBED_SIZES,
    presets: EMBED_PRESETS,
    locales: EMBED_LOCALES,
    path: EMBED_PATH,
  };
}

type TFrame = { el: HTMLIFrameElement; origin: string; minHeight: number; ready: boolean; queue: unknown[] };
type TCb = (detail: Record<string, unknown>) => void;

// The page-side loader behind /embed.js. It is served as this function's own source, so it must not reach for
// anything outside its body: every constant arrives in `cfg`.
export function embedLoader(win: Window, current: HTMLScriptElement | null, cfg: ILoaderConfig): void {
  const doc = win.document;
  const pick = (list: readonly string[], v: unknown, fallback: string) =>
    typeof v === 'string' && list.includes(v) ? v : fallback;
  const wallRe = /^([01]\d|2[0-3])[:-]([0-5]\d)$/;
  const hostRe = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  const wall = (v: unknown) => {
    const m = typeof v === 'string' ? wallRe.exec(v) : null;
    return m ? `${m[1] ?? '00'}:${m[2] ?? '00'}` : null;
  };
  const locale = (raw: unknown) => {
    if (typeof raw !== 'string') return 'en';
    const tag = raw.trim().toLowerCase();
    if (cfg.locales.includes(tag)) return tag;
    const primary = tag.split(/[-_]/)[0] ?? '';
    return primary === 'pt' ? 'pt-br' : pick(cfg.locales, primary, 'en');
  };
  const clean = (m: unknown): Record<string, unknown> | null => {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
    const o = m as Record<string, unknown>;
    if (o.type === 'awaketab:stop') return { type: 'awaketab:stop' };
    if (o.type === 'awaketab:theme')
      return pick(cfg.themes, o.theme, '') ? { type: 'awaketab:theme', theme: o.theme } : null;
    if (o.type !== 'awaketab:start') return null;
    const out: Record<string, unknown> = { type: 'awaketab:start' };
    if (o.preset !== undefined) {
      if (!pick(cfg.presets, o.preset, '') || o.preset === 'until') return null;
      out.preset = o.preset;
    }
    if (o.ms !== undefined) {
      if (typeof o.ms !== 'number' || !Number.isInteger(o.ms) || o.ms < 60_000 || o.ms > 604_800_000) return null;
      out.ms = o.ms;
    }
    if (o.until !== undefined) {
      const w = wall(o.until);
      if (!w) return null;
      out.until = w;
    }
    return out;
  };

  type TReg = {
    version: string;
    frames: TFrame[];
    listeners: { ready: Set<TCb>; state: Set<TCb> };
    on(event: 'ready' | 'state', cb: TCb): () => void;
    start(opts?: Record<string, unknown>): void;
    stop(): void;
    setTheme(theme: string): void;
  };
  const w = win as Window & { AwakeTabEmbed?: TReg };
  if (!w.AwakeTabEmbed) {
    const frames: TFrame[] = [];
    const listeners = { ready: new Set<TCb>(), state: new Set<TCb>() };
    const post = (rec: TFrame, msg: unknown) => {
      if (!rec.ready) rec.queue.push(msg);
      else rec.el.contentWindow?.postMessage(msg, rec.origin);
    };
    const broadcast = (msg: unknown) => {
      const ok = clean(msg);
      if (ok) for (const rec of frames) post(rec, ok);
    };
    win.addEventListener('message', (e: MessageEvent) => {
      const rec = frames.find((f) => f.el.contentWindow !== null && f.el.contentWindow === e.source);
      if (!rec || e.origin !== rec.origin || !e.data || typeof e.data !== 'object') return;
      const m = e.data as Record<string, unknown>;
      if (m.type === 'awaketab:resize' && typeof m.height === 'number' && Number.isFinite(m.height)) {
        const h = Math.round(Math.min(cfg.maxH, Math.max(cfg.minH, m.height)));
        rec.el.style.height = `${String(Math.max(rec.minHeight, h))}px`;
      } else if (m.type === 'awaketab:ready') {
        rec.ready = true;
        for (const q of rec.queue.splice(0)) post(rec, q);
        for (const cb of listeners.ready)
          cb({ frame: rec.el, version: typeof m.version === 'string' ? m.version : '' });
      } else if (m.type === 'awaketab:state' && typeof m.lock === 'string' && typeof m.status === 'string') {
        const endsAt = typeof m.endsAt === 'number' && Number.isFinite(m.endsAt) ? m.endsAt : null;
        for (const cb of listeners.state)
          cb({ frame: rec.el, lock: m.lock.slice(0, 16), status: m.status.slice(0, 16), endsAt, mode: m.mode });
      }
    });
    w.AwakeTabEmbed = {
      version: '1',
      frames,
      listeners,
      on(event, cb) {
        listeners[event].add(cb);
        return () => {
          listeners[event].delete(cb);
        };
      },
      start(opts = {}) {
        broadcast({ ...opts, type: 'awaketab:start' });
      },
      stop() {
        broadcast({ type: 'awaketab:stop' });
      },
      setTheme(theme) {
        broadcast({ type: 'awaketab:theme', theme });
      },
    };
  }
  const reg = w.AwakeTabEmbed;
  const lookups: Record<string, Promise<boolean>> = {};
  const keepsCredit = (origin: string) => {
    const host = win.location.hostname;
    if (!hostRe.test(host)) return Promise.resolve(true);
    lookups[origin] ??= win
      .fetch(`${origin}/api/embed/config?domain=${encodeURIComponent(host)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ licensed?: unknown; attribution?: unknown } | null>) : null))
      .then((d) => !(d?.licensed === true && d.attribution === false))
      .catch(() => true);
    return lookups[origin];
  };

  const mount = (script: HTMLScriptElement) => {
    let origin: string;
    try {
      origin = new URL(script.src).origin;
    } catch {
      return;
    }
    if (!/^https?:\/\//.test(origin)) return;
    const d = script.dataset;
    const preset = pick(cfg.presets, d.preset, 'pinf');
    const until = wall(d.until);
    const size = pick(cfg.sizes, d.size, 'compact') as 'compact' | 'full';
    const mode = pick(cfg.modes, d.mode, 'cook');
    const lang = locale(d.lang ?? doc.documentElement.lang);
    const q = new URLSearchParams({
      mode,
      theme: pick(cfg.themes, d.theme, 'auto'),
      lang,
      size,
      preset: preset === 'until' && !until ? 'pinf' : preset,
    });
    if (preset === 'until' && until) q.set('until', until.replace(':', '-'));
    if (hostRe.test(doc.location.hostname)) q.set('host', doc.location.hostname);
    const box = cfg.box[size];
    const frame = doc.createElement('iframe');
    frame.src = `${origin}${lang === 'en' ? '' : `/${lang}`}${cfg.path}?${q.toString()}`;
    frame.title = cfg.titles[lang] ?? cfg.titles.en ?? '';
    frame.setAttribute('allow', 'screen-wake-lock');
    frame.setAttribute('loading', 'lazy');
    frame.setAttribute('referrerpolicy', 'strict-origin');
    frame.setAttribute('sandbox', cfg.sandbox);
    frame.style.cssText = `width:${box.width};max-width:100%;height:${String(box.height)}px;border:0;border-radius:${String(box.radius)}px;color-scheme:light dark;display:block`;
    const parent = script.parentNode;
    if (parent && parent !== doc.head) parent.replaceChild(frame, script);
    else {
      script.remove();
      doc.body.append(frame);
    }
    const [below, tall] = cfg.narrow[size];
    const width = frame.offsetWidth;
    const narrow = width > 0 && width < below && (size === 'compact' || mode === 'cook');
    const height = narrow ? tall : box.height;
    frame.style.height = `${String(height)}px`;
    const credit = doc.createElement('div');
    credit.className = cfg.creditClass;
    credit.style.cssText = cfg.creditStyle;
    const link = doc.createElement('a');
    link.href = cfg.creditUrl;
    link.rel = 'nofollow';
    link.style.cssText = cfg.creditLinkStyle;
    link.textContent = cfg.credits[lang] ?? cfg.credits.en ?? '';
    credit.append(link);
    frame.after(credit);
    reg.frames.push({ el: frame, origin, minHeight: height, ready: false, queue: [] });
    void keepsCredit(origin).then((keep) => {
      if (!keep) credit.remove();
    });
  };

  const tags = current ? [current] : [...doc.querySelectorAll<HTMLScriptElement>('script[src*="/embed.js"]')];
  const run = () => {
    for (const tag of tags) mount(tag);
  };
  // An async tag in <head> can run before <body> exists.
  if ((doc.body as HTMLElement | null) !== null) run();
  else doc.addEventListener('DOMContentLoaded', run, { once: true });
}

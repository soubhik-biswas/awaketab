import { FACE_IDS, type TFace } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { strings, t } from '../i18n.js';
import type { TStatus } from '../ui/view.js';
import { type FaceProps, type FaceState, type FaceTheme, FACES, faceSheet, mountFace, setFaceText } from './index.js';
import { renderFaceGrid } from './sheet.js';

// The tool's status as a face state (needs-a-tap reads as "not awake", as on the boards).
const STATE: Record<TStatus, FaceState> = {
  ready: 'idle',
  starting: 'starting',
  awake: 'running',
  fallback: 'fallback',
  paused: 'paused',
  blocked: 'blocked',
  needtap: 'unsupported',
  timesup: 'up',
  ended: 'up',
};

interface IStageSnap {
  st: TStatus;
  left: number;
  total: number;
  inf: boolean;
  el: number;
  now: number;
}

let face: ReturnType<typeof mountFace> | undefined;
let swipe: Promise<void> | undefined;
let observed: HTMLElement | null = null;

export const faceName = (id: TFace): string => {
  const k = `face.name.${id}`;
  const s = t(k);
  return s === k ? (FACES.find((f) => f.id === id)?.name ?? id) : s;
};

export const stepFace = (id: TFace, by: number): TFace => {
  const n = FACE_IDS.length;
  const i = Math.max(0, FACE_IDS.indexOf(id));
  return FACE_IDS[(((i + by) % n) + n) % n] ?? 'ring';
};

const themeOf = (): FaceTheme => {
  const th = document.documentElement.dataset.theme;
  return th === 'light' || th === 'oled' ? th : 'dark';
};

const secOfDay = (ms: number) => {
  const d = new Date(ms);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
};

const fmtOf = (c24: boolean | null): 12 | 24 => {
  if (c24 !== null) return c24 ? 24 : 12;
  return new Intl.DateTimeFormat(document.documentElement.lang || undefined, { hour: 'numeric' }).resolvedOptions()
    .hour12 === false
    ? 24
    : 12;
};

// The current tool's dial keeps its own Ring; every other face draws in the dial's face host through the Face module.
export function paintStage(ctx: IToolCtx, snap: IStageSnap): void {
  const html = document.documentElement;
  const host = ctx.root.querySelector<HTMLElement>('[data-face-host]');
  const { settings } = ctx.store.get();
  if (!host) return;
  if (settings.face === 'ring') {
    delete html.dataset.face;
    face?.destroy();
    face = undefined;
    return;
  }
  html.dataset.face = settings.face;
  const size = Math.round(Math.min(host.clientWidth, host.clientHeight)) || 358;
  const props: FaceProps = {
    face: settings.face,
    theme: themeOf(),
    state: STATE[snap.st],
    remain: snap.inf ? snap.el : snap.left,
    total: snap.inf ? 0 : snap.total,
    nowSec: secOfDay(snap.now),
    size,
    bare: true,
    indef: snap.inf,
    motion: settings.reduceMotion === 'on' ? 'off' : 'auto',
    fmt: fmtOf(settings.ambient.clock24h),
  };
  if (face) face.update(props);
  else {
    setFaceText(strings('face.t.'));
    face = mountFace(host, props);
    if (matchMedia('(any-pointer: coarse)').matches) armSwipe(ctx);
  }
  if (observed !== host) {
    observed = host;
    // The dial resizes with the window; the face follows on the next paint.
    new ResizeObserver(() => {
      const s = Math.round(Math.min(host.clientWidth, host.clientHeight));
      if (s) face?.update({ size: s });
    }).observe(host);
  }
}

function setFace(ctx: IToolCtx, id: TFace): void {
  const cur = ctx.store.get().settings;
  if (cur.face === id) return;
  const next = { ...cur, face: id };
  ctx.storage.writeSettings(next);
  ctx.store.set({ settings: next });
}

// The C key and Shift+C step through the faces in sheet order.
export function faceAct(ctx: IToolCtx, name: string): void {
  setFace(ctx, stepFace(ctx.store.get().settings.face, name === 'facePrev' ? -1 : 1));
}

let grid: { host: HTMLElement; view: ReturnType<typeof renderFaceGrid> } | undefined;

export function showFaceGrid(ctx: IToolCtx, pane: HTMLElement): Promise<void> {
  const host = pane.querySelector<HTMLElement>('[data-face-grid]');
  if (!host) return Promise.resolve();
  if (grid?.host === host) {
    grid.view.select(ctx.store.get().settings.face);
    return faceSheet();
  }
  setFaceText(strings('face.t.'));
  const names = Object.fromEntries(FACE_IDS.map((id) => [id, faceName(id)]));
  let theme = themeOf();
  const view = renderFaceGrid(host, {
    selected: ctx.store.get().settings.face,
    theme,
    names,
    label: t('tool.face.label'),
    columns: matchMedia('(min-width: 600px) and (max-width: 1023px)').matches ? 5 : 3,
    onPick: (id) => {
      setFace(ctx, id);
    },
  });
  grid = { host, view };
  // The store changes every second; the thumbnails redraw only when the theme does.
  ctx.store.subscribe((s) => {
    view.select(s.settings.face);
    const next = themeOf();
    if (next !== theme) view.setTheme((theme = next));
  });
  return faceSheet();
}

// Swiping (Embla, its own chunk) loads on touch screens with the first face, elsewhere with the first touch or sideways
// trackpad swipe on the clock (extras.ts), so a mouse-only visitor never downloads it.
export function armSwipe(ctx: IToolCtx): void {
  swipe ??= Promise.all([faceSheet(), import('./swipe.js')]).then(([, m]) => {
    m.mountSwipe(ctx, (by) => {
      setFace(ctx, stepFace(ctx.store.get().settings.face, by));
      return Promise.resolve();
    });
  });
}

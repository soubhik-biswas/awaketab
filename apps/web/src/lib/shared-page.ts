import { FACES, mountFace } from '../tool/face';
import { endsAt, setupFromPath, setupToolHref, type ISetup } from './share-setup';

const fill = (root: HTMLElement, name: string, text: string): void => {
  for (const el of root.querySelectorAll<HTMLElement>(`[data-fill="${name}"]`)) el.textContent = text;
};

function lengthWords(minutes: number, d: DOMStringMap): string {
  if (minutes === 0) return d.noEnd ?? '';
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return (h === 1 ? (d.hour ?? '') : (d.hours ?? '')).replace('{n}', String(h));
  }
  return (d.minutes ?? '').replace('{n}', String(minutes));
}

function showShared(root: HTMLElement, setup: ISetup): void {
  const d = root.dataset;
  const face = FACES.find((f) => f.id === setup.face)?.name ?? setup.face;
  const length = lengthWords(setup.minutes, d);
  fill(root, 'length', length);
  fill(root, 'face', face);
  fill(root, 'chime', setup.chime ? (d.chimeOn ?? '') : (d.chimeOff ?? ''));
  const lead = root.querySelector<HTMLElement>('[data-fill="lead"]');
  const paint = (): void => {
    if (!lead) return;
    const template = setup.minutes === 0 ? d.leadOpen : setup.chime ? d.leadChime : d.leadQuiet;
    lead.textContent = (template ?? '')
      .replace('{length}', length)
      .replace('{face}', face)
      .replace('{time}', endsAt(new Date(), setup.minutes, d.tomorrow ?? '{time}'));
  };
  paint();
  // The end time follows the clock, so it stays true while the page is open.
  window.setInterval(paint, 30_000);
  const start = root.querySelector<HTMLAnchorElement>('[data-start]');
  if (start) {
    start.href = setupToolHref(setup, true);
    const label = start.querySelector('[data-fill="start"]');
    const h = setup.minutes / 60;
    const words =
      setup.minutes === 0
        ? d.startOpen
        : setup.minutes % 60 === 0
          ? (h === 1 ? d.startHour : d.startHours)?.replace('{n}', String(h))
          : d.startMin?.replace('{n}', String(setup.minutes));
    if (label) label.textContent = words ?? '';
  }
  const change = root.querySelector<HTMLAnchorElement>('[data-change]');
  if (change) change.href = setupToolHref(setup, false);
  const host = root.querySelector<HTMLElement>('[data-face]');
  if (host) {
    const theme = document.documentElement.dataset.theme;
    const total = setup.minutes * 60;
    const now = new Date();
    mountFace(host, {
      face: setup.face,
      theme: theme === 'dark' || theme === 'oled' ? theme : 'light',
      state: 'idle',
      remain: total,
      total,
      nowSec: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds(),
      size: matchMedia('(width < 700px)').matches ? 300 : 380,
      indef: setup.minutes === 0,
      fmt: 12,
    });
  }
}

export function initSharedPage(): void {
  const root = document.querySelector<HTMLElement>('[data-setup]');
  if (!root) return;
  const setup = setupFromPath(location.pathname);
  const view = setup ? 'shared' : 'removed';
  if (setup) showShared(root, setup);
  for (const el of root.querySelectorAll<HTMLElement>('[data-view]')) el.hidden = el.dataset.view !== view;
  document.title = (view === 'shared' ? root.dataset.titleShared : root.dataset.titleRemoved) ?? document.title;
}

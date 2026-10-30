import laptopSvg from 'lucide-static/icons/laptop.svg?raw';
import tabletSvg from 'lucide-static/icons/tablet.svg?raw';
import phoneSvg from 'lucide-static/icons/smartphone.svg?raw';
import checkSvg from 'lucide-static/icons/circle-check.svg?raw';
import pauseSvg from 'lucide-static/icons/pause.svg?raw';
import dotSvg from 'lucide-static/icons/circle-dot.svg?raw';
import plusSvg from 'lucide-static/icons/plus.svg?raw';
import userSvg from 'lucide-static/icons/user.svg?raw';
import cardSvg from 'lucide-static/icons/credit-card.svg?raw';
import outSvg from 'lucide-static/icons/external-link.svg?raw';
import downloadSvg from 'lucide-static/icons/download.svg?raw';
import logoutSvg from 'lucide-static/icons/log-out.svg?raw';
import trashSvg from 'lucide-static/icons/trash-2.svg?raw';
import chevronSvg from 'lucide-static/icons/chevron-right.svg?raw';
import { exportStatsCsv } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { readAccount, signOut } from '../../../lib/account.js';
import { fetchActivations } from '../../../lib/license.js';
import { POLAR_PORTAL_URL } from '../../../lib/pro-common.js';
import { esc, icon, longDate, time12, tr, upsell } from './ui.js';

const MAX_DEVICES = 5;
// Device identity colours: never green, amber or red, so they never read as a status.
export const IDENTITIES = ['cobalt', 'bubblegum', 'denim', 'grape', 'plum', 'sand', 'slate', 'mauve'] as const;

type TRow = { label: string; at: number; devHash: string };
type TGo = (view: 'devices' | 'account') => void;

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function deviceKind(label: string): 'phone' | 'tablet' | 'laptop' {
  if (/iPad|tablet/iu.test(label)) return 'tablet';
  if (/iOS|iPhone|Android/iu.test(label)) return 'phone';
  return 'laptop';
}

const KIND_ICON = { laptop: laptopSvg, tablet: tabletSvg, phone: phoneSvg };

function hereState(ctx: IToolCtx): { key: 'awake' | 'paused' | 'idle'; until: number | null } {
  const s = ctx.store.get();
  const live = s.session && (s.session.status === 'active' || s.session.status === 'paused') ? s.session : null;
  if (live?.status === 'paused') return { key: 'paused', until: null };
  if (live && (s.lock === 'held' || s.lock === 'fallback')) return { key: 'awake', until: live.endsAt };
  return { key: 'idle', until: null };
}

let cache: { token: string; rows: TRow[] } | null = null;

async function loadRows(token: string): Promise<TRow[] | null> {
  if (cache?.token === token) return cache.rows;
  try {
    const data = await fetchActivations(token);
    if (data.revoked || !Array.isArray(data.activations)) return null;
    cache = { token, rows: data.activations };
    return data.activations;
  } catch {
    return null;
  }
}

export function mountDevices(ctx: IToolCtx, host: HTMLElement): () => void {
  const lic = ctx.store.get().license;
  if (!lic || lic.exp * 1000 <= Date.now()) {
    host.innerHTML = `<div class="at-pv at-pv-devices">${upsell('devices')}<span class="at-pv-help">${tr('devices.help')}</span></div>`;
    return () => undefined;
  }
  host.innerHTML =
    `<div class="at-pv at-pv-devices">` +
    `<div class="at-pv-stack-row"><span class="at-pv-stack" data-dev-stack aria-hidden="true"></span><span class="at-pv-strong" data-dev-count aria-live="polite">${tr('devices.loading')}</span></div>` +
    `<div class="at-pv-list" role="list" data-dev-list></div>` +
    `<button type="button" class="at-pv-dash" aria-expanded="false" aria-controls="pv-add" data-dev-add>${icon(plusSvg, 18)}${tr('devices.add')}</button>` +
    `<div class="at-pv-add" id="pv-add" hidden><span>${tr('devices.addHow')}</span><a class="at-pv-link" href="/pro/activate">${tr('devices.addLink')}</a></div>` +
    `<span class="at-pv-help">${tr('devices.help')}</span>` +
    `</div>`;
  const list = host.querySelector<HTMLElement>('[data-dev-list]');
  const stack = host.querySelector<HTMLElement>('[data-dev-stack]');
  const count = host.querySelector<HTMLElement>('[data-dev-count]');
  const here = sha256Hex(lic.deviceId).catch(() => '');
  let rows: TRow[] = [];

  const paint = async () => {
    const mine = await here;
    const ordered = [...rows].sort((a, b) => Number(b.devHash === mine) - Number(a.devHash === mine) || a.at - b.at);
    const state = hereState(ctx);
    if (count) count.textContent = t('pro.view.devices.count', { n: ordered.length, max: MAX_DEVICES });
    if (stack)
      stack.innerHTML = ordered
        .map((r, i) => {
          const id = IDENTITIES[i % IDENTITIES.length] ?? 'cobalt';
          const tone = r.devHash === mine ? state.key : 'none';
          return `<span class="at-pv-av" data-id="${id}" data-tone="${tone}">${icon(KIND_ICON[deviceKind(r.label)], 18)}</span>`;
        })
        .join('');
    if (list)
      list.innerHTML = ordered
        .map((r, i) => {
          const id = IDENTITIES[i % IDENTITIES.length] ?? 'cobalt';
          const isHere = r.devHash === mine;
          const meta = isHere
            ? state.key === 'awake'
              ? state.until
                ? t('pro.view.devices.hereUntil', { time: time12(state.until) })
                : t('pro.view.devices.hereNoEnd')
              : t('pro.view.devices.here')
            : t('pro.view.devices.added', { date: longDate(r.at) });
          const badge = isHere
            ? `<span class="at-pv-badge" data-tone="${state.key}">${icon(state.key === 'awake' ? checkSvg : state.key === 'paused' ? pauseSvg : dotSvg, 14, 2.25)}${tr(`devices.state.${state.key}`)}</span>`
            : '';
          return (
            `<div class="at-pv-row" role="listitem"><span class="at-pv-sq" data-id="${id}">${icon(KIND_ICON[deviceKind(r.label)], 16)}</span>` +
            `<span class="at-pv-row-text"><span class="at-pv-row-name">${esc(r.label)}</span><span class="at-pv-help">${esc(meta)}</span></span>${badge}</div>`
          );
        })
        .join('');
  };

  host.querySelector('[data-dev-add]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLElement;
    const panel = host.querySelector<HTMLElement>('#pv-add');
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  });
  void loadRows(lic.token).then((r) => {
    if (r === null) {
      if (count) count.textContent = t('pro.view.devices.offline');
      return;
    }
    rows = r;
    void paint();
  });
  return ctx.store.subscribe(() => {
    if (rows.length) void paint();
  });
}

function download(body: string, type: string, name: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

const today = () => new Date().toISOString().slice(0, 10);

// Settings, presets and history as one JSON file; the licence token stays out of it.
export function exportMyData(): void {
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('at.v1.') || key === 'at.v1.license') continue;
      const raw = localStorage.getItem(key);
      try {
        out[key] = raw === null ? null : (JSON.parse(raw) as unknown);
      } catch {
        out[key] = raw;
      }
    }
  } catch {
    // Storage blocked: the file carries only the export date.
  }
  download(JSON.stringify(out, null, 2), 'application/json', `awaketab-data-${today()}.json`);
}

export function exportHistoryCsv(ctx: IToolCtx): boolean {
  if (!hasFeature(ctx, 'stats.export')) return false;
  download(exportStatsCsv(ctx.storage.stats(), '1.0'), 'text/csv;charset=utf-8', `awaketab-history-${today()}.csv`);
  return true;
}

export function mountAccount(ctx: IToolCtx, host: HTMLElement, go: TGo): () => void {
  const paint = () => {
    const account = readAccount();
    const lic = ctx.store.get().license;
    const pro = !!lic && lic.exp * 1000 > Date.now();
    const yearly = lic?.plan === 'pro_yearly';
    const renews = lic ? longDate((lic.exp - 7 * 86_400) * 1000) : '';
    const chip = pro ? tr(yearly ? 'account.yearly' : 'account.lifetime') : tr('account.free');
    const planText = !pro
      ? tr('account.plan.free')
      : yearly
        ? tr('account.plan.yearly', { date: renews })
        : tr('account.plan.lifetime');
    const devCount = cache?.token === lic?.token && cache ? cache.rows.length : null;
    const rows: Array<[string, string, string, string]> = [
      [
        'devices',
        tr('account.devices'),
        devCount === null
          ? tr('account.devicesUpTo', { max: MAX_DEVICES })
          : tr('account.devicesUsed', { n: devCount, max: MAX_DEVICES }),
        laptopSvg,
      ],
      ['export', tr('account.export'), tr('account.exportD'), downloadSvg],
      ...(hasFeature(ctx, 'stats.export')
        ? [['history', tr('account.history'), tr('account.historyD'), downloadSvg] as [string, string, string, string]]
        : []),
      ...(account
        ? [['signout', tr('account.signout'), tr('account.signoutD'), logoutSvg] as [string, string, string, string]]
        : []),
    ];
    host.innerHTML =
      `<div class="at-pv at-pv-account">` +
      `<div class="at-pv-who"><span class="at-pv-avatar" aria-hidden="true">${icon(userSvg, 22)}</span><span class="at-pv-who-text">` +
      (account
        ? `<strong class="at-pv-who-name">${esc(account.email)}</strong><span class="at-pv-help">${tr('account.magic')}</span>`
        : `<strong class="at-pv-who-name">${tr('account.guest')}</strong><a class="at-pv-link" href="/signin">${tr('account.signin')}</a>`) +
      `</span></div>` +
      `<div class="at-pv-plan"><span class="at-pv-plan-top"><strong class="at-pv-h3">${pro ? 'AwakeTab Pro' : tr('account.freeName')}</strong><span class="at-pv-chip">${chip}</span></span>` +
      `<span class="at-pv-plan-text">${planText}</span>` +
      (pro
        ? `<a class="at-button at-button-outline at-pv-wide" href="${POLAR_PORTAL_URL}" rel="noopener">${icon(cardSvg, 16)}${tr('account.billing')}${icon(outSvg, 16)}</a>`
        : `<a class="at-button at-button-primary at-pv-wide" href="/pro?ref=sheet-account">${tr('account.getPro')}</a>`) +
      `</div>` +
      `<div class="at-pv-rows">` +
      rows
        .map(
          ([id, n, d, svg]) =>
            `<button type="button" class="at-pv-rowbtn" data-acct="${id}"><span class="at-pv-tile">${icon(svg, 18, 1.75)}</span><span class="at-pv-row-text"><span class="at-pv-row-name">${n}</span><span class="at-pv-help">${d}</span></span>${icon(chevronSvg, 18)}</button>`,
        )
        .join('') +
      `</div>` +
      (account
        ? `<button type="button" class="at-button at-button-outline at-pv-danger" aria-expanded="false" aria-controls="pv-delete" data-acct="delete">${icon(trashSvg, 16)}${tr('account.delete')}</button>` +
          `<div class="at-pv-confirm" id="pv-delete" hidden><span>${tr('account.deleteWhat')}</span><span class="at-pv-confirm-btns"><button type="button" class="at-button at-button-outline at-button-sm" data-acct="keep">${tr('account.keep')}</button><button type="button" class="at-button at-button-destructive at-button-sm" data-acct="confirm">${tr('account.deleteYes')}</button></span></div>`
        : '') +
      `<span class="at-pv-help" role="status" data-acct-status></span>` +
      `<span class="at-pv-help">${tr('account.help')}</span>` +
      `</div>`;
  };

  const status = (key: string) => {
    const el = host.querySelector('[data-acct-status]');
    if (el) el.textContent = t(`pro.view.${key}`);
  };

  host.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-acct]') : null;
    if (!b) return;
    const panel = host.querySelector<HTMLElement>('#pv-delete');
    switch (b.dataset.acct) {
      case 'devices':
        go('devices');
        break;
      case 'export':
        exportMyData();
        status('account.exported');
        break;
      case 'history':
        if (exportHistoryCsv(ctx)) status('account.exported');
        break;
      case 'signout':
        signOut();
        paint();
        status('account.signedOut');
        break;
      case 'delete':
        b.setAttribute('aria-expanded', 'true');
        if (panel) panel.hidden = false;
        panel?.querySelector<HTMLElement>('[data-acct="keep"]')?.focus();
        break;
      case 'keep':
        if (panel) panel.hidden = true;
        host.querySelector<HTMLElement>('[data-acct="delete"]')?.focus();
        break;
      case 'confirm':
        signOut();
        paint();
        status('account.deleted');
        break;
    }
  });

  paint();
  const lic = ctx.store.get().license;
  if (lic && cache?.token !== lic.token) void loadRows(lic.token).then(paint);
  return () => undefined;
}

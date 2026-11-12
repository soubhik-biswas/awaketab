import { Mark, mount } from '../../src/ui';
import './options.css';
import { STORAGE_KEYS } from '@awaketab/core';
import { Switch, ToggleGroup } from 'radix-ui';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { browser } from 'wxt/browser';
import type { IExtApi, ITab } from '../../src/api';
import { loadPage, watchTheme, type IPageContext } from '../../src/page';
import {
  chimeOf,
  EXT_CHIMES,
  EXT_KEYS,
  isExtChime,
  normalizeHost,
  originPattern,
  readExt,
  readSettings,
  type IExtSettings,
  type TExtChime,
} from '../../src/settings';

type TNote = { key: 'ext.options.noSite' } | { key: 'ext.options.denied'; site: string } | null;

const ARRIVE = { duration: 0.42, ease: [0.16, 1, 0.3, 1] } as const;

function SwitchRow(props: { title: string; desc: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <Switch.Root className="xo-row" checked={props.checked} onCheckedChange={props.onChange}>
      <span className="xo-text">
        <strong className="xo-title">{props.title}</strong>
        <span className="xo-desc">{props.desc}</span>
      </span>
      <span className="at-switch" data-state={props.checked ? 'checked' : 'unchecked'} aria-hidden="true">
        <Switch.Thumb className="at-switch-thumb" />
      </span>
    </Switch.Root>
  );
}

// The sites the user was just on: the tabs Chrome lets us read (activeTab after a toolbar click, or a site already
// granted), most recently used first.
function readableSites(tabs: ITab[]): string[] {
  return tabs
    .filter((tab) => tab.url?.startsWith('https://'))
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .map((tab) => normalizeHost(tab.url ?? ''))
    .filter((host): host is string => host !== null);
}

function Options({ ctx, first }: { ctx: IPageContext; first: IExtSettings }) {
  const { api, t } = ctx;
  const reducedMotion = useReducedMotion();
  const [ext, setExt] = useState<IExtSettings>(first);
  const [chime, setChime] = useState<TExtChime>(chimeOf(ctx.settings));
  const [seen, setSeen] = useState<string[]>([]);
  const [note, setNote] = useState<TNote>(null);

  useEffect(() => watchTheme(ctx.settings.theme, () => undefined), [ctx.settings.theme]);

  const save = useCallback(
    (next: IExtSettings) => {
      setExt(next);
      void api.storage.local.set({ [EXT_KEYS.ext]: next });
    },
    [api],
  );

  const pickChime = async (value: string) => {
    if (!isExtChime(value)) return;
    setChime(value);
    // Read the settings again first: the popup may have saved a new length since this page opened.
    const stored = await api.storage.local.get(STORAGE_KEYS.settings);
    const settings = readSettings(stored[STORAGE_KEYS.settings]);
    await api.storage.local.set({ [STORAGE_KEYS.settings]: { ...settings, sound: { ...settings.sound, id: value } } });
  };

  const look = useCallback(async () => {
    try {
      setSeen(readableSites(await api.tabs.query({})));
    } catch {
      setSeen([]);
    }
  }, [api]);

  // Coming back to this tab from the site is the usual way in, so look again whenever the page is shown.
  useEffect(() => {
    void look();
    const onShow = () => {
      if (document.visibilityState === 'visible') void look();
    };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('focus', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('focus', onShow);
    };
  }, [look]);

  const candidate = seen.find((host) => !ext.autostart.sites.some((site) => site.host === host)) ?? null;

  const add = async () => {
    const host = candidate;
    if (!host) {
      setNote({ key: 'ext.options.noSite' });
      return;
    }
    // Asked straight from the click, so Chrome sees the user's gesture.
    const granted = await api.permissions.request({ origins: [originPattern(host)] }).catch(() => false);
    if (!granted) {
      setNote({ key: 'ext.options.denied', site: host });
      return;
    }
    setNote(null);
    save({ ...ext, autostart: { ...ext.autostart, sites: [...ext.autostart.sites, { host, durationMin: null }] } });
  };

  const remove = (host: string) => {
    void api.permissions.remove({ origins: [originPattern(host)] }).catch(() => false);
    save({ ...ext, autostart: { ...ext.autostart, sites: ext.autostart.sites.filter((s) => s.host !== host) } });
  };

  let noteText: ReactNode = null;
  if (note?.key === 'ext.options.noSite') noteText = t(note.key);
  else if (note?.key === 'ext.options.denied') noteText = t(note.key, { site: note.site });

  return (
    <main className="xo" data-root>
      <motion.section
        className="xo-card"
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : ARRIVE}
      >
        <header className="xo-head">
          <Mark size={28} />
          <h1 className="xo-h1">{t('ext.options.title')}</h1>
        </header>
        <SwitchRow
          title={t('ext.options.badge')}
          desc={t('ext.options.badge.desc')}
          checked={ext.badge}
          onChange={(on) => save({ ...ext, badge: on })}
        />
        <SwitchRow
          title={t('ext.options.auto')}
          desc={t('ext.options.auto.desc')}
          checked={ext.autostart.on}
          onChange={(on) => save({ ...ext, autostart: { ...ext.autostart, on } })}
        />
        <SwitchRow
          title={t('ext.options.hidden')}
          desc={t('ext.options.hidden.desc')}
          checked={ext.releaseHidden}
          onChange={(on) => save({ ...ext, releaseHidden: on })}
        />
        <div className="xo-pick">
          <span className="xo-text">
            <strong id="xo-chime-h" className="xo-title">
              {t('ext.options.chime')}
            </strong>
            <span id="xo-chime-d" className="xo-desc">
              {t('ext.options.chime.desc')}
            </span>
          </span>
          <ToggleGroup.Root
            type="single"
            value={chime}
            onValueChange={(value) => void pickChime(value)}
            aria-labelledby="xo-chime-h"
            aria-describedby="xo-chime-d"
            className="xo-seg"
            data-chime
          >
            {EXT_CHIMES.map((id) => (
              <ToggleGroup.Item key={id} value={id} className="xo-seg-item" data-chime-id={id}>
                {t(`ext.options.chime.${id}`)}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
        <div className="xo-sites" role="group" aria-labelledby="xo-sites-h">
          <strong id="xo-sites-h" className="xo-title">
            {t('ext.options.sites')}
          </strong>
          <ul className="xo-chips">
            {ext.autostart.sites.map((site) => (
              <li key={site.host}>
                <button
                  type="button"
                  className="xo-chip"
                  onClick={() => remove(site.host)}
                  aria-label={t('ext.options.remove', { site: site.host })}
                >
                  {site.host} ✕
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="xo-chip xo-chip-add" onClick={() => void add()} data-add>
                {t('ext.options.add')}
              </button>
            </li>
          </ul>
          <AnimatePresence initial={false}>
            {noteText ? (
              <motion.p
                key={note?.key}
                className="xo-note"
                role="status"
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={reducedMotion ? { duration: 0 } : ARRIVE}
              >
                {noteText}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.section>
    </main>
  );
}

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const [ctx, stored] = await Promise.all([loadPage(api), api.storage.local.get(EXT_KEYS.ext)]);
  document.title = ctx.t('ext.options.title');
  mount(<Options ctx={ctx} first={readExt(stored[EXT_KEYS.ext])} />);
}

void boot();

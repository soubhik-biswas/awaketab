import { Mark, mount, secondsSinceMidnight, useNow } from '../../src/ui';
import './popup.css';
import type { ISession } from '@awaketab/core';
import { motion } from 'motion/react';
import { ToggleGroup } from 'radix-ui';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { browser } from 'wxt/browser';
import { Face } from '../../../site/components/face/face';
import { toFaceId, type TFaceState } from '../../../site/components/face/model';
import type { IExtApi, IStorageChange } from '../../src/api';
import type { IExtState, ITabRef, TExtRequest } from '../../src/messages';
import { loadPage, send, watchTheme, type IPageContext, type TPageTheme } from '../../src/page';
import { EXT_PRESETS, isExtPreset, presetOf, type TExtPreset } from '../../src/settings';
import { isLive, pillCopy, remainingMs, totalMs, type TExtView } from '../../src/status';

const APP_URL = 'https://awaketab.com/?source=ext';
const FIX_URL = 'https://awaketab.com/help?source=ext';
const PRESET_SEC: Record<TExtPreset, number> = { p15: 900, p30: 1800, p60: 3600, pinf: 0 };
const FACE_STATE: Record<TExtView, TFaceState> = {
  ready: 'idle',
  awake: 'running',
  paused: 'paused',
  blocked: 'blocked',
};
const THUMB = { type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] } as const;

function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4h4v16H6z M14 4h4v16h-4z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2.5" />
    </svg>
  );
}

function elapsedSec(s: ISession, now: number): number {
  const pausedNow = s.status === 'paused' && s.pausedAt !== null ? now - s.pausedAt : 0;
  return Math.max(0, Math.floor((now - s.startedAt - s.pausedMs - pausedNow) / 1000));
}

async function activeTab(api: IExtApi): Promise<ITabRef | undefined> {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    return tab?.id !== undefined && tab.windowId !== undefined ? { tabId: tab.id, windowId: tab.windowId } : undefined;
  } catch {
    return undefined;
  }
}

// The toolbar popup: logo and status, the face, the four lengths, one primary action and the way to the full app.
function Popup({ ctx, first }: { ctx: IPageContext; first: IExtState | null }) {
  const { api, t } = ctx;
  const [state, setState] = useState<IExtState | null>(first);
  const [failed, setFailed] = useState(first === null);
  const [chosen, setChosen] = useState<TExtPreset>(presetOf(ctx.settings));
  const [theme, setTheme] = useState<TPageTheme>('dark');
  const now = useNow();

  useEffect(() => watchTheme(ctx.settings.theme, setTheme), [ctx.settings.theme]);

  const refresh = useCallback(async () => {
    const next = await send(api, { type: 'state' });
    if (next) {
      setState(next);
      setFailed(false);
    }
  }, [api]);

  // The worker writes the session to storage on every change, so a local change means the state moved.
  useEffect(() => {
    const onChange = (_changes: Record<string, IStorageChange>, area: string) => {
      if (area === 'local') void refresh();
    };
    api.storage.onChanged.addListener(onChange);
    return () => {
      api.storage.onChanged.removeListener(onChange);
    };
  }, [api, refresh]);

  const act = async (request: TExtRequest) => {
    const next = await send(api, request);
    setFailed(next === null);
    if (next) setState(next);
  };

  const start = async (presetId: TExtPreset) => {
    const tab = await activeTab(api);
    await act(tab ? { type: 'start', presetId, tab } : { type: 'start', presetId });
  };

  const view: TExtView = state?.view ?? 'ready';
  const session = state?.session ?? null;
  const live = isLive(session) ? session : null;
  const selected: TExtPreset | '' = live ? (isExtPreset(live.presetId) ? live.presetId : '') : chosen;
  const indef = live ? live.endsAt === null : chosen === 'pinf';
  const left = live ? remainingMs(live, now) : null;
  const remain = live ? (indef ? elapsedSec(live, now) : Math.ceil((left ?? 0) / 1000)) : PRESET_SEC[chosen];
  const total = live ? Math.round((totalMs(live) ?? 3_600_000) / 1000) : PRESET_SEC[chosen] || 3600;
  const pill = pillCopy(view, state?.lock ?? 'idle', live, now);

  const pick = (value: string) => {
    if (!isExtPreset(value)) return;
    if (live || view === 'blocked') void start(value);
    else setChosen(value);
  };

  return (
    <main className="xp" data-view={view} data-root>
      <header className="xp-head">
        <Mark size={24} />
        <strong className="xp-word">AwakeTab</strong>
        <span className="xp-pill-slot">
          <span className="at-pill" data-view={view} role="status" aria-live="polite" data-pill>
            <span className="at-dot" aria-hidden="true" />
            {t(pill.key, pill.vars)}
          </span>
        </span>
      </header>

      <div className="xp-body" style={{ '--xp-glow': `var(--at-glow-${view})` } as CSSProperties}>
        <Face
          face={toFaceId(ctx.settings.face)}
          theme={theme}
          state={FACE_STATE[view]}
          remain={remain}
          total={total}
          indef={indef}
          nowSec={secondsSinceMidnight(now)}
          size={220}
          bare
          motion="auto"
        />

        <ToggleGroup.Root
          type="single"
          value={selected}
          onValueChange={pick}
          aria-label={t('ext.chips')}
          className="xp-chips"
          data-chips
        >
          {EXT_PRESETS.map((p) => (
            <ToggleGroup.Item
              key={p}
              value={p}
              className="xp-chip"
              aria-label={t(`ext.chip.${p}.aria`)}
              data-preset={p}
            >
              {selected === p ? (
                <motion.span layoutId="xp-thumb" className="xp-thumb" transition={THUMB} aria-hidden="true" />
              ) : null}
              <span className="xp-chip-text">{t(`ext.chip.${p}`)}</span>
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>

        {failed ? (
          <p className="xp-alert" role="alert">
            {t('ext.noAnswer')}
          </p>
        ) : null}

        {view === 'blocked' ? (
          <a className="xp-cta xp-cta-fix" href={FIX_URL} target="_blank" rel="noopener" aria-label={t('ext.fix.aria')}>
            {t('ext.fix')}
          </a>
        ) : view === 'awake' ? (
          <button type="button" className="xp-cta" onClick={() => void act({ type: 'pause' })} data-primary>
            <PauseIcon />
            {t('ext.pause')}
          </button>
        ) : view === 'paused' ? (
          <span className="xp-row">
            <button type="button" className="xp-cta" onClick={() => void act({ type: 'resume' })} data-primary>
              <PlayIcon size={18} />
              {t('ext.resume')}
            </button>
            <button
              type="button"
              className="xp-stop"
              onClick={() => void act({ type: 'stop' })}
              aria-label={t('ext.stop')}
              data-stop
            >
              <StopIcon />
            </button>
          </span>
        ) : (
          <button type="button" className="xp-cta" onClick={() => void start(chosen)} data-primary>
            <PlayIcon size={18} />
            {t('ext.start')}
          </button>
        )}
      </div>

      <footer className="xp-foot">
        <span>{t('ext.foot.anyTab')}</span>
        <a className="xp-open" href={APP_URL} target="_blank" rel="noopener" aria-label={t('ext.foot.open.aria')}>
          {t('ext.foot.open')}
        </a>
      </footer>
    </main>
  );
}

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const [ctx, first] = await Promise.all([loadPage(api), send(api, { type: 'state' })]);
  mount(<Popup ctx={ctx} first={first} />);
}

void boot();

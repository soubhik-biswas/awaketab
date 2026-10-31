'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { isFaceId } from '@/components/face';
import { updateSettings } from '@/lib/tool/settings';
import { toolUi, type TBanner, type TToolView } from '@/lib/tool/ui';
import { wake, type TWakeState } from '@/lib/wake';

export type TQaMessage =
  | { type: 'at-qa'; action: 'state'; state: TWakeState; total?: number; remain?: number }
  | { type: 'at-qa'; action: 'view'; view: TToolView; emptyPresets?: boolean; query?: string }
  | { type: 'at-qa'; action: 'banner'; banner: TBanner }
  | { type: 'at-qa'; action: 'theme'; theme: 'system' | 'light' | 'dark' | 'oled' }
  | { type: 'at-qa'; action: 'face'; face: string }
  | { type: 'at-qa'; action: 'time'; remain: number }
  | { type: 'at-qa'; action: 'extend' }
  | { type: 'at-qa'; action: 'boardTime'; on: boolean }
  | { type: 'at-qa'; action: 'samples'; on: boolean }
  | { type: 'at-qa'; action: 'reset' };

// The boards' sample moment: Thursday, 29 October 2026 at 11:03:48 AM.
const BOARD_NOW = new Date(2026, 9, 29, 11, 3, 48).getTime();
const BOARD_LABEL = 'Presenting to the board';

// Puts the session in a drawn state the way the design's prototype controls do, without asking the browser.
export function qaState(state: TWakeState, total = 3600, remain = 2292) {
  const now = Date.now();
  const live = state !== 'idle' && state !== 'unsupported' && state !== 'ended';
  const noEnd = total === 0;
  wake.qaJump({
    state,
    totalSec: total,
    startedAt: live || state === 'ended' ? now - (noEnd ? remain : total - remain) * 1000 : null,
    endsAt: live && !noEnd ? now + remain * 1000 : state === 'ended' ? now : null,
    pausedAt: state === 'paused' ? now : null,
    pausedMs: 0,
    pauseReason: state === 'paused' ? 'user' : null,
    endedAt: state === 'ended' ? now : null,
    mode: state === 'fallback' ? 'video' : live ? 'native' : null,
    supported: state !== 'unsupported',
    advice: null,
    lastExtendSec: 0,
    announce: null,
  });
  if (!live) updateSettings({ totalSec: total });
  if (state === 'ended') wake.qaEnded();
}

export function QaBridge() {
  const { setTheme } = useTheme();
  useEffect(() => {
    const onMsg = (e: MessageEvent<TQaMessage | null>) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'at-qa') return;
      const msg = e.data;
      switch (msg.action) {
        case 'state':
          qaState(msg.state, msg.total, msg.remain);
          break;
        case 'view':
          toolUi.qa({ emptyPresets: msg.emptyPresets === true });
          toolUi.go(msg.view);
          if (msg.query) toolUi.set({ palQuery: msg.query });
          break;
        case 'banner':
          toolUi.qa({ banner: msg.banner });
          break;
        case 'theme':
          setTheme(msg.theme);
          updateSettings({ theme: msg.theme === 'system' ? 'auto' : msg.theme });
          break;
        case 'face':
          if (isFaceId(msg.face)) updateSettings({ face: msg.face });
          break;
        case 'time':
          qaState('running', Math.max(3600, msg.remain), msg.remain);
          break;
        case 'extend':
          wake.extend(900);
          break;
        case 'boardTime':
          toolUi.qa({ offsetMs: msg.on ? BOARD_NOW - Date.now() : 0 });
          if (msg.on) updateSettings({ label: BOARD_LABEL });
          break;
        case 'samples':
          toolUi.qa({ samples: msg.on });
          break;
        case 'reset':
          for (const k of Object.keys(localStorage)) if (k.startsWith('at.')) localStorage.removeItem(k);
          window.location.reload();
          break;
      }
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: 'at-qa-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, [setTheme]);
  return null;
}

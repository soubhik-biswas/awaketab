import { wake } from '@/lib/wake';
import type { TFields } from './client';
import {
  IDLE_VIEW,
  isLive,
  minutes,
  newMemo,
  startedJustNow,
  step,
  type ILook,
  type IWakeView,
} from './session-events';

const POLL_MS = 2000;

interface ISessionWatch {
  stop: () => void;
  leave: () => void;
}

export function watchSessions(track: (event: string, fields?: TFields) => void, look: () => ILook): ISessionWatch {
  let memo = newMemo(Date.now());
  let prev: IWakeView = IDLE_VIEW;
  let unsubscribe: (() => void) | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;

  const read = (now: number) => {
    const next: IWakeView = wake.getSnapshot();
    const out = step(memo, prev, next, now, document.visibilityState === 'visible', look);
    memo = out.memo;
    prev = next;
    for (const e of out.events) track(e.event, e.fields);
  };

  // Subscribing starts the wake controller, which only the tool may do: its clock stays at 0 until then.
  const attach = () => {
    const first = wake.getSnapshot();
    if (unsubscribe || first.now === 0) return;
    if (poll !== null) clearInterval(poll);
    poll = null;
    const now = Date.now();
    memo = newMemo(now);
    prev = startedJustNow(first, now) ? IDLE_VIEW : first;
    unsubscribe = wake.subscribe(() => read(Date.now()));
    read(now);
  };

  poll = setInterval(attach, POLL_MS);
  attach();

  return {
    stop() {
      if (poll !== null) clearInterval(poll);
      poll = null;
      unsubscribe?.();
      unsubscribe = null;
    },
    // The tab is closing or leaving mid-session: the minutes so far are counted, and a return starts from zero.
    leave() {
      if (!unsubscribe || !isLive(prev)) return;
      read(Date.now());
      if (!isLive(prev)) return;
      track('session_end', { reason: 'closed', durationMin: minutes(memo.awakeMs) });
      memo = { ...memo, awakeMs: 0 };
    },
  };
}

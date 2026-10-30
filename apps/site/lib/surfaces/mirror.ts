import type { IWakeSnapshot, TPauseReason, TWakeState } from '@/lib/wake';

export const MIRROR_CHANNEL = 'awaketab';
export const MIRROR_STALE_MS = 4000;
const HEARTBEAT_MS = 1500;

export type TMirrorSnap = Pick<
  IWakeSnapshot,
  'state' | 'now' | 'totalSec' | 'endsAt' | 'pausedAt' | 'pauseReason' | 'endedAt' | 'mode'
>;

// The same envelope as the tabs protocol in @awaketab/core, plus the engine's own state for the mini clock.
export type TMirrorMessage =
  | { type: 'hello'; tabId: string; ts: number }
  | {
      type: 'state';
      tabId: string;
      ts: number;
      status: 'active' | 'paused' | 'inactive';
      startedAt: number | null;
      endsAt: number | null;
      pausedAt: number | null;
      surface: {
        state: TWakeState;
        totalSec: number;
        pauseReason: TPauseReason | null;
        endedAt: number | null;
        mode: 'native' | 'video' | null;
      };
    }
  | { type: 'intent'; tabId: string; ts: number; target: string; action: 'stop' | 'add'; ms?: number }
  | { type: 'bye'; tabId: string; ts: number };

const WAKE_STATES: readonly TWakeState[] = [
  'idle',
  'starting',
  'running',
  'fallback',
  'paused',
  'needsyou',
  'blocked',
  'unsupported',
  'ended',
];

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());

const openChannel = (): BroadcastChannel | null =>
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(MIRROR_CHANNEL);

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function stateMessage(tabId: string, s: IWakeSnapshot, ts = Date.now()): TMirrorMessage {
  const live = s.state !== 'idle' && s.state !== 'ended' && s.state !== 'unsupported';
  return {
    type: 'state',
    tabId,
    ts,
    status: !live ? 'inactive' : s.pausedAt !== null ? 'paused' : 'active',
    startedAt: s.startedAt,
    endsAt: s.endsAt,
    pausedAt: s.pausedAt,
    surface: { state: s.state, totalSec: s.totalSec, pauseReason: s.pauseReason, endedAt: s.endedAt, mode: s.mode },
  };
}

// A state message from another window, checked field by field; anything else on the channel is ignored.
export function readState(data: unknown, now = Date.now()): (TMirrorSnap & { tabId: string; ts: number }) | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.type !== 'state' || typeof m.tabId !== 'string' || !m.surface || typeof m.surface !== 'object') return null;
  const s = m.surface as Record<string, unknown>;
  if (!WAKE_STATES.includes(s.state as TWakeState)) return null;
  return {
    tabId: m.tabId,
    ts: num(m.ts) ?? now,
    state: s.state as TWakeState,
    now,
    totalSec: num(s.totalSec) ?? 0,
    endsAt: num(m.endsAt),
    pausedAt: num(m.pausedAt),
    pauseReason: s.pauseReason === 'user' || s.pauseReason === 'hidden' ? s.pauseReason : null,
    endedAt: num(s.endedAt),
    mode: s.mode === 'native' || s.mode === 'video' ? s.mode : null,
  };
}

export interface IMirrorHostActions {
  extend(sec: number): void;
  stop(): void;
}

// The opener's side: tells the mini clock popup what the engine is doing and carries out its +15 and stop.
export function hostMirror(
  read: () => IWakeSnapshot,
  subscribe: (cb: () => void) => () => void,
  actions: IMirrorHostActions,
  channel?: BroadcastChannel,
): () => void {
  const ch = channel ?? openChannel();
  if (!ch) return () => undefined;
  const tabId = newId();
  let last = '';
  const post = (force = false) => {
    const s = read();
    const key = `${s.state}|${s.endsAt}|${s.pausedAt}|${s.totalSec}|${s.mode}`;
    if (!force && key === last) return;
    last = key;
    ch.postMessage(stateMessage(tabId, s));
  };
  const onMessage = (ev: MessageEvent<unknown>) => {
    const m = ev.data as Partial<TMirrorMessage> | null;
    if (!m || typeof m !== 'object' || m.tabId === tabId) return;
    if (m.type === 'hello') post(true);
    if (m.type === 'intent' && m.target === tabId) {
      if (m.action === 'stop') actions.stop();
      if (m.action === 'add') actions.extend(Math.round((num(m.ms) ?? 900_000) / 1000));
    }
  };
  ch.addEventListener('message', onMessage);
  const off = subscribe(() => post());
  const beat = setInterval(() => post(true), HEARTBEAT_MS);
  post(true);
  return () => {
    off();
    clearInterval(beat);
    ch.removeEventListener('message', onMessage);
    ch.postMessage({ type: 'bye', tabId, ts: Date.now() } satisfies TMirrorMessage);
    if (!channel) ch.close();
  };
}

export interface IMirror {
  snap(now?: number): TMirrorSnap | null;
  send(action: 'stop' | 'add', ms?: number): void;
  dispose(): void;
}

// The popup's side: the freshest opener that is keeping a session, or nothing once it has gone quiet.
export function joinMirror(
  onChange: () => void,
  given?: BroadcastChannel,
): IMirror {
  const channel = given ?? openChannel();
  const tabId = newId();
  const peers = new Map<string, TMirrorSnap & { tabId: string; ts: number; heard: number }>();
  const onMessage = (ev: MessageEvent<unknown>) => {
    const m = ev.data as Partial<TMirrorMessage> | null;
    if (!m || typeof m !== 'object' || m.tabId === tabId) return;
    if (m.type === 'bye' && typeof m.tabId === 'string') peers.delete(m.tabId);
    const s = readState(m);
    if (s) peers.set(s.tabId, { ...s, heard: Date.now() });
    onChange();
  };
  channel?.addEventListener('message', onMessage);
  channel?.postMessage({ type: 'hello', tabId, ts: Date.now() } satisfies TMirrorMessage);
  const owner = (now: number) => {
    let best: (TMirrorSnap & { tabId: string; heard: number }) | null = null;
    for (const p of peers.values()) {
      if (now - p.heard > MIRROR_STALE_MS) continue;
      const live = p.state !== 'idle' && p.state !== 'ended';
      const bestLive = best !== null && best.state !== 'idle' && best.state !== 'ended';
      if (!best || (live && !bestLive) || (live === bestLive && p.heard > best.heard)) best = p;
    }
    return best;
  };
  return {
    snap(now = Date.now()) {
      const o = owner(now);
      return o ? { ...o, now } : null;
    },
    send(action, ms) {
      const o = owner(Date.now());
      if (!o) return;
      channel?.postMessage({
        type: 'intent',
        tabId,
        ts: Date.now(),
        target: o.tabId,
        action,
        ...(action === 'add' ? { ms: ms ?? 900_000 } : {}),
      } satisfies TMirrorMessage);
    },
    dispose() {
      channel?.removeEventListener('message', onMessage);
      channel?.postMessage({ type: 'bye', tabId, ts: Date.now() } satisfies TMirrorMessage);
      if (!given) channel?.close();
    },
  };
}

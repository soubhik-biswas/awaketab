import type { ISession, TLockState } from '@awaketab/core';

export type TOrigin = 'user' | 'command' | 'autostart';

// The four things the popup, the pill and the toolbar badge can say.
export type TExtView = 'ready' | 'awake' | 'paused' | 'blocked';

export interface IBadge {
  text: string;
  bg: string;
  fg: string;
}

// The extension board's badge colours: volt, amber and red, each with its own dark ink.
export const BADGE: Record<Exclude<TExtView, 'ready'>, { bg: string; fg: string }> = {
  awake: { bg: '#3DF58E', fg: '#04140A' },
  paused: { bg: '#FFC53D', fg: '#1A1200' },
  blocked: { bg: '#FF6B81', fg: '#1A0509' },
};

export type TLiveSession = ISession & { status: 'active' | 'paused' };

export function isLive(session: ISession | null | undefined): session is TLiveSession {
  return session?.status === 'active' || session?.status === 'paused';
}

export function viewOf(lock: TLockState, session: ISession | null | undefined): TExtView {
  if (lock === 'denied' || lock === 'unsupported') return 'blocked';
  if (session?.status === 'paused') return 'paused';
  if (lock === 'held' && session?.status === 'active') return 'awake';
  return 'ready';
}

export function remainingMs(session: ISession, now: number): number | null {
  if (session.endsAt === null) return null;
  if (session.plan.type === 'duration') {
    const pausedNow = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
    return Math.max(0, session.endsAt - now + session.pausedMs + pausedNow);
  }
  return Math.max(0, session.endsAt - now);
}

export function totalMs(session: ISession): number | null {
  if (session.plan.type === 'duration') return session.plan.ms;
  if (session.endsAt === null) return null;
  return Math.max(1, session.endsAt - session.startedAt);
}

export function minutesLeft(session: ISession, now: number): number | null {
  const rem = remainingMs(session, now);
  return rem === null ? null : Math.max(1, Math.ceil(rem / 60_000));
}

// Shape, colour and text together, never colour alone: minutes left (or ∞) while awake, II paused, ! blocked.
export function badgeOf(view: TExtView, session: ISession | null, now: number, showTime: boolean): IBadge | null {
  if (view === 'ready') return null;
  if (view === 'paused') return { text: 'II', ...BADGE.paused };
  if (view === 'blocked') return { text: '!', ...BADGE.blocked };
  const minutes = session ? minutesLeft(session, now) : null;
  let text = 'ON';
  if (showTime)
    text = minutes === null ? '∞' : minutes < 100 ? String(minutes) : `${String(Math.floor(minutes / 60))}h`;
  return { text, ...BADGE.awake };
}

export function originOf(session: ISession | null | undefined): TOrigin | null {
  const origin = session?.modeState.origin;
  return origin === 'user' || origin === 'command' || origin === 'autostart' ? origin : null;
}

// The tab a session belongs to, for release-when-hidden.
export function tabOf(session: ISession | null | undefined): { tabId: number; windowId: number } | null {
  const tabId = session?.modeState.tabId;
  const windowId = session?.modeState.windowId;
  return typeof tabId === 'number' && typeof windowId === 'number' ? { tabId, windowId } : null;
}

export function hiddenPause(session: ISession | null | undefined): boolean {
  return session?.status === 'paused' && session.modeState.hidden === true;
}

// The pill's words for each view, shared by the popup and the toolbar title.
export function pillCopy(
  view: TExtView,
  lock: TLockState,
  session: ISession | null,
  now: number,
): { key: string; vars?: { minutes: number } } {
  const minutes = session ? minutesLeft(session, now) : null;
  switch (view) {
    case 'awake':
      return minutes === null ? { key: 'ext.pill.awakeOpen' } : { key: 'ext.pill.awake', vars: { minutes } };
    case 'paused':
      if (hiddenPause(session)) return { key: 'ext.pill.hidden' };
      return minutes === null ? { key: 'ext.pill.pausedOpen' } : { key: 'ext.pill.paused', vars: { minutes } };
    case 'blocked':
      return { key: lock === 'unsupported' ? 'ext.pill.unsupported' : 'ext.pill.blocked' };
    case 'ready':
      return { key: 'ext.pill.ready' };
  }
}

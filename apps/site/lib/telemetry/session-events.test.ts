// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { IDLE_VIEW, newMemo, startedJustNow, step, type IWakeView } from './session-events';

const T0 = 1_763_000_000_000;
const LOOK = () => ({ face: 'ring', background: 'aurora' });

const view = (patch: Partial<IWakeView>): IWakeView => ({ ...IDLE_VIEW, ...patch });
const running = (patch: Partial<IWakeView> = {}): IWakeView =>
  view({ state: 'running', startedAt: T0, endsAt: T0 + 3_600_000, totalSec: 3600, mode: 'native', ...patch });

// Walks the snapshots one second apart and returns every event the steps named.
function walk(views: IWakeView[], visible = true, stepMs = 1000) {
  let memo = newMemo(T0);
  let prev = views[0] ?? IDLE_VIEW;
  const out: { event: string; fields: Record<string, string | number> }[] = [];
  views.slice(1).forEach((next, i) => {
    const result = step(memo, prev, next, T0 + (i + 1) * stepMs, visible, LOOK);
    memo = result.memo;
    prev = next;
    out.push(...result.events);
  });
  return out;
}

const names = (events: { event: string }[]): string[] => events.map((e) => e.event);

describe('session events from the wake store', () => {
  it('names a start with its length, face and background', () => {
    const starting = view({ state: 'starting', startedAt: T0, endsAt: T0 + 2_700_000, totalSec: 2700 });
    expect(walk([IDLE_VIEW, starting])).toEqual([
      {
        event: 'session_start',
        fields: { planType: 'duration', presetId: 'p45', lengthMin: 45, face: 'ring', background: 'aurora' },
      },
    ]);
  });

  it('names a session with no end and a custom length', () => {
    const noEnd = view({ state: 'starting', startedAt: T0, endsAt: null, totalSec: 0 });
    expect(walk([IDLE_VIEW, noEnd])[0]?.fields).toMatchObject({
      planType: 'indefinite',
      presetId: 'pinf',
      lengthMin: 0,
    });
    const custom = view({ state: 'starting', startedAt: T0, endsAt: T0 + 5_400_000, totalSec: 5400 });
    expect(walk([IDLE_VIEW, custom])[0]?.fields).toMatchObject({ presetId: 'custom', lengthMin: 90 });
  });

  it('says nothing while a session just ticks', () => {
    expect(walk([running(), running(), running()])).toEqual([]);
  });

  it('counts the minutes kept awake and how the session ended', () => {
    const ticks = Array.from({ length: 121 }, () => running());
    const completed = walk([...ticks, view({ state: 'ended', startedAt: T0, endsAt: T0 + 3_600_000 })]);
    expect(completed).toEqual([{ event: 'session_end', fields: { reason: 'completed', durationMin: 2 } }]);
    const stopped = walk([...ticks, IDLE_VIEW]);
    expect(stopped).toEqual([{ event: 'session_end', fields: { reason: 'stopped', durationMin: 2 } }]);
  });

  it('does not count a paused or waiting stretch, or a sleep, as time kept awake', () => {
    const paused = running({ state: 'paused', pausedAt: T0 });
    const quiet = walk([...Array.from({ length: 121 }, () => paused), IDLE_VIEW]);
    expect(quiet[0]?.fields.durationMin).toBe(0);
    const slept = walk([running(), running(), IDLE_VIEW], true, 3_600_000);
    expect(slept[0]?.fields.durationMin).toBe(0);
  });

  it('ends the old session and starts the new one when a session is replaced', () => {
    const next = running({ state: 'starting', startedAt: T0 + 5000 });
    expect(names(walk([running(), next]))).toEqual(['session_end', 'session_start']);
    expect(walk([running(), next])[0]?.fields.reason).toBe('replaced');
  });

  it('names an extension only when the end moves later on a counting session', () => {
    const extended = walk([running(), running({ endsAt: T0 + 3_600_000 + 900_000 })]);
    expect(extended).toEqual([{ event: 'session_extend', fields: { addedMin: 15 } }]);
    const paused = running({ state: 'paused', pausedAt: T0 });
    expect(walk([paused, running({ endsAt: T0 + 3_600_000 + 900_000 })])).toEqual([]);
    expect(walk([running(), running({ endsAt: T0 + 3_600_000 - 900_000 })])).toEqual([]);
  });

  it('names a refused lock with its reason', () => {
    const starting = view({ state: 'starting', startedAt: T0, endsAt: T0 + 3_600_000, totalSec: 3600 });
    const blocked = walk([starting, { ...starting, state: 'blocked', advice: 'permissions_policy' }]);
    expect(blocked).toEqual([{ event: 'lock_denied', fields: { reason: 'permissions_policy' } }]);
    expect(walk([starting, { ...starting, state: 'blocked' }])[0]?.fields.reason).toBe('denied');
    const unsupported = walk([IDLE_VIEW, view({ state: 'unsupported', startedAt: T0 })]);
    expect(unsupported).toEqual([{ event: 'lock_denied', fields: { reason: 'unsupported' } }]);
  });

  it('names the video fallback once, and its failure', () => {
    const starting = view({ state: 'starting', startedAt: T0, endsAt: T0 + 3_600_000, totalSec: 3600, mode: 'video' });
    const held = { ...starting, state: 'fallback' };
    expect(names(walk([starting, held, held, { ...held, state: 'needsyou' }, held]))).toEqual(['fallback_used']);
    const failed = walk([starting, { ...starting, state: 'unsupported', mode: null }]);
    expect(names(failed)).toEqual(['session_end', 'lock_denied']);
    expect(failed[0]?.fields.reason).toBe('failed');
    expect(failed[1]?.fields.reason).toBe('fallback_failed');
  });

  it('names the tap to resume only after the tab has waited for one', () => {
    const needs = running({ state: 'needsyou' });
    expect(names(walk([running(), needs, running()]))).toEqual([]);
    expect(names(walk([running(), needs, needs, needs, running()]))).toEqual(['resume_shown', 'resume_accepted']);
    expect(names(walk([running(), needs, needs, needs, needs]))).toEqual(['resume_shown']);
    expect(names(walk([running(), needs, needs, needs, IDLE_VIEW]))).toEqual(['resume_shown', 'session_end']);
    expect(names(walk([running(), needs, needs, needs, needs], false))).toEqual([]);
  });

  it('treats a session restored from an earlier page as carried on, and a just-started one as new', () => {
    expect(startedJustNow(running({ startedAt: T0 - 2000 }), T0)).toBe(true);
    expect(startedJustNow(running({ startedAt: T0 - 60_000 }), T0)).toBe(false);
    expect(startedJustNow(running({ state: 'needsyou', startedAt: T0 - 2000 }), T0)).toBe(false);
    expect(startedJustNow(IDLE_VIEW, T0)).toBe(false);
  });
});

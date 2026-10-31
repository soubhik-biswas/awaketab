import { describe, expect, it } from 'vitest';
import { IDLE_SESSION, isDue, reduce, remainSec, type ISession } from './session';

const T0 = 1_800_000_000_000;

function running(sec = 3600): ISession {
  const started = reduce(IDLE_SESSION, { type: 'start', now: T0, totalSec: sec, supported: true });
  return reduce(started, { type: 'held', mode: 'native', now: T0 });
}

describe('session machine', () => {
  it('starts, holds the lock and keeps the end as a timestamp', () => {
    const s = running();
    expect(s.state).toBe('running');
    expect(s.endsAt).toBe(T0 + 3_600_000);
    expect(remainSec({ ...s, now: T0 + 60_000 })).toBe(3540);
  });

  it('goes straight to unsupported when the browser has no wake lock', () => {
    const s = reduce(IDLE_SESSION, { type: 'start', now: T0, totalSec: 3600, supported: false });
    expect(s.state).toBe('unsupported');
  });

  it('pauses and resumes without losing time', () => {
    const paused = reduce(running(), { type: 'pause', now: T0 + 10_000 });
    expect(paused.state).toBe('paused');
    const resumed = reduce(paused, { type: 'resume', now: T0 + 70_000 });
    expect(resumed.endsAt).toBe(T0 + 3_660_000);
    expect(reduce(resumed, { type: 'held', mode: 'native', now: T0 + 70_000 }).state).toBe('running');
  });

  it('never turns blocked while a lock is held', () => {
    const s = running();
    const next = reduce(s, { type: 'refused', mode: 'native', to: 'denied', advice: null, held: true, now: T0 });
    expect(next.state).toBe('running');
  });

  it('turns blocked on a real refusal and records when it checked', () => {
    const started = reduce(IDLE_SESSION, { type: 'start', now: T0, totalSec: 3600, supported: true });
    const next = reduce(started, { type: 'refused', mode: 'native', to: 'denied', advice: null, held: false, now: T0 });
    expect(next.state).toBe('blocked');
    expect(next.checkedAt).toBe(T0);
    expect(reduce(next, { type: 'fallback', now: T0 }).state).toBe('starting');
  });

  it('needs the person after the tab was hidden', () => {
    const hidden = reduce(running(), { type: 'hidden', now: T0 });
    expect(hidden.state).toBe('paused');
    const refused = reduce(hidden, {
      type: 'refused',
      mode: 'native',
      to: 'denied',
      advice: 'hidden_document',
      held: false,
      now: T0,
    });
    expect(refused.state).toBe('needsyou');
  });

  it('ends at zero and starts again with added time', () => {
    const s = running(60);
    expect(isDue(s, T0 + 60_000)).toBe(true);
    const ended = reduce(s, { type: 'end', now: T0 + 60_000 });
    expect(ended.state).toBe('ended');
    const again = reduce(ended, { type: 'extend', sec: 900, now: T0 + 61_000 });
    expect(again.state).toBe('starting');
    expect(again.totalSec).toBe(900);
  });

  it('extends and undoes the last extension', () => {
    const s = reduce(running(), { type: 'extend', sec: 900, now: T0 });
    expect(s.endsAt).toBe(T0 + 4_500_000);
    expect(reduce(s, { type: 'undo', now: T0 }).endsAt).toBe(T0 + 3_600_000);
  });

  it('stops back to idle', () => {
    expect(reduce(running(), { type: 'stop', now: T0 }).state).toBe('idle');
  });
});

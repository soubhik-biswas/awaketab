import { describe, expect, it } from 'vitest';
import { elapsedSec, IDLE_SESSION, isDue, reduce, remainSec, type ISession } from './session';

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

  it('freezes the clock only when the person pauses', () => {
    const paused = reduce(running(), { type: 'pause', now: T0 + 10_000 });
    expect(paused.pauseReason).toBe('user');
    expect(paused.pausedAt).toBe(T0 + 10_000);
    expect(remainSec({ ...paused, now: T0 + 10_000 })).toBe(3590);
    expect(remainSec({ ...paused, now: T0 + 600_000 })).toBe(3590);
    expect(elapsedSec({ ...paused, now: T0 + 600_000 })).toBe(10);
    expect(isDue(paused, T0 + 3_600_000)).toBe(false);
  });

  it('needs the person, with the clock still running, when a hidden tab loses the lock', () => {
    const hidden = reduce(running(), { type: 'hidden', now: T0 + 10_000 });
    expect(hidden.state).toBe('needsyou');
    expect(hidden.pausedAt).toBeNull();
    expect(hidden.endsAt).toBe(T0 + 3_600_000);
    expect(remainSec({ ...hidden, now: T0 + 70_000 })).toBe(3530);
    expect(elapsedSec({ ...hidden, now: T0 + 70_000 })).toBe(70);
  });

  it('goes back to running on return when the browser grants the lock, with no jump in the time', () => {
    const hidden = reduce(running(), { type: 'hidden', now: T0 + 10_000 });
    const back = reduce({ ...hidden, now: T0 + 70_000 }, { type: 'held', mode: 'native', now: T0 + 70_000 });
    expect(back.state).toBe('running');
    expect(back.pauseReason).toBeNull();
    expect(back.endsAt).toBe(T0 + 3_600_000);
    expect(back.pausedMs).toBe(0);
    expect(remainSec(back)).toBe(3530);
  });

  it('keeps needing the person on return when the browser wants a tap first', () => {
    const hidden = reduce(running(), { type: 'hidden', now: T0 });
    const refused = reduce(hidden, {
      type: 'refused',
      mode: 'native',
      to: 'denied',
      advice: 'hidden_document',
      held: false,
      now: T0,
    });
    expect(refused.state).toBe('needsyou');
    const tapped = reduce(refused, { type: 'resume', now: T0 + 5000 });
    expect(tapped.endsAt).toBe(T0 + 3_600_000);
    expect(reduce(tapped, { type: 'held', mode: 'native', now: T0 + 5000 }).state).toBe('running');
  });

  it("stays paused when the tab is hidden during the person's own pause", () => {
    const paused = reduce(running(), { type: 'pause', now: T0 + 10_000 });
    const hidden = reduce(paused, { type: 'hidden', now: T0 + 20_000 });
    expect(hidden).toBe(paused);
    expect(hidden.state).toBe('paused');
    expect(hidden.pauseReason).toBe('user');
  });

  it('ends on time when the end passes while the tab is hidden', () => {
    const hidden = reduce(running(60), { type: 'hidden', now: T0 + 10_000 });
    expect(isDue(hidden, T0 + 59_000)).toBe(false);
    expect(isDue(hidden, T0 + 60_000)).toBe(true);
    const ended = reduce(hidden, { type: 'end', now: T0 + 90_000 });
    expect(ended.state).toBe('ended');
    expect(ended.endedAt).toBe(T0 + 60_000);
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

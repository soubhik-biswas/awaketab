import { describe, expect, it } from 'vitest';
import { applyKioskHash, cleanText, driftAt, kioskQuery, kioskWindow, parseKioskQuery, parseLogo } from './kiosk';
import { joinMirror, readState, stateMessage } from './mirror';
import { digits, surfaceView } from './session';
import { readWidgetAction, widgetData, WIDGET_PRESETS } from './widgets';
import { WIDGET_ACTION } from './widget-protocol';
import type { IWakeSnapshot } from '@/lib/wake';

const at = (h: number, m = 0, day = 2) => new Date(2026, 10, day, h, m, 0, 0).getTime();

const snap = (patch: Partial<IWakeSnapshot> = {}): IWakeSnapshot => ({
  state: 'running',
  now: at(11, 3),
  totalSec: 3600,
  startedAt: at(10, 42),
  endsAt: at(11, 42),
  pausedAt: null,
  pausedMs: 0,
  pauseReason: null,
  endedAt: null,
  advice: null,
  mode: 'native',
  supported: true,
  lastExtendSec: 0,
  peerHolds: false,
  announce: null,
  ...patch,
});

describe('surface view', () => {
  it('reads an awake session with its end time', () => {
    const v = surfaceView(snap());
    expect(v.label).toBe('awake');
    expect(v.face).toBe('running');
    expect(v.until).toBe('11:42 AM');
    expect(v.canExtend).toBe(true);
    expect(v.remain).toBe(39 * 60);
  });

  it('says paused when the tab is hidden, unless the floating window holds its own lock', () => {
    const hidden = snap({ state: 'paused', pauseReason: 'hidden' });
    expect(surfaceView(hidden).label).toBe('hidden');
    expect(surfaceView(hidden, { held: true }).label).toBe('awake');
    expect(surfaceView(snap({ state: 'paused', pauseReason: 'user', pausedAt: at(11, 3) }), { held: true }).label).toBe(
      'paused',
    );
  });

  it('has no end and no +15 for an open-ended session', () => {
    const v = surfaceView(snap({ endsAt: null, totalSec: 0 }));
    expect(v.indef).toBe(true);
    expect(v.canExtend).toBe(false);
    expect(v.until).toBeNull();
  });

  it('says tomorrow past midnight', () => {
    expect(surfaceView(snap({ now: at(23, 30), endsAt: at(0, 30, 3) })).until).toBe('12:30 AM tomorrow');
  });

  it('formats digits like the board', () => {
    expect(digits(2292)).toBe('38:12');
    expect(digits(3725)).toBe('1:02:05');
  });
});

describe('mirror', () => {
  it('round-trips a state message', () => {
    const msg = stateMessage('tab', snap(), 5);
    const back = readState(msg, 10);
    expect(back?.state).toBe('running');
    expect(back?.endsAt).toBe(at(11, 42));
    expect(back?.now).toBe(10);
  });

  it('ignores anything that is not a state message', () => {
    expect(readState({ type: 'lock', tabId: 'x' })).toBeNull();
    expect(readState({ type: 'state', tabId: 'x', surface: { state: 'bogus' } })).toBeNull();
  });

  it('follows the opener and sends +15 to it', () => {
    const sent: unknown[] = [];
    const hub: { listener: ((ev: MessageEvent) => void) | null } = { listener: null };
    const channel = {
      postMessage: (m: unknown) => sent.push(m),
      addEventListener: (_: string, cb: (ev: MessageEvent) => void) => {
        hub.listener = cb;
      },
      removeEventListener: () => undefined,
      close: () => undefined,
    } as unknown as BroadcastChannel;
    const mirror = joinMirror(() => undefined, channel);
    expect(mirror.snap()).toBeNull();
    hub.listener?.({ data: stateMessage('opener', snap()) } as MessageEvent);
    expect(mirror.snap()?.state).toBe('running');
    mirror.send('add', 900_000);
    expect(sent.at(-1)).toMatchObject({ type: 'intent', target: 'opener', action: 'add', ms: 900_000 });
  });
});

describe('kiosk', () => {
  const defaults = { kicker: 'RECEPTION', msg: 'Please take a seat.', line: 'We’ll call your name.' };

  it('defaults to the board: LCD (for the retired LED), Midnight, weekdays 8 AM to 6 PM', () => {
    const cfg = parseKioskQuery('', defaults);
    expect(parseKioskQuery('?face=led', defaults).face).toBe('lcd');
    expect(cfg).toMatchObject({
      face: 'lcd',
      screen: 'dark',
      schedule: { days: 'weekdays', from: '08:00', to: '18:00' },
    });
  });

  it('round-trips its link', () => {
    const cfg = { ...parseKioskQuery('?face=moon&screen=oled&days=everyday&from=07-30&to=22-00', defaults) };
    expect(parseKioskQuery(`?${kioskQuery(cfg, defaults)}`, defaults)).toEqual(cfg);
  });

  it('finds the schedule window', () => {
    const s = { days: 'weekdays' as const, from: '08:00', to: '18:00' };
    const mon = at(9, 0, 2);
    expect(kioskWindow(s, mon)).toMatchObject({ inside: true, end: at(18, 0, 2) });
    expect(kioskWindow(s, at(19, 0, 2))).toMatchObject({ inside: false, next: at(8, 0, 3) });
    expect(kioskWindow(s, at(12, 0, 7))).toMatchObject({ inside: false, next: at(8, 0, 9) });
    expect(kioskWindow(null, mon).inside).toBe(true);
  });

  it('drifts through the four offsets', () => {
    expect([0, 1, 2, 3, 4].map(driftAt)).toEqual([
      [0, 0],
      [6, -4],
      [-5, 5],
      [4, 6],
      [0, 0],
    ]);
  });

  it('accepts only https logos and clean text', () => {
    expect(parseLogo('http://x.test/a.png')).toBeNull();
    expect(parseLogo('https://x.test/a.png')).toBe('https://x.test/a.png');
    expect(cleanText('  a\u0007  b ')).toBe('a b');
  });

  it('stores only a valid kiosk licence', async () => {
    const stored: unknown[] = [];
    const token = 'aaa.bbb.ccc';
    const ok = () =>
      Promise.resolve({
        valid: true,
        plan: 'biz_kiosk_site',
        features: ['ambient.logo' as const],
        exp: 9e9,
        grace: false,
      });
    expect(await applyKioskHash(`#lic=${token}`, ok, (r) => stored.push(r))).toBe('stored');
    const pro = () => Promise.resolve({ valid: true, plan: 'pro_yearly', features: [], exp: 9e9, grace: false });
    expect(await applyKioskHash(`#lic=${token}`, pro, (r) => stored.push(r))).toBe('invalid');
    expect(await applyKioskHash('', ok, (r) => stored.push(r))).toBe('none');
    expect(stored).toHaveLength(1);
  });
});

describe('widgets', () => {
  it('builds the widget data from the view', () => {
    const data = widgetData(surfaceView(snap()), {
      status: 'Awake',
      line: 'until 11:42 AM',
      label: 'Presenting to the board',
      extend: '+15 min',
      stop: 'Stop',
      presetsTitle: 'Presets',
      presets: [
        { name: 'Presenting', length: '1 h' },
        { name: 'Cooking', length: '45 m' },
        { name: 'Reading', length: '30 m' },
      ],
    });
    expect(data.digits).toBe('39:00');
    expect(data.presets.map((p) => p.preset)).toEqual(WIDGET_PRESETS.map((p) => p.preset));
  });

  it('reads only known widget taps', () => {
    expect(readWidgetAction({ type: WIDGET_ACTION, action: 'extend' })).toEqual({ action: 'extend' });
    expect(readWidgetAction({ type: WIDGET_ACTION, action: 'preset', preset: 'p45' })).toEqual({
      action: 'preset',
      preset: 'p45',
    });
    expect(readWidgetAction({ type: WIDGET_ACTION, action: 'preset', preset: 'p240' })).toBeNull();
    expect(readWidgetAction({ type: 'other', action: 'stop' })).toBeNull();
  });
});

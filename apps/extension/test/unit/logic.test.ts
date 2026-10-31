import type { ISession } from '@awaketab/core';
import { describe, expect, it } from 'vitest';
import { BG_PREFIX, LOCALES, readCatalog } from '../../scripts/i18n.mjs';
import { readChime } from '../../src/chime';
import { format, resolveLocale } from '../../src/i18n';
import { parseRequest } from '../../src/messages';
import { matchSite, normalizeHost, readExt, readSettings } from '../../src/settings';
import { BADGE, badgeOf, pillCopy, viewOf } from '../../src/status';

const live = (patch: Partial<ISession>): ISession => ({
  v: 1,
  id: 'x',
  plan: { type: 'indefinite' },
  presetId: 'pinf',
  mode: 'standard',
  startedAt: 0,
  endsAt: null,
  status: 'active',
  pausedAt: null,
  pausedMs: 0,
  endedAt: null,
  endReason: null,
  awakeSeconds: 0,
  modeState: {},
  source: 'ext',
  ...patch,
});

const timed = (patch: Partial<ISession> = {}) =>
  live({ plan: { type: 'duration', ms: 3_600_000 }, presetId: 'p60', endsAt: 3_600_000, ...patch });

describe('views, badge and pill (the extension board)', () => {
  it('reads ready, awake, paused and blocked from the lock and the session', () => {
    expect(viewOf('idle', null)).toBe('ready');
    expect(viewOf('held', live({}))).toBe('awake');
    expect(viewOf('idle', live({ status: 'paused', pausedAt: 1 }))).toBe('paused');
    expect(viewOf('denied', null)).toBe('blocked');
    expect(viewOf('unsupported', null)).toBe('blocked');
    expect(viewOf('idle', live({ status: 'completed' }))).toBe('ready');
  });

  it('badge: none when ready, volt minutes while awake, amber II paused, red ! blocked', () => {
    expect(badgeOf('ready', null, 0, true)).toBeNull();
    expect(badgeOf('awake', timed(), 60_000 * 22 + 1, true)).toEqual({ text: '38', ...BADGE.awake });
    expect(badgeOf('awake', live({}), 0, true)?.text).toBe('∞');
    expect(badgeOf('awake', timed({ endsAt: 4 * 3_600_000 }), 0, true)?.text).toBe('4h');
    expect(badgeOf('awake', timed(), 0, false)?.text).toBe('ON');
    expect(badgeOf('paused', timed({ status: 'paused', pausedAt: 0 }), 0, true)).toEqual({
      text: 'II',
      ...BADGE.paused,
    });
    expect(badgeOf('blocked', null, 0, true)).toEqual({ text: '!', ...BADGE.blocked });
    expect(BADGE.awake).toEqual({ bg: '#3DF58E', fg: '#04140A' });
    expect(BADGE.paused).toEqual({ bg: '#FFC53D', fg: '#1A1200' });
    expect(BADGE.blocked).toEqual({ bg: '#FF6B81', fg: '#1A0509' });
  });

  it('pill words follow the view, with the minutes left and the hidden-tab reason', () => {
    expect(pillCopy('ready', 'idle', null, 0)).toEqual({ key: 'ext.pill.ready' });
    expect(pillCopy('awake', 'held', timed(), 60_000 * 22)).toEqual({ key: 'ext.pill.awake', vars: { minutes: 38 } });
    expect(pillCopy('awake', 'held', live({}), 0)).toEqual({ key: 'ext.pill.awakeOpen' });
    const hidden = timed({ status: 'paused', pausedAt: 0, modeState: { hidden: true } });
    expect(pillCopy('paused', 'idle', hidden, 0)).toEqual({ key: 'ext.pill.hidden' });
    expect(pillCopy('blocked', 'unsupported', null, 0)).toEqual({ key: 'ext.pill.unsupported' });
    expect(pillCopy('blocked', 'denied', null, 0)).toEqual({ key: 'ext.pill.blocked' });
  });

  it('ships the worker its pill words in every locale', () => {
    for (const locale of LOCALES) {
      const keys = Object.keys(readCatalog(locale)).filter((k) => k.startsWith(BG_PREFIX));
      expect(keys.length, locale).toBe(8);
    }
  });
});

describe('settings and auto-wake matcher', () => {
  it('keeps telemetry and notifications off and defaults to the one-hour chip', () => {
    expect(readSettings(undefined).telemetry).toBe(false);
    expect(readSettings({ telemetry: true }).telemetry).toBe(false);
    expect(readSettings({ notifications: true }).notifications).toBe(false);
    expect(readSettings(undefined).defaultPreset).toBe('p60');
    expect(readSettings({ defaultPreset: 'p45' }).defaultPreset).toBe('p60');
    expect(readSettings({ defaultPreset: 'pinf' }).defaultPreset).toBe('pinf');
  });

  it('normalises pasted sites and refuses anything that is not an https host', () => {
    expect(normalizeHost('https://Docs.Example.com/path?q=1')).toBe('docs.example.com');
    expect(normalizeHost(' meet.example.com ')).toBe('meet.example.com');
    expect(normalizeHost('*.example.com')).toBe('*.example.com');
    expect(normalizeHost('http://example.com')).toBeNull();
    expect(normalizeHost('localhost')).toBeNull();
    expect(normalizeHost('192.168.0.1')).toBeNull();
    expect(normalizeHost('javascript:alert(1)')).toBeNull();
    expect(normalizeHost('')).toBeNull();
  });

  it('matches exact hosts and wildcard subdomains over https only', () => {
    const sites = [
      { host: 'meet.example.com', durationMin: null },
      { host: '*.work.test', durationMin: 60 },
    ];
    expect(matchSite('https://meet.example.com/abc', sites)?.host).toBe('meet.example.com');
    expect(matchSite('https://other.example.com/', sites)).toBeNull();
    expect(matchSite('http://meet.example.com/', sites)).toBeNull();
    expect(matchSite('https://a.b.work.test/', sites)?.durationMin).toBe(60);
    expect(matchSite('https://work.test/', sites)?.host).toBe('*.work.test');
    expect(matchSite(undefined, sites)).toBeNull();
    expect(matchSite('not a url', sites)).toBeNull();
  });

  it('sanitises stored extension settings and reads an older record as the defaults', () => {
    const ext = readExt({
      level: 'system',
      schedules: [{ id: 'ok', days: [1], start: '09:00', end: '17:00' }],
      badge: 'no',
      releaseHidden: 1,
      autostart: { browserStart: true, sites: [{ host: 'HTTPS://X.Example.com' }, { host: 'nope' }] },
    });
    expect(ext).toEqual({
      v: 1,
      badge: true,
      releaseHidden: false,
      autostart: { on: true, sites: [{ host: 'x.example.com', durationMin: null }] },
    });
    expect(readExt({ badge: false, releaseHidden: true, autostart: { on: false } })).toMatchObject({
      badge: false,
      releaseHidden: true,
      autostart: { on: false, sites: [] },
    });
  });
});

describe('messages, chime and i18n helpers', () => {
  it('accepts only the documented request shapes', () => {
    expect(parseRequest({ type: 'start', presetId: 'p30' })).toEqual({ type: 'start', presetId: 'p30' });
    expect(parseRequest({ type: 'start', presetId: 'p60', tab: { tabId: 4, windowId: 1 } })).toEqual({
      type: 'start',
      presetId: 'p60',
      tab: { tabId: 4, windowId: 1 },
    });
    expect(parseRequest({ type: 'start', presetId: 'p60', tab: { tabId: -1 } })).toEqual({
      type: 'start',
      presetId: 'p60',
    });
    expect(parseRequest({ type: 'pause' })).toEqual({ type: 'pause' });
    expect(parseRequest({ type: 'resume' })).toEqual({ type: 'resume' });
    expect(parseRequest({ type: 'start', presetId: 'p45' })).toBeNull();
    expect(parseRequest({ type: 'until', wall: '18:30' })).toBeNull();
    expect(parseRequest({ type: 'level', level: 'system' })).toBeNull();
    expect(parseRequest(null)).toBeNull();
  });

  it('reads the chime the worker asks the offscreen page for', () => {
    expect(readChime('?kind=bell&volume=0.4')).toEqual({ kind: 'bell', volume: 0.4 });
    expect(readChime('?kind=two&volume=7')).toEqual({ kind: 'two', volume: 1 });
    expect(readChime('?kind=siren')).toEqual({ kind: 'off', volume: 0.6 });
  });

  it('formats placeholders and resolves the locale', () => {
    expect(format('Remove {site}', { site: 'a.test' })).toBe('Remove a.test');
    expect(resolveLocale(null, 'pt-BR')).toBe('pt-br');
    expect(resolveLocale('ja', 'en-US')).toBe('ja');
    expect(resolveLocale('xx', 'sv-SE')).toBe('en');
  });
});

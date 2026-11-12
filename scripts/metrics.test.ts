// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  collect,
  DATASET,
  dayLabel,
  duration,
  formatFeedback,
  formatNumber,
  formatReport,
  NOTE,
  parseArgs,
  percent,
  plan,
  readFeedback,
  sqlRunner,
  stamp,
  table,
  weightedMedian,
  type IPlanStep,
  type TFetch,
  type TRow,
  type TSection,
} from './metrics.mjs';

const NOW = Date.UTC(2026, 10, 13, 16, 5);
const DAY = String(Date.UTC(2026, 10, 13) / 1000);

const step = (steps: IPlanStep[], name: string): IPlanStep => {
  const found = steps.find((s) => s.name === name);
  if (!found) throw new Error(`no step ${name}`);
  return found;
};

describe('options', () => {
  it('defaults to the last 24 hours of the production dataset', () => {
    expect(parseArgs([])).toEqual({ since: '24h', feedback: false, limit: 50, dataset: DATASET, help: false });
  });

  it('reads the period, the feedback switch and the limit', () => {
    expect(parseArgs(['--since', '7d']).since).toBe('7d');
    expect(parseArgs(['--since=30d', '--feedback', '--limit', '5'])).toMatchObject({
      since: '30d',
      feedback: true,
      limit: 5,
    });
    expect(parseArgs(['--dataset', 'awaketab_events_preview']).dataset).toBe('awaketab_events_preview');
  });

  it('refuses a period, a limit, a dataset or an option it does not know', () => {
    expect(() => parseArgs(['--since', '2w'])).toThrow(/24h, 7d or 30d/u);
    expect(() => parseArgs(['--since'])).toThrow(/24h, 7d or 30d/u);
    expect(() => parseArgs(['--limit', '0'])).toThrow(/whole number/u);
    expect(() => parseArgs(['--dataset', 'x; DROP'])).toThrow(/letters, digits/u);
    expect(() => parseArgs(['--verbose'])).toThrow(/Unknown option --verbose/u);
  });
});

describe('queries', () => {
  const steps = plan(DATASET, '7d');

  it('weights every count by the sample interval', () => {
    for (const s of steps) {
      expect(s.sql).toContain(`FROM ${DATASET} WHERE timestamp > NOW() - INTERVAL '7' DAY`);
      expect(s.sql.endsWith('FORMAT JSON')).toBe(true);
      if (s.name !== 'visitors') expect(s.sql).toContain('sum(_sample_interval)');
      expect(s.sql).not.toMatch(/count\(\) AS (?:n|views)\b/u);
    }
  });

  it('uses the period that was asked for', () => {
    expect(step(plan(DATASET, '24h'), 'daily').sql).toContain("INTERVAL '24' HOUR");
    expect(step(plan(DATASET, '30d'), 'daily').sql).toContain("INTERVAL '30' DAY");
  });

  it('counts unique visitors from the daily key and leaves out rows that have none', () => {
    const visitors = step(steps, 'visitors');
    expect(visitors.sql).toContain('count(DISTINCT blob15) AS visitors');
    expect(visitors.sql).toContain("blob15 != ''");
    expect(visitors.fallback).toContain('GROUP BY day, visitor');
  });

  it('reads each column the site writes', () => {
    expect(step(steps, 'referrers').sql).toContain('blob13 AS label');
    expect(step(steps, 'referrers').sql).toContain("blob13 != ''");
    expect(step(steps, 'refs').sql).toContain('blob14 AS label');
    expect(step(steps, 'countries').sql).toContain('blob10 AS label');
    expect(step(steps, 'devices').sql).toContain('blob11 AS label');
    expect(step(steps, 'browsers').sql).toContain('blob12 AS label');
    expect(step(steps, 'languages').sql).toContain('blob2 AS label');
    expect(step(steps, 'pages').sql).toContain('blob1 AS label');
    expect(step(steps, 'faces').sql).toContain("index1 = 'session_start' AND blob16 != ''");
    expect(step(steps, 'backgrounds').sql).toContain('blob17 AS label');
    expect(step(steps, 'minutes').sql).toContain("index1 = 'session_end'");
    expect(step(steps, 'errors').sql).toContain('blob6 AS name, blob7 AS message');
  });

  it('counts the tool as the home page in every language', () => {
    const sql = step(steps, 'toolViews').sql;
    expect(sql).toContain("blob1 = '/' OR blob1 = '/es'");
    expect(sql).toContain("blob1 = '/hi'");
    expect(sql).not.toContain('/kiosk');
  });
});

describe('collecting', () => {
  const steps: IPlanStep[] = [
    { name: 'plain', sql: 'A' },
    { name: 'unique', sql: 'B', fallback: 'C' },
    { name: 'later', sql: 'D', fallback: 'E', reduce: (rows) => rows.map((row) => ({ ...row, reduced: 1 })) },
  ];

  it('keeps going when one query fails and says why in its section', async () => {
    const data = await collect(steps, (sql) =>
      sql === 'A' ? Promise.reject(new Error('422: bad query')) : Promise.resolve([{ n: 1 }]),
    );
    expect(data.plain).toEqual({ error: '422: bad query' });
    expect(data.unique).toEqual({ rows: [{ n: 1 }] });
  });

  it('falls back to the plainer query when unique counts are refused, and stops asking for them', async () => {
    const asked: string[] = [];
    const data = await collect(steps, (sql) => {
      asked.push(sql);
      return sql === 'B' ? Promise.reject(new Error('no DISTINCT')) : Promise.resolve([{ n: 2 }]);
    });
    expect(asked).toEqual(['A', 'B', 'C', 'E']);
    expect(data.unique).toEqual({ rows: [{ n: 2 }] });
    expect(data.later).toEqual({ rows: [{ n: 2, reduced: 1 }] });
  });

  it('stops at once when the token is refused', async () => {
    const refused = Object.assign(new Error('refused'), { fatal: true });
    await expect(collect(steps, () => Promise.reject(refused))).rejects.toThrow('refused');
  });

  it('sends the query as the body with the token, and reads the rows', async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetchFn: TFetch = (url, init) => {
      calls.push({ url, init });
      return Promise.resolve(Response.json({ meta: [], data: [{ n: '3' }], rows: 1 }));
    };
    const rows = await sqlRunner({ account: 'acct', token: 'secret' }, fetchFn)('SELECT 1');
    expect(rows).toEqual([{ n: '3' }]);
    expect(calls[0]?.url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/analytics_engine/sql');
    expect(calls[0]?.init).toMatchObject({
      method: 'POST',
      body: 'SELECT 1',
      headers: { authorization: 'Bearer secret' },
    });
  });

  it('names the permission to check when the token is refused', async () => {
    const fetchFn: TFetch = () => Promise.resolve(new Response('no', { status: 403 }));
    await expect(sqlRunner({ account: 'a', token: 't' }, fetchFn)('SELECT 1')).rejects.toThrow(
      /Account Analytics: Read/u,
    );
  });
});

describe('formatting', () => {
  it('writes counts, shares and durations plainly', () => {
    expect(formatNumber('12345')).toBe('12,345');
    expect(formatNumber(undefined)).toBe('0');
    expect(percent(1, 4)).toBe('25%');
    expect(percent(1, 80)).toBe('1.3%');
    expect(percent(1, 0)).toBe('');
    expect(duration(45)).toBe('45 min');
    expect(duration(125)).toBe('2 h 5 min');
  });

  it('finds the middle session when rows stand for many sessions', () => {
    expect(weightedMedian([])).toBeNull();
    expect(weightedMedian([{ value: 5, weight: 1 }])).toBe(5);
    expect(
      weightedMedian([
        { value: 60, weight: 1 },
        { value: 10, weight: 5 },
        { value: 30, weight: 2 },
      ]),
    ).toBe(10);
    expect(
      weightedMedian([
        { value: 10, weight: 1 },
        { value: 30, weight: 1 },
        { value: 60, weight: 3 },
      ]),
    ).toBe(60);
  });

  it('writes days and times in full, with AM and PM', () => {
    expect(dayLabel(DAY)).toBe('Friday, 13 November 2026');
    expect(dayLabel('2026-11-13 00:00:00')).toBe('Friday, 13 November 2026');
    expect(dayLabel('soon')).toBe('soon');
    expect(stamp(NOW, 'UTC')).toBe('Friday, 13 November 2026 · 4:05 PM');
    expect(stamp(NOW, 'Asia/Kolkata')).toBe('Friday, 13 November 2026 · 9:35 PM');
  });

  it('lines columns up, text on the left and numbers on the right', () => {
    expect(
      table(
        ['Site', 'Visits'],
        [
          ['producthunt.com', '300'],
          ['x.com', '4'],
        ],
      ),
    ).toEqual(['  Site              Visits', '  producthunt.com      300', '  x.com                  4']);
  });
});

describe('the report', () => {
  const rows = (list: TRow[]): TSection => ({ rows: list });
  const data: Record<string, TSection> = {
    daily: rows([{ day: DAY, views: '1210', stored: '1210' }]),
    visitors: rows([{ day: DAY, visitors: '455' }]),
    referrers: rows([{ label: 'producthunt.com', n: '300', visitors: '280' }]),
    refs: rows([{ label: 'producthunt', n: '310', visitors: '290' }]),
    countries: rows([
      { label: 'US', n: 700, visitors: 250 },
      { label: '', n: 12, visitors: 5 },
    ]),
    devices: rows([{ label: 'desktop', n: 900, visitors: 300 }]),
    screens: rows([{ label: 'phone', n: 600, visitors: 250 }]),
    browsers: rows([{ label: 'Chrome', n: 1000, visitors: 380 }]),
    languages: rows([{ label: 'en', n: 1400, visitors: 500 }]),
    modes: rows([{ label: 'web', n: 1500, visitors: 560 }]),
    pages: { error: 'Analytics Engine answered 422: bad query' },
    consent: rows([
      { label: 'allow', n: 410 },
      { label: 'load', n: 380 },
      { label: 'route', n: 760 },
    ]),
    toolViews: rows([{ n: 1100, visitors: 520 }]),
    events: rows([
      { event: 'session_start', detail: 'duration', n: 600 },
      { event: 'session_start', detail: 'indefinite', n: 40 },
      { event: 'session_end', detail: 'completed', n: 210 },
      { event: 'session_end', detail: 'stopped', n: 180 },
      { event: 'session_extend', detail: '', n: 45 },
      { event: 'lock_denied', detail: 'permissions_policy', n: 3 },
      { event: 'fallback_used', detail: '', n: 7 },
      { event: 'resume_shown', detail: '', n: 90 },
      { event: 'resume_accepted', detail: '', n: 61 },
    ]),
    minutes: rows([
      { reason: 'completed', minutes: 60, n: 150 },
      { reason: 'stopped', minutes: 7, n: 180 },
      { reason: 'failed', minutes: 0, n: 500 },
    ]),
    lengths: rows([
      { preset: 'p60', minutes: 60, n: 400 },
      { preset: 'pinf', minutes: 0, n: 40 },
      { preset: 'custom', minutes: 480, n: 20 },
    ]),
    faces: rows([{ label: 'ring', n: 500 }]),
    backgrounds: rows([{ label: 'aurora', n: 520 }]),
    errors: rows([{ name: 'TypeError', message: 'Failed to fetch', n: 9 }]),
  };
  const report = formatReport(data, { since: '24h', now: NOW, timeZone: 'UTC' });

  it('says who is counted, on the first line and on every section', () => {
    expect(report.split('\n')[0]).toBe(`AwakeTab launch report · the last 24 hours · ${NOTE}`);
    expect(NOTE).toBe('among visitors who allowed counting');
    const headings = report.split('\n').filter((line) => /^[A-Z]{3}/u.test(line));
    expect(headings.length).toBeGreaterThan(10);
    for (const line of headings) expect(line.endsWith(NOTE)).toBe(true);
    expect(report).toContain('Analytics & Logs → HTTP Traffic');
    expect(report).toContain('Workers & Pages → awaketab-site → Metrics');
  });

  it('prints visitors and page views per day', () => {
    expect(report).toMatch(/Friday, 13 November 2026\s+455\s+1,210/u);
    expect(report).not.toContain('sampled');
  });

  it('prints the consent pair without a count of people who declined', () => {
    expect(report).toContain('Pressed Allow in this period: 410');
    expect(report).toContain('Page loads by people who had already allowed: 380');
    expect(report).toContain('"No thanks" sends nothing, so it is not counted.');
  });

  it('prints where people came from, and "(not known)" for an empty value', () => {
    expect(report).toMatch(/producthunt\.com\s+280\s+300\s+100%/u);
    expect(report).toMatch(/\(not known\)\s+5\s+12\s+1\.7%/u);
  });

  it('prints the tool funnel with the minutes kept, leaving failed starts out of the minutes', () => {
    expect(report).toMatch(/Page views of the tool\s+1,100 {3}520 visitors/u);
    expect(report).toMatch(/Sessions started\s+640 {3}58% of tool page views/u);
    expect(report).toMatch(/Sessions completed\s+210 {3}33% of started/u);
    expect(report).toMatch(/Sessions stopped\s+180 {3}28% of started/u);
    expect(report).toMatch(/Minutes kept awake, total\s+10,260 {3}171 h 0 min/u);
    expect(report).toMatch(/Minutes kept, median\s+7\n/u);
  });

  it('prints the lengths chosen, a custom one with its own length', () => {
    expect(report).toMatch(/1 hour\s+400\s+87%/u);
    expect(report).toMatch(/No end\s+40\s+8\.7%/u);
    expect(report).toMatch(/8 h 0 min \(own length\)\s+20\s+4\.3%/u);
  });

  it('prints reliability and errors', () => {
    expect(report).toMatch(/permissions_policy\s+3/u);
    expect(report).toContain('Video fallback used: 7');
    expect(report).toContain('Asked for a tap after the tab came back: 90 · tapped: 61 (68%)');
    expect(report).toMatch(/TypeError: Failed to fetch\s+9/u);
  });

  it('shows a failed section in place and still prints the rest', () => {
    expect(report).toContain('Could not read this: Analytics Engine answered 422: bad query');
    expect(formatReport({}, { since: '7d', now: NOW, timeZone: 'UTC' })).toContain('Could not read this: no answer');
  });

  it('says when rows were sampled and when no visitor key is stored', () => {
    const sampled = formatReport(
      { ...data, daily: rows([{ day: DAY, views: '5000', stored: '500' }]) },
      { since: '24h', now: NOW, timeZone: 'UTC' },
    );
    expect(sampled).toContain('Analytics Engine sampled these rows');
    const unkeyed = formatReport({ ...data, visitors: rows([]) }, { since: '24h', now: NOW, timeZone: 'UTC' });
    expect(unkeyed).toContain('set the RATE_LIMIT_SALT secret');
  });
});

describe('feedback', () => {
  const items = [
    {
      rating: 'good',
      topics: [],
      device: 'phone',
      browser: 'Safari',
      sessions: 0,
      version: 'web',
      at: NOW - 3_600_000,
    },
    {
      rating: 'love',
      topics: ['faces', 'ease'],
      text: 'Kept my recipe on screen.\nThank you',
      device: 'desktop',
      browser: 'Chrome',
      sessions: 3,
      version: 'web',
      at: NOW,
    },
  ];

  it('prints the newest note first with its rating, topics, text, device and browser', () => {
    const lines = formatFeedback(items, { limit: 50, timeZone: 'UTC' }).split('\n');
    expect(lines[0]).toBe('AwakeTab feedback · 2 notes, newest first');
    expect(lines[1]).toBe('Love 1 · Good 1 · Bad 0');
    expect(lines.slice(3, 8)).toEqual([
      'Friday, 13 November 2026 · 4:05 PM',
      '  Rating: love · Topics: faces, ease',
      '  Device: desktop · Browser: Chrome · Sessions: 3 · Version: web',
      '  > Kept my recipe on screen.',
      '  > Thank you',
    ]);
    expect(lines[9]).toBe('Friday, 13 November 2026 · 3:05 PM');
    expect(lines[10]).toBe('  Rating: good · Topics: none');
  });

  it('prints only as many notes as asked and says so', () => {
    const text = formatFeedback(items, { limit: 1, timeZone: 'UTC' });
    expect(text).toContain('Showing the newest 1; --limit prints more.');
    expect(text).not.toContain('Rating: good');
  });

  it('lists the feedback keys page by page and reads each note', async () => {
    const asked: string[] = [];
    const fetchFn: TFetch = (url) => {
      asked.push(url);
      const { pathname, searchParams } = new URL(url);
      if (pathname.endsWith('/keys')) {
        const second = searchParams.get('cursor') === 'next';
        return Promise.resolve(
          Response.json({
            result: [{ name: second ? 'feedback:b' : 'feedback:a' }],
            result_info: { cursor: second ? '' : 'next' },
          }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ rating: 'love', at: pathname.endsWith('b') ? 2 : 1 })));
    };
    const found = await readFeedback({ account: 'acct', token: 'secret', namespace: 'ns' }, fetchFn);
    expect(found.map((item) => item.at).sort()).toEqual([1, 2]);
    expect(asked[0]).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct/storage/kv/namespaces/ns/keys?prefix=feedback%3A&limit=1000',
    );
    expect(asked[1]).toContain('cursor=next');
    expect(asked.some((url) => url.endsWith('/values/feedback%3Aa'))).toBe(true);
  });
});

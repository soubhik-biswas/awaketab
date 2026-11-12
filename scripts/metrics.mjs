#!/usr/bin/env node
// Prints the launch report, or stored feedback: node scripts/metrics.mjs [--since 24h|7d|30d] [--feedback]
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.cloudflare.com/client/v4';
export const DATASET = 'awaketab_events';
export const NOTE = 'among visitors who allowed counting';

// The same order as BLOB_COLUMNS in apps/site/lib/server/events.ts; docs/ANALYTICS.md has the full table.
const COL = {
  path: 'blob1',
  locale: 'blob2',
  source: 'blob4',
  detail: 'blob6',
  extra: 'blob7',
  viewport: 'blob8',
  country: 'blob10',
  device: 'blob11',
  browser: 'blob12',
  referrer: 'blob13',
  ref: 'blob14',
  visitor: 'blob15',
  face: 'blob16',
  background: 'blob17',
  number: 'double1',
};

const SINCE = {
  '24h': { interval: "'24' HOUR", label: 'the last 24 hours' },
  '7d': { interval: "'7' DAY", label: 'the last 7 days' },
  '30d': { interval: "'30' DAY", label: 'the last 30 days' },
};

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
// The home page is the tool, in every language.
const TOOL_PATHS = ['/', ...LOCALES.map((locale) => `/${locale}`)];

const PRESET_LABELS = {
  p15: '15 minutes',
  p30: '30 minutes',
  p45: '45 minutes',
  p60: '1 hour',
  p120: '2 hours',
  p240: '4 hours',
  pinf: 'No end',
};

const USAGE = `Usage: node scripts/metrics.mjs [options]

  --since 24h|7d|30d   the period to report on (default 24h)
  --feedback           print stored feedback, newest first, instead of the report
  --limit <n>          how many feedback notes to print (default 50)
  --dataset <name>     the Analytics Engine dataset (default ${DATASET})

Environment:
  CLOUDFLARE_API_TOKEN    a token with Account Analytics: Read (and Workers KV Storage: Read for --feedback)
  CLOUDFLARE_ACCOUNT_ID   the Cloudflare account id
  KV_LICENSES_ID          the LICENSES namespace id, for --feedback only`;

export function parseArgs(argv) {
  const options = { since: '24h', feedback: false, limit: 50, dataset: DATASET, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = String(argv[i]).split('=');
    const value = () => {
      if (inline !== undefined) return inline;
      i += 1;
      return argv[i] ?? '';
    };
    if (flag === '--feedback') options.feedback = true;
    else if (flag === '--help' || flag === '-h') options.help = true;
    else if (flag === '--since') {
      const since = value();
      if (!Object.hasOwn(SINCE, since)) throw new Error(`--since takes 24h, 7d or 30d, not "${since}"`);
      options.since = since;
    } else if (flag === '--limit') {
      const limit = Number(value());
      if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit takes a whole number above zero');
      options.limit = limit;
    } else if (flag === '--dataset') {
      const dataset = value();
      if (!/^[A-Za-z0-9_]{1,64}$/u.test(dataset)) throw new Error('--dataset takes letters, digits and underscores');
      options.dataset = dataset;
    } else throw new Error(`Unknown option ${String(argv[i])}`);
  }
  return options;
}

const anyOf = (column, values) => `(${values.map((value) => `${column} = '${value}'`).join(' OR ')})`;

function scope(dataset, since, event, extra = '') {
  const period = `timestamp > NOW() - INTERVAL ${SINCE[since].interval}`;
  return `FROM ${dataset} WHERE ${period} AND index1 = '${event}'${extra ? ` AND ${extra}` : ''}`;
}

// Every count is sum(_sample_interval): Analytics Engine may keep one row in N and says so in that column.
const COUNT = 'sum(_sample_interval)';
const DAY = 'intDiv(toUInt32(timestamp), 86400) * 86400';

function dimensionSql(dataset, since, event, column, limit, options = {}) {
  const visitors = options.visitors ? `, count(DISTINCT ${COL.visitor}) AS visitors` : '';
  const filter = options.filled ? `${column} != ''` : '';
  return `SELECT ${column} AS label, ${COUNT} AS n${visitors} ${scope(dataset, since, event, filter)} GROUP BY label ORDER BY n DESC LIMIT ${limit} FORMAT JSON`;
}

function countByDay(rows) {
  const days = new Map();
  for (const row of rows) days.set(String(row.day), (days.get(String(row.day)) ?? 0) + 1);
  return [...days].map(([day, visitors]) => ({ day, visitors }));
}

const DIMENSIONS = [
  { name: 'referrers', column: COL.referrer, limit: 15, filled: true },
  { name: 'refs', column: COL.ref, limit: 15, filled: true },
  { name: 'countries', column: COL.country, limit: 15 },
  { name: 'devices', column: COL.device, limit: 10 },
  { name: 'screens', column: COL.viewport, limit: 10 },
  { name: 'browsers', column: COL.browser, limit: 10 },
  { name: 'languages', column: COL.locale, limit: 10 },
  { name: 'modes', column: COL.source, limit: 5 },
  { name: 'pages', column: COL.path, limit: 20 },
];

// The queries the report needs, in order. A step with a fallback counts unique visitors and has a plainer second try.
export function plan(dataset, since) {
  const keyed = `${COL.visitor} != ''`;
  const tool = anyOf(COL.path, TOOL_PATHS);
  const elsewhere = `timestamp > NOW() - INTERVAL ${SINCE[since].interval} AND index1 != 'page_view' AND index1 != 'client_error'`;
  return [
    {
      name: 'daily',
      sql: `SELECT ${DAY} AS day, ${COUNT} AS views, count() AS stored ${scope(dataset, since, 'page_view')} GROUP BY day ORDER BY day FORMAT JSON`,
    },
    {
      name: 'visitors',
      sql: `SELECT ${DAY} AS day, count(DISTINCT ${COL.visitor}) AS visitors ${scope(dataset, since, 'page_view', keyed)} GROUP BY day ORDER BY day FORMAT JSON`,
      fallback: `SELECT ${DAY} AS day, ${COL.visitor} AS visitor, count() AS stored ${scope(dataset, since, 'page_view', keyed)} GROUP BY day, visitor ORDER BY day LIMIT 200000 FORMAT JSON`,
      reduce: countByDay,
    },
    ...DIMENSIONS.map(({ name, column, limit, filled }) => ({
      name,
      sql: dimensionSql(dataset, since, 'page_view', column, limit, { visitors: true, filled }),
      fallback: dimensionSql(dataset, since, 'page_view', column, limit, { filled }),
    })),
    { name: 'consent', sql: dimensionSql(dataset, since, 'page_view', COL.extra, 5) },
    {
      name: 'toolViews',
      sql: `SELECT ${COUNT} AS n, count(DISTINCT ${COL.visitor}) AS visitors ${scope(dataset, since, 'page_view', tool)} FORMAT JSON`,
      fallback: `SELECT ${COUNT} AS n ${scope(dataset, since, 'page_view', tool)} FORMAT JSON`,
    },
    {
      name: 'events',
      sql: `SELECT index1 AS event, ${COL.detail} AS detail, ${COUNT} AS n FROM ${dataset} WHERE ${elsewhere} GROUP BY event, detail ORDER BY n DESC LIMIT 500 FORMAT JSON`,
    },
    {
      name: 'minutes',
      sql: `SELECT ${COL.detail} AS reason, ${COL.number} AS minutes, ${COUNT} AS n ${scope(dataset, since, 'session_end')} GROUP BY reason, minutes ORDER BY minutes LIMIT 20000 FORMAT JSON`,
    },
    {
      name: 'lengths',
      sql: `SELECT ${COL.extra} AS preset, ${COL.number} AS minutes, ${COUNT} AS n ${scope(dataset, since, 'session_start')} GROUP BY preset, minutes ORDER BY n DESC LIMIT 12 FORMAT JSON`,
    },
    { name: 'faces', sql: dimensionSql(dataset, since, 'session_start', COL.face, 10, { filled: true }) },
    { name: 'backgrounds', sql: dimensionSql(dataset, since, 'session_start', COL.background, 10, { filled: true }) },
    {
      name: 'errors',
      sql: `SELECT ${COL.detail} AS name, ${COL.extra} AS message, ${COUNT} AS n ${scope(dataset, since, 'client_error')} GROUP BY name, message ORDER BY n DESC LIMIT 15 FORMAT JSON`,
    },
  ];
}

const reason = (error) => (error instanceof Error ? error.message : String(error));

// Runs the plan in order. One failed query costs its own section, not the report; a refused token stops everything.
export async function collect(steps, run) {
  const data = {};
  let distinct = true;
  for (const step of steps) {
    try {
      if (step.fallback && !distinct) throw new Error('unique counts are not available');
      data[step.name] = { rows: await run(step.sql) };
    } catch (error) {
      if (error instanceof Error && error.fatal) throw error;
      if (!step.fallback) {
        data[step.name] = { error: reason(error) };
        continue;
      }
      try {
        const rows = await run(step.fallback);
        data[step.name] = { rows: step.reduce ? step.reduce(rows) : rows };
        // The plainer query worked, so it was the unique count that was refused: the rest skip it.
        distinct = false;
      } catch (second) {
        if (second instanceof Error && second.fatal) throw second;
        data[step.name] = { error: reason(second) };
      }
    }
  }
  return data;
}

export function formatNumber(value) {
  return Math.round(Number(value) || 0).toLocaleString('en-US');
}

export function percent(part, whole) {
  if (!whole) return '';
  const share = (Number(part) / Number(whole)) * 100;
  return `${share >= 10 || share === 0 ? Math.round(share) : share.toFixed(1)}%`;
}

export function duration(totalMinutes) {
  const minutes = Math.round(Number(totalMinutes) || 0);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} min`;
  return `${formatNumber(hours)} h ${minutes % 60} min`;
}

// The middle value when every row stands for `weight` sessions.
export function weightedMedian(pairs) {
  const sorted = pairs.filter((p) => p.weight > 0).sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, p) => sum + p.weight, 0);
  if (total === 0) return null;
  let seen = 0;
  for (const p of sorted) {
    seen += p.weight;
    if (seen >= total / 2) return p.value;
  }
  return null;
}

const DAY_FORMAT = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

function dateLabel(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { ...DAY_FORMAT, timeZone }).formatToParts(date);
  const pick = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('weekday')}, ${pick('day')} ${pick('month')} ${pick('year')}`;
}

// Analytics Engine returns a day as seconds since 1970 or as "YYYY-MM-DD hh:mm:ss"; both are UTC.
export function dayLabel(value) {
  const text = String(value);
  const date = /^\d+$/u.test(text) ? new Date(Number(text) * 1000) : new Date(`${text.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? text : dateLabel(date, 'UTC');
}

export function stamp(ms, timeZone) {
  const date = new Date(ms);
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).format(
    date,
  );
  return `${dateLabel(date, timeZone)} · ${time}`;
}

// Plain columns: the first is text, the rest are right-aligned numbers.
export function table(headers, rows) {
  const all = [headers, ...rows].map((row) => row.map((cell) => String(cell)));
  const widths = headers.map((_, i) => Math.max(...all.map((row) => (row[i] ?? '').length)));
  return all
    .map((row) =>
      row
        .map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i])))
        .join('   ')
        .trimEnd(),
    )
    .map((line) => `  ${line}`);
}

const heading = (title) => ['', `${title} · ${NOTE}`];
const failed = (section) => [`  Could not read this: ${section?.error ?? 'no answer'}`];
const usable = (section) => Array.isArray(section?.rows);

function dailyLines(daily, visitors) {
  if (!usable(daily)) return failed(daily);
  if (daily.rows.length === 0) return ['  No page views in this period.'];
  const perDay = new Map((usable(visitors) ? visitors.rows : []).map((row) => [String(row.day), Number(row.visitors)]));
  const known = usable(visitors);
  const rows = daily.rows.map((row) => [
    dayLabel(row.day),
    known ? formatNumber(perDay.get(String(row.day)) ?? 0) : '?',
    formatNumber(row.views),
  ]);
  const views = daily.rows.reduce((sum, row) => sum + Number(row.views), 0);
  const people = [...perDay.values()].reduce((sum, n) => sum + n, 0);
  const lines = table(
    ['Day (UTC)', 'Visitors', 'Page views'],
    [...rows, ['Total', known ? formatNumber(people) : '?', formatNumber(views)]],
  );
  lines.push('  A visitor is counted once per day, so the total adds the days together.');
  if (!known) lines.push(`  Unique visitors could not be read: ${visitors?.error ?? 'no answer'}`);
  else if (people === 0 && views > 0)
    lines.push('  No visitor keys are stored: set the RATE_LIMIT_SALT secret on the Worker to count unique visitors.');
  if (daily.rows.some((row) => Number(row.views) > Number(row.stored)))
    lines.push('  Analytics Engine sampled these rows: counts are estimates and unique visitors are a lower bound.');
  return lines;
}

function dimensionLines(section, label, unit, empty) {
  if (!usable(section)) return failed(section);
  if (section.rows.length === 0) return [`  ${empty}`];
  const total = section.rows.reduce((sum, row) => sum + Number(row.n), 0);
  const withVisitors = section.rows.some((row) => row.visitors !== undefined);
  const headers = withVisitors ? [label, 'Visitors', unit, 'Share'] : [label, unit, 'Share'];
  const rows = section.rows.map((row) => {
    const name = String(row.label) || '(not known)';
    const share = percent(row.n, total);
    return withVisitors
      ? [name, formatNumber(row.visitors), formatNumber(row.n), share]
      : [name, formatNumber(row.n), share];
  });
  return table(headers, rows);
}

function consentLines(section) {
  if (!usable(section)) return failed(section);
  const count = (via) => section.rows.filter((row) => row.label === via).reduce((sum, row) => sum + Number(row.n), 0);
  return [
    `  Pressed Allow in this period: ${formatNumber(count('allow'))}`,
    `  Page loads by people who had already allowed: ${formatNumber(count('load'))}`,
    '  "No thanks" sends nothing, so it is not counted. Compare with unique visitors in the Cloudflare dashboard.',
  ];
}

function eventCount(events, name, detail) {
  return events.rows
    .filter((row) => row.event === name && (detail === undefined || row.detail === detail))
    .reduce((sum, row) => sum + Number(row.n), 0);
}

function toolLines(data) {
  const lines = [];
  const views = usable(data.toolViews) ? Number(data.toolViews.rows[0]?.n ?? 0) : null;
  const people = usable(data.toolViews) ? data.toolViews.rows[0]?.visitors : undefined;
  if (views === null) lines.push(...failed(data.toolViews));
  if (!usable(data.events)) return [...lines, ...failed(data.events)];
  const started = eventCount(data.events, 'session_start');
  const ends = data.events.rows.filter((row) => row.event === 'session_end');
  const funnel = [];
  if (views !== null) {
    const who = people === undefined ? '' : `${formatNumber(people)} visitors`;
    funnel.push(['Page views of the tool', formatNumber(views), who]);
  }
  funnel.push([
    'Sessions started',
    formatNumber(started),
    views ? `${percent(started, views)} of tool page views` : '',
  ]);
  for (const row of ends) {
    const name = String(row.detail) || 'no reason';
    funnel.push([`Sessions ${name}`, formatNumber(row.n), started ? `${percent(row.n, started)} of started` : '']);
  }
  funnel.push(['Sessions extended', formatNumber(eventCount(data.events, 'session_extend')), '']);
  for (const [label, count, note] of funnel) {
    lines.push(`  ${label.padEnd(26)}${count.padStart(9)}${note ? `   ${note}` : ''}`);
  }
  if (usable(data.minutes)) {
    const kept = data.minutes.rows.filter((row) => row.reason !== 'failed');
    const total = kept.reduce((sum, row) => sum + Number(row.minutes) * Number(row.n), 0);
    const median = weightedMedian(kept.map((row) => ({ value: Number(row.minutes), weight: Number(row.n) })));
    lines.push(`  ${'Minutes kept awake, total'.padEnd(26)}${formatNumber(total).padStart(9)}   ${duration(total)}`);
    lines.push(`  ${'Minutes kept, median'.padEnd(26)}${(median === null ? '-' : formatNumber(median)).padStart(9)}`);
  } else lines.push(...failed(data.minutes));
  return lines;
}

function lengthLines(section) {
  if (!usable(section)) return failed(section);
  if (section.rows.length === 0) return ['  No sessions started in this period.'];
  const total = section.rows.reduce((sum, row) => sum + Number(row.n), 0);
  const rows = section.rows.map((row) => {
    const label = PRESET_LABELS[row.preset] ?? `${duration(row.minutes)} (own length)`;
    return [label, formatNumber(row.n), percent(row.n, total)];
  });
  return table(['Length', 'Sessions', 'Share'], rows);
}

function reliabilityLines(data) {
  if (!usable(data.events)) return failed(data.events);
  const denied = data.events.rows.filter((row) => row.event === 'lock_denied');
  const shown = eventCount(data.events, 'resume_shown');
  const accepted = eventCount(data.events, 'resume_accepted');
  const lines = [];
  if (denied.length === 0) lines.push('  Wake lock refused: 0');
  else {
    lines.push('  Wake lock refused, by reason:');
    lines.push(
      ...table(
        ['  Reason', 'Times'],
        denied.map((row) => [`  ${String(row.detail) || 'no reason'}`, formatNumber(row.n)]),
      ),
    );
  }
  lines.push(`  Video fallback used: ${formatNumber(eventCount(data.events, 'fallback_used'))}`);
  lines.push(
    `  Asked for a tap after the tab came back: ${formatNumber(shown)} · tapped: ${formatNumber(accepted)}${shown ? ` (${percent(accepted, shown)})` : ''}`,
  );
  lines.push(`  Installed as an app: ${formatNumber(eventCount(data.events, 'pwa_install'))}`);
  lines.push(`  Mini clock opened: ${formatNumber(eventCount(data.events, 'pip_open'))}`);
  return lines;
}

function errorLines(section) {
  if (!usable(section)) return failed(section);
  if (section.rows.length === 0) return ['  No errors reported.'];
  return table(
    ['Error', 'Times'],
    section.rows.map((row) => [
      `${String(row.name) || 'Error'}: ${String(row.message) || '(no message)'}`,
      formatNumber(row.n),
    ]),
  );
}

export function formatReport(data, options) {
  const period = SINCE[options.since]?.label ?? options.since;
  const dimension = (name, title, label, unit, empty) => [
    ...heading(title),
    ...dimensionLines(data[name], label, unit, empty),
  ];
  return [
    `AwakeTab launch report · ${period} · ${NOTE}`,
    `Made on ${stamp(options.now, options.timeZone)}`,
    '',
    'Only people who pressed Allow on "Count this visit?" are in these numbers. Everyone else is missing from all of',
    'them. Total traffic is in the Cloudflare dashboard: the zone → Analytics & Logs → HTTP Traffic (requests, unique',
    'visitors, countries) and Workers & Pages → awaketab-site → Metrics (requests, errors).',
    ...heading('VISITORS AND PAGE VIEWS'),
    ...dailyLines(data.daily, data.visitors),
    ...heading('COUNTING ALLOWED'),
    ...consentLines(data.consent),
    ...dimension('referrers', 'WHERE THEY CAME FROM (linking sites)', 'Site', 'Visits', 'No visit came from a link.'),
    ...dimension(
      'refs',
      'WHERE THEY CAME FROM (?ref= and ?utm_source= labels)',
      'Label',
      'Visits',
      'No visit had a label.',
    ),
    ...dimension('countries', 'COUNTRIES', 'Country', 'Page views', 'No page views.'),
    ...dimension('devices', 'DEVICES', 'Device', 'Page views', 'No page views.'),
    ...dimension('screens', 'SCREEN SIZES', 'Layout', 'Page views', 'No page views.'),
    ...dimension('browsers', 'BROWSERS', 'Browser', 'Page views', 'No page views.'),
    ...dimension('languages', 'LANGUAGES', 'Language', 'Page views', 'No page views.'),
    ...dimension('modes', 'BROWSER TAB (web) OR INSTALLED APP (pwa)', 'Opened as', 'Page views', 'No page views.'),
    ...dimension('pages', 'TOP PAGES', 'Page', 'Page views', 'No page views.'),
    ...heading('THE TOOL'),
    ...toolLines(data),
    ...heading('LENGTHS CHOSEN'),
    ...lengthLines(data.lengths),
    ...dimension('faces', 'TOP 10 FACES', 'Face', 'Sessions', 'No sessions started.'),
    ...dimension('backgrounds', 'TOP 10 BACKGROUNDS', 'Background', 'Sessions', 'No sessions started.'),
    ...heading('RELIABILITY'),
    ...reliabilityLines(data),
    ...heading('ERRORS'),
    ...errorLines(data.errors),
    '',
  ].join('\n');
}

export function formatFeedback(items, options) {
  const sorted = [...items].sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0));
  const shown = sorted.slice(0, options.limit);
  const count = (rating) => sorted.filter((item) => item.rating === rating).length;
  const lines = [
    `AwakeTab feedback · ${formatNumber(sorted.length)} notes, newest first`,
    `Love ${count('love')} · Good ${count('good')} · Bad ${count('bad')}`,
  ];
  if (shown.length < sorted.length) lines.push(`Showing the newest ${shown.length}; --limit prints more.`);
  for (const item of shown) {
    const topics = Array.isArray(item.topics) && item.topics.length > 0 ? item.topics.join(', ') : 'none';
    lines.push('');
    lines.push(item.at ? stamp(Number(item.at), options.timeZone) : 'No date');
    lines.push(`  Rating: ${String(item.rating ?? '?')} · Topics: ${topics}`);
    lines.push(
      `  Device: ${String(item.device ?? '?')} · Browser: ${String(item.browser ?? '?')} · Sessions: ${formatNumber(item.sessions)} · Version: ${String(item.version ?? '?')}`,
    );
    if (item.text)
      lines.push(
        ...String(item.text)
          .split('\n')
          .map((line) => `  > ${line}`),
      );
  }
  lines.push('');
  return lines.join('\n');
}

function refused(status, what) {
  const error = new Error(
    `Cloudflare refused the token (${status}) for ${what}. Check CLOUDFLARE_API_TOKEN and its permissions: Account Analytics: Read for the report, Workers KV Storage: Read for --feedback.`,
  );
  error.fatal = true;
  return error;
}

export function sqlRunner(env, fetchFn = fetch) {
  return async (query) => {
    const res = await fetchFn(`${API}/accounts/${env.account}/analytics_engine/sql`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.token}` },
      body: query,
    });
    const text = await res.text();
    if (res.status === 401 || res.status === 403) throw refused(res.status, 'Analytics Engine');
    if (!res.ok) throw new Error(`Analytics Engine answered ${res.status}: ${text.trim().slice(0, 300)}`);
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.data) ? parsed.data : [];
  };
}

const MAX_FEEDBACK = 2000;
const PARALLEL = 6;

export async function readFeedback(env, fetchFn = fetch) {
  const base = `${API}/accounts/${env.account}/storage/kv/namespaces/${env.namespace}`;
  const headers = { authorization: `Bearer ${env.token}` };
  const names = [];
  let cursor = '';
  do {
    const query = new URLSearchParams({ prefix: 'feedback:', limit: '1000' });
    if (cursor) query.set('cursor', cursor);
    const res = await fetchFn(`${base}/keys?${query.toString()}`, { headers });
    if (res.status === 401 || res.status === 403) throw refused(res.status, 'Workers KV');
    if (!res.ok) throw new Error(`Workers KV answered ${res.status}: ${(await res.text()).trim().slice(0, 300)}`);
    const page = await res.json();
    for (const key of page.result ?? []) names.push(key.name);
    cursor = page.result_info?.cursor ?? '';
  } while (cursor && names.length < MAX_FEEDBACK);
  const items = [];
  const queue = names.slice(0, MAX_FEEDBACK);
  const worker = async () => {
    for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
      const res = await fetchFn(`${base}/values/${encodeURIComponent(name)}`, { headers });
      if (!res.ok) continue;
      try {
        items.push(JSON.parse(await res.text()));
      } catch {
        continue;
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  return items;
}

function need(name, why) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} (${why}).`);
  return value;
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options.help) return USAGE;
  const token = need('CLOUDFLARE_API_TOKEN', 'an API token with Account Analytics: Read');
  const account = need('CLOUDFLARE_ACCOUNT_ID', 'the Cloudflare account id');
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (options.feedback) {
    const namespace = need('KV_LICENSES_ID', 'the id of the LICENSES KV namespace');
    const items = await readFeedback({ account, token, namespace });
    return formatFeedback(items, { limit: options.limit, timeZone });
  }
  const data = await collect(plan(options.dataset, options.since), sqlRunner({ account, token }));
  return formatReport(data, { since: options.since, now: Date.now(), timeZone });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((text) => {
      process.stdout.write(`${text}\n`);
    })
    .catch((error) => {
      process.stderr.write(`metrics: ${reason(error)}\n`);
      process.exitCode = 1;
    });
}

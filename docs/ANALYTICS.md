# Analytics

AwakeTab counts visits itself: first-party, without cookies, and only for people who say yes. Analytics is opt-in: until someone allows it, nothing is sent. This page says what is collected, what is deliberately not, where it is stored, how to turn it off and how to read the numbers.

## 1. The rule: only after "Allow"

Site pages ask once, "Count this visit?", with two equal answers: **No thanks** and **Allow**. The same choice is the **Count my visits** switch in Settings → Privacy. The answer is saved in this browser as `telemetry: true` or `telemetry: false` inside `at.v1.settings`.

Events are sent only while that value is exactly `true`. Nothing is sent when:

- the person pressed **No thanks**, or has not answered, or the saved answer cannot be read;
- the browser sends Global Privacy Control (`navigator.globalPrivacyControl`) or Do Not Track (`navigator.doNotTrack === '1'`), even after an Allow;
- the build is the preview site (`NEXT_PUBLIC_DEPLOY_ENV=play`) or a development build;
- the page is shown inside another site's frame (the embed widget);
- **Count my visits** is turned off later. Sending stops at once and anything still waiting in memory is thrown away.

Pressing **No thanks** sends nothing at all, not even "someone declined".

**What this means for the numbers.** Every number in the report is *among visitors who allowed counting*. It is a part of the traffic, not all of it. Total traffic needs no code and is in the Cloudflare dashboard:

- the `awaketab.com` zone → **Analytics & Logs → HTTP Traffic**: requests, unique visitors and countries for everyone;
- **Workers & Pages → awaketab-site → Metrics**: requests and errors of the Worker.

Divide the report's unique visitors by the dashboard's unique visitors to see what share of people allow counting.

## 2. What is collected

Every event carries these common fields, sent by the browser:

| Field | Example | Notes |
|---|---|---|
| `event` | `page_view` | one of the names in §3 |
| `path` | `/guides/keep-screen-on` | the path only; anything after `?` or `#` is never sent |
| `locale` | `de` | the site language, read from the path |
| `source` | `web` or `pwa` | a browser tab, or AwakeTab installed as an app |
| `viewport` | `phone`, `tabletP`, `tabletL`, `desktop` | the tool's layout tier for the window width (700, 1100, 1300 px) |
| `ver` | `web` | the app version (`NEXT_PUBLIC_APP_VERSION`) |
| `sid` | a random id | made when the page loads, kept in memory only, gone on reload; it ties a session's start to its end |
| `ts` | a timestamp | used only to store the difference from the server's clock |

The server adds four things from the request itself, for events from the site only (`source` `web` or `pwa`):

| Added | Example | From |
|---|---|---|
| country | `IN` | Cloudflare's two-letter country for the request; "unknown" and Tor are stored empty |
| device class | `phone`, `tablet`, `desktop`, `bot`, `other` | the User-Agent header, sorted into a bucket |
| browser family | `Chrome`, `Edge`, `Firefox`, `Safari`, `Opera`, `Samsung Internet`, `Other` | the User-Agent header, family name only, no version |
| daily visitor key | `3fa9c1e07b2d4a68` | see §5 |

Events from the browser extension and from the embed widget get none of these four.

### Deliberately not collected

- No cookie, no `localStorage` or `sessionStorage` identifier, no fingerprint (no canvas, fonts, screen size, time zone or hardware details).
- No IP address is stored. It is read to limit request rates and to compute the daily visitor key, then dropped.
- No full User-Agent string is stored, only the device class and browser family above.
- No full referrer. Only the hostname of the linking site, and only on the first counted page of a visit.
- No query strings, no labels typed into the timer, no notes, no names, no account details.
- No third-party analytics script and no request to any other origin. The content security policy stays `connect-src 'self'`.
- No event for **No thanks**.

## 3. Events

| Event | When | Extra fields |
|---|---|---|
| `page_view` | the first page after Allow, each later page load and each client-side route change | `via`: `allow` (the page on which the person just allowed), `load` (a page load by someone who had already allowed) or `route` (a move inside the site); `referrer`: hostname of the linking site; `ref`: the `?ref=` or `?utm_source=` value (lower-case letters, digits, dash, underscore, at most 32 characters; a dot becomes a dash). `referrer` and `ref` ride on the first counted page of a visit only |
| `session_start` | a session begins in the timer | `planType`: `duration` or `indefinite`; `presetId`: `p15` `p30` `p45` `p60` `p120` `p240` `pinf` or `custom`; `lengthMin`: the chosen length in minutes, `0` for no end; `face`: the clock face id; `background`: the background id |
| `session_end` | a session is over | `reason`: `completed` (ran to its end), `stopped` (the person stopped it), `replaced` (a new session started over it), `closed` (the tab was closed or left mid-session), `failed` (the lock was never held); `durationMin`: minutes the screen was actually kept awake |
| `session_extend` | the end time of a running session moves later by a minute or more | `addedMin` |
| `lock_denied` | the browser refused the wake lock | `reason`: `hidden_document`, `permissions_policy`, `insecure_context`, `unsupported_browser`, `ios_safari_old`, `firefox_old`, `iframe_no_allow`, `unsupported`, `denied`, or `fallback_failed` when the video fallback could not start |
| `fallback_used` | the video fallback is holding the screen awake, once per session | none |
| `resume_shown` | the tab came back and still needed a tap to keep going (the automatic retry did not get the lock within 1.5 seconds) | none |
| `resume_accepted` | that tap happened and the screen is awake again | none |
| `pwa_install` | the browser reports that AwakeTab was installed as an app | none |
| `pip_open` | the mini clock opened in a Picture-in-Picture window | none |
| `client_error` | an uncaught error or unhandled promise rejection, at most 5 per page load | `code`: the error's class name, such as `TypeError`; `message`: at most 120 characters, with link queries and anything shaped like an address or a long number removed |

Two more things write to the same dataset and are not part of the sender: content-security-policy reports that browsers send by themselves to `/api/csp` are stored as `client_error` with `code` `csp` and the page path only; and the endpoint also accepts the browser extension's origin, whose events (`source` `ext`) are stored without the four request facts.

`share_click` is on the allowed list but is not sent yet (§9).

The sender batches up to 20 events, sends them with `navigator.sendBeacon('/api/e')` when the tab is hidden or closed and every 15 seconds while something is waiting, and falls back to `fetch` with `keepalive`.

The endpoint takes at most 20 events in a request and reads the body only up to 8 KB: it stops reading at the cap and answers 413 `too_large`, whatever the `Content-Length` header says. The sender cuts a batch at about 7 KB, so it never gets there. An event whose name is not on the list is dropped, and only the known fields of an event are stored.

## 4. Where it is stored

Cloudflare Workers Analytics Engine, dataset `awaketab_events` (binding `EVENTS`). The preview site writes to `awaketab_events_preview`, and its pages send nothing anyway. Analytics Engine keeps rows for three months and then deletes them.

One row per event. The order is `BLOB_COLUMNS` in `apps/site/lib/server/events.ts`; the first nine columns are unchanged from the earlier layout and new columns are added on the end.

| Column | Holds |
|---|---|
| `index1` | event name |
| `blob1` | `path` |
| `blob2` | `locale` |
| `blob3` | `ua` class; the site does not send it, so it is empty for site events |
| `blob4` | `source` (`web`, `pwa`, `ext`, `embed`) |
| `blob5` | `sid` |
| `blob6` | attribute 1: `planType` on `session_start`; `reason` on `session_end` and `lock_denied`; `code` on `client_error`; the embedding hostname on the embed widget's `page_view`. For the accepted events the site does not send yet: `from` on `lock_state`, `plan` on `pro_checkout_click` and `pro_activated`, `action` on `rating_prompt`, `page` on `ad_slot_loaded` |
| `blob7` | attribute 2: `via` on `page_view`; `presetId` on `session_start`; `message` on `client_error`. Not sent yet: `to` on `lock_state`, `sku` on `pro_checkout_click`, `sponsorId` on `sponsor_view` and `sponsor_click`, `target` on `share_click` |
| `blob8` | `viewport` |
| `blob9` | `ver` |
| `blob10` | country |
| `blob11` | device class |
| `blob12` | browser family |
| `blob13` | referrer hostname (`page_view`) |
| `blob14` | `ref` value (`page_view`) |
| `blob15` | daily visitor key |
| `blob16` | face id (`session_start`) |
| `blob17` | background id (`session_start`) |
| `double1` | the event's number: `lengthMin` on `session_start`, `durationMin` on `session_end`, `addedMin` on `session_extend` (`stars` on `rating_prompt`, which is not sent yet) |
| `double2` | the browser's clock minus the server's, in milliseconds |

Feedback is separate: it is stored in the `LICENSES` KV namespace under `feedback:<id>` when someone presses Send, whatever they answered to "Count this visit?".

## 5. The daily visitor key

Unique visitors are counted without an identifier in the browser:

```
key = first 16 hex characters of SHA-256( UTC date | secret | IP address | User-Agent )
```

- The secret is the Worker secret **`RATE_LIMIT_SALT`**, the same one the rate limiter uses. If it is not set, the key is written empty; the code never hashes with a built-in constant. The report then says so instead of showing a wrong count.
- The date is part of the input, so the same browser gets a different key every UTC day. Rows from different days cannot be joined to follow a person.
- The IP address and the User-Agent go into the hash and nowhere else. They are not stored beside the key or anywhere in the dataset.
- Two people behind one network address with the same browser version share a key for that day, and one person on Wi-Fi and then on mobile data has two. The count is close, not exact.
- Limit worth knowing: whoever holds the secret, and already knows a specific IP address and User-Agent, could recompute that key for a given day. Keep the secret a secret.

## 6. Turning it off

For a visitor: press **No thanks** on the card, turn off **Count my visits** in Settings → Privacy, or switch on Global Privacy Control or Do Not Track in the browser. Clearing the site's data forgets the answer, and the card asks again.

For the owner, to stop all collection: remove `<Telemetry />` from `apps/site/app/[locale]/layout.tsx` and deploy. The endpoint can stay; nothing calls it.

## 7. Reading the numbers

```
CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…  node scripts/metrics.mjs --since 24h
```

- `--since 24h | 7d | 30d` chooses the period (default `24h`).
- `--feedback` prints stored feedback instead: newest first, with rating, topics, text, device and browser. It also needs `KV_LICENSES_ID`, the id under `kv_namespaces` in `apps/site/wrangler.jsonc`. `--limit <n>` sets how many notes to print (default 50).
- `--dataset <name>` reads another dataset.

The API token (Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token) needs:

- **Account → Account Analytics → Read** for the report;
- **Account → Workers KV Storage → Read** as well, for `--feedback`.

The account id is on the Workers & Pages overview page. Keep the token out of the repository.

The report prints, all among visitors who allowed counting: unique visitors and page views per day; how many pressed Allow; top linking sites and `ref` labels; countries, devices, screen sizes, browsers, languages, tab or installed app, and top pages; the tool funnel (page views of the tool → sessions started → completed, stopped and the other endings, total and median minutes kept awake, lengths chosen, top 10 faces and backgrounds); reliability (wake lock refusals by reason, video fallback, taps asked for and given, installs, mini clock) and the most frequent errors.

How to read it:

- Every count is `sum(_sample_interval)`, so it stays right if Analytics Engine starts sampling under heavy load. The report says when that happened. Unique visitors are then a lower bound.
- Days are UTC. A visitor is counted once per day, so a total over several days adds the days together.
- "Visits" in the two "where they came from" tables are first pages of a visit that carried a referrer or a label.
- If one query fails, its section says why and the rest of the report still prints.

## 8. Five numbers to watch on launch day

1. **Unique visitors today**, and beside it the dashboard's unique visitors: the first is who allowed counting, the second is everyone.
2. **Visits with `ref` `producthunt`** (and the `producthunt.com` row under linking sites): how much of the day is the launch.
3. **Start rate**: sessions started ÷ page views of the tool. This is whether people who arrive actually use it.
4. **Failures**: wake lock refusals by reason, video fallback uses, and the top errors. One reason or one error climbing fast is the thing to fix first.
5. **Completed against stopped, and the median minutes kept awake**: whether a session does the job once it starts.

Then read `--feedback`. It is the only place people say why.

## 9. Known limits

- Only people who allow counting are in the numbers (§1).
- `share_click` is not sent: sharing lives in the tool's own panel and has no place to call from outside it. The helper is `track('share_click')` from `apps/site/lib/telemetry/client.ts`.
- The mini clock is counted when it opens as a Picture-in-Picture window. Where the browser opens it as a small popup instead, it shows up as a `page_view` of `/pip`.
- A session that was already running when the person pressed Allow is followed from that moment: it has an end but no start, and only the minutes after Allow are counted.
- A tab the browser discards in the background without telling the page loses the minutes of its unfinished session.
- An iPad that asks for desktop pages reports itself as a Mac, so it counts as `desktop`; the `viewport` column still shows its real layout.
- Ad blockers that block beacons, and browsers with scripts off, are not counted.
- `/api/e` allows 30 requests per caller in 60 seconds (the `RL_EVENTS` rate limit binding in `apps/site/wrangler.jsonc`). Many people behind one address (an office) can lose some events.
- The rate limiter is a Cloudflare Workers Rate Limiting binding. It writes nothing to KV, so counting visits costs no KV reads or writes. If the limiter fails, the request goes through; on a local server, where there is no binding, the count is kept in memory.

## 10. Files

| File | Role |
|---|---|
| `apps/site/components/site/consent.tsx` | the "Count this visit?" card |
| `apps/site/lib/tool/settings.ts` | `readTelemetry()` and `setTelemetry()` behind the "Count my visits" switch in Settings |
| `apps/site/components/telemetry.tsx` | mounted once in the locale layout; starts the sender and reports route changes |
| `apps/site/lib/telemetry/client.ts` | the consent check, the queue, `track`, `flush`, and `consentChanged()` for anything that saves the answer |
| `apps/site/lib/telemetry/boot.ts` | page views, errors, install and mini clock events; starts and stops with the answer |
| `apps/site/lib/telemetry/session-events.ts` | turns two snapshots of the wake store into session events |
| `apps/site/lib/telemetry/session-watch.ts` | watches the wake store on the pages that run a session |
| `apps/site/lib/telemetry/shape.ts` | the cleaners both sides share (path, referrer host, `ref`, ids, error text) |
| `apps/site/lib/server/events.ts`, `apps/site/app/api/e/route.ts` | the endpoint: the capped body read, allow-list, request facts, daily key, Analytics Engine row |
| `apps/site/lib/server/env.ts` | the accepted event names (`EVENT_NAMES`), the batch and body limits |
| `apps/site/lib/server/ratelimit.ts` | the rate limit for the endpoint |
| `scripts/metrics.mjs` | the report and `--feedback` |

# 00 · Conventions, glossary and canonical facts

> Implementation: the site is Next.js 16 in `apps/site`, running on Cloudflare Workers through OpenNext ([Next.js deployment](DEPLOYMENT.md)).

> **This file is the single source of truth for names, identifiers, states, keys, routes, plans and budgets.** Every other document in `docs/` must use these exact identifiers. If a detail here conflicts with another doc, this file wins and the other doc gets fixed. When a decision changes, change it here first.

Status: v2.0 · 13 Nov 2026 · Owner: Soubhik

---

## 1. Product identity

| Item | Value |
|---|---|
| Product name | **AwakeTab** (one word, capital A and T; never "Awake Tab" or "awaketab" in prose; `awaketab` in code/URLs) |
| Tagline | "The tab that keeps your screen awake." |
| Canonical domain | `https://awaketab.com`. `www.awaketab.com` redirects to it in the Worker; `awaketab.app`, `awaketab.page` and `awaketab.dev` redirect to it (301) at the zone |
| Company/legal | Sole proprietorship of Soubhik (India) — confirm with CA; placeholder legal name `AwakeTab` |
| GitHub repository | `soubhik-biswas/awaketab` (monorepo) |
| npm scope | `@awaketab` — package `@awaketab/wake` |
| Extension name | Product name on the website and in running text: **AwakeTab for Chrome**. Store and manifest name on the Chrome Web Store and Edge Add-ons: **AwakeTab — Keep your screen awake** (`ext.name`; Edge shows the same manifest name). Manifest short name: **AwakeTab**. The licence device label stays "AwakeTab for Chrome · {OS}" |
| Embed product | **AwakeTab Embed** (first widget: Cook Mode) |
| Business tier | **AwakeTab Business** (Embed licence, Kiosk licence) |
| Paid tier | **AwakeTab Pro** |
| Brand colours | One job each (`DESIGN.md`, values in `apps/site/app/globals.css`): green means awake (`--lamp`, `#117A3B` light / `#3DF58E` dark), violet is the action (`--primary`, `#6633F5` / `#9F7BFF`), amber means paused (`--warning`), red means blocked (`--destructive`), sky is focus and information (`--ring`). State is never colour alone: the pill text, the glyph and the ring pattern say it too |
| Favicon / icon motif | The ring (progress ring with a glowing dot at 12 o'clock) |
| Author page | `/about` — real name, testing setup, contact |

Standing decisions: name = AwakeTab; stack = Next.js on Cloudflare Workers (§3); licence = the whole repository is open source: the website (`apps/site`), the extension (`apps/extension`) and the session engine (`packages/core`) under the GNU AGPL 3.0 only (`AGPL-3.0-only`, `LICENSE`), the `@awaketab/wake` library (`packages/wake`) under MIT (`packages/wake/LICENSE`), and the AwakeTab name and logo under neither (`TRADEMARKS.md`); launch locales = 8 below; analytics = first-party beacon, sent only after the person allows it (no third-party script; `ANALYTICS.md`). Changing any of these means editing this file and grepping the docs.

---

## 2. Identifier schemes

| Kind | Format | Example |
|---|---|---|
| Functional requirement | `FR-<AREA>-##` | `FR-ENGINE-04`, `FR-TIMER-02`, `FR-PWA-01` |
| Non-functional requirement | `NFR-<AREA>-##` | `NFR-PERF-01`, `NFR-A11Y-02` |
| Architecture decision | `ADR-###` | `ADR-004` |
| Analytics event | `snake_case` | `session_start` |
| Feature gate (Pro) | `dot.case` | `ambient.packs` |
| Storage key | `at.v1.<name>` | `at.v1.settings` |
| i18n key | `dot.case` grouped by screen | `tool.pill.held` |
| Content slug | `kebab-case` | `keep-screen-on-while-cooking` |
| TypeScript interface | `I` + `PascalCase` | `IWakeLockHandle`, `ISession` |
| TypeScript type alias | `T` + `PascalCase` | `TLockState`, `TPresetId` |
| Runtime constant map | `SCREAMING_SNAKE` + `as const` | `PRESET_MS`, `STORAGE_KEYS` |

The `I`/`T` prefixes are enforced by `@typescript-eslint/naming-convention` and apply to every workspace, including the type surfaces of the published `@awaketab/wake` and the private `@awaketab/core`. The Worker bindings type `IEnv` (`apps/site/lib/server/env.ts`) already complies. The shadcn/ui files the registry generates (`apps/site/components/ui/**`) are exempt so updates apply cleanly; only the components the product uses are kept there. `enum` is banned by `no-restricted-syntax` — closed sets are string-literal unions (`TLockState`, `TEndReason`) or `as const` maps, because `enum` emits runtime JavaScript. Renaming a *type* never renames a *value*: the seven lock-state strings in §5.1, the storage keys in §6 and the preset ids stay byte-identical.

Areas for FR/NFR: `ENGINE`, `TIMER`, `UI`, `AMBIENT`, `STATS`, `PWA`, `PIP`, `I18N`, `SEO`, `CONTENT`, `PRO`, `ADS`, `EXT`, `EMBED`, `LIB`, `API`, `ANALYTICS`, `PERF`, `A11Y`, `SEC`, `PRIVACY`, `COMPAT`.

Priority labels: `P0` (launch blocker), `P1` (launch), `P2` (post-launch, phase 3), `P3` (later).

---

## 3. Stack (canonical)

| Layer | Choice | Notes |
|---|---|---|
| Site framework | **Next.js 16** (App Router, React 19) in `apps/site`, built for Workers by OpenNext; content collections (`@content-collections`, Markdown in `apps/site/content`); `next-intl` locale routing | The tool is a React component tree (`apps/site/components/tool`). |
| Language | TypeScript, `strict: true`, ESM | Node 22 LTS, pnpm 12 workspaces |
| Styling | Tailwind CSS v4 with design tokens as CSS variables (`apps/site/app/globals.css`); **shadcn/ui** components (`apps/site/components/ui`) | Fonts come from `next/font/google` (`apps/site/app/fonts.ts`), which self-hosts them at build time, so pages make no third-party font request; Japanese and Chinese text uses the device's own fonts; the extension keeps the `--at-*` tokens (`10-extension-spec.md` §8) |
| PWA | Serwist service worker `apps/site/worker/sw.ts`, bundled by esbuild (`apps/site/scripts/build-sw.mjs`) to `public/serwist/sw.js` before `next build` | Precaches the offline pages and widget templates; a new revision per build |
| Hosting | **Cloudflare Workers**: `awaketab-site` (awaketab.com) and `awaketab-site-preview` (play.awaketab.com); `/api/*` are Next.js route handlers | `apps/site/wrangler.jsonc`; `DEPLOYMENT.md` |
| Serverless state | Cloudflare **KV** `LICENSES` (licences, embed configs, feedback, ratings), **Workers Analytics Engine** `EVENTS` (events), **D1** `AUTH_DB` (sign-in), **Workers Rate Limiting** bindings `RL_EVENTS`, `RL_FEEDBACK` and `RL_LICENSE` (request limits; nothing is stored in KV for them) | Accounts exist only for sign-in (Better Auth, `apps/site/lib/auth`) |
| Payments | **Polar.sh** as merchant of record (checkout, licence keys, webhooks) | Alternative: Dodo Payments (UPI) — not in v1 |
| Ads | Google AdSense → Journey by Mediavine → Raptive/Mediavine (content pages only) | Loader module only in content layout |
| Analytics | First-party beacon `POST /api/e` → Analytics Engine, opt-in only; Google Search Console; CrUX | No cookies, no third-party analytics script; nothing is sent until the person allows it (`ANALYTICS.md`) |
| Extension | **WXT** framework, Manifest V3, Chromium (`chrome.power`) | Firefox has no `power` API → not supported in v1 |
| Library | `@awaketab/wake` — tsup build (ESM + CJS + d.ts), zero deps | Semantic versioning, changesets |
| Testing | Vitest (unit, site), Playwright (extension e2e), axe-core, Lighthouse CI | See `13-testing-strategy.md` |
| CI/CD | GitHub Actions run the checks on pushes to `main` and `play` and on pull requests; Cloudflare Workers Builds deploys `main` to awaketab.com and `play` to play.awaketab.com | See `14-devops.md` §1–§2 and `DEPLOYMENT.md` |
| OG images | Rendered by the `/og` route (`next/og`) per page template | |
| Errors | Console + first-party `client_error` event (opt-in like every event, at most 5 per page load); no Sentry in v1 | |

---

## 4. Repository layout

```
awaketab/
├─ apps/
│  ├─ site/                # Next.js site, tool, embed iframe app, PiP page, API route handlers (Cloudflare Worker)
│  │  ├─ app/              # routes (see §7): [locale]/ pages, api/ route handlers, og/, robots, sitemap, manifest
│  │  ├─ content/          # Markdown collections: for/, on/, vs/, guides/, learn/ (per locale)
│  │  ├─ components/       # tool/, face/, site/ (header, footer, page shell), embed/, pip/, pro/, ui/ = shadcn/ui primitives
│  │  ├─ lib/              # server/ (API, licences, Polar, rate limit), auth/, embed/, tool/, seo.ts, routes.ts
│  │  ├─ messages/         # ui strings: en.json, es.json, pt-br.json, de.json, fr.json, ja.json, zh.json, hi.json
│  │  ├─ i18n/             # next-intl routing, locales, slugs.json
│  │  ├─ worker/sw.ts      # service worker source (bundled to public/serwist/sw.js by scripts/build-sw.mjs)
│  │  ├─ migrations/       # D1 migrations for AUTH_DB
│  │  ├─ public/           # icons, OG backgrounds, widgets, _headers
│  │  └─ wrangler.jsonc    # Worker bindings: production and env.preview
│  └─ extension/           # WXT project (popup, options, background service worker)
├─ packages/
│  ├─ wake/                # @awaketab/wake — low-level Screen Wake Lock + fallback + status events
│  └─ core/                # @awaketab/core — session engine, plans, stats, storage schema, licence token verification (framework-agnostic; shared by web + extension)
├─ scripts/                # setup, licence keys (keys-dev, keys-prod, check-keys, dev-license-key.json), kv/ backups, lint helpers
├─ docs/                   # this documentation set
├─ .github/workflows/      # ci.yml, e2e.yml, lighthouse.yml, release.yml, kv-backup.yml, nightly.yml, …
├─ pnpm-workspace.yaml · package.json · CLAUDE.md
```

---

## 5. Engine and session vocabulary

### 5.1 Lock states (`@awaketab/wake`) — exactly seven

| State | Meaning |
|---|---|
| `idle` | No lock requested |
| `requesting` | `navigator.wakeLock.request('screen')` in flight |
| `held` | Sentinel alive |
| `lost` | Sentinel released by the browser (tab hidden, OS) |
| `denied` | Request rejected (`NotAllowedError`: hidden document, page policy, Safari before a tap, Firefox at ≤ 5 % battery) |
| `unsupported` | `navigator.wakeLock` absent |
| `fallback` | The fallback clip is seen playing after a user gesture: a 1 × 1 px video with a silent audio track, not muted (`04-engine-spec.md` §5) |

Only `held` and `fallback` may show a running timer. Transitions are specified in `04-engine-spec.md`.

**Session states and the status pill.** The tool turns the lock states into nine session states (`TWakeState`, the reducer in `apps/site/lib/tool/session.ts`). The pill shows exactly these words (`tool.glance.pill.*` in `apps/site/messages/`), a glyph of its own shape per state and the state colour, so no state reads by colour alone.

| Session state | From | Status pill (en) | Colour | Glyph |
|---|---|---|---|---|
| `idle` | lock `idle`, nothing started | "Not keeping awake" | neutral | hollow circle |
| `starting` | lock `requesting` | "Asking the browser…" | sky | dashed ring |
| `running` | lock `held` | "Awake · until 12:26 PM" · "Awake · until you stop" with no end | volt, pulsing | filled dot |
| `fallback` | lock `fallback` | "Awake via video · until 12:26 PM" · "Awake via video · until you stop" | sky, pulsing | play mark in a frame |
| `paused` | the person pressed Pause | "Paused · 57 min left" · "Paused · no end" | amber | two bars |
| `needsyou` | lock `lost` because the tab was hidden, or `denied` with `hidden_document` | "Tap to resume · tab was hidden" | amber | two bars |
| `blocked` | lock `denied` | "Not awake · {reason}": "battery saver", "the browser said no", "needs a secure page", "not allowed here" | red | slashed circle |
| `unsupported` | lock `unsupported` | "No wake lock in this browser" | sky | warning triangle |
| `ended` | the end time passed | "Time’s up · it slept at 12:26 PM" | neutral | bell |

Rules that hold on every surface (tool, tab title, announcer, face, history, mini clock, widgets, wall mode):

- **Paused is only the person's own Pause.** It freezes the clock (`pausedAt` is set) and Resume moves the end time by the length of the pause.
- **A hidden tab that lost the lock is `needsyou`, never paused.** The clock keeps running to the same end time; if that time passes while the tab is hidden, the session ends normally. When the tab is visible again the lock is asked for by itself: granted, the state is `running` again with no tap; `needsyou` stays on screen only when the browser wants a gesture first.
- **A warning shows only while the browser is really refusing.** "Not awake", the red banner and Help & fixes never claim a problem while a lock is held.
- An end time past midnight says "tomorrow" ("Awake · until 12:30 AM tomorrow").

The face caption (`face.t.cap.*`, shown under a face that is not `bare`) uses the same words without the time: "Not keeping awake" · "Asking the browser…" · "Awake" · "Awake via video" · "Paused" · "Not awake" · "No wake lock in this browser" · "Time’s up", and "Tap to resume" for a face drawn with `needs`.

**The extension** keeps the same seven lock states behind `chrome.power` and shows them as four views with their own pill words (`ext.pill.*`): Ready, Awake, Paused and Blocked. It has no video fallback and no system-only level (`10-extension-spec.md` §3).

### 5.2 Session (`@awaketab/core`)

| Concept | Values |
|---|---|
| Session status | `inactive` · `active` · `paused` · `completed` · `aborted` |
| Plan type | `indefinite` · `duration` (`ms`) · `until` (`endsAt` epoch ms, local clock) |
| End reason | `completed` · `user` · `lost_timeout` · `denied` · `battery` · `error` |
| Preset IDs | `p15` (15 min) · `p30` · `p45` · `p60` · `p120` · `p240` · `pinf` (∞) · `custom` · `until` |
| Ambient modes | `standard` · `clock` · `focus` · `breathe` · `minimal` · `night` · `message` · `cook` |
| Theme | `auto` · `light` · `dark` · `oled` |
| End behaviour | `stop` · `prompt_extend` (default) |

Timing rules: ticks every 1000 ms aligned to the wall clock; all arithmetic uses `Date.now()` (never accumulated deltas); the end of a session is a timestamp, not a counter. `endsAt` is the real end time: it moves forward by the length of each pause when the session is resumed. A stored session is `paused` only for the person's own pause; a session that needs a tap is stored `active`, and after a reload it asks for the lock again by itself.

### 5.3 Keyboard shortcuts (the tool)

`Space` start, pause or resume · `Enter` start (Set mode) · `←` `→` shorter or longer length (Set mode) · `+` `−` add or take off 5 minutes · `F` Faces · `Shift+F` fullscreen · `V` Vibe · `R` Recents · `,` Settings · `⌘K` / `Ctrl K` the command palette · `?` the command palette, which lists every command with its key · `Esc` close the open panel.

Single keys act only while focus is inside the tool, no panel is open and nothing is being typed; `⌘K` / `Ctrl K` works anywhere on the page. With focus on a button, `Space` and `Enter` press that button. `Shift+F` and the Fullscreen button are offered only where the browser has a Fullscreen API.

---

## 6. Storage (localStorage, JSON, versioned)

| Key | Contents | Notes |
|---|---|---|
| `at.v1.settings` | `ISettings` object (theme, face, defaultPreset, sound, ambient, locale, telemetry, …) plus the tool's own fields: `vibe`, `vibeMotion`, `ambientOn`, `dimAtNight`, `keepControls` | Defaults applied on read; schema in `08-data-storage.md`. `telemetry` is written only by the person's answer (the "Count this visit?" card or Settings → Count my visits), never as a default. `ambient.clock24h` stays `null` until the person picks 12-hour or 24-hour (the tool reads that as `clockSet`); until then the clock follows the language |
| `at.v1.session` | Current/last `ISession` (id, plan, presetId, mode, startedAt, endsAt, status, pausedAt, pausedMs) | Lets a session survive a reload; `endsAt` is the real end time |
| `at.v1.stats` | `{ days: { "YYYY-MM-DD": minutes }, totalMinutes, sessions, longestStreak }` | Day key = **local** date via `Intl.DateTimeFormat('en-CA')`; retained 365 days |
| `at.v1.license` | `{ token, plan, exp, features[], lastValidatedAt, deviceId }` | Token = ES256 JWT signed by our Worker |
| `at.v1.meta` | `{ installedAt, sessionCount, ratingPrompt: { shownAt, action, stars?, rearmAt? }, lastSeenVersion }` | `rearmAt` is the session count at which a "later" answer asks again |
| `at.v1.onboarding` | `{ dismissedTips: [] }` | The `analytics` tip records that the visit-counting question was answered |
| `at.v1.account` | `{ v: 1, method, name, signedInAt }` | `method` is `google`, `github` or `passkey`. Written when a sign-in session is confirmed; removed by Sign out, Delete account or a session the server no longer backs. Holds no address. Never sent anywhere (`08-data-storage.md` §2.9a) |
| `at.v1.studio` | `{ v: 1, lamp, glow }` | Face studio: `lamp` `''` or `#RRGGBB`, `glow` 0–100 in steps of 5 (default 70) (`08-data-storage.md` §2.9a) |
| `at.v1.presets` | `{ v: 1, items: [{ id, label, icon, totalSec, face, chime, vibe? }] }` | Saved from the tool, at most 20; schema in `08-data-storage.md` §2.9b |
| `at.v1.history` | `{ v: 1, items: [{ id, label, icon, face, startedAt, endedAt, totalSec, awakeSec, reason }] }` | Sessions of a minute or more, at most 200, 365 days; Settings → Clear history removes only this key |
| `at.v1.journey` | `{ v: 1, firstSeen, sessions, firstDoneAt, quietUntil }` | What the first-session card and the one Pro nudge need; never sent anywhere (`08-data-storage.md` §2.9c) |
| `at.v1.notes` | IndexedDB, not localStorage: database `awaketab`, store `notes`, this key. `{ v: 1, notes: [{ id, title, doc, createdAt, updatedAt, pinned? }], current?, voiceOk? }` | Never leaves the device; schema in `08-data-storage.md` §2.1a |
| `theme` | `system` · `light` · `dark` · `oled` | Written by the theme library (`next-themes`) so the page paints in the right theme before any script of ours runs; the tool keeps `at.v1.settings.theme` in step with it |

sessionStorage also holds `at.v1.signin` (the sign-in button pressed, for the trip to Google or GitHub and back; read once) beside `at.tabId`.

`BroadcastChannel('awaketab')` coordinates multiple tabs (the "another tab is keeping this screen awake" banner and Take over). A tab that holds the lock repeats its state every 3 s, and a tab not heard from for 10 s is forgotten. Migrations: `migrate(fromVersion)` in `@awaketab/core/storage`; bump prefix to `at.v2.` only for breaking changes.

---

## 7. Routes (English at root; locales under `/{lang}/`)

| Route | Purpose |
|---|---|
| `/` | The tool, filling the first screen, plus the home story below it |
| `/15m` `/30m` `/45m` `/1h` `/2h` `/4h` `/8h` | Preset pages (indexable, self-canonical, English only) |
| `/until/HH-MM` | Until-time pages in 5-minute steps (noindex, canonical `/`, English only) |
| `/for` · `/on` · `/vs` · `/guides` · `/learn` | The five hubs (indexable, English only) |
| `/for/{slug}` | 14 scenario pages |
| `/on/{slug}` | 11 device and browser pages |
| `/vs/{slug}` | 7 comparison pages |
| `/guides/{slug}` | 7 OS how-to pages |
| `/learn/{slug}` | 8 docs pages: how AwakeTab works, honest limits, FAQ, reference and developer pages |
| `/{lang}/{collection}/{slug}` | A translated article; `es`, `pt-br`, `de` and `fr` use the translated slug, `ja`, `zh` and `hi` the English one |
| Moved URLs (301, `apps/site/proxy.ts`) | `/for/second-monitor` → `/guides/second-monitor-turns-off`, `/on/windows-10` → `/on/windows-11`, `/guides/modern-standby` → `/guides/lock-screen-vs-sleep`, `/learn/nosleep-js-vs-wake-lock` → `/vs/nosleep-js`, `/support-matrix` → `/learn/browser-support-matrix`, `/how-we-tested` → `/learn/how-we-tested`, and the design boards' sample addresses `/learn/browser-support`, `/on/iphone-and-ipad`, `/vs/mouse-jiggler`, `/guides/presenting`, `/legal/privacy` and `/legal/terms` → the pages that own those topics. Never built, 404: `/for/navigation`, `/for/live-streams`, `/for/exams-proctoring`, `/for/baby-monitor` |
| `/pro` · `/pro/checkout` · `/pro/activate` · `/pro/manage` | Pricing, the purchase flow (`#plans` · `#account` · `#check` · `#pay`, `?plan=yearly\|monthly`), activation and plan management. Only while `NEXT_PUBLIC_PRO_ENABLED=1`; otherwise 404. All but `/pro` are noindex |
| `/signin` · `/signin/expired` | Sign-in with Google, GitHub or a passkey, and the expired-session page (noindex). Only while Pro is on; otherwise 404 |
| `/extension` · `/embed` · `/kiosk` · `/library` | Product landing pages (indexable, English only) |
| `/embed/cook` · `/{lang}/embed/cook` | Iframe app for the Cook Mode widget, in the language the loader asks for (noindex) |
| `/embed.js` | The widget loader script |
| `/pip` · `/{lang}/pip` | Popup fallback for the mini clock, in the opener's language (noindex, disallowed in robots.txt, not in the sitemap) |
| `/about` · `/privacy` · `/terms` · `/changelog` | Trust pages (indexable, English only) |
| `/rss.xml` | The changelog as an RSS feed |
| `/help` | Help centre: search over its topics and every English article, popular topics, how to send feedback (indexable) |
| `/s/{face}-{minutes}-{chime\|quiet}` | Shared setup (length, face and chime only, e.g. `/s/flip-45-chime`); an unreadable code shows the "setup removed" view. Lengths: 15, 30, 45, 60, 120, 240 or 0 (no end). Its buttons open `/?preset=p45&face=flip&chime=on` (plus `autostart=0` for "Change it first"). noindex |
| `/status` | Service status: "Everything is running", or the maintenance page when the build sets `NEXT_PUBLIC_MAINTENANCE_UNTIL`. noindex |
| `/offline` · `/{lang}/offline` · `/s/removed` | System pages (offline, setup removed), noindex. The service worker precaches the offline page of every language and shows it for an uncached address |
| Not found and server error | Any unclaimed address renders the not-found page (the timer button, the home page, three popular guides and the help centre) with status 404; a failed render shows the error page with "Try again". Neither has an address of its own |
| `/sitemap.xml` · `/robots.txt` · `/manifest.webmanifest` · `/og` | The sitemap, robots rules, web app manifest and the share-image renderer |
| `/api/*` | Next.js route handlers on the Worker (see §9) |

Spelling: page URLs have no trailing slash (`/30m`, `/for/cooking`, `/es/for/cocinar`); the only exception is `/` itself. Locale homes are `/es`, `/pt-br`, `/de`, `/fr`, `/ja`, `/zh` and `/hi`. Canonicals, hreflang, the sitemap and links use exactly these spellings.

Query params of the tool (all optional, read once on arrival and then taken off the address with `history.replaceState`, so a reload or a copied link never applies them again): `preset=` (`p15` … `p240`, `pinf`, or `custom` with `minutes=` 1–10080, as `/8h` sends `preset=custom&minutes=480`), `autostart=1` (start straight away; `autostart=0` or no value opens Set mode), `until=HH-MM`, `face=`, `vibe=`, `chime=on|off`, `open=` (`feedback` · `settings` · `faces` · `vibes` · `recents` · `language` · `pro`). A session restored after a reload keeps its own length and end time whatever the address says. `source=` (PWA start) is left on the address and ignored by the tool.

Locales and folders: `en` (root), `es`, `pt-br`, `de`, `fr`, `ja`, `zh` (Simplified), `hi`. `x-default` → root. Phase 2 locales: `id`, `tr`, `ko`, `it`, `ru`, `vi`, `ar`.

Content slugs (English canonical; translated slugs for the Latin-script locales `es`, `pt-br`, `de`, `fr` only, with hreflang linking; `ja`, `zh` and `hi` keep the English slug, e.g. `/ja/for/cooking` — `06-content-seo-spec.md` §5):
- `/for/`: cooking · presentations · downloads · ai-agents · dashboards · kiosk · sheet-music · reading · night-clock · video-calls · teleprompter · workouts · work-laptop · classroom
- `/on/`: iphone-safari · ios-home-screen · ipad · android-chrome · samsung-internet · chromebook · windows-11 ("Windows 11 and 10") · macos · linux · firefox · edge
- `/vs/`: caffeine · amphetamine · powertoys-awake · caffeinate-command · nosleep-page · nosleep-js · mouse-jigglers
- `/guides/`: windows-11-screen-turns-off-after-1-minute · mac-prevent-sleep-lid-closed · iphone-auto-lock-never-greyed-out · chrome-energy-saver · android-screen-timeout-one-app · second-monitor-turns-off · lock-screen-vs-sleep
- `/learn/`: how-awaketab-works · honest-limits · faq · screen-wake-lock-api-guide · does-a-wake-lock-keep-teams-green · low-power-mode-and-wake-locks · browser-support-matrix · how-we-tested

---

## 8. Plans, prices, gates

### 8.1 Products (Polar.sh)

| Plan ID | Name | Price | Term | Activations |
|---|---|---|---|---|
| `pro_yearly` | AwakeTab Pro (yearly) | $12 / year | 12 months + 7-day grace | 5 devices |
| `pro_monthly` | AwakeTab Pro (monthly) | not set yet; the site shows a placeholder until it is | renews every month | 5 devices |
| `pro_lifetime` | AwakeTab Pro (pay once) | no longer offered (`redesign/DECISIONS.md`, Monthly Pro); licences already bought keep working | perpetual; token re-validates every 90 days | 5 devices |
| `biz_embed_site_yearly` | AwakeTab Embed licence | $29 / year per site (domain) | 12 months | 1 domain (+ staging subdomain) |
| `biz_kiosk_site` | AwakeTab Kiosk licence | $19 one-time per site; `biz_kiosk_5` $49 for five | perpetual | per site |

### 8.2 Feature gates (Pro unless stated)

`ambient.packs` · `ambient.message` · `ambient.logo` · `schedules` · `sounds.custom` · `stats.history` (beyond 7 days) · `stats.export` · `pip.pro` (PiP with ambient modes) · `ext.autostart` · `ext.schedules` · `ads.free` · `embed.noattrib` (Business) · `kiosk.branding` (Business).

The gate ids above are the `features` a licence token can carry (`PLAN_FEATURES` in `apps/site/lib/server/license.ts`). Everything the tool does on one screen is free and stays free: the lock, every length, until-time, session restore, every clock face, the ambient views, sounds, stats, the floating window, keyboard shortcuts, the installable app and all languages. Pro, which ships switched off, adds what needs an account: keeping up to five screens in sync, starting or stopping them all from one, and history across devices (`plan/PREMIUM-LAUNCH.md`).

### 8.3 Monetization gates

| Gate | Condition | Turns on |
|---|---|---|
| G0 | Launch (Tier 0 + 1 live) | Donate link (Buy Me a Coffee, `.github/FUNDING.yml`). No ads, no Pro |
| G1 | 60 English pages indexed | AdSense on content pages; affiliate cards |
| G2 | Tier 2 shipped | Pro via Polar; `ads.free` |
| G3 | 1,000 Tier-1 sessions / 30 d and domain ≥ 4 months | Journey by Mediavine; network-managed in-view refresh, content pages only |
| G4 | 25k pv/mo, ≥ 50% Tier-1, long-form majority | Raptive application (or stay Mediavine) |
| G5 | 100k visits / mo | Sponsor card on awake screen; push Embed/Kiosk licences |

Ad rules (non-negotiable): Google ads never on the awake screen, `/pip`, `/embed/*`, or in the extension; never auto-refresh under AdSense; ≤ 3 ads in view; ads-to-content ≤ 20%; ad scripts load after LCP; slots have fixed dimensions.

---

## 9. API surface (Next.js route handlers under `/api`)

| Method · Path | Purpose | Auth |
|---|---|---|
| `POST /api/e` | Analytics events batch (≤ 20 events; the body is read up to 8 KB and refused with 413 beyond it) | none; rate-limited (`RL_EVENTS`, 30 a minute per caller) |
| `POST /api/license/activate` | `{ key, deviceId, deviceLabel }` → `{ token, plan, features, exp, activations }` | licence key |
| `POST /api/license/validate` | `{ token }` → fresh token or `{ revoked: true }` | token |
| `POST /api/license/deactivate` | `{ token, deviceId }` | token |
| `POST /api/webhooks/polar` | Polar events (`order.created`, `subscription.*`, `benefit_grant.*`) → KV; `order.paid` (first purchase) and `subscription.past_due` also queue the receipt and renewal-failed emails | HMAC signature |
| `GET`, `POST /api/auth/*` | Better Auth: sign-in with Google, GitHub or a passkey, and the session. While sign-in is not configured, `/api/auth/get-session` answers `null` and everything else 503 `auth_unavailable` | Better Auth session |
| `GET /api/auth/status` | `{ ready, google, github, passkey }`: which sign-in methods are set up | none |
| `GET /api/checkout?plan=yearly\|monthly` | Opens Polar checkout for a Pro plan (303). 404 while Pro is off; 503 `checkout_unavailable` when no product or checkout link is configured. A signed-in account id travels from the session, never from the browser | none; rate-limited (`RL_LICENSE`, 10 a minute per caller) |
| `POST /api/feedback` | `{ rating, topics?, text?, device, browser, sessions, version }` → KV `feedback:{id}`, kept two years; anything in the note that looks like an address or a phone number is removed first | none; rate-limited (`RL_FEEDBACK`, 5 a minute per caller) |
| `POST /api/rating` | `{ stars 1–5, text?, locale }` → KV `rating:{id}`, kept two years | none; rate-limited (`RL_FEEDBACK`, 5 a minute per caller) |
| `GET /api/embed/config?domain=` | `{ licensed, attribution, theme, expiresAt }` for the widget | none (public, cached 5 min) |
| `GET /api/health` | `{ ok, version, polar }`: `version` is the first 12 characters of the deployed commit (`COMMIT_SHA`; `dev` on a local server), `polar` is `sandbox` \| `production` | none |
| `POST /api/csp` | CSP violation reports (Reporting API or legacy `report-uri` body, ≤ 8 KB) → `client_error {code:'csp'}` | none; rate-limited (`RL_EVENTS`, 30 a minute per caller) |

Rate limits are Cloudflare Workers Rate Limiting bindings (`ratelimits` in `apps/site/wrangler.jsonc`): `RL_EVENTS` 30 requests in 60 s, `RL_FEEDBACK` 5 in 60 s, `RL_LICENSE` 10 in 60 s (the licence routes, checkout and passkey registration), each counted per route and per caller, keyed by a salted hash of the address. Without the binding (a local server, tests) the count is kept in memory, and a limiter that fails lets the request through (`apps/site/lib/server/ratelimit.ts`). The licence routes and their bodies are in §13.3.

Token: JWT, `alg: ES256`, claims `{ sub, plan, features, dev, iat, exp, ver }`; public key shipped in `@awaketab/core`; verified offline in the browser and the extension.

---

## 10. Analytics events (first-party, opt-in, no PII)

Nothing is sent until the person allows it: the "Count this visit?" card or the "Count my visits" switch in Settings sets `telemetry: true` in `at.v1.settings`, and events are sent only while that value is exactly `true`. Global Privacy Control, Do Not Track, the preview site, a development build and a page inside another site's frame all send nothing. The full description, the Analytics Engine columns and the report are in `ANALYTICS.md`; this section is the list of names.

Sent by the site today (`apps/site/lib/telemetry`): `page_view {via, referrer?, ref?}` · `session_start {planType, presetId, lengthMin, face, background}` · `session_end {reason, durationMin}` · `session_extend {addedMin}` · `lock_denied {reason}` · `fallback_used` · `resume_shown` · `resume_accepted` · `pwa_install` · `pip_open` · `client_error {code, message}` (at most 5 per page load).

Also accepted by `POST /api/e` (`EVENT_NAMES` in `apps/site/lib/server/env.ts`) and not sent by the site yet: `lock_state {from, to}` · `share_click {target}` · `pro_view` · `pro_checkout_click {plan, sku}` · `pro_activated {plan}` · `rating_prompt {action, stars}` · `rating_submitted` · `extension_click` · `ad_slot_loaded {page}` · `affiliate_click` · `sponsor_view {sponsorId}` · `sponsor_click {sponsorId}`. Any other name is dropped.

Common fields from the browser: `ts`, `path` (no query string), `locale`, `source` (`web` or `pwa`), `viewport` class (`phone`, `tabletP`, `tabletL`, `desktop`), `sid` (a random id kept in memory for one page load) and `ver`. The server adds, for site events only, the country, a device class, the browser family and a daily visitor key (a hash that changes every UTC day). Never stored: the IP address (read for rate limiting and the daily key, then dropped), a user id, the full User-Agent, a referrer beyond its hostname, query strings.

---

## 11. Budgets and thresholds

| Budget | Value |
|---|---|
| Site JS and CSS (gz) | Not set yet for the Next.js site, and nothing measures it: `pnpm size` covers the two packages only (`@awaketab/wake`: core entry ≤ 3.4 KB, the video clips entry ≤ 2.2 KB, the IIFE ≤ 5.8 KB, each adapter ≤ 400 B; `@awaketab/core` ≤ 7 KB) |
| Third-party requests on tool pages | 0 |
| LCP (lab, mobile emulation) | ≤ 1.2 s; field p75 ≤ 2.0 s |
| INP field p75 | ≤ 100 ms |
| CLS | 0 (fixed slot sizes everywhere) |
| Lighthouse (mobile) | Performance ≥ 95 · Accessibility 100 · Best Practices 100 · SEO 100 |
| Content pages | Ads load after LCP |
| Wake lock time-to-request | ≤ 300 ms after `DOMContentLoaded` when `autostart` conditions met |
| Availability | 99.9% for pages; `/api/*` 99.5% |
| Browser support | Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen app ≥ 18.4 (native); older → fallback; UI tested on last 2 versions |


---

## 13. Further identifiers

Section and subsection numbers are stable because other documents cite them, so they are not consecutive.

### 13.1 Engine and session constants

| Identifier | Value / meaning |
|---|---|
| `LOST_TIMEOUT_MS` | 6 h (21,600,000 ms). A session whose lock has been `lost` continuously for longer ends with reason `lost_timeout` and is not offered for resume. Finite plans end at `endsAt` if that comes first |
| `CUSTOM_MAX_MS` | 7 days — upper bound for `custom` durations; zero/negative rejected inline |
| `TLockReason` | `request` · `acquired` · `fallback_started` · `released_hidden` · `released_platform` · `denied` · `unsupported` · `user_release` · `retry` · `destroyed` (see 04 §3) |
| `TAdviceCode` | `hidden_document` · `permissions_policy` · `insecure_context` · `unsupported_browser` · `ios_safari_old` · `firefox_old` · `iframe_no_allow` — UI maps each to `tool.advice.<code>` |
| `Plan.until.wall` | `'HH:MM'` string kept with `endsAt` so the UI can re-derive after clock changes |
| `ISession` extra fields | `pausedMs`, `endedAt`, `endReason`, `awakeSeconds` (seconds in `held` or `fallback`; feeds stats), `modeState` (per-mode data, e.g. `cookTimers[]`) |
| `ISettings` extra fields | `keyboardShortcuts: boolean` (enables single-key shortcuts; WCAG 2.1.4) distinct from `keyboardHints: boolean` (shows hints); `lastCustomMs`; `ambient.message` |
| `TTabMessage` | `{type:'hello'|'lock'|'state'|'intent'|'bye', tabId, ts, …}` on `BroadcastChannel('awaketab')`; `tabId` in `sessionStorage['at.tabId']` |
| `/8h` route | Maps to a `custom` plan of 480 min; there is no `p480` chip |

### 13.3 API, storage (server) and configuration

| Identifier | Decision |
|---|---|
| Activate request/response | `{ key \| checkoutId, deviceId, deviceLabel, embed?: { domain } }`; the validate response includes `activations`; `{ checkoutId, lookup: true }` → `{ key, plan }` without activating |
| API error codes | `invalid_key` · `activation_limit` · `revoked` · `refunded` · `polar_unavailable` · `rate_limited` · `bad_token` · `bad_request` · `too_large` · `unsupported_media_type` · `storage_unavailable` · `checkout_unavailable` · `auth_unavailable` |
| KV keys | `lic:{keyHash}` · `cus:{customerId}` · `wh:{eventId}` (TTL 30 d) · `ord:{orderId}` · `embed:{domain}` · `rating:{id}` and `feedback:{id}` (TTL 2 years) · the Polar id indexes `lk:{polarLicenseKeyId}` · `grant:{benefitGrantId}` · `sub:{subscriptionId}` (`08-data-storage.md` §4). The rate limiter keeps nothing in KV |
| Secrets (Worker) | `POLAR_ACCESS_TOKEN` · `POLAR_WEBHOOK_SECRET` · `POLAR_ORGANIZATION_ID` · `POLAR_BENEFIT_MAP` (JSON benefit-id → plan) · `LICENSE_SIGNING_KEY` (private JWK, ES256) · `LICENSE_SIGNING_VER` (integer `ver` claim) · `LICENSE_KEY_ENC_KEY` (32-byte base64, AES-GCM for raw key at rest) · `RATE_LIMIT_SALT` (salts the address hash of the rate limiter and the daily visitor key) · sign-in: `BETTER_AUTH_SECRET` · `BETTER_AUTH_URL` (optional) · `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GITHUB_CLIENT_ID` · `GITHUB_CLIENT_SECRET` · Polar product ids `POLAR_PRODUCT_PRO_YEARLY` · `POLAR_PRODUCT_PRO_MONTHLY` · `POLAR_PRODUCT_PRO_LIFETIME` (optional). The full list with each purpose is `apps/site/.env.example` |
| Bindings | KV `LICENSES` · Analytics Engine `EVENTS` (dataset `awaketab_events`, `awaketab_events_preview` on the preview) · D1 `AUTH_DB` (`awaketab-auth`, `awaketab-auth-preview`) · rate limits `RL_EVENTS` (30 in 60 s) · `RL_FEEDBACK` (5 in 60 s) · `RL_LICENSE` (10 in 60 s) · static assets `ASSETS` (also holds the prerendered pages) · service `WORKER_SELF_REFERENCE` |
| KV backups | Workflow `.github/workflows/kv-backup.yml` (weekly, artifact `kv-backup-<run id>` with `{namespace}-YYYY-MM-DD.jsonl.enc`, 84 days) · root scripts `pnpm kv:backup` · `pnpm kv:restore <file>` · `pnpm kv:reencrypt` (code in `scripts/kv/`) · GitHub Actions secrets `CLOUDFLARE_API_TOKEN` (KV Read) · `CLOUDFLARE_ACCOUNT_ID` · `KV_LICENSES_ID` · `KV_LICENSES_PREVIEW_ID` (optional) · `BACKUP_ENCRYPTION_KEY` (32-byte base64) · operator-only env for rotation `OLD_LICENSE_KEY_ENC_KEY` · `NEW_LICENSE_KEY_ENC_KEY` · backup format `awaketab-kv-backup` v1 (`14-devops.md` §6–§7) |
| Public build vars | Worker vars `PUBLIC_SITE_URL` · `PUBLIC_POLAR_SERVER` (`production`/`sandbox`; the route handlers read it at run time). Read at build time: `NEXT_PUBLIC_DEPLOY_ENV` (`play` on the preview) · `NEXT_PUBLIC_POLAR_SERVER` · `NEXT_PUBLIC_PRO_ENABLED` · `NEXT_PUBLIC_ADS_ENABLED` (`'0'`/`'1'`) · `NEXT_PUBLIC_MAINTENANCE_UNTIL` · `NEXT_PUBLIC_AXE` · `NEXT_PUBLIC_APP_VERSION` · `COMMIT_SHA` (the commit `/api/health` reports; `next.config.ts` takes it from `WORKERS_CI_COMMIT_SHA`, which Workers Builds sets, then `COMMIT_SHA`, then `git rev-parse HEAD`). The IndexNow key is a constant in `scripts/indexnow.mjs` |
| Code constants | `LICENSE_PUBLIC_KEYS: Record<number, JsonWebKey>` in `@awaketab/core` (`PRODUCTION_LICENSE_PUBLIC_KEYS`, plus the dev key in sandbox builds only) · `PLAN_PRICES` (`apps/site/lib/pro/plans.ts`) · `PLAN_FEATURES` (`apps/site/lib/server/license.ts`) |
| Polar labels | benefits `lk_pro_yearly`, `lk_pro_lifetime`, `lk_embed`, `lk_kiosk_site`, `lk_kiosk_5`; the benefit-id → plan map is the secret `POLAR_BENEFIT_MAP` |
| CMP | Google-certified CMP on content pages only, for EEA/UK/CH visitors, once ads are on; tool pages never load a CMP |

### 13.4 Analytics additions

Event names and fields are listed in §10. `client_error.code` is the error's class name (`TypeError`, …) for an uncaught error or an unhandled rejection, and `csp` for a content-security-policy report stored by `POST /api/csp`.

### 13.31 Glance clock faces

Spec: `docs/plan/glance/AGENT_PROMPT.md` §6.

| Identifier | Decision |
|---|---|
| Face ids | `FACE_IDS` in `packages/core/src/types.ts` and `apps/site/components/face/model.ts` (the same 46, gallery order): `ring` · `bold` · `horizon` · `tide` · `flip` · `rolling` · `analog` · `luxe` · `rings` · `words` · `nixie` · `lcd` · `dive` · `chrono` · `gauge` · `type` · `bars` · `timeline` · `pilot` · `dual` · `radar` · `dots` · `hourglass` · `battery` · `stack` · `board` · `orbit` · `disc` · `clocks` · `wordgrid` · `tape` · `moon` · `aurora` · `glass` · `neon` · `liquid` · `eclipse` · `skeleton` · `bauhaus` · `poster` · `eink` · `waveform` · `blob` · `hud` · `constellation` · `halo`; default `ring` |
| Old ids | `led`, `pulse`, `terminal`. `migrateFace` (core storage) and `toFaceId` / `RETIRED_FACES` (site) read `led` → `lcd`, `terminal` → `lcd`, `pulse` → `waveform`, `matrix` → `lcd`, `word` → `words`, unknown → `ring` |
| Collections | `FACE_COLLECTIONS`: `featured` (18), `digital` (15), `analog` (14), `ambient` (17), `all` (46); `FACES[i].kind` and `FACES[i].featured` |
| Face API | `<Face face theme state remain total nowSec size lamp? bare? framed? indef? motion? lblTop? lblEnd? fmt? className?>`; `FACES`, `FACE_IDS`, `FACE_COLLECTIONS`, `faceName`, `faceKind`, `loadFace`, `preloadFaces`, `isFaceId`, `toFaceId`, `FaceGrid` |
| Root markup | `.af[role="timer"][aria-label]` > `.af-a[aria-hidden]` (the 360 × 315 artboard plus caption, `transform: scale(size / 360)`); the box is `size × round(size × 0.875)` when bare, square with the caption or `framed`; classes `af-live`, `af-still`, `af-compact` (size < 200: `.af-l` text hidden), `af-thumb` (size ≤ 64: `.af-d` detail hidden) |
| Colour | The face file's palette per theme (`FACE_PALETTE`), not page tokens; `--fl` (lamp or Face studio accent) and `--fa` (state colour) on the root |

---

## 14. Writing conventions for these docs

- Requirements are testable sentences with "must/should/may"; every FR has at least one acceptance criterion in Given/When/Then form.
- Refer to states, keys and routes in backticks exactly as written here.
- Dates are absolute (ISO).
- Estimates are marked as estimates where they appear.
- Each doc starts with: title, status line (version · date · owner), one-paragraph purpose, and "Related docs".

# 13 · Testing strategy

Status: v1.5 · 2026-11-13 · Owner: Soubhik

**Purpose.** The product's one promise is "the pill never lies". This document defines the tests that prove it — from the state machine to real devices — plus the performance, accessibility and API checks that protect the other goals. Everything here is automated except the device matrix, whose results are published as `/learn/how-we-tested`, and the site's visible changes, which are checked by hand until the site has its own browser suite.

Related docs: `04-engine-spec.md` (what is being tested) · `08-data-storage.md` (fixtures) · `06-content-seo-spec.md` (SEO rules) · `09-monetization-impl.md` (licence/ads) · `14-devops.md` §2 (the workflows) · `00-conventions.md` §11 (budgets).

> **Scope.** The site is the Next.js app in `apps/site`. §1 lists every suite that runs. The site has no browser end-to-end suite yet: the extension has one, and the site's pages are checked by hand against the design (`DESIGN.md`, `docs/plan/glance/AGENT_PROMPT.md` and the decisions in `docs/redesign/DECISIONS.md`; the design boards are kept outside this repository).

---

## 1. Pyramid and tooling

| Layer | Tool | Runs on | Blocks merge? |
|---|---|---|---|
| Types | `pnpm typecheck` (`pnpm -r typecheck`): `tsc --noEmit` per package and for `apps/site`; `wxt prepare && tsc --noEmit` for the extension; then `tsc -p scripts/tsconfig.json` for the root scripts, their tests and the root Vitest config | every PR | yes |
| Dead code | `pnpm knip` (Knip, config in `knip.json`; part of `pnpm lint`): unused files, exports, types and dependencies in every workspace. Entry points are the Next.js routes, the scripts, the tests and the published package exports; the only ignores are the unused exports and types of the vendored shadcn/ui files (`components/ui/*.tsx`; the components themselves must be used) and the two Tailwind packages that are loaded from CSS | every PR | yes |
| Unit (`packages/*`, `scripts/`, `apps/extension/test`) | Vitest + fake timers + happy-dom (root `vitest.config.ts`, `pnpm test:unit`) | every PR | yes |
| Site (`apps/site`) | Vitest + happy-dom (`apps/site/vitest.config.ts`, `pnpm test:site`): faces, the session machine, surfaces, embed, Pro plans, sign-in helpers, page metadata, deployment settings, API headers and checkout targets (§4) | every PR | yes |
| E2E (extension, chromium) | Playwright (`pnpm test:e2e:ext`, `.github/workflows/e2e.yml`) with axe-core, plus `pnpm -F extension zip:check` | every PR | yes |
| E2E (site) | None yet; check visible changes by hand against the design | — | — |
| Accessibility | axe-core in the extension Playwright suite; `NEXT_PUBLIC_AXE=1` logs WCAG 2.2 AA violations in the site during development; manual SR checklist | every PR (extension axe) | yes (extension axe) |
| Performance | Lighthouse CI (`lighthouserc.cjs`) + `size-limit` (packages, `pnpm size`) | every PR (size, and LHCI on a local build); a deployed origin by hand (LHCI) | yes (size) |
| Dependencies | `pnpm audit --audit-level high` | nightly | — |
| Device matrix | manual, templated | before each release and each browser major | gate |

`ci.yml` runs on every pull request and on every push to `main` and to `play`. A feature branch is merged into `play` first and checked on play.awaketab.com, then the same branch is merged into `main`; `play` is never merged into `main`. Cloudflare Workers Builds runs the same gates (lint, typecheck, tests, build, size) again before it deploys either branch, so a commit that fails them is never deployed (`14-devops.md` §1–§2).

Coverage is not measured: no coverage tool is configured. The standing rule is that every `@awaketab/wake` transition row has a test (§2).

---

## 2. `@awaketab/wake` unit tests

Fake `navigator.wakeLock` injected via `navigatorLike`; fake `document` with controllable `visibilityState` via `documentLike`; `fakeMedia()` in `packages/wake/test/fake.ts` stands in for a media element that plays, is refused or stalls.

```ts
class FakeSentinel extends EventTarget { released = false; type = 'screen'; release = async () => { this.released = true; this.dispatchEvent(new Event('release')); } }
const fakeWakeLock = { request: vi.fn(async () => new FakeSentinel()) };
```

| ID | Scenario | Expect |
|---|---|---|
| T01 | `request()` resolves | `idle → requesting → held`, reason `acquired` |
| T02 | `request()` rejects `NotAllowedError` while visible & plugged | `denied`, advice `null` (cause unknown; UA-agnostic default), one retry after `baseMs` |
| T03 | rejects `NotAllowedError` while `hidden` | `denied`, advice `hidden_document`; auto re-request on visible → `held` |
| T04 | rejects `SecurityError`/insecure context | `unsupported` with `insecure_context` |
| T05 | sentinel `release` while hidden | `held → lost` (`released_hidden`); visible → `requesting → held` |
| T06 | sentinel `release` while visible | `lost` (`released_platform`) → single retry → `held` or `denied` |
| T07 | `navigator.wakeLock` undefined | `unsupported` at creation; `request()` → fallback path |
| T08 | fallback `play()` resolves and the clip is seen playing (its clock advances) | `unsupported → fallback`, video element attached, watchdog armed |
| T09 | fallback `play()` rejects (autoplay) | stays `unsupported`, `error` emitted, no video left attached |
| T09b | fallback `play()` never settles and the last `<source>` fires `error` | `request()` resolves to `unsupported` at once (advice `unsupported_browser`), no video left attached |
| T09c | default sources vs `videoSources` | both built-in clips are offered, WebM first, then MP4; a passed source replaces the built-in clip of its own type |
| T09d | the built-in clips | each is a real ten-second video with a video track and a silent audio track, inside the size budget |
| T10 | `release()` from `held` / `fallback` | `idle` (`user_release`); sentinel released; video paused and removed |
| T11 | `destroy()` | the lock is released first, then listeners removed; further `request()` is a no-op resolving `idle` |
| T12 | `fullscreenchange` while `held` | nothing is requested; the one sentinel stays |
| T12b | `fullscreenchange` while `denied` | one more request |
| T13 | in iframe without `allow` (`permissions policy` rejection) | `denied`, advice `iframe_no_allow` |
| T14 | UA iOS 16.0 Safari | `classifyDenial` → `ios_safari_old`; UA Firefox 120 → `firefox_old` |
| T15 | retry exhaustion | 3 attempts then `denied` stays until `request()` |
| T16 | SSR (`window` undefined) | inert handle, `supported=false`, no throw |

Beside the transition rows: `test/sentinels.test.ts` counts live sentinels through fullscreen changes, rapid request and release (calls are serialised; `request()` while `held` returns `held` without asking again) and `destroy()`; `test/fallback.test.ts` drives the clip that plays, is refused, never advances or stalls later (reported as `fallback` only once playback is seen to advance); `test/adapters.test.ts` mounts, unmounts and mounts each adapter again; `test/pack.test.ts` checks what gets published.

---

## 3. `@awaketab/core` unit tests

### 3.1 Tick algorithm (fake timers + `vi.setSystemTime`)

- Duration plan 90 min: after 90 min of wall time (advanced in 1 s steps and in one 5 min jump) `status='completed'`, `endReason='completed'`; timer never drifts (compare against `endsAt`).
- Clock jumps forward 1 h during `until` → session ends immediately if past `endsAt`; jumps backward → continues, `wall` unchanged.
- DST: `until 02:30` on the spring-forward night in `America/New_York` resolves to 03:30 wall time; the fall-back night ends at the first 01:30.
- `visibilitychange` after 40 min hidden → one recompute, no burst of ticks.

### 3.2 Pause/resume and coupling

`pause()` sets `paused` with `pausedAt` and stops the clock; `resume()` adds the pause to `pausedMs` and moves `endsAt` forward by the same amount for a `duration` plan, so the time left is kept; an `until` plan keeps its wall-clock end and completes at once if it passed during the pause. A lock that goes `lost` does not pause the session: it stays `active` with the clock running, and `lost` for `LOST_TIMEOUT_MS` or longer → `aborted` `lost_timeout`; `denied` mid-session → `aborted` `denied`; battery threshold crossed (fake `getBattery`) → `battery`, hysteresis prevents flapping at ±2%.

**Pause, added time and tabs.** `pause({ keepLock: true })` freezes the clock but keeps the lock `held`, while a plain `pause()` still releases; `addTime` grows a `duration` plan in place, turns an `until` plan into a `duration` with the same moved deadline, and ignores `indefinite`, non-positive and over-`CUSTOM_MAX_MS` values; `updateSession` persists `mode` and `modeState`; `stop()` after completion releases the extend-prompt grace lock; state snapshots are broadcast and an `intent` addressed to the engine's `tabId` is obeyed (others ignored); a `hello` is answered with a snapshot; battery at 14% with a 15% threshold ends the session once, warning first. `session-resume.test.ts`: a session paused and resumed is still running after a restart past its first end time, is no longer resumable once the moved end time has passed, keeps its time while still paused, and a record saved with the first end time and a paused total is read as ending later by that total.

### 3.3 Stats

Fixtures `stats.kolkata-midnight.json` and `stats.la-dst.json`: a session 23:30–00:30 in `Asia/Kolkata` writes 30 min to each local day (never to the UTC day); streak counts consecutive local days with ≥ 1 min; 365-day pruning; CSV export matches columns.

### 3.4 Storage

Defaults applied for missing fields; corrupt JSON → defaults + one `client_error storage_unavailable`? (no — corrupt value → defaults silently; only a throwing adapter emits the error); private-mode adapter → memory fallback; `migrate()` idempotent; `clearAll()` removes every `at.*` key.

### 3.5 Licence verification

Valid token → features; expired → none; tampered payload → none; unknown `ver` → none; device mismatch → none; grace: yearly token 3 days past `exp` with `lastValidatedAt` recent → still valid; kiosk token verified offline for 365 d.

### 3.6 i18n and content

Covered where the code lives: `apps/site/app/metadata.test.ts` checks every English page and article for its title, description, canonical and alternates, and `apps/site/content-collections.ts` rejects bad frontmatter when the content is built (`pnpm -F site content`, which also runs on install).

---

## 4. Site tests (`pnpm test:site`)

Vitest with happy-dom, configured in `apps/site/vitest.config.ts`. The tests sit beside the code they cover:

| File | Covers |
|---|---|
| `app/metadata.test.ts` | Titles, descriptions, canonicals, alternates and share images of the pages and articles |
| `app/deployment.test.ts` | Production stays indexable, the preview stays out of search at the metadata, crawler and header layers, and production and preview keep separate domains, data and payments in `wrangler.jsonc` |
| `components/face/face.test.ts` | The clock faces and their ids |
| `lib/tool/session.test.ts`, `lib/wake.test.ts` | The tool's session machine and the wake controller: paused is only the person's Pause, a hidden tab is "needs you" with the clock running, the end time moves on resume, a reload asks for the lock again, the heartbeat and the 10-second peer timeout |
| `lib/clock-format.test.ts` | The clock as each language writes it: the 12/24-hour setting, the language default, the Hindi day periods |
| `components/tool/*.test.*` | Fitting the face to the stage, the tool's hooks and the crash copy |
| `lib/surfaces/surfaces.test.ts` | The surface view, the mirror, the kiosk and the widgets |
| `lib/embed/embed.test.ts` | The widget's message protocol, its session plans, the kitchen timers and the loader |
| `lib/pro/plans.test.ts`, `lib/pro/account.test.ts`, `lib/auth/shared.test.ts` | Plans and prices, the device's account note, sign-in helpers |
| `lib/canonical-url.test.ts` | One address per page: `www`, plain `http` and the `/en` prefix move to the canonical address |
| `lib/server/*.test.ts`, `app/api/routes.test.ts` | The headers every API response carries, the cache headers, which checkout a plan opens (the Polar API, a sandbox link, or unavailable), the analytics row and the capped body read, the rate limiter (the binding per route, the in-memory fallback, failing open), licence request bodies, the Polar webhook, and the feedback, rating, CSP report and health routes (`/api/health` reports the build commit) |
| `lib/telemetry/*.test.ts` | Session events from two snapshots of the wake store, and the cleaners for paths, referrers, labels and error text |
| `lib/seo.test.ts` | Structured data: dates with a time zone, the image, the questions |

The scripts have their own tests in the unit run: `scripts/check-keys.test.ts` (the production key check), `scripts/indexnow.test.ts` and `scripts/kv/test/` (backup, restore and re-encryption against an in-memory KV store and a fake of the Cloudflare REST API).

---

## 5. Accessibility

axe-core runs in the extension's Playwright suite: the popup and the options page must have zero violations in light, dark and OLED. On the site, `NEXT_PUBLIC_AXE=1` logs WCAG 2.2 AA violations in the browser console during development, and Lighthouse CI requires an accessibility score of 100 on its five URLs (§6). Keyboard use, focus order and screen-reader output on the site are checked by hand.

---

## 6. Performance

- `size-limit` (`pnpm size`): `@awaketab/wake` ≤ 3.4 KB gz for the core entry, with separate caps for its video entry, the IIFE and each adapter, and `@awaketab/core` ≤ 7 KB. The site has no byte budget yet (`00-conventions.md` §11).
- Lighthouse CI (mobile) for `/`, `/30m`, `/for/cooking`, `/guides/lock-screen-vs-sleep` and `/es`: performance ≥ 95, accessibility 100, best practices 100, SEO 100, LCP ≤ 1.2 s (lab), TBT ≤ 100 ms, CLS = 0, and zero third-party requests on the tool routes (`/`, `/30m`, `/es`).
  - **One config, two targets** (`lighthouserc.cjs`): `pnpm build && pnpm lighthouse` starts the Next.js production server with `pnpm --filter site start --hostname localhost --port 4173` and audits `http://localhost:4173`; with `LHCI_BASE_URL=https://play.awaketab.com` it starts nothing and audits that deployment. `LHCI_RUNS` (default 3) and `LHCI_UPLOAD_TARGET` (default `temporary-public-storage` in CI, `filesystem` → `.lighthouseci/` locally) are optional.
  - `/es` is `noindex` until its translation is reviewed, so it asserts every SEO audit except `is-crawlable`; `play.awaketab.com` gets the same exception on every URL because the whole preview is `noindex`.
  - `lighthouse.yml` runs the local target on every pull request and a deployed origin on a manual run.
- Field data: CrUX p75 for LCP, INP and CLS is reviewed as `14-devops.md` §5 describes.

---

## 7. Extension tests

- **Unit** (`apps/extension/test/unit/*.test.ts`, in `pnpm test:unit`): the background controller against an in-memory `chrome.*` fake (`fake-chrome.ts`), the power and storage adapters, the pill and badge logic, the build configuration and the packaging command.
- **Build** (`apps/extension/test/build/reproducible.test.ts`): the extension is built twice from the same sources and the two zips have the same SHA-256. `pnpm -F extension zip:check` does the same in CI.
- **Playwright** (`pnpm test:e2e:ext`, `apps/extension/playwright.config.ts`): the `AT_EXT_TEST=1` build loaded unpacked in Chromium, with `chrome.power` replaced by a recorder. The popup exposes its product name as an `<h1>` and its four lengths as radios, and the suite checks the choice with `aria-checked`. The options page honours reduced motion, and its accessibility scan waits for the card to reach full opacity. Popup and options must have zero axe violations in light, dark and OLED.
- The global shortcut cannot be pressed in headless Chromium, so the `toggle` command is covered by the controller unit test. Real `chrome.power` behaviour on Windows and macOS stays in the device matrix (§8).

---

## 8. Device matrix (manual, before each release and each browser major)

| # | Device / browser | Cases |
|---|---|---|
| 1 | Windows 11 · Chrome, Edge, Firefox (display sleep 1 min) | native lock holds ≥ 10 min; hidden tab releases; the extension keeps the display awake from another tab |
| 2 | macOS · Safari, Chrome (display sleep 1 min; lid) | lock holds; lid close sleeps regardless (documented) |
| 3 | iPhone · Safari 17/18 (Auto-Lock 30 s) | holds; Low Power Mode behaviour recorded; Home-Screen app on iOS 18.4+ |
| 4 | iPad · Safari | same as 3; sheet-music scenario |
| 5 | Android · Chrome, Samsung Internet (timeout 30 s) | holds with Battery Saver on (it never refuses the lock); PWA install |
| 6 | Chromebook · Chrome | holds; extension |
| 7 | Windows laptop · Modern Standby | screen vs system behaviour for `/for/downloads` copy |
| 8 | Linux · Firefox 126+ | native lock |

Template (one row per case): date, OS/browser/version, plugged/battery, mode, expected, observed, screenshot, verdict. Results become `/learn/how-we-tested` and update `/learn/browser-support-matrix`.

---

## 9. Policies

- **Merge gate:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (unit and site), `pnpm build`, `pnpm size` (package budgets) and the extension's Chromium end-to-end tests with axe, all green. Lighthouse CI runs on every pull request.
- **Order of merges:** a feature branch goes into `play` first and is tried on play.awaketab.com, then the same branch goes into `main`. `play` is never merged into `main`.
- **Nightly:** `pnpm audit --audit-level high`.
- **Flaky tests:** quarantine with `test.fixme` and open an issue within 24 hours; no retries above 1 in CI; a test that is flaky twice in a week is rewritten or deleted.
- **Definition of done:** acceptance criteria automated where feasible; a new engine transition has a test; a user-visible change has a changelog fragment; docs are updated if an identifier changed (`00-conventions.md` first).

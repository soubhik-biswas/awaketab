# 12 · Library specification — `@awaketab/wake`

Status: v2.0 · 2026-11-13 (the package as it is in `packages/wake`) · Owner: Soubhik

**Purpose.** `@awaketab/wake` is the low-level Screen Wake Lock layer that the web app, the PiP window, the embed and the extension share — published as a standalone, MIT-licensed npm package. It is the only part of the repository under MIT: the website, the extension and `@awaketab/core` are AGPL-3.0-only, and the AwakeTab name and logo are covered by `TRADEMARKS.md`. It is the maintained replacement for NoSleep.js (last release December 2020) and the developer-facing asset that earns the links a tool site needs. This document is its contract.

Related docs: `00-conventions.md` §5.1, §13.1 · `04-engine-spec.md` §3–§5 (behaviour it implements) · `13-testing-strategy.md` §2 · `14-devops.md` §2 (release workflow) · `06-content-seo-spec.md` (`/library` page and `/vs/nosleep-js`).

---

## 1. Goals and constraints

| Goal | Target |
|---|---|
| Size | ≤ 3.4 KB gz for the core entry (`size-limit` in CI, `packages/wake/package.json`). The fallback clips are not in it: they live in the `@awaketab/wake/video` entry (WebM and MP4, capped at 2.2 KB gz), which the core imports by itself the first time the fallback is used |
| Dependencies | zero |
| Environments | Browsers per the support matrix; SSR-safe (`typeof window === 'undefined'` → inert instance) |
| Types | TypeScript, `strict`, `.d.ts` shipped |
| Formats | ESM (`exports.import`), CJS (`exports.require`), IIFE (`dist/awaketab-wake.iife.js`, global `AwakeTabWake`) |
| Behaviour | Exactly the seven states and transitions of `04-engine-spec.md` §3–§4; no session/timer logic (that is `@awaketab/core`) |
| Honesty | Never reports `held` unless a live `WakeLockSentinel` exists, and never `fallback` unless the video is seen playing (not paused, enough data, `currentTime` moving). Never holds more than one sentinel, so `release()` and `destroy()` always let the screen sleep |

---

## 2. Public API

```ts
export type TLockState = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';
export type TLockReason = 'request' | 'acquired' | 'fallback_started' | 'released_hidden' | 'released_platform'
  | 'denied' | 'unsupported' | 'user_release' | 'retry' | 'destroyed';
export type TAdviceCode = 'hidden_document' | 'permissions_policy'
  | 'insecure_context' | 'unsupported_browser' | 'ios_safari_old' | 'firefox_old' | 'iframe_no_allow';

export interface IWakeLockOptions {
  fallback?: 'video' | 'none';                 // default 'video'
  videoSources?: { webm?: string; mp4?: string }; // each replaces the built-in clip of that type (data: or https: URLs)
  reacquireOnVisible?: boolean;                // default true — re-request when the document becomes visible after `lost`
  retry?: { attempts: number; baseMs: number } | false; // default { attempts: 3, baseMs: 500 } for transient denials
  nudgeIntervalMs?: number;                    // default 20_000 — how often the fallback video is checked for real playback
  navigatorLike?: Pick<Navigator, 'wakeLock' | 'userAgent'>; // test injection
  documentLike?: Document;                     // test injection
  wakeLock?: IWakeLockLike | null;             // test injection: the wake-lock API itself; null stands for a browser without one
  document?: Document;                         // test injection: same as documentLike
}

export interface IChangeEvent { from: TLockState; to: TLockState; reason: TLockReason; advice?: TAdviceCode; error?: unknown; at: number }

export interface IWakeLockHandle {
  readonly state: TLockState;
  readonly supported: boolean;                 // native API present in a secure context
  readonly usingFallback: boolean;
  readonly mode: 'native' | 'video' | null;    // what the last successful request used
  readonly advice: TAdviceCode | null;         // the advice that goes with a denied, unsupported or lost state
  request(): Promise<TLockState>;               // resolves with the resulting state; never throws
  release(): Promise<void>;
  on(event: 'change', cb: (e: IChangeEvent) => void): () => void;
  on(event: 'error', cb: (e: { error: unknown; at: number; state?: TLockState; advice?: TAdviceCode | null }) => void): () => void;
  destroy(): void;                             // release first, then remove listeners, timers and the video element
}

export function createWakeLock(options?: IWakeLockOptions): IWakeLockHandle;
export function classifyDenial(err: unknown, ctx: { visible: boolean; secure: boolean; inIframe: boolean; ua: string; policyBlocks?: boolean }): TAdviceCode | null; // null: cause unknown
export const isWakeLockSupported: () => boolean;
```

These three functions and the types are the whole public surface. The event emitter is internal, and there is no separate transition function: `createWakeLock()` carries the transitions of `04-engine-spec.md` §4 itself, and the tests in `test/transitions.test.ts` check them row by row.

### 2.1 Behavioural notes

- `request()` from `idle`/`lost`/`denied` → `requesting` → `held` on resolve. On `NotAllowedError` → `denied` with `advice` from `classifyDenial()`; transient causes (`hidden_document`) retry per `retry` when the document becomes visible; others wait for a new `request()`.
- **One sentinel, one call at a time.** `request()` and `release()` run in the order they were called, each after the one before it has settled; the first starts in the caller's call stack so the fallback can play inside the tap. `request()` while `held` resolves `held` without asking the browser again. A new sentinel is stored only after any earlier one has been released and its listener detached, so there is never more than one live sentinel and `release()` always lets the screen sleep.
- Sentinel `release` while `document.hidden` → `lost` (reason `released_hidden`); while visible → `lost` (reason `released_platform`, e.g. Firefox at 5 % battery or less) and one retry; three visible releases within 10 s → `denied` with advice `null`.
- `unsupported` is set at creation when the API is missing or the context is insecure. `request()` in `unsupported` with `fallback:'video'` attempts the video: `play()` rejection (autoplay policy) leaves the state `unsupported` and emits `error` — callers must invoke `request()` from a user gesture in that case (the UI shows "Tap to use the fallback").
- The fallback video element is `<video playsinline>` appended to `document.body` at 1 × 1 px with `opacity: 0.01` and `pointer-events: none`: never `muted`, `loop` or `hidden`, because browsers keep the display on only for a rendered, unmuted, non-looping video that has an audio track (`04-engine-spec.md` §1, §5). Its two sources are the built-in clips, WebM (VP8 and Opus) first and MP4 (H.264 and AAC) second: 10 s of black with a silent audio track. `videoSources.webm` / `.mp4` replace the built-in clip of that type. The clip rewinds before its end instead of looping, pauses when the document is hidden and plays again when it is visible.
- `fallback` is reported only once the clip is seen playing (not paused, `readyState ≥ 2`, `currentTime` changed between two checks). Every `nudgeIntervalMs` the same check runs again; a clip that fails it gets one restart, and if that fails the state goes to `lost` with advice `unsupported_browser`.
- If no source can play, or `play()` resolves but the clock never moves, `request()` resolves to `unsupported` (advice `unsupported_browser`) and the video element is removed. A browser's `play()` never settles once every source has failed, so the last source's `error` event ends the request; the state never hangs on `requesting`.
- `fullscreenchange` while `held` or `fallback` asks for nothing. If the browser released the lock for the change, its `release` event (or a sentinel that already reports `released`) starts the usual retry, which ends with one sentinel. While `denied`, a `fullscreenchange` tries once more.
- `classifyDenial()` gives `iframe_no_allow` only when the frame's permissions policy really blocks `screen-wake-lock`: it reads `document.permissionsPolicy` / `featurePolicy` `.allowsFeature()` where the browser has it and the error text elsewhere. Outside a frame the same finding is `permissions_policy`.
- `destroy()` releases the sentinel and removes the video first, then removes every listener and timer; the instance is inert afterwards (`state` stays `idle`). A sentinel that arrives from a request still in flight is released at once.

### 2.2 Usage

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ to, advice }) => render(to, advice));
button.addEventListener('click', () => lock.request());   // gesture-safe for the fallback path
```

Framework adapters (separate entry points, each < 400 B): `@awaketab/wake/react` (`useWakeLock(options)` → `{ state, supported, request, release }`), `/preact`, `/vue` (`useWakeLock()` composable). Adapters are optional and tree-shaken. Each creates its lock in the effect or mounted hook and destroys it in the cleanup, so React StrictMode's cleanup and re-run, and any unmount followed by a mount, get a new working lock; before the component has mounted, `state` is `idle` and `supported` is `false`.

Fallback clips (separate entry point, ≤ 2.2 KB gz): `@awaketab/wake/video` exports `webm` and `mp4` as `data:` URLs. The core imports this entry by itself, with a dynamic `import()`, the first time the fallback is used, so an app only imports it to host or inspect the clips. How the clips are made is in `04-engine-spec.md` §5.1.

---

## 3. Package layout

```
packages/wake/
├─ src/
│  ├─ index.ts          # createWakeLock (with the transitions of 04-engine-spec §4), classifyDenial, isWakeLockSupported
│  ├─ emitter.ts        # the internal change / error emitter
│  ├─ fallback.ts       # video element management; loads the clips from video.ts on first use
│  ├─ video.ts          # the `@awaketab/wake/video` entry: exports `webm` and `mp4`
│  ├─ classify.ts       # denial → TAdviceCode
│  ├─ adapters/react.ts · preact.ts · vue.ts
│  └─ assets/blank.webm.b64.ts · blank.mp4.b64.ts
├─ test/                # Vitest: one test per transition row (T01…Tnn), sentinels, fallback, classify, adapters, SSR
├─ README.md · CHANGELOG.md · LICENSE (MIT)
├─ package.json (with the size-limit budgets) · tsup.config.ts
```

`package.json` (essential fields):

```json
{
  "name": "@awaketab/wake",
  "version": "1.0.0",
  "description": "Screen Wake Lock with an honest state machine and a tiny video fallback. Maintained replacement for NoSleep.js.",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/awaketab-wake.iife.js",
  "jsdelivr": "./dist/awaketab-wake.iife.js",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./react": {
      "import": { "types": "./dist/adapters/react.d.ts", "default": "./dist/adapters/react.js" },
      "require": { "types": "./dist/adapters/react.d.cts", "default": "./dist/adapters/react.cjs" }
    },
    "./preact": {
      "import": { "types": "./dist/adapters/preact.d.ts", "default": "./dist/adapters/preact.js" },
      "require": { "types": "./dist/adapters/preact.d.cts", "default": "./dist/adapters/preact.cjs" }
    },
    "./vue": {
      "import": { "types": "./dist/adapters/vue.d.ts", "default": "./dist/adapters/vue.js" },
      "require": { "types": "./dist/adapters/vue.d.cts", "default": "./dist/adapters/vue.cjs" }
    },
    "./video": {
      "import": { "types": "./dist/video.d.ts", "default": "./dist/video.js" },
      "require": { "types": "./dist/video.d.cts", "default": "./dist/video.cjs" }
    },
    "./iife": "./dist/awaketab-wake.iife.js",
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md", "CHANGELOG.md", "LICENSE"],
  "keywords": ["wake lock", "screen wake lock", "nosleep", "keep awake", "prevent sleep", "wakelock"],
  "repository": { "type": "git", "url": "https://github.com/soubhik-biswas/awaketab", "directory": "packages/wake" },
  "homepage": "https://awaketab.com/library",
  "bugs": { "url": "https://github.com/soubhik-biswas/awaketab/issues" },
  "publishConfig": { "access": "public", "provenance": true },
  "peerDependencies": { "react": ">=17", "preact": ">=10", "vue": ">=3" },
  "peerDependenciesMeta": { "react": { "optional": true }, "preact": { "optional": true }, "vue": { "optional": true } }
}
```

Build: `tsup`, `minify: true`, `target: 'es2020'`, in three passes. The core and `video` entries as ESM and CJS with `.d.ts` and `.d.cts` types; the core's `import('./video.js')` is kept as a real import of the `video` file built beside it (`./video.js` in ESM, `./video.cjs` in CJS), so the clips never count against the core. The IIFE has no second file to fetch, so it bundles the clips. The adapters the same way, with their import of the core kept external as `@awaketab/wake`, so an adapter is under 400 B and shares the one lock instead of bundling a second copy. The IIFE as `dist/awaketab-wake.iife.js`, which exposes `window.AwakeTabWake` for `<script>` users; that file name is part of the contract, so `tsup.config.ts` sets it.

---

## 4. Comparison (for README and `/vs/nosleep-js`)

| | `@awaketab/wake` | NoSleep.js 0.12.0 |
|---|---|---|
| Last release | maintained; semver | 16 Dec 2020 |
| Native Wake Lock | yes, first | yes (when present) |
| Honest state | seven states + `change` events with reason and advice | `isEnabled` boolean; state can be wrong after release |
| Fallback | WebM and MP4 clips with a silent audio track, loaded on first use, gesture-aware, reported only while really playing, pauses when hidden, `unsupported` when nothing can play | video with a silent audio track, always on |
| Denial diagnosis | `classifyDenial()` → advice codes | none |
| Re-acquire on visible | yes, configurable | yes |
| Size (gz) | ≤ 3.4 KB core, plus ≈ 2 KB of clips loaded only when the fallback is used | ≈ 3.2 KB measured |
| TypeScript | native | community typings |
| SSR-safe | yes | no |
| Adapters | React/Preact/Vue | no |

---

## 5. README outline

Badges (npm version, size, CI) · one-paragraph what/why · install · 10-line usage · states diagram (the seven states) · options table · the handle · adapters · fallback caveats (gesture, battery) · what a wake lock cannot do · iframes · browser support (link to the live matrix) · the NoSleep.js comparison · "Used by AwakeTab" with a link to its page · contributing · licence.

---

## 6. Page `/library`

`apps/site/app/[locale]/(site)/library/page.tsx`, English only: the install line, the usage sample, the seven states in the words the tool's own pill uses for each, the comparison table of §4 and a link to the repository. It is the page developer searches should land on (`06-content-seo-spec.md`).

A live demo of the state machine and a hosted copy of the IIFE build do not exist yet, so neither the README nor the page mentions them.

---

## 7. Versioning and release

Changesets in the monorepo (`.changeset/config.json`, `access: public`); breaking changes bump the major version, and the apps in this repository use `workspace:*`.

`.github/workflows/release.yml`: the `version` job opens the "version packages" pull request while changesets are pending. When none are pending and the repository variable `NPM_PUBLISH_ENABLED` is `true`, the `publish-wake` job tests, builds and size-checks the package, skips if `@awaketab/wake@<version>` is already on npm, and runs `npm publish --provenance --access public` from `packages/wake`. It signs in through npm trusted publishing (GitHub OIDC), which needs npm 11.5.1 or later, so the job installs its own npm. Nothing is published from a laptop: `publishConfig.provenance` makes a local `npm publish` fail outside CI.

Size budgets (`size-limit`, in `package.json`, gzipped): `dist/index.js` ≤ 3.4 kB, `dist/video.js` ≤ 2.2 kB, the IIFE ≤ 5.8 kB (it carries the clips), each adapter ≤ 400 B. Measured on 13 November 2026: 3.05 kB, 1.98 kB, 5.53 kB, and 0.32 kB for the largest adapter.

What gets published: `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE` and `dist/` only. `packages/wake/test/pack.test.ts` checks that list with `npm pack --dry-run`, that every `exports` and `unpkg` target is in it, and that no source, test or config file is.

---

## 8. Browser support statement

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4 (iOS Home-Screen web apps ≥ 18.4). Fallback: any browser that can play an inline video with sound after a user gesture and load a module with `import()` (iOS ≥ 11, Chrome ≥ 63, Firefox ≥ 67). Whether a given browser then keeps its display on is checked on real devices (`04-engine-spec.md` §5.2). Node/SSR: inert. The versions are those of the support data file, `apps/extension/data/support-matrix.json`; change them there first.

---

## 9. Contributing summary

Issues use templates (bug with browser/OS/version, feature request); PRs require a changeset, tests for any transition change, and a passing size check. Code of conduct: Contributor Covenant. Security issues go through GitHub's private vulnerability reporting (`https://github.com/soubhik-biswas/awaketab/security/advisories/new`), as `SECURITY.md` says; there is no contact email.

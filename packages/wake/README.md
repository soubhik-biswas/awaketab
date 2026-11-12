# @awaketab/wake

[![npm version](https://img.shields.io/npm/v/@awaketab/wake?label=npm&color=B86E00)](https://www.npmjs.com/package/@awaketab/wake)
[![gzip size](https://img.shields.io/badge/gzip-%E2%89%A4%203.4%20KB-B86E00)](https://github.com/soubhik-biswas/awaketab/blob/main/packages/wake/package.json)
[![CI](https://github.com/soubhik-biswas/awaketab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/soubhik-biswas/awaketab/actions/workflows/ci.yml)
[![npm provenance](https://img.shields.io/badge/npm-provenance-2B3A67)](https://www.npmjs.com/package/@awaketab/wake#provenance)
[![license: MIT](https://img.shields.io/npm/l/@awaketab/wake)](./LICENSE)

Screen Wake Lock with an honest state machine and a tiny video fallback. The maintained replacement for NoSleep.js (last release December 2020).

`@awaketab/wake` keeps a web page's screen from dimming while it is visible, and tells you the truth about it: it reports `held` only while a live `WakeLockSentinel` exists or the fallback video is actually playing. Zero dependencies, ≤ 3.4 KB gzipped (the fallback clips load separately, on first use), SSR-safe, TypeScript-native. It is the lock layer behind [AwakeTab](https://awaketab.com), its Picture-in-Picture pill, its embeddable Cook Mode widget and its browser extension.

## Install

The npm package is coming soon; `npm install @awaketab/wake` works once the first version is published. Until then, build it from the repository (`pnpm -F @awaketab/wake build`, output in `packages/wake/dist`).

No bundler? The package also ships an IIFE build, `dist/awaketab-wake.iife.js`, which exposes `window.AwakeTabWake` (`AwakeTabWake.createWakeLock()`). It is one self-contained file, so it carries the fallback clips too (≈ 5.5 KB gzipped).

## Usage

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  status.textContent = to; // idle · requesting · held · lost · denied · unsupported · fallback
  if (advice) hint.textContent = advice; // e.g. 'hidden_document', 'iframe_no_allow'
});
button.addEventListener('click', () => lock.request()); // a gesture keeps the fallback path open
stopButton.addEventListener('click', () => lock.release());
```

`request()` never throws: it resolves with the resulting state. Calls run one at a time in the order you make them, so `release()` followed at once by `request()` is safe, and `request()` while the lock is already held resolves `held` without asking the browser again. There is never more than one live sentinel.

## The seven states

```
            request()                 sentinel acquired
  idle ───────────────► requesting ─────────────────────► held
   ▲                        │  │                            │  tab hidden / OS released
   │ release()              │  │ NotAllowedError            ▼
   │                        │  └──────────────► denied     lost ── visible again ──► requesting
   │                        │ no API / insecure              
   │                        ▼                                
   └──────────────── unsupported ── request() + video plays ──► fallback
```

| State | Meaning |
|---|---|
| `idle` | No lock requested |
| `requesting` | `navigator.wakeLock.request('screen')` (or the fallback video) is in flight |
| `held` | A sentinel is alive |
| `lost` | The browser released the sentinel (tab hidden, OS), or the fallback clip stopped playing. Re-requested when the document is visible again |
| `denied` | The request was rejected (`NotAllowedError`: hidden document, Permissions-Policy, Safari before a tap, Firefox at 5 % battery or less). `advice` says why when the cause is known, and is `null` otherwise |
| `unsupported` | No Screen Wake Lock API, or an insecure context. `request()` tries the video fallback |
| `fallback` | The fallback clip is playing: its clock has been seen to move, and it is checked again every `nudgeIntervalMs` |

Every `change` event carries `{ from, to, reason, advice?, error?, at }`. Reasons: `request` · `acquired` · `fallback_started` · `released_hidden` · `released_platform` · `denied` · `unsupported` · `user_release` · `retry` · `destroyed`. Advice codes: `hidden_document` · `permissions_policy` · `insecure_context` · `unsupported_browser` · `ios_safari_old` · `firefox_old` · `iframe_no_allow`.

## Options

| Option | Default | What it does |
|---|---|---|
| `fallback` | `'video'` | `'none'` disables the video fallback |
| `videoSources` | the built-in WebM and MP4 | `{ webm?, mp4? }` — `data:` or `https:` URLs that replace the built-in clip of that type. A clip of your own needs a video track and an audio track |
| `reacquireOnVisible` | `true` | Re-request when the document becomes visible after `lost` |
| `retry` | `{ attempts: 3, baseMs: 500 }` | Backoff for transient denials; `false` disables |
| `nudgeIntervalMs` | `20000` | How often the fallback video is checked for real playback (not paused, enough data, `currentTime` moving) |
| `navigatorLike` / `documentLike` | globals | Test injection: a navigator-like object (`wakeLock`, `userAgent`) and the document whose visibility and fullscreen changes the lock follows |
| `wakeLock` / `document` | globals | Test injection, shorter: the wake-lock API itself (`null` stands for a browser without one) and the document |

Also exported: `classifyDenial(err, ctx)` → advice code (or `null` when the cause is unknown), `isWakeLockSupported()`, and the types `IWakeLockHandle`, `IWakeLockOptions`, `IRetryOptions`, `IChangeEvent`, `IErrorEvent`, `TLockState`, `TLockReason`, `TAdviceCode`, `IWakeLockLike` and `IWakeLockSentinelLike`.

## The handle

`createWakeLock()` returns one handle:

| Member | What it is |
|---|---|
| `state` | The current state, one of the seven |
| `supported` | `true` when the native API exists in a secure context |
| `usingFallback` | `true` while the state is `fallback` |
| `mode` | `'native'` or `'video'`: what the last successful request used; `null` before one |
| `advice` | The advice code that goes with a `denied`, `unsupported` or `lost` state, `null` when the cause is unknown or the lock is held |
| `request()` | Asks for the lock; resolves with the resulting state |
| `release()` | Lets the screen sleep again |
| `on('change' \| 'error', cb)` | Subscribes; returns a function that unsubscribes. An `error` event carries `{ error, at, state?, advice? }` |
| `destroy()` | Releases the lock, then removes the listeners, timers and the video element; the handle stays `idle` afterwards |

## Framework adapters

Each adapter is < 400 B and imports the core, so you get one lock instance.

```ts
import { useWakeLock } from '@awaketab/wake/react'; // or '@awaketab/wake/preact'
const { state, supported, request, release } = useWakeLock();
```

```ts
import { useWakeLock } from '@awaketab/wake/vue';
const { state, request, release } = useWakeLock();
```

Each adapter creates its lock when the component mounts and destroys it when the component unmounts, so React's StrictMode and remounts get a working lock every time. Until the component has mounted, `state` is `idle` and `supported` is `false`.

## Fallback caveats

- Browsers keep the display on only for a video they treat as real media. The fallback is a 10-second black clip with a video track and a silent audio track, played inline, not muted, not looping (it rewinds before its end) and drawn on the page at 1 × 1 px. You hear nothing: the audio track is silence.
- It needs a user gesture (autoplay policy). Call `request()` straight from a click or tap handler. If `play()` is rejected the state stays `unsupported` and an `error` event fires — call `request()` again from a click.
- `fallback` is reported only once the clip is really playing: not paused, enough data, and `currentTime` moving. A clip that never starts ends in `unsupported`; one that stalls later goes to `lost` with advice `unsupported_browser`, after one restart has been tried.
- The clips (WebM with VP8 and Opus, MP4 with H.264 and AAC, ≈ 2 KB gzipped together) are in `@awaketab/wake/video`. The core imports that entry by itself the first time the fallback is used, so you only import it yourself to host or inspect the clips. If neither clip can play, `request()` resolves to `unsupported` instead of waiting.
- Because the clip is unmuted media, a phone may show it in its media controls and pause other audio while it plays.
- It uses more power than a native wake lock. It pauses while the tab is hidden and resumes when it is visible.
- Battery savers do not refuse a wake lock: Chromium and WebKit have no such check. Firefox refuses and releases the lock at 5 % battery or less while discharging, and iPhone Low Power Mode caps Auto-Lock at 30 seconds.

## What a wake lock cannot do

A wake lock keeps the **display** on while the page is **visible**. It does not keep a hidden tab awake, does not stop a laptop sleeping when the lid closes, and does not keep Teams or Slack "Available" — those follow input idle, and this library never fakes input.

## Iframes

A cross-origin iframe can hold a lock only when the embedding page delegates the feature: `<iframe allow="screen-wake-lock" …>`. Without it the request is rejected and the advice is `iframe_no_allow`. That advice is given only when the frame's permissions policy really blocks the feature (`document.featurePolicy.allowsFeature('screen-wake-lock')` where the browser has it, the error text elsewhere); a correctly delegated frame that is refused for another reason gets the advice for that reason, or `null`.

## Browser support

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4 (iOS Home-Screen web apps ≥ 18.4). Fallback: any browser that can play an inline video with sound after a gesture. Node/SSR: an inert handle (`supported: false`, never throws). The live, tested matrix is at [awaketab.com/learn/browser-support-matrix](https://awaketab.com/learn/browser-support-matrix) and the method at [awaketab.com/learn/how-we-tested](https://awaketab.com/learn/how-we-tested).

## Compared with NoSleep.js

| | `@awaketab/wake` | NoSleep.js 0.12.0 |
|---|---|---|
| Last release | maintained; semver | 16 Dec 2020 |
| Honest state | seven states + `change` events with reason and advice | `isEnabled` boolean |
| Denial diagnosis | `classifyDenial()` → advice codes | none |
| Fallback | WebM and MP4 clips loaded on first use, gesture-aware, reported only while really playing, pauses when hidden | video with a silent audio track, always on |
| TypeScript / SSR | native / inert on the server | community typings / no |

## Used by AwakeTab

AwakeTab's own timer, mini clock and website widget run on this package. Its page is [awaketab.com/library](https://awaketab.com/library).

## Contributing

Issues and PRs are welcome at [github.com/soubhik-biswas/awaketab](https://github.com/soubhik-biswas/awaketab). A PR needs a changeset (`pnpm changeset`), a test for any transition change, and a passing size check (`pnpm -F @awaketab/wake size`). Report security issues privately through [GitHub's vulnerability reporting](https://github.com/soubhik-biswas/awaketab/security/advisories/new).

Support development via [Buy me a coffee](https://buymeacoffee.com/awaketab).

## Licence

MIT © Soubhik Biswas

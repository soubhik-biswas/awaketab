# @awaketab/wake

## Unreleased

### Fixed

- A fullscreen change while the lock is held no longer asks for a second lock. Before, each change left one more live sentinel behind and `release()` let go of only the newest, so the screen could stay awake after Stop. There is now never more than one live sentinel: a new one is stored only after the old one has been released, and a released sentinel's late `release` event is not read as a loss.
- `destroy()` now releases the lock before it marks the handle as destroyed. Before, the native lock was left held.
- `request()` and `release()` run one at a time in the order they were called, so `release()` followed at once by `request()` cannot interleave. `request()` while the lock is already held resolves `held` without asking the browser again.
- The video fallback is rebuilt the way the technique is known to work. Before, the clip was muted, looping and hidden, which browsers do not keep the display on for. The clip now has a video track and a silent audio track, plays inline, is not muted, does not use `loop` (it rewinds before its end, and restarts on `ended`) and is drawn on the page at 1 × 1 px instead of being hidden. `play()` is called in the same call stack as `request()`, so it stays inside the tap.
- `fallback` is reported only when the clip is really playing (not paused, enough data, `currentTime` moving). A clip that never starts ends in `unsupported` with advice `unsupported_browser`; a clip that stalls later goes to `lost` with the same advice after one restart has been tried.
- `classifyDenial()` gives `iframe_no_allow` only when the frame's permissions policy really blocks the wake lock. A correctly delegated frame that is refused for another reason no longer gets that advice.
- The React, Preact and Vue adapters create the lock when the component mounts and destroy it when it unmounts. Before, React StrictMode's second effect run found a destroyed lock and `request()` did nothing.

### Changed

- The fallback clips moved out of the core entry into `@awaketab/wake/video`, which the core imports by itself the first time the fallback is used. Both clips (WebM and MP4) are now offered by default; `videoSources.webm` and `videoSources.mp4` replace the built-in clip of that type. `@awaketab/wake/video` grows to about 2 KB gzipped; the core entry stays under 3.4 KB. The IIFE build carries the clips itself and is about 5.5 KB gzipped.
- `release()` removes the fallback video element in every case; the next `request()` creates a new one.
- Until an adapter's component has mounted, its `state` is `idle` and `supported` is `false`.

### Added

- `classifyDenial()` accepts an optional `policyBlocks` flag in its context: `true` or `false` when the document's permissions policy is known, left out when it is not.

## 1.0.0

First public release. The pending pre-release changesets (`wake-lock-layer`, and the `@awaketab/wake` half of `type-name-prefixes`) are folded into this entry, so `changeset version` does not bump the unpublished package past 1.0.0.

### Features

- `createWakeLock(options)` with exactly seven states — `idle` · `requesting` · `held` · `lost` · `denied` · `unsupported` · `fallback` — and `change` events carrying `{ from, to, reason, advice?, error?, at }`. `held` is reported only while a live `WakeLockSentinel` exists.
- Inlined two-frame WebM video fallback: gesture-aware `play()`, 20 s `currentTime` nudge, paused while hidden, removed on release. When no source can play, `request()` resolves to `unsupported` instead of waiting. The MP4 for Safari before 16.4 is opt-in from `@awaketab/wake/video`.
- `classifyDenial()` maps a rejection to an advice code (`hidden_document`, `permissions_policy`, `insecure_context`, `unsupported_browser`, `ios_safari_old`, `firefox_old`, `iframe_no_allow`).
- Re-acquire on `visibilitychange`, backoff retry for transient denials, re-request on `fullscreenchange`.
- SSR-safe inert handle when `window` is undefined.
- React, Preact and Vue adapters (`@awaketab/wake/react`, `/preact`, `/vue`), each < 400 B gzipped and importing the core instead of bundling a second copy.
- ESM, CJS (with `.d.cts` types) and an IIFE build at `dist/awaketab-wake.iife.js` exposing `window.AwakeTabWake` for `<script>` and CDN users.

### Type names

Every exported type name is prefixed: interfaces take `I` (`IWakeLockHandle`, `IChangeEvent`, `IWakeLockOptions`) and type aliases take `T` (`TLockState`, `TAdviceCode`, `TLockReason`). String values are unchanged.

# 04 · Engine specification

Status: v1.2 · 2026-11-13 · Owner: Soubhik

**Purpose.** This is the implementable specification of the two engine layers: the **lock layer** `@awaketab/wake` (seven states, one transition table, video fallback, retry policy, reason/advice codes) and the **session layer** `@awaketab/core` (sessions, plans, the wall-clock tick, pause/resume, end-of-session pipeline, battery monitor, persistence, stats, multi-tab protocol, capability probe). Every state name, status, plan type and storage key is as in `00-conventions.md` §5–§6. Codes introduced here that are not yet in the conventions are marked **PROPOSED — add to 00-conventions.md**. The rule the whole engine serves: *the pill never lies* — UI state is derived only from the promise results and browser events, never from intent.

**Related docs.** `00-conventions.md` · `03-architecture.md` (where the engine sits) · `08-data-storage.md` (schemas for `at.v1.session`, `at.v1.stats`, `at.v1.license`) · `12-library-spec.md` (packaging of `@awaketab/wake`) · `13-testing-strategy.md`.

---

## Part A · Lock layer — `@awaketab/wake`

### 1. Platform facts the design relies on

Verified in the blueprint and re-verified per release on `/learn/browser-support-matrix`:

- `navigator.wakeLock.request('screen')` exists in Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen web apps ≥ 18.4. The interface is `[SecureContext]`, so on `http://` (other than `localhost`) `navigator.wakeLock` is `undefined`.
- The browser releases the lock when the document becomes hidden (tab switch, minimise, device lock). The `WakeLockSentinel` fires a `release` event; `sentinel.released` becomes `true`. The page must request again on `visibilitychange` to visible.
- The request rejects with `NotAllowedError` when the document is hidden, when Permissions-Policy `screen-wake-lock` denies the document (typical in an iframe without `allow="screen-wake-lock"`), or when the browser refuses for its own reasons (Safari before a user gesture, Firefox at 5 % battery or less while discharging). Battery savers (Chrome Energy Saver, Android Battery Saver, Windows Energy saver) do not refuse it: Chromium and WebKit have no such check.
- The video fallback needs a user gesture because of autoplay policy. A browser keeps the display on only for a video it treats as real media: one with a video track **and** an audio track, playing, not muted, rendered on the page (1 × 1 px, never `display:none` or `hidden`) and not looping. WebKit takes no display-sleep assertion for an element with `loop`, for a muted one, or for one without audio; Chromium takes its video wake lock for a visible video only when it has volume (or covers a large part of the viewport). The clip's audio track is silence, so nothing is heard.
- iOS Low Power Mode is not detectable; it forces a 30 s Auto-Lock regardless of the wake lock.

### 2. States (exactly seven)

`idle` · `requesting` · `held` · `lost` · `denied` · `unsupported` · `fallback` — meanings and pill copy in `00-conventions.md` §5.1. Only `held` and `fallback` may show a running timer. Two internal fields accompany the state and are exposed read-only: `mode: 'native' | 'video' | null` (which mechanism the last successful acquisition used) and `attempt: number` (retry counter).

```
                 request()                     resolved
   idle ──────────────────────► requesting ──────────────► held ◄──────────────┐
    ▲   API absent│               │  ▲      NotAllowedError   │ release event     │ visible +
    │             ▼               │  │           ▼            ▼ (hidden/OS)       │ reacquire
    │        unsupported          │  │        denied ◄──── lost ──────────────────┘
    │   tap + fallback:'video'│   │  │  retry timer│   ▲      ▲
    │             ▼           └───┘  └─────────────┘   │      │ hidden (pause video)
    │         requesting ──play() ok──► fallback ──────┘      │
    │              │ play() rejects      │                    │
    │              ▼                     └────────────────────┘
    │         unsupported (advice unsupported_browser)
    └── release() from any state; destroy() from any state
```

### 3. Reason and advice codes

```ts
// As in 00-conventions.md §5.1 (states) and §13.1 (reasons and advice codes)
export type TLockState = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';

/** Why a transition happened. Carried on every `change` event. */
export type TLockReason =
  | 'request'            // request() called
  | 'acquired'           // native promise resolved
  | 'fallback_started'   // video play() resolved
  | 'released_hidden'    // sentinel release, or fallback paused, while the document is hidden
  | 'released_platform'  // sentinel release while visible (fullscreen transition, OS), or the fallback clip stopped playing
  | 'denied'             // NotAllowedError or another rejection
  | 'unsupported'        // no API, or no fallback video could play
  | 'user_release'       // release() called
  | 'retry'              // backoff timer, visibility or fullscreen re-request
  | 'destroyed';         // destroy() called

/** What the UI should tell the user to do. Null when nothing is wrong or the cause is unknown. */
export type TAdviceCode =
  | 'hidden_document'      // bring the tab back to the front
  | 'permissions_policy'   // the page's Permissions-Policy blocks screen-wake-lock
  | 'insecure_context'     // page is served over http
  | 'unsupported_browser'  // no API and no playable fallback, or the fallback video was refused
  | 'ios_safari_old'       // iOS Safari before 16.4
  | 'firefox_old'          // Firefox before 126
  | 'iframe_no_allow';     // embedded without allow="screen-wake-lock"
```

Classification of a refusal (`classify.ts`), in order. Battery savers and Low Power Mode never refuse a wake lock (Chromium and WebKit have no such check), so there is no battery advice:

```ts
function classifyDenial(err, ctx: { visible; secure; inIframe; ua; policyBlocks? }): TAdviceCode | null {
  if (!ctx.secure || err.name === 'SecurityError') return 'insecure_context';
  if (!ctx.visible) return 'hidden_document';
  // policyBlocks: document.permissionsPolicy / featurePolicy .allowsFeature('screen-wake-lock') negated, when the
  // browser exposes it (Chromium); otherwise the error text is read for the word "policy".
  if (ctx.policyBlocks ?? /polic/i.test(err.message)) return ctx.inIframe ? 'iframe_no_allow' : 'permissions_policy';
  if (iOS && Safari < 16.4) return 'ios_safari_old';
  if (Firefox < 126) return 'firefox_old';
  return null; // no known cause (on iOS usually Safari wanting a tap): the UI lists the usual ones
}
```

A refusal inside an iframe is blamed on the frame (`iframe_no_allow`) only when its permissions policy really blocks the feature: a frame that was given `allow="screen-wake-lock"` and is refused for another reason gets that reason's advice, or `null`.

`unsupported` carries advice `insecure_context` when `!isSecureContext`, otherwise `unsupported_browser`; when the fallback is available the pill reads Tap to use the fallback until the user taps.

### 4. Transition table

Guards reference `vis` (`document.visibilityState`), `fb` (`options.fallback === 'video'`), `reacq` (`options.reacquireOnVisible`, default `true`), `n` (`attempt`), `N` (`retry.attempts`, default 3). Every transition emits `change { from, to, reason, advice }` unless marked *silent*.

| # | From | Event | Guard | To | Side effects |
|---|---|---|---|---|---|
| 1 | `idle` | `request()` | `'wakeLock' in navigator` | `requesting` | `attempt = 0`; call `navigator.wakeLock.request('screen')`; set `pending` flag |
| 2 | `idle` | `request()` | API absent | `unsupported` | advice = `insecure_context` if `!isSecureContext` else `unsupported_browser`; with `fb` the pill offers Tap to use the fallback; emit `error` if not `fb` |
| 3 | `requesting` | native promise resolves | not cancelled | `held` | release any sentinel still stored and detach its listener, then store the new one (never two live sentinels); `sentinel.addEventListener('release', onRelease)`; `mode = 'native'`; `attempt = 0`; advice = null |
| 4 | `requesting` | native promise resolves | cancelled (release() during flight) | `idle` | `await sentinel.release()`; drop sentinel (*silent* beyond the earlier `release` change) |
| 5 | `requesting` | rejects `NotAllowedError` | — | `denied` | `{reason, advice} = classifyDenial()`; if reason is `unknown` and `vis==='visible'` and `n + 1 < N` → schedule retry in `baseMs·2^n` (defaults: 0.5 s, then 1 s); if `hidden` → wait for `visibilitychange`; if `policy`/`insecure_context` → no timer; emit `error` |
| 6 | `requesting` | rejects other error | — | `denied` | reason `unknown`, advice `null` (cause unknown); same retry rule; emit `error` |
| 7 | `requesting` (video) | `video.play()` resolves **and** the clip is seen playing (`!paused`, `readyState ≥ 2`, `currentTime` different between two checks 250 ms apart, up to 8 checks) | — | `fallback` | `mode = 'video'`; start the 20 s watchdog; advice = null |
| 8 | `requesting` (video) | `play()` rejects `NotAllowedError`, or resolves but the clip's clock never moves within 2 s | — | `unsupported` | video removed; advice `unsupported_browser`; emit `error` |
| 9 | `requesting` (video) | `play()` rejects another way (`NotSupportedError`, `AbortError`), or the last `<source>` fires `error` | — | `unsupported` | at once, never left on `requesting`: the browser tries the sources in order itself, and when none can play, `play()` never settles, so the last source's `error` ends the request; video removed; advice `unsupported_browser`; emit `error` |
| 10 | `held` | sentinel `release` event | `vis === 'hidden'` | `lost` | sentinel = null; advice `hidden_document`; reason `released_hidden` |
| 11 | `held` | sentinel `release` event | `vis === 'visible'` | `lost` → immediately `requesting` | reason `released_platform`; loop guard: if ≥ 3 visible-releases within 10 s → go to `denied` (reason `denied`, advice null) instead and apply the retry rule |
| 12 | `held` | `release()` | — | `idle` | detach the `release` listener, then `await sentinel.release()`, so the resulting event is never read as a loss; sentinel = null; `mode` kept |
| 13 | `lost` | `visibilitychange` → visible | `reacq` | `requesting` | native: `request('screen')`; video: `video.play()`; reason `visible` |
| 14 | `lost` | `visibilitychange` → visible | `!reacq` | `lost` | *silent*; caller must `request()` |
| 15 | `lost` | `release()` | — | `idle` | clear timers; remove the video if `mode === 'video'` |
| 16 | `denied` | retry timer fires | `vis === 'visible'` | `requesting` | `attempt++`; reason `retry` |
| 17 | `denied` | `visibilitychange` → visible | reason was `hidden` | `requesting` | `attempt = 0`; reason `visible` |
| 18 | `denied` | `fullscreenchange` | any | `requesting` | one attempt, `attempt` unchanged; reason `fullscreen` |
| 19 | `denied` | `request()` | — | `requesting` | `attempt = 0`; cancel retry timer (user action resets the policy) |
| 20 | `denied` | `release()` | — | `idle` | cancel retry timer |
| 21 | `unsupported` | `request()` | `fb` and video not yet created | `requesting` | create `<video>` (§5) synchronously inside the caller's gesture; `play()`; reason `request` |
| 22 | `unsupported` | `request()` | `fb` and video exists | `requesting` | `play()` again |
| 23 | `unsupported` | `request()` | `!fb` | `unsupported` | emit `error`; *silent* |
| 24 | `fallback` | `visibilitychange` → hidden | — | `lost` | `video.pause()`; clear nudge timer; advice `hidden_document`; reason `released_hidden` |
| 25 | `fallback` | watchdog (every `nudgeIntervalMs`, 20 s) | `video.paused \|\| video.readyState < 2 \|\| currentTime` unchanged since the last check | `fallback` (self) when one restart (`play()` and the playing check of row 7) succeeds, *silent*; otherwise `lost` | on failure: pause, stop the watchdog, reason `released_platform`, advice `unsupported_browser`. From `lost`, rows 13 and 22 apply |
| 26 | `fallback` | `release()` | — | `idle` | `video.pause()`; clear timers; remove the element |
| 27 | `held` \| `fallback` | `fullscreenchange` | — | same | *silent* no-op: no request is made, because a second request would leave a second sentinel alive. If the browser released the lock for the change, row 10/11 fires from the `release` event; a sentinel that already reports `released` without the event having arrived is treated as row 11 |
| 27a | `held` | `request()` | sentinel live | `held` | *silent*; the browser is not asked again |
| 27b | `fallback` | `request()` | — | `fallback` | *silent* |
| 28 | any | `destroy()` | — | `idle` | first release the sentinel (listener detached) and pause and remove the `<video>`; only then mark the handle destroyed, remove all listeners, clear timers and `emitter.clear()`; a sentinel that arrives from a request still in flight is released at once; further calls resolve to `'idle'` |
| 29 | any except `idle` | `pagehide` / `freeze` (Page Lifecycle) | — | as per rows 10/24 | The browser releases anyway; we just mirror it. On `resume` event treat as `visibilitychange` → visible |

**One at a time.** `request()` and `release()` are queued and run in the order they were called; each waits for the one before it to settle. The first call in an empty queue starts in the caller's own call stack, so the fallback's `play()` stays inside the tap. Timers and browser events that ask again (rows 11, 13, 16–18) go through the same queue and do nothing once `release()` has been called. `release()` while a request is in flight marks it cancelled (row 4) and, for the video, abandons the pending `play()` at once, so Stop never waits behind it. Stop followed at once by Start therefore ends `held` with exactly one live sentinel.

Row 5 is the retry policy in full: exponential backoff, at most `N = 3` attempts in all (the request itself, then a retry after 0.5 s and one after 1 s: `baseMs·2^n` with `baseMs` 500 and no upper limit), only while visible and only for refusals with no known cause (advice null); after the third failure the machine stays in `denied` with its advice and waits for one of: `request()` (user tap on the pill's "Try again"), `visibilitychange` → visible, `fullscreenchange`. `hidden` denials never retry on a timer (the visible event is the retry). `policy` and `insecure_context` never retry — nothing the user does in the tab can fix them.

### 5. Video fallback details

Created lazily, inside the user's gesture (row 21):

```ts
function createFallbackVideo(doc: Document, sources: { webm?: string; mp4?: string } = {}): IFallbackHandle {
  const v = doc.createElement('video');
  v.playsInline = true; v.preload = 'auto';              // never muted, never loop, never hidden
  v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.setAttribute('aria-hidden', 'true'); v.title = 'AwakeTab keeps the screen awake';
  v.disablePictureInPicture = true;
  v.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
  doc.body.appendChild(v);
  // No `loop`: the clip rewinds before its end, and restarts if it does reach it.
  v.addEventListener('timeupdate', () => { if (v.currentTime > v.duration * 0.8) v.currentTime = 0; });
  v.addEventListener('ended', () => { v.currentTime = 0; if (on) void v.play(); });
  const play = () => {
    void v.play();                                       // in the tap itself, before the clip has arrived
    return (loading ??= load())                          // import('./video.js'), then append <source> webm, mp4
      .then(started)                                     // v.play() again; the last <source>'s error rejects it
      .then(moving);                                     // !paused, readyState >= 2, currentTime moved
  };
  return { el: v, play, /* pause, watch, unwatch, remove */ };
}
```

- **Why this shape.** See §1: display sleep is held off only for a playing video that has an audio track, is not muted, is rendered and does not loop. The element therefore carries no `muted`, `loop` or `hidden`; it sits in the page at 1 × 1 px with `opacity: 0.01` and `pointer-events: none`. The volume is left at its default: muting or a volume of zero defeats Chromium's rule, and the audio track is digital silence anyway.
- **The clips.** Two `data:` URLs in `src/assets`, exported by the `@awaketab/wake/video` entry as `webm` and `mp4`: a 10 s, 16 × 16 black clip at 1 frame per second with a silent mono audio track. WebM is VP8 with Opus (3,717 bytes); MP4 is H.264 constrained baseline with AAC-LC (3,346 bytes), for Safari, which cannot play WebM where it has no Wake Lock API. Both are offered by default, WebM first; `options.videoSources.webm` / `.mp4` replace the built-in clip of that type with a `data:` or `https:` URL. 16 × 16 is one whole macroblock, which decoders handle more reliably than a cropped 2 × 2 frame, and costs no extra bytes.
- **Lazy loading.** The clips are not in the core entry. `fallback.ts` loads them with `import('./video.js')` on the first fallback request, so the core stays inside its 3.4 KB budget (`12-library-spec.md` §1). Because that import is asynchronous, `play()` is called twice: once at once, in the tap, on the still empty element (which is what lets the element play later without another tap: WebKit lifts its gesture requirement per element, Chromium and Firefox per document), and again when the sources are attached. When both `videoSources` are passed, nothing is imported.
- **Looping without `loop`.** On `timeupdate` the clip jumps back to the start once it is past 80 % of its length, so it normally never ends; if it does, `ended` rewinds it and plays it again.
- **Honest start.** `play()` resolving is not taken as proof. The request ends in `fallback` only after the clip is seen playing: not paused, `readyState ≥ 2` and `currentTime` changed between two checks (every 250 ms, up to 8 checks). A rejected `play()` or a clock that never moves ends in `unsupported` with advice `unsupported_browser` (row 8).
- **When nothing can play.** If no source can play, the request ends in `unsupported` (advice `unsupported_browser`) straight away and the video element is removed (row 9); it never hangs on `requesting`.
- **Watchdog.** Every `nudgeIntervalMs` (20 s) the same three conditions are checked against the previous check's `currentTime`. A clip that fails them gets one restart; if that fails too the state goes to `lost` with advice `unsupported_browser` (row 25), so the pill stops saying the screen is kept awake.
- On hidden: pause (row 24) — saves the CPU that older fallbacks burned (25–30% reported for the Firefox video path). On visible: `play()` again; if the browser now demands a gesture the machine goes to `unsupported` and the pill asks for a tap (Tap to use the fallback) instead of pretending.
- The element is removed when a failed `play()` ends the request, on every `release()`, and on `destroy()`; the next `request()` creates a fresh one.
- **Side effect to know.** Unmuted media can appear in a phone's media controls and can pause other audio while it plays.

#### 5.1 Regenerating the clips

With ffmpeg (9.0 was used; `libx264`, `libvpx` and `libopus` are needed). The flags strip every encoder string and timestamp, so the same ffmpeg build gives the same bytes:

```sh
ffmpeg -f lavfi -i "color=c=black:s=16x16:r=1:d=10" -f lavfi -i "anullsrc=r=44100:cl=mono" -t 10 \
  -map_metadata -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -preset veryslow -crf 51 -g 10 -refs 1 \
  -bsf:v filter_units=remove_types=6 -c:a aac -b:a 8k -ar 44100 -ac 1 -movflags +faststart blank.mp4

ffmpeg -f lavfi -i "color=c=black:s=16x16:r=1:d=10" -f lavfi -i "anullsrc=r=48000:cl=mono" -t 10 \
  -map_metadata -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -c:v libvpx -crf 63 -b:v 1k -g 10 -c:a libopus -b:a 6k -frame_duration 120 -ac 1 blank.webm
```

`filter_units=remove_types=6` drops the x264 settings banner (about 700 bytes); `-frame_duration 120` packs the silence into 84 Opus packets instead of 500. Then write each file into its module as one line:

```sh
printf "export const MP4_DATA_URL: string =\n  'data:video/mp4;base64,%s';\n" "$(base64 -i blank.mp4 | tr -d '\n')"
printf "export const WEBM_DATA_URL: string =\n  'data:video/webm;base64,%s';\n" "$(base64 -i blank.webm | tr -d '\n')"
```

Keep the one-line comment at the top of `src/assets/blank.mp4.b64.ts` and `blank.webm.b64.ts`. Check with `ffprobe -show_streams` that each file has one video and one audio stream, and with `ffmpeg -i <file> -af volumedetect -vn -f null -` that the audio is silent (`max_volume` at about −91 dB). `packages/wake/test/transitions.test.ts` (T09d) checks the tracks, the length and the size.

#### 5.2 Verify on a device

Unit tests use a stand-in media element, so they prove the engine's honesty, not that a given browser keeps its screen on. Before a release, try the fallback on real hardware, on battery power, with the system's screen timeout at its shortest (30 s on a phone, 1 min on a laptop). For each browser: open the tool, tap Start, confirm the pill reads the fallback state, then leave the device untouched for **30 minutes**. It passes when the screen is still on and the pill still reads the fallback state; it also passes when the screen slept and the pill said so before it did.

1. Safari on iOS or iPadOS 16.3 or earlier (no Wake Lock API): the main fallback audience.
2. A Home-Screen web app on iOS 16.4–18.3 (the API is missing in installed apps before 18.4).
3. Safari on macOS 16.3 or earlier.
4. Firefox 125 or earlier, desktop and Android (set `dom.screenwakelock.enabled` to `false` in a current Firefox to get the same path).
5. Any current browser on an `http://` page that is not `localhost` (the API is hidden in insecure contexts): Chrome on Android, Chrome on desktop, Safari on iOS.
6. Chrome or Edge 83 or earlier, where one is still at hand.

For each run also note: whether other audio (a music app) was paused when the clip started; whether the clip shows in the lock-screen or notification media controls; that switching away and back returns to the fallback state without a tap, or asks for one honestly; and that Stop removes the `<video>` element (check in the inspector).

### 6. Public API of `@awaketab/wake`

```ts
export interface IWakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
  removeEventListener(type: 'release', cb: () => void): void;
}
export interface IWakeLockLike { request(type: 'screen'): Promise<IWakeLockSentinelLike>; }

export interface IRetryOptions { attempts: number /* 3 */; baseMs: number /* 500 */ }

export interface IWakeLockOptions {
  fallback?: 'video' | 'none';                 // default 'video'
  videoSources?: { webm?: string; mp4?: string };
  reacquireOnVisible?: boolean;                // default true
  retry?: IRetryOptions;
  /** Test/PiP hooks: inject the API and document to observe. */
  wakeLock?: IWakeLockLike | null;              // default navigator.wakeLock (null forces `unsupported`)
  document?: Document;                          // default globalThis.document
}

export interface IChangeEvent { from: TLockState; to: TLockState; reason: TLockReason; advice?: TAdviceCode; error?: unknown; at: number }
export interface IErrorEvent  { error: unknown; state: TLockState; advice: TAdviceCode | null }
export interface WakeLockEvents extends Record<string, unknown> { change: IChangeEvent; error: IErrorEvent }

export interface WakeLock {
  readonly state: TLockState;
  readonly mode: 'native' | 'video' | null;
  readonly advice: TAdviceCode | null;
  readonly supported: boolean;                 // API present in this document (false during SSR)
  /** Never rejects; resolves with the state reached: held | fallback | denied | unsupported | idle (if destroyed). */
  request(): Promise<TLockState>;
  release(): Promise<void>;
  on<K extends keyof WakeLockEvents>(type: K, cb: (ev: WakeLockEvents[K]) => void): () => void;
  destroy(): void;
}

export function createWakeLock(options?: IWakeLockOptions): WakeLock;
export function createEmitter<E extends Record<string, unknown>>(): IEmitter<E>;
```

Usage:

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock({ fallback: 'video' });
lock.on('change', ({ to, advice }) => pill.render(to, advice));
button.addEventListener('click', async () => {
  const state = await lock.request();          // inside the gesture so the fallback can play
  if (state === 'denied' || state === 'unsupported') showFix(lock.advice);
});
```

Constraints: `createWakeLock()` touches no globals until `request()`/`on()` is first called, so it is SSR-safe; `request()` while a request is pending returns that request's promise; `request()` while `held` resolves `held` without asking again; `release()` while `requesting` cancels the request (row 4); calls are serialised (§4, One at a time).

The framework adapters (`@awaketab/wake/react`, `/preact`, `/vue`) create the lock in the effect or mounted hook and destroy it in the cleanup, never during render or setup, so a cleanup followed by a re-run (React StrictMode, a remount) gets a new, working lock.

---

## Part B · Session layer — `@awaketab/core`

### 7. Types

```ts
import type { TLockState, TAdviceCode, WakeLock } from '@awaketab/wake';

export type TPlanType = 'indefinite' | 'duration' | 'until';
export type TPlan =
  | { type: 'indefinite' }
  | { type: 'duration'; ms: number }                       // 60_000 ≤ ms ≤ 7 days
  | { type: 'until'; endsAt: number; wall: string };       // endsAt epoch ms (local clock); wall 'HH:MM' — PROPOSED field `wall`

export type TSessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'aborted';
export type TEndReason = 'completed' | 'user' | 'lost_timeout' | 'denied' | 'battery' | 'error';
export type TPresetId = 'p15' | 'p30' | 'p45' | 'p60' | 'p120' | 'p240' | 'pinf' | 'custom' | 'until';
export type TAmbientMode = 'standard' | 'clock' | 'focus' | 'minimal' | 'night' | 'message' | 'cook';
export type TTheme = 'auto' | 'light' | 'dark' | 'oled';
export type TEndBehaviour = 'stop' | 'prompt_extend';

export interface ISession {
  id: string;                 // crypto.randomUUID()
  plan: TPlan;
  presetId: TPresetId;
  mode: TAmbientMode;
  startedAt: number;          // epoch ms
  endsAt: number | null;      // null for indefinite; shifted on pause/resume for duration plans
  status: TSessionStatus;
  pausedAt: number | null;
  pausedMs: number;           // total paused time — PROPOSED field
  endedAt: number | null;     // PROPOSED field
  endReason: TEndReason | null;// PROPOSED field
  awakeSeconds: number;       // seconds spent in held|fallback, for stats — PROPOSED field
  modeState: Record<string, unknown>; // per-mode data, e.g. cookTimers (08-data-storage.md §2.2); written by updateSession()
  source: 'web' | 'pwa' | 'pip' | 'ext' | 'embed';
}

export const PRESET_MS: Record<Exclude<TPresetId, 'pinf' | 'custom' | 'until'>, number> = {
  p15: 15 * 60_000, p30: 30 * 60_000, p45: 45 * 60_000, p60: 60 * 60_000, p120: 120 * 60_000, p240: 240 * 60_000,
};
```

Status lifecycle: `inactive` →(`start`) `active` ⇄(`pause`/`resume`) `paused`; `active|paused` →(`plan end`) `completed`; `active|paused` →(`stop`/`battery`/`denied`/`lost_timeout`/`error`) `aborted`. `completed` always has `endReason: 'completed'`; `aborted` has any other reason. A new `start()` replaces the session object (the previous one has already been folded into stats).

### 8. Tick algorithm

One `setTimeout` chain aligned to the wall clock; no `setInterval`, no accumulated deltas.

```ts
function scheduleTick(): void {
  const now = opts.now();                               // Date.now() by default
  timer = opts.setTimeout(tick, 1000 - (now % 1000));   // fire just after the next whole second
}
function tick(): void {
  timer = null;
  const now = opts.now();
  if (session.status !== 'active') return;
  if (session.plan.type === 'until') reconcileUntil(now);   // §8.1
  if (session.endsAt !== null && now >= session.endsAt) { finish('completed', now); return; }
  if (lock.state === 'held' || lock.state === 'fallback') {
    session.awakeSeconds += 1;                             // credit only genuinely awake seconds
    if (session.awakeSeconds % 60 === 0) stats.creditMinute(now);
  }
  if (lock.state === 'lost' && lostSince !== null && now - lostSince >= opts.lostTimeoutMs) { finish('lost_timeout', now); return; }
  emit('tick', { now, remainingMs: session.endsAt === null ? null : Math.max(0, session.endsAt - now), elapsedMs: now - session.startedAt - session.pausedMs });
  scheduleTick();
}
```

Properties: a tick that fires late (throttled background tab, long task) computes remaining time from `endsAt - now`, so the display never drifts; catch-up is automatic because the next delay is recomputed from `now % 1000`. On `visibilitychange` → visible the engine cancels the pending timer and runs `tick()` immediately so the UI is correct on the first frame. Background timers in hidden tabs are throttled to ≥ 1 min by browsers — irrelevant here because the lock is `lost` while hidden and the end check runs on return; the end-of-session pipeline still fires late-but-correct.

#### 8.1 `until` plans, DST and clock changes

`Plan.until` stores both `endsAt` (absolute) and `wall` (`'HH:MM'` local). Creation: parse `HH:MM`, build `new Date()` set to today at that local time via `setHours(h, m, 0, 0)`; if `≤ now + 30 s` add one day. Because `endsAt` is absolute, a DST transition between now and the target is handled by the `Date` local-time computation at creation — "until 06:00" across a spring-forward night is a correct 06:00. `reconcileUntil(now)` guards the remaining cases: if `formatHHMM(new Date(endsAt))` no longer equals `wall` (time-zone change, manual clock adjustment, NTP correction > 60 s detected as `|now - lastTickAt| > 90_000` while visible), recompute `endsAt` from `wall` relative to `now` and emit `warning { code: 'clock_adjusted' }`. It runs on every tick and on `visibilitychange`. For `duration` plans, `endsAt` is never recomputed: a backwards clock jump extends the session by the jump, a forward jump past `endsAt` completes it on the next tick — both acceptable and rare.

### 9. Pause and resume

**One convention for the end time.** `endsAt` is the real end of a running session. For a `duration` plan it moves forward by each finished pause, so `endsAt = startedAt + plan.ms + pausedMs` always holds, time left is `endsAt − now` while active and `endsAt − pausedAt` while paused, and `pausedMs` is only needed for elapsed time. The web tool, the extension and the stored session all follow it.

`pause()` (allowed in `active`): `status = 'paused'`, `pausedAt = now`, `lock.release()` — the screen may sleep while paused, that is the point — tick chain stopped, persist. `resume()` (allowed in `paused`): `pausedMs += now - pausedAt`; for `duration` plans `endsAt += now - pausedAt` (remaining time is preserved); for `until` plans `endsAt` is unchanged (the clock target is what matters — if it has passed, `resume()` finishes with `completed` immediately); `indefinite` unchanged; `status = 'active'`, `await lock.request()`, restart ticks, persist. Pause does not count toward `awakeSeconds`.

**`pause({ keepLock: true })`** (kept in the engine's API; nothing in the apps calls it today): same as `pause()` except the lock is **not** released — the clock stops, the screen stays awake, and the pill keeps reading the real lock state. `resume()` then reuses the kept lock when it is still `held` or `fallback`, and re-requests it otherwise (e.g. it was `lost` while the tab was hidden). A plain `pause()` still releases.

**`addTime(ms)`** (PiP and popup `+15`): allowed in `active` and `paused` on a finite plan; ignored for `indefinite`, for non-finite or `ms ≤ 0`, and when remaining + `ms` would exceed `CUSTOM_MAX_MS`. A `duration` plan grows in place (`plan.ms += ms`, `endsAt += ms`). An `until` plan whose deadline moved is no longer a wall-clock target, so it becomes a `duration` plan with `endsAt += ms` — the same moved deadline — and `plan.ms = endsAt − startedAt − pausedMs`. Unlike `extend()` it never starts a new session. Tracks `session_extend { addedMin }`, persists, and broadcasts a `state` snapshot (§14).

**`updateSession({ mode?, modeState? })`**: sets `session.mode` and shallow-merges `modeState` on the current session, then persists. A caller uses it to keep what belongs to the running session on the session itself, so a reload or a restart resumes it: the extension keeps the session's origin and tab there.

**`stop()` after completion**: when the session is already `completed`/`aborted`, `stop()` does not finish it again but still calls `lock.release()`, because the UI may have re-requested the lock for the extend-prompt grace period (§10 step 6).

### 10. End-of-session pipeline

`finish(reason, now)` runs the same ordered steps for every end; steps 3–6 are skipped for `reason === 'user'`.

1. `status = reason === 'completed' ? 'completed' : 'aborted'`; `endReason`, `endedAt` set; tick chain stopped; `lock.release()`.
2. Persist `at.v1.session`; `stats.finalize(session)` (credit the partial minute if `awakeSeconds % 60 ≥ 30`; increment `sessions` and `daySessions[dayKey(now)]`; when `reason === 'completed'` and `modeState.focusBlock === true`, increment `dayFocus[dayKey(now)]`); track `session_end { reason, durationMin }`.
3. Chime (if `settings.sound.enabled`): the `AudioContext` was created and `resume()`d on the start gesture so it can play now without user interaction; a 600 ms two-tone chime from an oscillator (no audio file). Pro `sounds.custom` replaces it.
4. Notification (if `settings.notifications` and permission `granted`): `registration.showNotification(t('end.title'), { body, tag: 'at-end', renotify: true, icon: '/icons/192.png' })` through the service worker so it works with the tab in the background. On iOS this is only possible in the installed Home-Screen app; the settings toggle is hidden when `caps.features.notifications === 'unavailable'`.
5. Title flash: alternate `document.title` between the original and `t('end.titleFlash')` every 1 s until the document is visible *and* focused, then restore. Never `alert()`.
6. Extend prompt: if `settings.endBehaviour === 'prompt_extend'` (default) show the `extend` overlay (+15 min, +30 min, +60 min, ∞) with a 60 s auto-dismiss; `extend(ms)` creates a new `duration` session with `presetId: 'custom'` and the same mode (or `indefinite` for ∞). If `stop`, show the summary toast only. For `battery` and `denied` the overlay shows the fix instead of the extend buttons.

Steps 1–2 run in the engine. Steps 3–6 belong to whatever shows the session, which hears the engine's `ended` event: the web tool shows its Time's up state, and the extension plays the chime chosen in its options from an offscreen document and shows no notification or extend prompt (`10-extension-spec.md` §4).

### 11. Battery monitor (Chromium only)

Enabled when `'getBattery' in navigator` and `settings.battery.autoStop`, and only while the session is `active`. The engine calls `navigator.getBattery()` **once** and caches the `BatteryManager` for its lifetime (listeners on `levelchange` and `chargingchange` are removed in `destroy()`); `null` is cached when the API is absent or rejects. It evaluates on start, on every battery event, and on every 60th tick (the first tick included). `evaluateBattery(b, threshold, 0.02)` returns `ok` when charging, `stop` when `level ≤ threshold` (default `0.15`), `low` when `level ≤ threshold + 0.02`:

- `low` → emit `warning { code: 'battery_low', level }` (toast `tool.toast.batteryLow`), at most **once per session** (the flag resets on `start()`).
- `stop` while armed → disarm, then `finish('battery')`.
- Hysteresis: the stop re-arms only once the device is charging or `level ≥ threshold + 0.05`. A session started below the threshold on the same discharge gets the one-time `battery_low` warning instead of being stopped again. The armed flag lives in memory for the engine's lifetime.
- The active check is re-done after `getBattery()` resolves, so a session that ended meanwhile is never finished twice.

### 12. Persistence and resume

Written to `at.v1.session` on every status change, on `addTime` and `updateSession`, and on every tick while active, so `awakeSeconds` is never more than a second behind. The extension's storage adapter batches those per-second writes to one every 10 s (`10-extension-spec.md` §7); the web tool, which keeps its own machine (below), writes every 15 s and on every change. On boot, `getResumable()` returns the stored session when all hold: `status ∈ {'active','paused'}`; and it has time left (`endsAt − now > 0`, or `endsAt − pausedAt > 0` for a paused `duration` plan, whose clock stands still) or (`plan.type === 'indefinite' && now - startedAt < 12 h`). Because `endsAt` already includes every finished pause (§9), a session that was paused, resumed and then outlived its first end time is still resumable after a restart. Otherwise, if `status === 'active'` and `endsAt !== null && endsAt ≤ now` the session is marked `completed` silently (it ended while unloaded; minutes credited only up to the last heartbeat); if indefinite and older than 12 h it is marked `aborted` with `endReason: 'error'`. A caller that offers a resume choice calls `resumeSession()` on accept, which keeps `id`, `startedAt` and `endsAt` (time that passed while the page was unloaded counts; a session stored as `paused` resumes through `resume()`, which moves `endsAt` by the pause), and requests the lock; decline → `aborted` with `endReason: 'user'` and no chime.

**Reading what is stored.** `createStorage()` checks the shape of what it reads, because localStorage can be edited or half-written. Stats: a `days` that is not an object becomes `{}`, and `totalMinutes` and `sessions` that are not numbers become `0`; nothing throws. A stored session is dropped (read as `null`) when its plan is missing or malformed, or when `startedAt`, `endsAt` or `pausedAt` is not a real time; a missing `pausedMs` reads as `0` and a missing `modeState` as `{}`. A session saved before `endsAt` moved with each pause (it kept the first end time, with the paused total beside it) is recognised by `endsAt === startedAt + plan.ms` with `pausedMs > 0` and read with `endsAt + pausedMs`.

**The web tool** (`apps/site/lib/wake.ts`) keeps its own session machine on the same storage and follows the same rules:

- *The tick never dies.* Each per-second tick schedules the next one in a `finally`, and the bookkeeping around it (crediting stats, writing the session, event listeners) is guarded, so a failure there is logged once with `console.error` and the session still reaches its end and releases the lock. The end-of-session step and Stop release the lock even when recording the result fails.
- *Paused and needs you.* "Paused" is only the person's own Pause: it sets `pausedAt` and freezes the clock, and Resume moves `endsAt` forward by the length of the pause. A hidden tab that lost the lock is "Needs you" instead: `pausedAt` stays `null`, the clock runs on to the same `endsAt`, the lock is asked for again when the tab is visible, and the session ends normally if `endsAt` passes while the tab is hidden. It is stored as `active`.
- *After a reload.* A session that was running comes back as "Needs you" and, when the page is visible and the browser has the API, asks for the lock again by itself, once (Chromium and Firefox grant it without a tap). If it is granted the session runs on. If it is refused without a known cause (the browser wants a tap), or the page is hidden, it stays "Needs you" without a refusal message; a refusal with a cause a tap cannot fix (permissions policy, insecure page) shows as blocked. The update banner's reload goes through the same path. A session stored as paused stays paused.
- *A stalled fallback clip.* When the lock layer reports the video `lost` while the page is visible (row 25), the session goes to "Needs you" and keeps its video mode, so the next tap restarts the clip inside the gesture.

### 13. Stats

`at.v1.stats = { days: Record<'YYYY-MM-DD', number>, totalMinutes, sessions, longestStreak }` (schema and retention in `08-data-storage.md`).

```ts
const dayKey = (ms: number) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); // local date, e.g. 2026-09-07
```

**Per-day counters.** `finish()` also keeps two optional per-day counters (`08-data-storage.md` §2.3), both through `countDay(rec, now, timeZone)` on the local day the session **ends**, so a session that crosses local midnight counts on the new day while its minutes split at the boundary. `daySessions` goes up under the same ≥ 1 min rule as `sessions`. `dayFocus` goes up for a `completed` session carrying `modeState.focusBlock === true`, which focus mode sets on the block it starts. A block stopped early, or an extension of a finished block, is a session but not a focus block.

`creditMinute(now)` adds 1 to `days[dayKey(now)]` and `totalMinutes`, flushing to storage at most every 60 s. `finalize()` increments `sessions` when the session had ≥ 1 credited minute, prunes keys older than 365 days, and recomputes streaks: walk backwards from today; `currentStreak` counts consecutive days with `minutes ≥ 1` starting at today or, if today is empty, at yesterday; `longestStreak = max(longestStreak, currentStreak)`. `currentStreak` is derived on read, not stored. Free tier renders 7 days; `stats.history` unlocks the 365-day heatmap; `stats.export` the CSV — the data is stored for everyone so upgrading reveals history.

### 14. Multi-tab protocol and single-active-lock election

Channel: `new BroadcastChannel('awaketab')`. `tabId` is `crypto.randomUUID()` kept in `sessionStorage['at.tabId']` (survives reload, not tab duplication — a duplicated tab gets a new id because we also compare `performance.timeOrigin`).

```ts
// As in 00-conventions.md §13.1
type TTabMessage =
  | { type: 'hello'; tabId: string; ts: number }
  | { type: 'lock';  tabId: string; ts: number; state: TLockState }
  | { type: 'state'; tabId: string; ts: number; status: TSessionStatus; lock: TLockState; startedAt: number | null;
      // timing snapshot so a mirror (the /pip popup) can count locally between messages
      endsAt?: number | null; planType?: TPlanType; pausedMs?: number; pausedAt?: number | null; wall?: string | null }
  | { type: 'intent'; tabId: string; ts: number; target: string; action: 'stop' | 'add'; ms?: number }
  | { type: 'bye';   tabId: string; ts: number };
```

Rules:

1. On boot post `hello`. Every peer replies with `lock` (its current lock state) and, when it has a session, a full `state` snapshot. Peers are tracked in a map with a 10 s liveness timeout refreshed on any message; `peers` in the store is the map size. In the web tool a tab that keeps the screen awake repeats its `lock` message every 3 s as a heartbeat, and every tab drops, on its own tick and when it becomes visible, a holder it has not heard from for 10 s. A tab that crashed or was discarded without sending `bye` therefore stops counting as "running in another tab" within 10 s.
2. A tab that is not awake itself and hears a peer report `lock ∈ {'held','fallback'}` shows the "another tab is keeping this screen awake" banner with *Take over*. The session engine emits `warning { code: 'second_tab' }` for the same message.
3. Take over: the tab sends `intent { action: 'stop' }` to every tab it knows as a holder, forgets them and starts its own session. The addressed tab stops its session (reason `user`). No tab is ever set to `paused` by another tab: paused is only the person's own Pause. Because only a visible tab can hold a native lock, this mostly matters for stats double-counting and honest pills.
4. `bye` on `pagehide` removes the peer immediately.
5. Snapshots: while it has a session, the engine posts `state` (with `endsAt`, `planType`, `pausedMs`, `pausedAt`, and `wall` for `until` plans) on every tick, on every status change, on every lock change, and after `addTime()`. Mirrors compute the timer locally from the snapshot, so a throttled owner tab never freezes them.
6. Intents: a tab without an engine (the `/pip` popup, `05-frontend-spec.md` §9) acts through `intent` messages addressed to one owner's `tabId`. The addressed engine runs `stop()` for `action: 'stop'` and `addTime(ms)` for `action: 'add'`; every other tab ignores the message. Intents are commands, never state: the mirror still waits for the owner's next `state` to change its display.

### 15. Capability probe

Synchronous, runs once at boot (< 1 ms), result cached in the store and re-used by the pill copy, settings visibility and analytics `ua` class.

```ts
export type TBrowserFamily = 'chrome' | 'edge' | 'firefox' | 'safari' | 'samsung' | 'opera' | 'other';
export type TOSFamily = 'ios' | 'ipados' | 'android' | 'windows' | 'macos' | 'linux' | 'chromeos' | 'other';

export interface ICapabilities {
  browser: { family: TBrowserFamily; major: number | null; minor: number | null; source: 'ua-ch' | 'ua' };
  os: { family: TOSFamily };
  isIOS: boolean;                 // iPhone/iPad/iPod, including iPadOS desktop UA (MacIntel + maxTouchPoints > 1)
  isStandalone: boolean;          // matchMedia('(display-mode: standalone)') || navigator.standalone === true
  isSecureContext: boolean;
  isEmbedded: boolean;            // window !== window.top
  wakeLock: 'native' | 'fallback' | 'none';   // feature detection first, matrix second
  matrix: { nativeExpected: boolean; minVersion: string | null };   // from the support matrix, for advice copy
  features: {
    battery: boolean;                                      // 'getBattery' in navigator (Chromium only)
    notifications: 'granted' | 'denied' | 'default' | 'unavailable';   // 'unavailable' on iOS when not standalone
    documentPip: boolean;                                  // 'documentPictureInPicture' in window (Chromium only)
    idleDetection: boolean;                                // 'IdleDetector' in window (Chromium only)
    broadcastChannel: boolean;
    serviceWorker: boolean;
    webCrypto: boolean;                                    // crypto.subtle available (needed for licence verify)
  };
  advice: TAdviceCode | null;          // initial advice before any request: insecure_context | unsupported_browser | null
}

const NATIVE_MIN: Partial<Record<TBrowserFamily, [major: number, minor: number]>> = { chrome: [84, 0], edge: [84, 0], firefox: [126, 0], safari: [16, 4], samsung: [14, 0], opera: [70, 0] };
```

Browser family comes from `navigator.userAgentData.brands` when present (pick, in order, `Microsoft Edge`, `Samsung Internet`, `Opera`, `Google Chrome`, `Chromium`; version from that brand), else from the UA string (`Edg/`, `SamsungBrowser/`, `OPR/`, `Firefox/`, `Chrome/`, `Version/… Safari/`). `wakeLock` is `'native'` if `'wakeLock' in navigator`, else `'fallback'` if a `<video>` can be created (`typeof HTMLVideoElement !== 'undefined'`), else `'none'`. The matrix does not override detection; it only produces copy such as "Safari 16.3 — update to 16.4 for native support". iOS Home-Screen apps below 18.4 are detected as `isIOS && isStandalone` with `os` version < 18.4 → `matrix.nativeExpected = false` and advice copy points to the browser tab instead.

**iOS Low Power heuristic** (in `core`, because `wake` has no timeline): on iOS, if the document goes hidden without any user input in the preceding 25–40 s while `held`, twice within one session, emit `warning { code: 'ios_low_power' }`; the UI shows the Low Power Mode fix. This is a heuristic and the copy says "probably".

### 16. Public API of `@awaketab/core`

```ts
export interface IStorageAdapter { get<T>(key: string): T | null; set(key: string, value: unknown): void; remove(key: string): void; readonly persistent: boolean }

export interface ISessionOptions {
  lock: WakeLock;
  storage: IStorageAdapter;                     // from createStorage() — see 08-data-storage.md
  channel?: BroadcastChannel | null;           // null disables multi-tab logic
  settings: () => ISettings;                    // live getter so changes apply without restart
  now?: () => number;                          // default Date.now
  setTimeout?: typeof setTimeout; clearTimeout?: typeof clearTimeout;
  lostTimeoutMs?: number;                      // default 6 h
  notify?: (title: string, body: string) => Promise<void>;   // SW notification adapter (web) / chrome.notifications (extension)
  track?: (event: string, params?: Record<string, string | number | boolean>) => void;
}

export interface ISessionEvents extends Record<string, unknown> {
  tick:    { now: number; remainingMs: number | null; elapsedMs: number };
  status:  { from: TSessionStatus; to: TSessionStatus; reason: TEndReason | null };
  lock:    IChangeEvent;                        // re-emitted from @awaketab/wake
  ended:   { session: ISession; reason: TEndReason };
  warning: { code: 'battery_low' | 'second_tab' | 'clock_adjusted' | 'ios_low_power' | 'storage_memory'; level?: number };
  peers:   { count: number };
}

export interface ISessionEngine {
  readonly session: ISession | null;
  readonly lockState: TLockState;
  start(plan: TPlan, meta: { presetId: TPresetId; mode: TAmbientMode; source?: string }): Promise<TLockState>;
  pause(opts?: { keepLock?: boolean }): void;  // keepLock: clock paused, lock kept (cook mode, §9)
  resume(): Promise<TLockState>;
  stop(): void;                                // endReason 'user'; after completion only releases the grace lock
  extend(ms: number | 'indefinite'): Promise<TLockState>;
  addTime(ms: number): void;                   // grow the live finite plan in place (§9)
  updateSession(patch: { mode?: TAmbientMode; modeState?: Record<string, unknown> }): void;
  getResumable(): ISession | null;
  resumeSession(): Promise<TLockState>;         // accept the resume banner
  discardResumable(): void;
  on<K extends keyof ISessionEvents>(type: K, cb: (ev: ISessionEvents[K]) => void): () => void;
  destroy(): void;
}

export function createSession(opts: ISessionOptions): ISessionEngine;
export function planFromPreset(id: Exclude<TPresetId, 'custom' | 'until'>): TPlan;
export function planUntil(wall: string, now?: number): TPlan;               // 'HH:MM' → { type:'until', endsAt, wall }
export function probeCapabilities(win?: Window & typeof globalThis): ICapabilities;
export { createStorage, migrate, readStats, exportStatsCsv, clearAllData } from './storage';
export { verifyLicenseToken, type ILicenseState } from './license';
export { dayKey, computeStreaks } from './stats';
```

Usage (web app):

```ts
const lock = createWakeLock({ fallback: 'video' });
const engine = createSession({ lock, storage, channel: new BroadcastChannel('awaketab'), settings: () => store.get().settings, notify: swNotify, track });
engine.on('tick', ({ remainingMs }) => store.set({ now: Date.now() }));
engine.on('lock', ({ to, advice, mode }) => store.set({ lock: { state: to, advice, mode } }));
engine.on('ended', ({ reason }) => reason !== 'user' && store.set(s => ({ ui: { ...s.ui, overlay: 'extend' } })));
startButton.onclick = () => engine.start(planFromPreset('p30'), { presetId: 'p30', mode: 'standard', source: 'button' });
```

Extension: the background service worker wraps `chrome.power.requestKeepAwake('display')` / `releaseKeepAwake()` as the lock (`held` after a request; `unsupported` when `chrome.power` is absent; `denied` when the request throws) and passes it to `createSession()` with a `chrome.storage.local`-backed `IStorageAdapter`, `channel: null`, which switches the tab protocol off, and `resumeIndefiniteMs: Infinity` (an `ISessionOptions` field, default 12 h), so the often restarted worker can resume a long session with no end. See `10-extension-spec.md` §4.

### 17. Test hooks

- `createWakeLock({ wakeLock: fake, document: fakeDoc })` — `@awaketab/wake/testing` exports `createFakeWakeLock()` returning `{ api: WakeLockLike; sentinels: FakeSentinel[]; rejectNextWith(err: Error): void; releaseAll(): void }` where `FakeSentinel.fireRelease()` simulates the browser releasing. `setVisibility(doc, 'hidden' | 'visible')` redefines `visibilityState` and dispatches `visibilitychange`. Passing `wakeLock: null` forces the `unsupported` path; `fakeMedia()` in `packages/wake/test/fake.ts` stands in for a media element that plays, is refused or stalls, and drives rows 7–9 and 25 (`test/fallback.test.ts`). `test/sentinels.test.ts` counts live sentinels through fullscreen changes, rapid request and release, and `destroy()`; `test/adapters.test.ts` mounts, unmounts and mounts each adapter again.
- `createSession({ now, setTimeout, clearTimeout })` — inject a controllable clock, or use Vitest fake timers (`vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`) and `vi.setSystemTime()` to test DST/`until` reconciliation and the 12 h resume window.
- `IStorageAdapter` in-memory implementation is the same class used for the private-mode fallback, so storage tests need no jsdom `localStorage`.
- `BroadcastChannel` is polyfilled in tests with an in-process implementation that delivers to all other instances synchronously; election tests create two engines on the same channel.
- Every transition row in §4 has a Vitest case named `T<row>`; the e2e suite (Playwright, chromium/firefox/webkit) asserts the pill text after tab hide/show and after a forced `NotAllowedError` via `--disable-features=WakeLock` or CDP `Emulation.setIdleOverride`. See `13-testing-strategy.md`.

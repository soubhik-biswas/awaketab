# 08 · Data and storage

Status: v2.0 · 2026-11-13 · Owner: Soubhik

**Purpose.** Every byte AwakeTab persists — in the browser, in the extension, in Cloudflare KV, in Workers Analytics Engine and in D1 — with its schema, defaults, versioning, retention and privacy classification. The free tool has no account. Sign-in, which exists only for Pro and ships switched off, keeps its accounts and sessions in the D1 database `AUTH_DB` (Better Auth's tables, `apps/site/migrations`).

Related docs: `00-conventions.md` §6, §9, §10, §13 · `04-engine-spec.md` (who writes the session and stats) · `09-monetization-impl.md` (licence records) · `14-devops.md` (backups, secrets).

---

## 1. Principles

1. **Local first.** Everything the product needs to function lives in the user's browser under the `at.v1.*` keys. The server holds only licence records, embed configs, feedback and ratings people chose to send, and anonymous events from visitors who allowed counting.
2. **No identifiers that follow a person.** No cookies, no user ids, no fingerprinting. `deviceId` is a random UUID that exists only to count licence activations; `sid` is a random id kept in memory for one page load; the daily visitor key of the analytics is a hash that changes every UTC day (§5).
3. **Schema-on-read with defaults.** Every read passes through `parse<T>(key, schema, defaults)`; corrupt or missing values fall back to defaults and are logged as `client_error {code:'storage_unavailable'}` only when the whole store is inaccessible.
4. **Versioned keys.** The `v1` in `at.v1.settings` is the *schema major*. Additive changes keep `v1`; a breaking change ships `migrate()` and a `v2` prefix.

---

## 2. Browser storage (localStorage)

All values are JSON. Sizes are well under 50 KB total; localStorage quota (≥ 5 MB) is never a concern. sessionStorage holds `at.tabId` (UUID) and, during a sign-in, `at.v1.signin` (§2.9a).

### 2.1 `at.v1.settings`

```ts
export interface ISettings {
  v: 1;
  theme: 'auto' | 'light' | 'dark' | 'oled';        // default 'auto'
  accent: string;                                   // default '#087B87'; kept so older records still read. The tool no longer offers a lamp colour: Face studio keeps its own accent in at.v1.studio (§2.9a)
  face: TFace;                                      // one of FACE_IDS in packages/core/src/types.ts (the 46 Glance faces, 00-conventions.md §13.31); default 'ring' — the remembered clock face; the faces gallery writes it. Read through migrateFace: retired and old ids map to a face that stays ('led' → 'lcd', 'terminal' → 'lcd', 'pulse' → 'waveform', 'matrix' → 'lcd', 'word' → 'words', 'analog' saved with faceStyles.analog 'luxe' → 'luxe'); any other unknown value reads as 'ring'; faceStyles is dropped on read
  defaultPreset: TPresetId;                          // 'p15'|'p30'|'p45'|'p60'|'p120'|'p240'|'pinf'|'custom'|'until'; default 'pinf'
  lastCustomMs: number;                             // default 90 * 60_000
  lastUntilWall: string | null;                     // 'HH:MM', default null
  autostart: boolean;                               // default true (request lock on load when visible)
  sound: { id: 'chime' | 'bell' | 'soft' | 'digital' | 'birds' | 'none' | `custom:${string}`; volume: number }; // default {id:'chime', volume:0.6} on the website; the extension's default is 'none' (§3). The tool writes 'chime' (Two notes), 'bell' or 'none' (Off)
  notifications: boolean;                           // default false (permission asked only when turned on)
  endBehaviour: 'stop' | 'prompt_extend';           // default 'prompt_extend'
  battery: { autoStop: boolean; threshold: number; chargingReminder: boolean }; // default {false, 15, true}; UI hidden when Battery API absent
  ambient: {
    mode: 'standard' | 'clock' | 'focus' | 'minimal' | 'night' | 'message' | 'cook' | 'breathe'; // default 'standard'
    message: string;                                // ≤ 80 chars, default ''
    clock24h: boolean | null;                       // default null = no choice made, the clock follows the language (§2.9c); true = 24-hour, false = 12-hour, in every language
    showSeconds: boolean;                           // default true
    pixelShift: boolean;                            // default true in ambient modes
    autoHideMs: number;                             // default 3000
    focus: { workMin: number; breakMin: number; cycles: number }; // default {25, 5, 4}
  };
  locale: string | null;                            // explicit override, default null (URL decides)
  telemetry: boolean;                               // the answer to "Count this visit?". The website never writes it as a default and counts only when the stored value is exactly true (§2.9c, ANALYTICS.md); the extension's default is false
  keyboardShortcuts: boolean;                       // default true — single-key shortcuts (WCAG 2.1.4)
  keyboardHints: boolean;                           // default true — show hints in UI
  reduceMotion: 'system' | 'on' | 'off';            // default 'system'
}
```

Additive fields (28 September 2026; still `v: 1`, missing fields read as their defaults): `faceStyles` (per-face style id; retired 30 Oct 2026: Luxe is its own face, and `migrateFace` folds `analog` + `luxe` into it and drops the field on read) · `palette` (`clear-night` | `paper` | `nord` | `solarized` | `midnight` | `forest` | `sunset` | `mono` | `contrast`, default `clear-night`) · `pattern` (`none` | `grain` | `dots` | `grid` | `topo` | `waves` | `aurora` | `stars` | `drift`, default `none`) · `vibrate` (`true`) · `tick` (`false`) · `focusSound { kind, volume 0.5, mix {}, stopAtEnd true }` (`kind`: `none` | `brown` | `pink` | `white` | `rain` | `cafe` | `fire` | `lofi` | `track:<id>`) · `intention` (≤ 80 chars, `''`) · `worldClock` (IANA zone or `null`) · `pomodoro { autoCycle false, longBreakMin 15 }` (`autoCycle` needs `ambient.packs`; `longBreakMin` 5–45, free) · `breathe` (`'478'` \| `'box'`, optional: absent reads as `'478'`, so it has no default entry). `intention` and `worldClock` are read defensively (an unknown zone or a non-string reads as unset). `face` gains `flip` · `rolling` · `analog` · `rings` · `word` · `nixie` · `lcd` · `matrix`; `sound.id` gains `digital` · `birds`; `ambient.mode` gains `breathe`. A Pro item being previewed is never written here. How the sound fields are used: `sound.volume` is written by Settings → End sound volume; `focusSound.kind` is the last chosen focus sound (it never starts playing on load); a non-empty `focusSound.mix` (Pro) plays instead of `kind` and is cleared by picking a single sound; the pack reads every nested `focusSound` field defensively (`readFocus`: unknown kinds read as `none`, out-of-range levels and volumes are dropped).

### 2.1a `at.v1.notes` (IndexedDB)

Notes live in IndexedDB (`idb-keyval`, database `awaketab`, store `notes`, key `at.v1.notes`), never in localStorage and never sent anywhere. Written by the notes pack 600 ms after the last keystroke, and at once when the drawer closes, the tab hides or the page goes away.

```ts
interface INotesData {
  v: 1;
  notes: Array<{
    id: string;           // crypto.randomUUID()
    title: string;        // ≤ 120 chars; '' for new notes, whose title is their first line
    doc: JSONContent | null; // Tiptap/ProseMirror document JSON; null until something is written
    createdAt: number;    // ms epoch
    updatedAt: number;    // ms epoch, the list sorts on it
    pinned?: true;        // Pro; pinned notes list first
  }>;                     // creation order: notes[0] is the free note
  current?: string;       // id of the note the drawer opens on
  voiceOk?: true;         // the dictation notice was read and accepted once
}
```

Reads are defensive (`parseNotes`): a damaged record, a duplicate id or a non-document `doc` is dropped, never thrown. Free: one editable note, the first in the array; with `ambient.packs`, or during a five-minute preview, every note is editable. An older note that still has a `title` gets it as its first line (a level 1 heading) the first time it opens editable, and the field is emptied; read-only notes keep it and Copy and Export put it on top. Notes written during a preview stay (readable, copyable, exportable) and are read only after it ends; nothing is deleted except by the user (Clear with an inline confirm, or Delete note when there are several). Clearing the site's data in the browser deletes them; there is no server copy and no sync.

### 2.2 `at.v1.session`

Written on every status change, when time is added, and while a session is live: the web tool (`apps/site/lib/wake.ts`) writes every 15 s and when the page goes away; the session engine in `@awaketab/core` (the extension) writes on every tick, which the extension's storage batches to one write every 10 s.

```ts
export type TPlan =
  | { type: 'indefinite' }
  | { type: 'duration'; ms: number }
  | { type: 'until'; endsAt: number; wall: string };

export type TSessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'aborted';
export type TEndReason = 'completed' | 'user' | 'lost_timeout' | 'denied' | 'battery' | 'error';

export interface ISession {
  v: 1;
  id: string;               // UUID
  plan: TPlan;
  presetId: TPresetId;
  mode: TAmbientMode;
  startedAt: number;        // epoch ms
  endsAt: number | null;    // the real end time, null for indefinite; Resume moves it forward by the length of the pause
  status: TSessionStatus;   // 'paused' only for the person's own Pause; a session that needs a tap is stored 'active'
  pausedAt: number | null;  // set only while paused
  pausedMs: number;         // total of finished pauses, already included in endsAt; used for elapsed time
  endedAt: number | null;
  endReason: TEndReason | null;
  awakeSeconds: number;     // seconds spent in lock `held` or `fallback`
  modeState: Record<string, unknown>; // per-mode data merged by engine.updateSession(): { cookTimers?: ICookTimer[]; focusBlock?: boolean; plus the focus keys below }
  source: 'web' | 'pwa' | 'pip' | 'ext' | 'embed';
}
```

```ts
// cook mode kitchen timers — session.modeState.cookTimers (the embed's copy: apps/site/lib/embed/timers.ts)
export interface ICookTimer {
  id: string;               // 8-char random id
  name: string;             // ≤ 20 code points, NFC, control/format chars stripped; default 'Timer N'
  durationMs: number;       // 60_000 … 12 h
  endsAt: number;           // epoch ms (wall clock; keeps running while the session clock is paused)
  doneAt: number | null;    // epoch ms when it fired, null while counting
}
```

`modeState.focusBlock` is `true` on a session started by focus mode's "Start a focus block". It is what makes the session count toward `at.v1.stats.dayFocus` when it completes (§2.3). Focus tools (28 September 2026) add, all optional and read defensively: `focusAuto` (`true` for an auto-cycle session, which is `indefinite` and has `focusBlock: false`) · `focusCfg` (`{ workMin, breakMin, cycles, longMin }` frozen at start) · `focusSkip` · `focusPauseAt` (epoch ms while the Pomodoro timer is paused, else 0) · `focusPaused` (ms paused so far) · `focusAdded` (ms added to a single block's end during the current pause) · `focusRounds` (auto-cycle blocks already counted). An auto-cycle session adds one to `dayFocus` for each block it finishes, whatever its end reason.

At most 3 timers. The reader is defensive: a non-array or malformed entry is dropped (localStorage is user-editable). Focus-mode phases are not stored — they are derived from `startedAt`, `pausedMs` and `settings.ambient.focus` on every repaint. The session also changes through `addTime(ms)` (an `until` plan may become a `duration` plan with the same deadline) and `pause({ keepLock: true })` (cook mode; `04-engine-spec.md` §9).

**The end time.** `endsAt` is the real end of a running session. For a `duration` plan `endsAt = startedAt + plan.ms + pausedMs` always holds: each Resume adds the pause to both. Time left is `endsAt − now` while active and `endsAt − pausedAt` while paused. A record written before `endsAt` moved with each pause (recognised by `endsAt === startedAt + plan.ms` with `pausedMs > 0`) is read as `endsAt + pausedMs` (`04-engine-spec.md` §9, §12).

**Paused and needs you.** A session is stored `paused`, with `pausedAt` set, only when the person pressed Pause. A hidden tab that lost the lock is "needs you": it stays `active`, `pausedAt` stays `null` and the clock runs on to the same `endsAt`; if that time passes while the tab is hidden, the session ends normally.

**Resume rule** (evaluated on load): the stored session is restored when `status ∈ {active, paused}` and it has time left (`endsAt − now > 0`, or `endsAt − pausedAt > 0` for a paused session, whose clock stands still), or when it has no end and `now − startedAt < 12 h`. Anything else is left alone and a new session starts from idle. On the website a restored `active` session comes back as "needs you" and asks for the lock again by itself, with no banner and no tap where the browser allows it; a restored `paused` session stays paused until Resume. The website restores only sessions it wrote itself (`source: 'web'`).

**Other tabs.** Nothing about other tabs is stored. Tabs talk over `BroadcastChannel('awaketab')`: a tab that holds the lock repeats its state every 3 s, and a tab not heard from for 10 s is forgotten (`04-engine-spec.md` §14).

### 2.3 `at.v1.stats`

```ts
export interface IStats {
  v: 1;
  days: Record<string, number>;   // 'YYYY-MM-DD' (LOCAL date) → awake minutes
  totalMinutes: number;
  sessions: number;               // completed + user-ended sessions ≥ 1 min
  longestStreakDays: number;
  currentStreakDays: number;      // recomputed on read
  lastSessionAt: number | null;
  daySessions?: Record<string, number>; // 'YYYY-MM-DD' (LOCAL) → sessions ≥ 1 min that ENDED that day
  dayFocus?: Record<string, number>;    // 'YYYY-MM-DD' (LOCAL) → focus blocks completed that day
}
```

**Per-day counters (optional fields, no version bump).** `daySessions` goes up wherever `sessions` does, on the local day the session ends. `dayFocus` goes up when a session with `modeState.focusBlock === true` ends with reason `completed` (`04-engine-spec.md` §10). Both are optional. Data written before them has neither field, and `storage.stats()` does not invent them: a missing record or a missing day means "not recorded", which the Stats panel shows as 0 sessions today and the CSV leaves empty. On read, both are pruned with the same 365-day window as `days`. A value that is not an object is dropped, and `pruneDays()` keeps only number values, for `days` too. `dayFocus` is a separate sparse record rather than a second number inside `daySessions`, so the common record stays `Record<string, number>`, and people who never use focus mode store nothing extra.

Day key: `new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' }).format(date)` — always the user's local date (the nosleep.page UTC bug is a regression test). Minutes are added at each whole awake minute and at session end; a session spanning midnight splits at the local boundary. Retention: prune keys older than 365 days on write. Free users see the last 7 days; `stats.history` unlocks the full 365 and `stats.export` the CSV.

### 2.4 `at.v1.license`

```ts
export interface ILicenseRecord {
  v: 1;
  token: string;            // JWT (ES256)
  plan: 'pro_yearly' | 'pro_lifetime' | 'biz_embed_site_yearly' | 'biz_kiosk_site' | 'biz_kiosk_5';
  features: TFeatureGate[];  // copied from token for fast reads
  exp: number;              // epoch seconds from token
  lastValidatedAt: number;  // epoch ms of last successful online validate
  deviceId: string;         // random UUID, generated once, never derived from hardware
  deviceLabel: string;      // e.g. 'Chrome on macOS' (user-editable)
}
```

Token claims: `{ sub: keyHash, plan, features, dev: deviceHash, iat, exp, ver }`. Verification (browser and extension): `crypto.subtle.verify({ name:'ECDSA', hash:'SHA-256' }, publicKey(ver), sig, data)` against `LICENSE_PUBLIC_KEYS[ver]`; reject if `exp < now`, `dev !== sha256(deviceId)`, or unknown `ver`. Re-validation: yearly plans on load when `now - lastValidatedAt > 24 h`; lifetime every 90 days; kiosk every 30 days; failures while offline never downgrade until `exp` (yearly tokens carry a 7-day grace past period end).

### 2.5 `at.v1.meta`

```ts
export interface IMeta {
  v: 1;
  installedAt: number;
  sessionCount: number;            // completed sessions ≥ 5 min
  ratingPrompt: { shownAt: number | null; action: 'rated' | 'later' | 'never' | null; stars?: number; rearmAt?: number }; // rearmAt = sessionCount at which 'later' asks again (sessionCount + 10)
  lastSeenVersion: string;         // for the changelog toast
  pwa: { installed: boolean; promptShownAt: number | null };
  secondTabWarnedAt: number | null;
}
```

### 2.6 `at.v1.onboarding`

`{ v: 1, dismissedTips: string[] }` — tip ids such as `pip`, `until`, `shortcuts`. The `analytics` tip records that "Count this visit?" was answered, so the card does not ask again (§2.9c).

### 2.7 Access layer

```ts
// packages/core/src/storage.ts
export interface IStorageAdapter { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void }
export const memoryAdapter: IStorageAdapter;   // used when localStorage throws (private mode, disabled)
export function createStore(adapter?: IStorageAdapter): {
  settings: Ref<ISettings>; session: Ref<ISession | null>; stats: Ref<IStats>; license: Ref<ILicenseRecord | null>; meta: Ref<IMeta>;
  migrate(): void; clearAll(): void; exportCsv(): string;
};
```

Writes are debounced 250 ms except `session.status` changes (immediate). If `localStorage` throws on first access, the store switches to `memoryAdapter`, shows one toast ("Settings won't be saved in this private window") and emits `client_error {code:'storage_unavailable'}` once.

### 2.8 Migration

`migrate()` runs before first render: reads `at.v1.*`; unknown fields are dropped, missing fields get defaults, and `v` is stamped. A future `v2` adds `migrateV1toV2()` and removes `at.v1.*` after a successful copy. Never migrate `at.v1.license` lossy — if it cannot be parsed, keep the raw string under `at.v1.license.raw` for support.

### 2.9 Clear all data

Settings → "Delete all local data": removes every `at.*` key and `sessionStorage['at.tabId']`, unregisters the service worker's caches, reloads. The licence is included (the user is warned and shown the key-recovery link — keys are recoverable from the Polar receipt email).

### 2.9a `at.v1.account`, `at.v1.studio` and sessionStorage `at.v1.signin` (Glance, 31 October 2026)

```ts
interface IAccount { v: 1; method: 'google' | 'github' | 'passkey'; name: string; signedInAt: number } // at.v1.account — written once the sign-in session is confirmed
interface IStudio { v: 1; lamp: '' | `#${string}`; glow: number } // at.v1.studio — Face studio (Pro); glow 0–100, step 5, default 70
type TPendingSignIn = 'google' | 'github' | 'passkey' // sessionStorage at.v1.signin — the button pressed, read once on return
```

All three are read defensively (damage reads as signed out or the default look). The account note holds no address: sign-in is Google, GitHub or a passkey, and the server keeps the account (Better Auth on D1) only so Pro can sync. A record from the old email-link sign-in reads as signed out. Sign out, Delete account, or a session the server no longer backs remove `at.v1.account`. `at.v1.studio` is free for everyone. Checkout sends only the plan; a signed-in account id goes to the payment provider as the external customer id. Account → Export my data writes every `at.v1.*` localStorage key except `at.v1.license` to a JSON file.

### 2.9b `at.v1.presets` and `at.v1.history` (the tool)

```ts
interface IPresets { v: 1; items: Array<{ id: string; label: string; icon: 'presentation' | 'chef' | 'reading' | 'coffee' | 'infinity' | 'night' | 'timer'; totalSec: number; face: TFace; chime: boolean; vibe?: TVibe }> } // ≤ 20, saved from the tool; 0 s = no end
interface IHistory { v: 1; items: Array<{ id: string; label: string; icon: string; face: TFace; startedAt: number; endedAt: number; totalSec: number; awakeSec: number; reason: 'completed' | 'user' }> } // ≤ 200, 365 days, sessions of a minute or more
```

Both are read defensively (bad entries are dropped) and live only on this device. Settings → Clear history removes `at.v1.history` only.

### 2.9c `at.v1.journey`, the tool's fields in `at.v1.settings` and the `theme` key

```ts
interface IJourney { v: 1; firstSeen: number; sessions: number; firstDoneAt: number | null; quietUntil: number } // first visit, sessions of a minute or more, the first Time's up, and until when the Pro nudge stays quiet
type TVibe = 'aurora' | 'night' | 'rain' | 'sunset' | 'lava' | 'calm'
type TVibeMotion = 'still' | 'calm' | 'lively'
```

`at.v1.journey` is written by `apps/site/lib/tool/journey.ts`, read defensively and never sent anywhere. It decides two things only: the first-session feedback card (once, at the first Time's up) and the one Pro nudge (10 sessions, 2 presets or a second screen; never on the first day; quiet for 30 days after either answer).

The tool adds these fields to `at.v1.settings`, all additive and read defensively (`apps/site/lib/tool/settings.ts`): `vibe: TVibe` (default `aurora`), `vibeMotion: TVibeMotion` (default `calm`), `ambientOn: boolean` (default `false`: play the ambient mix while awake), `dimAtNight: boolean` (default `false`: a softer glow from 10 PM to 6 AM) and `keepControls: boolean` (default `false`: Settings → Keep controls visible; the top bar and dock stay on screen while awake instead of resting after 5 s). Added 13 November 2026: `autoMini: boolean` (default `true`, read as `autoMini !== false`: Settings → Mini clock when you leave; where the browser allows it, leaving the tab during a session opens the mini clock and returning closes it) and `miniSize: 'compact' | 'expanded'` (default `expanded`: the mini clock's last size, written by `apps/site/lib/surfaces/pip.ts`). The tool writes the record back whole, keeping every field it does not own.

**Focus sound.** The tool's sound panel keeps its levels inside `at.v1.settings.focusSound` (`apps/site/lib/tool/sound-mix.ts`). `focusSound.mix` holds one level from 0 to 1 per layer that is on; a layer at 0 is not written. The layers are `rain`, `cafe`, `fire` and `brown` (the original four, so older saved mixes still load) plus, added 13 November 2026, `ocean`, `stream`, `wind`, `crickets`, `thunder`, `train`, `fan`, `pink`, `white`, `pad`, `keys`, `drone` and `bells`. `focusSound.master` (0 to 1, default 0.8, added the same day) is the master volume. Unknown layer names and out-of-range values are dropped on read; levels are stored in steps of 0.05. An empty mix, when sound was never switched on (`ambientOn` not `true`), reads as the Deep focus scene. All sound is synthesised in the browser; nothing is downloaded. A scene (Deep focus, Rainy café and so on) is only a preset of these levels and is not stored by name.

**The clock dial.** The tool's 12-hour switch is stored in `ambient.clock24h`. The tool reads two things from it: `h12` (`clock24h !== true`) and `clockSet` (`true` once `clock24h` is `true` or `false`). While `clockSet` is false the field is written back as `null` and the clock follows the language: 12-hour in English, Japanese, Chinese and Hindi, 24-hour in German, Spanish, French and Portuguese. Once the person uses the switch the choice is stored and wins in every language. Hindi names four parts of the day on the 12-hour dial (सुबह, दोपहर, शाम, रात). Code: `apps/site/lib/tool/settings.ts`, `apps/site/lib/clock-format.ts`.

`telemetry` in `at.v1.settings` is the person's answer to "Count this visit?". Analytics is opt-in: events are sent only while the stored value is exactly `true`. It is written only by that answer: the "Count this visit?" card, or Settings → Count my visits, which is on only when the stored value is `true`. Saving any other setting never writes a value for it, so a person who has not answered is still asked and is not counted. Either way of answering also records the `analytics` tip in `at.v1.onboarding`, so the card does not ask again.

`theme` (no `at.` prefix) is the theme library's own key: `system`, `light`, `dark` or `oled`. It exists so the page paints in the right theme before any script of ours runs. The tool's Settings writes it and `at.v1.settings.theme` together; the footer switch writes `theme` only.

### 2.10 `at.v1.embed.settings` (embed widget)

The `/embed/cook` iframe's only persistent key (`11-embed-spec.md` §7). It lives in the awaketab.com origin's storage *as partitioned by the embedding site* in current browsers, so one recipe blog's widget never sees another's.

```ts
interface IEmbedSettings {
  v: 1;
  cookTimers: ICookTimer[]; // ≤ 3; same shape as ISession.modeState.cookTimers (§2.2)
}
```

Read defensively (blocked storage, corrupt JSON and bad entries → defaults). The widget's session engine uses an in-memory adapter, so it never writes `at.v1.session`, `at.v1.stats` or any other `at.v1.*` key, and it does not join `BroadcastChannel('awaketab')`. It sends no analytics events: a page shown inside another site's frame never counts (`ANALYTICS.md` §1).

---

## 3. Extension storage

The extension keeps these keys in `chrome.storage.local` (`10-extension-spec.md`):

| Key (`chrome.storage.local`) | Contents | Synced |
|---|---|---|
| `at.v1.settings` | `ISettings`; extension defaults `telemetry: false`, `notifications: false`, `defaultPreset: 'p60'` and `sound.id: 'none'` (the end chime is off until one is chosen in Options: None, Two tones or Bell) | yes |
| `at.v1.ext` | `IExtSettings { v: 1, badge, releaseHidden, autostart: { on, sites: IAutostartSite[] (≤ 50) } }` (Glance, 31 Oct 2026; an older record with `level`, `schedules` or `browserStart` reads as the defaults) — sanitised on every read (synced data is untrusted) | yes |
| `at.v1.session` | `ISession` with `source: 'ext'` and `modeState { level, origin, dismissed? }` | no |
| `at.v1.stats` | `IStats` (the worker counts seconds only while it runs) | no |
| `at.v1.license` | `ILicenseRecord`, `deviceLabel` "AwakeTab for Chrome · {OS}" | **never** |
| `at.v1.device` | `{ v: 1, id }` random UUID per profile (the licence device id) | **never** |

Values are stored as objects, not JSON strings. `chrome.storage.sync` receives only `at.v1.settings` and `at.v1.ext` (debounced 2 s); a fresh profile is seeded from sync, and sync changes from another device are adopted. The test build also writes `chrome.storage.session['at.test.power']` (the recorded `chrome.power` calls); production never does.

---

## 4. Server storage (Cloudflare KV, namespace `LICENSES`)

| Key | Value | TTL / lifecycle |
|---|---|---|
| `lic:{keyHash}` | `{ plan, status: 'active'|'canceled'|'revoked'|'refunded'|'expired', keyEnc, polarOrderId, customerId, polarLicenseKeyId?, polarSubscriptionId?, polarGrantId?, benefitId?, activations: [{ devHash, label, at, polarActivationId? }], limit, exp, createdAt, updatedAt }` | until `exp + 1 y`, then expire |
| `cus:{customerId}` | `string[]` of keyHashes | with the licences |
| `wh:{eventId}` | `{ at }` | 30 days (idempotency) |
| `ord:{orderId}` | `{ plan, amountCents, currency, customerId, at, lks? }` — `lks`: Polar licence-key ids granted by the order. Every field is optional: a benefit grant can create the record before `order.created` | 2 years from the last write (reporting) |
| `lk:{polarLicenseKeyId}` | `{ keyHashes: string[], grantId?, orderId?, subscriptionId?, customerId?, benefitId?, pending?, at }` — the hub joining a Polar licence key to its activated key hashes and Polar ids; `pending` = a status that arrived before any activation | 3 years from the last write |
| `grant:{benefitGrantId}` | Polar licence-key id (plain string) | 3 years from the last write |
| `sub:{subscriptionId}` | `string[]` of Polar licence-key ids | 3 years from the last write |
| `embed:{domain}` | `{ keyHash, attribution: false, theme: { accent, scheme }, expiresAt }` | until `expiresAt + 30 d` |
| `rating:{id}` | `{ stars, text?, locale, ver, at }` | 2 years |
| `feedback:{id}` | `{ rating, topics, text?, device, browser, sessions, version, at }` | 2 years |

`canceled` = the subscription will not renew; tokens keep working until `exp` (docs/09 §2.7). `revoked` and `refunded` are terminal.

**Polar ids.** Polar's order, refund and subscription webhooks carry ids, never the licence key (docs/09 §2.7.1). Activation writes `polarLicenseKeyId` (Polar validate `id`), `benefitId`, `customerId` and, from a checkout, `polarSubscriptionId`; a `benefit_grant.*` webhook adds `polarGrantId`, `polarOrderId` and `polarSubscriptionId` through `lk:`. `polarOrderId` is `''` until known. The index keys hold licence-key ids, not key hashes, because a grant usually arrives before anyone activates; `lk:` is the only place a hash meets Polar's ids. The webhook resolves by raw key, then licence-key id, grant id, subscription id, order id, then the `cus:` fan-out (docs/09 §2.7). The 3-year TTL restarts on every write; a licence whose index has expired is still found through `cus:`, where the ids on `lic:` must match exactly. Records without ids keep working through the key path and the `cus:` fan-out until their next activation fills them in. `activations[].at` is the device's last-seen time (refreshed by `/api/license/validate`); activate evicts a device unseen for 90 days. `wh:{eventId}` is written after the event is handled, so a failed delivery is re-processed on Polar's retry.

`keyHash = sha256(licenceKey)` hex; `devHash = sha256(deviceId)`. The raw key is stored only as `keyEnc` (AES-256-GCM with `LICENSE_KEY_ENC_KEY`) because Polar's deactivate endpoint needs it.

**Rate limiting keeps nothing in KV.** Request limits are Cloudflare Workers Rate Limiting bindings (`RL_EVENTS`, `RL_FEEDBACK`, `RL_LICENSE` under `ratelimits` in `apps/site/wrangler.jsonc`). The key handed to a binding is `{route}:{ipHash}` with `ipHash = sha256(RATE_LIMIT_SALT + ip)`; Cloudflare keeps the count for the 60-second window and nothing else, and the address is never stored. The salt rotates quarterly. Without the binding the count is held in memory, and a limiter that fails lets the request through (`03-architecture.md` §8).

Backups: the weekly GitHub Actions job `kv-backup.yml` exports `lic:*`, `cus:*`, `embed:*`, `ord:*`, `lk:*`, `grant:*`, `sub:*`, `rating:*` and `feedback:*` (values, `expiration`, metadata), encrypted with AES-256-GCM (`BACKUP_ENCRYPTION_KEY`), as a 12-week artifact. Restore with `pnpm kv:restore`; rotate `LICENSE_KEY_ENC_KEY` with `pnpm kv:reencrypt` (`14-devops.md` §6–§7).

---

## 5. Analytics Engine (dataset `awaketab_events`)

Analytics is opt-in. A row is written only for a visitor who pressed Allow on the "Count this visit?" card or turned on "Count my visits" in Settings (`telemetry: true` in `at.v1.settings`, §2.9c). The full description, with what is deliberately not collected and how to read the numbers, is `ANALYTICS.md`; this section is the storage layout.

Written by `POST /api/e`: at most 20 events in a batch, and the body is read only up to 8 KB (413 `too_large` beyond it, whatever `Content-Length` says). No PII by construction: an event whose name is not on the list (`00-conventions.md` §10) is dropped, and only the known fields of an event are copied. The preview site writes to `awaketab_events_preview`.

One row per event. The order is `BLOB_COLUMNS` in `apps/site/lib/server/events.ts`; new columns are added on the end.

| Column | Type | Contents |
|---|---|---|
| `index1` | index | `event` name |
| `blob1` | string | `path` (no query string; locale prefix kept) |
| `blob2` | string | `locale` |
| `blob3` | string | `ua` class sent by a client; the site does not send one, so it is empty for site events |
| `blob4` | string | `source` (`web`, `pwa`, `ext`, `embed`) |
| `blob5` | string | `sid` (a random id kept in memory for one page load; it ties a session's start to its end and is never persisted) |
| `blob6` | string | event attribute 1: `planType` on `session_start`; `reason` on `session_end` and `lock_denied`; `from` on `lock_state`; `plan` on `pro_checkout_click` and `pro_activated`; `action` on `rating_prompt`; `code` on `client_error`; `page` on `ad_slot_loaded`; the embedding hostname on an embed widget's `page_view` |
| `blob7` | string | event attribute 2: `via` on `page_view`; `presetId` on `session_start`; `to` on `lock_state`; `message` on `client_error`; `sku` on `pro_checkout_click`; `sponsorId` on `sponsor_view` and `sponsor_click`; `target` on `share_click` |
| `blob8` | string | `viewport` class (`phone`, `tabletP`, `tabletL`, `desktop`) |
| `blob9` | string | `ver` (site version) |
| `blob10` | string | country, two letters, from Cloudflare (site events only) |
| `blob11` | string | device class: `phone`, `tablet`, `desktop`, `bot`, `other` (site events only) |
| `blob12` | string | browser family, no version (site events only) |
| `blob13` | string | referrer hostname, on the first counted `page_view` of a visit |
| `blob14` | string | `ref` label (`?ref=` or `?utm_source=`), on the first counted `page_view` of a visit |
| `blob15` | string | daily visitor key (site events only) |
| `blob16` | string | face id (`session_start`) |
| `blob17` | string | background id (`session_start`) |
| `double1` | number | the event's number: `lengthMin` on `session_start`, `durationMin` on `session_end`, `stars` on `rating_prompt`, otherwise `addedMin` or `count` |
| `double2` | number | client `ts` minus the server's clock (ms), for sanity checks |

**The daily visitor key** is the first 16 hex characters of `SHA-256(UTC date | RATE_LIMIT_SALT | IP address | User-Agent)`. It counts unique visitors without an identifier in the browser, changes every UTC day, and is written empty when the secret is not set. The address and the User-Agent go into the hash and are stored nowhere (`ANALYTICS.md` §5).

Sampling: none on the client; `client_error` is capped at 5 per page load. Retention: Analytics Engine keeps three months; monthly KPI snapshots are kept with the internal planning records before they age out. The report is `node scripts/metrics.mjs` (`ANALYTICS.md` §7).

Example: sessions started and completed, among visitors who allowed counting (last 7 days):

```sql
SELECT
  sumIf(_sample_interval, index1 = 'session_start') AS starts,
  sumIf(_sample_interval, index1 = 'session_end' AND blob6 = 'completed') AS completed
FROM awaketab_events
WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob4 IN ('web', 'pwa');
```


---

## 6. CSV export (Pro `stats.export`)

Columns: `date,awake_minutes,sessions` (one row per local day, ISO dates; the rows are the union of the `days` and `daySessions` keys), plus a trailer comment `# exported YYYY-MM-DD from AwakeTab vX.Y`. Generated client-side; nothing is uploaded. `sessions` is `daySessions[date]`. It is left empty for a day with no per-day count (days recorded before the per-day counters existed), never filled with a guessed 0. The download is named `awaketab-stats-YYYY-MM-DD.csv`.

---

## 7. Privacy classification (feeds `/privacy`)

| Data | Where | Why | Leaves the device? |
|---|---|---|---|
| Settings, session, stats, onboarding | localStorage / chrome.storage | The product works offline and without an account | No |
| Notes (`at.v1.notes`) | IndexedDB | A notepad that works offline and without an account | No (export and copy are the user's own action) |
| Dictation audio (notes mic) | The browser's speech service while the mic listens (Google in Chrome, Microsoft in Edge, Apple in Safari) | Voice typing; AwakeTab never receives the audio or the text | Yes, by the browser, after an inline notice; not by AwakeTab |
| Licence token + random `deviceId` | localStorage / chrome.storage.local | Prove a Pro purchase; count activations (max 5) | Token only, to `/api/license/*` |
| Anonymous usage events, only after the person allows counting | Analytics Engine, three months | Reliability (does the lock hold?) and product decisions | Yes, and only after Allow — no IP stored, no ids beyond a random `sid` per page load and a visitor key that changes every day; switch in Settings → Count my visits |
| Licence record | KV | Fulfil purchases, handle refunds, stop abuse | Held by us; purchase details are with Polar (merchant of record) |
| Sign-in account (`at.v1.account`, D1 `user`, `account`, `passkey`) | localStorage note; D1 rows for the account | Let Pro sync screens | Google or GitHub share their account id and profile; a passkey shares only its public key. A passkey-only account gets an undeliverable `@passkey.awaketab.invalid` placeholder because the user table needs one; it is never shown or mailed |
| Ratings and feedback | KV | Show a real rating; read what people say | Stars, topics and optional text, sent only when the person presses Send; no identity |
| Ad cookies (content pages only, with consent) | Google / network | Ads fund the free content pages | Governed by the CMP; never on the tool |

`/privacy` states every row: browser storage and the extension in their own sections; the server rows with their retention (events three months, ratings and feedback up to 2 years, the licence record until `exp` + 1 year, §4); `#delete` says how to ask for deletion of the licence record, its device list and the sign-in account, which is done within 7 days; the ad-cookie text from `09-monetization-impl.md` §3.7 applies only once ads are on (gate G1).

---

## 8. Test fixtures

`packages/core/test/fixtures/`: `stats.kolkata-midnight.json` and `stats.kolkata-midnight-sessions.json` (a session crossing 00:00 IST, without and with the per-day session count) and `stats.la-dst.json` (a session across the DST change). Other tests build their records inline.

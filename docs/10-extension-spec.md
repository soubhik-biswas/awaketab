# 10 · Browser extension specification — AwakeTab — Keep your screen awake

Status: v2.0 · 2026-11-13 (the Glance extension as it is in `apps/extension`) · Owner: Soubhik

**Purpose.** A web page can keep a screen awake only while its tab is visible: the browser takes the wake lock back when the tab is hidden. The extension is the honest answer to that limit. It asks Chrome itself, through `chrome.power`, to keep the display awake from a background service worker, so it works in any tab and while other apps are in front, and it never claims more than it does. It follows the Glance brief (`docs/plan/glance/AGENT_PROMPT.md` §9f); where the product differs from it, the reason is in `docs/redesign/DECISIONS.md` under "Extension".

Related docs: `00-conventions.md` (extension tables: identifiers, storage keys, badge colours) · `04-engine-spec.md` (the session layer it reuses) · `08-data-storage.md` · `13-testing-strategy.md`.

---

## 1. Scope and non-goals

**In scope:** Chrome and Edge on desktop, version 116 or later (Chrome Web Store and Edge Add-ons). Keeping the display awake for 15 minutes, 30 minutes, 1 hour or with no end; Pause, Resume and Stop; the time left on the toolbar badge; one keyboard command; auto-wake on sites the user picks; release when the session's tab is hidden; an optional end chime. Everything is free and nothing needs an account.

**Out of scope, and said so on the listing and in the reviewer notes:** Firefox and Safari (no `power` API for extensions; the web app is the alternative); stopping sleep when a laptop lid closes; overriding a locked device or a work or system power policy; keeping Teams, Slack or Zoom "Available" (presence follows input, which the extension never simulates); running while the browser is closed.

---

## 2. Manifest (`wxt.config.ts`)

```json
{
  "manifest_version": 3,
  "name": "AwakeTab — Keep your screen awake",
  "short_name": "AwakeTab",
  "description": "Keep your screen on with one click. A calm clock shows the time left. 46 faces, all free — no account, no tracking.",
  "default_locale": "en",
  "version": "1.0.1",
  "minimum_chrome_version": "116",
  "permissions": ["power", "alarms", "storage", "offscreen", "activeTab"],
  "optional_host_permissions": ["https://*/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "AwakeTab",
    "default_icon": { "16": "icons/extension-16.png", "32": "icons/extension-32.png" }
  },
  "options_page": "options.html",
  "background": { "service_worker": "background.js", "type": "module" },
  "commands": { "toggle": { "suggested_key": { "default": "Alt+Shift+A" }, "description": "Start or stop keeping the screen awake" } },
  "icons": { "16": "icons/extension-16.png", "32": "icons/extension-32.png", "48": "icons/extension-48.png", "128": "icons/extension-128.png" }
}
```

- The name, description and command text are `__MSG_ext_name__`, `__MSG_ext_description__` and `__MSG_ext_command_toggle__`; the block shows their English text. The name stays in English in every locale, because it is a product name. The short name is "AwakeTab". On the website and in running text the product is "AwakeTab for Chrome".
- The version comes from `apps/extension/package.json`, the minimum Chrome version from `apps/extension/data/support-matrix.json` (`extension.minimumChromeVersion`).
- Permissions are exactly these five. `power` keeps the display awake; `alarms` ends the session on time and refreshes the badge; `storage` keeps settings and the session; `offscreen` plays the end chime; `activeTab` lets "Add this site" read the site the user was on. Site access is optional and asked for one site at a time, only for sites added to auto-wake; the prompt names the site and page content is never read.
- No content scripts, no `externally_connectable`, no remote code, the default Manifest V3 content security policy.
- The icons are the design's exported files in `public/icons/`, used unchanged.

---

## 3. Views, pill and badge

The popup, the pill and the toolbar badge say one of four things (`TExtView`, from `viewOf(lock, session)` in `src/status.ts`):

| View | When | Pill (`ext.pill.*`) | Badge |
|---|---|---|---|
| `ready` | no live session | "Ready" (hollow dot) | none |
| `awake` | the keep-awake is held and the session is active | "Awake · 38 min", or "Awake · no end" | minutes left on volt `#3DF58E` with ink `#04140A`: `38`, `2h` from 100 minutes, `∞` with no end, `ON` when the badge timer is off |
| `paused` | the session is paused | "Paused · 57 min left", "Paused" with no end, or "Paused · tab hidden" when release-when-hidden paused it | `II` on amber `#FFC53D` with ink `#1A1200` |
| `blocked` | Chrome refused the request, or has no `power` API | "Blocked", or "Not supported" | `!` on red `#FF6B81` with ink `#1A0509` |

Status is always words and shape as well as colour. The toolbar tooltip is `AwakeTab — {pill}`. `chrome.power` gives no battery-saver signal, so the blocked pill names no cause.

The lock itself keeps the seven states of `00-conventions.md` §5.1: `src/power.ts` wraps `chrome.power` as the wake-lock handle the session engine expects (`requestKeepAwake('display')` → `held`; a missing API → `unsupported`; a request that throws → `denied`). There is no video fallback and no system-only level.

---

## 4. Background service worker (`entrypoints/background.ts`, `src/controller.ts`)

- **Session.** `createSession()` from `@awaketab/core` with `channel: null`, `source: 'ext'` and `resumeIndefiniteMs: Infinity`, because the worker restarts many times during one session. `ISession.modeState` carries `{ origin, tabId?, windowId?, hidden? }`; the origin is `user`, `command` or `autostart`. Every event handler runs one at a time through a promise queue, so a popup click, an alarm and a tab event cannot interleave.
- **Keep-awake.** `chrome.power.requestKeepAwake('display')` on start and resume, `releaseKeepAwake()` on stop, pause and end. The request is re-issued on `onStartup`, `onInstalled` and every tick while a session is active. With no live session the worker releases defensively on start.
- **Alarms.** `at.tick` every half minute while a session runs (none while paused), `at.end` at the session's end so it completes on time even if the worker slept, and `at.license` every hour (see Licence below). Alarms an older build set for schedules (`at.sched.*`) are cleared on start.
- **Restarts.** A live session is resumed; a timed session whose end passed while the worker slept is finished as completed; a paused session stays in storage, out of the engine, until Resume, which folds the pause into the end time first.
- **Starting.** The popup sends `start { presetId, tab? }`; the worker remembers the length as `settings.defaultPreset`, so the popup opens on the length used last. Starting while a session runs replaces its plan with one lock. With no `power` API nothing is started and the view is `blocked`.
- **Command.** `Alt+Shift+A` (`toggle`) stops an active session, resumes a paused one, and otherwise starts the last length. Chrome's shortcut settings can change the keys.
- **Auto-wake.** With the switch on, a tab that finishes loading on a chosen site starts a session with origin `autostart` if nothing is live: no end, or the site's own length. When no tab on a chosen site is left open, that session stops. Without site access Chrome withholds `tab.url`, so other tabs' events are dropped before any work. Site names are never sent anywhere.
- **Release when hidden.** The session belongs to the tab it was started from. With the option on, another tab in front in that window, or a minimised window, pauses it with `hidden: true` ("Paused · tab hidden"); coming back resumes it; closing that tab stops it. The option is off by default, so the extension works in any tab.
- **End chime.** When a timed session completes and a chime is chosen, the worker opens `offscreen.html?kind=two|bell&volume=<0–1>` (reason `AUDIO_PLAYBACK`), which plays two synthesised tones or a bell, and closes it after 3 seconds. `settings.sound.id` `none` is silent, and it is the default: a new install makes no sound.
- **Licence.** Everything is free and nothing reads a licence. If an earlier build stored one, it is checked against `https://awaketab.com/api/license/validate` about once a day and dropped when revoked. With none stored, the extension makes no network request at all.

Messages from the pages (`TExtRequest`): `state` · `start` · `stop` · `pause` · `resume` · `toggle`. Only the extension's own pages are answered.

---

## 5. Popup (`entrypoints/popup/`, 360 wide)

Top to bottom:

1. **Header:** the mark, the "AwakeTab" wordmark and the status pill (`role="status"`, `aria-live="polite"`).
2. **Face:** the website's own `Face` component at 220 px, bare, over a soft glow in the view's colour. It draws the face in `settings.face`, Ring unless another is stored. The words on the face and its clock follow the popup's language: 12-hour with AM/PM in English, a 24-hour dial in German, Spanish, French and Portuguese, and the day words of Japanese, Chinese and Hindi (`clockTime()` and `dialOf()` in `src/i18n.ts`, `ext.face.*`).
3. **Lengths:** four chips, 15m · 30m · 1h · ∞, with a sliding thumb; 1h is the default. Each chip's hit area is the full 48 px row. While awake, or blocked, picking a chip starts with that length.
4. **Primary action:** "Keep this tab awake" when ready; "Pause" while awake; "Resume" with a round Stop button beside it while paused; "See the fix" in red when blocked, which opens `https://awaketab.com/help?source=ext`.
5. **Footer:** "Works in any tab" and "Open full app ↗" (`https://awaketab.com/?source=ext`).

If the worker does not answer, a line says "AwakeTab didn’t answer. Close this popup and open it again." The popup follows `settings.theme`; Auto follows the system setting live.

---

## 6. Options page (`entrypoints/options/`)

One card, "AwakeTab extension · Options" (also the tab's title), with:

- **Show time left on the icon** ("The badge counts down in minutes"), on by default. Off, the awake badge reads `ON`.
- **Wake automatically on chosen sites** ("Starts when one of the sites below opens"), on by default.
- **Release when the tab is hidden** ("Saves battery; resumes when you come back"), off by default.
- **Chime when time is up** ("Plays once when a timed session ends"): None, Two tones or Bell. None is the default.
- **Always keep these sites awake:** a chip per site (pressing it removes the site and its permission) and "+ Add this site". `activeTab` shows a site only after a toolbar click, so the page reads the most recent https tab Chrome lets it see and asks for that one origin; with none it says "Click the AwakeTab icon while you are on the site, then add it here.", and a refusal says so.

The three switches are real switches (`role="switch"`), the chime is a radio group, and every target is at least 44 px.

---

## 7. Storage and sync

All in `chrome.storage.local`, under the keys of `00-conventions.md`:

| Key | What |
|---|---|
| `at.v1.settings` | The shared `ISettings`, with the extension's defaults: telemetry and notifications off, `defaultPreset` `p60`, `sound.id` `none` |
| `at.v1.ext` | `IExtSettings { v: 1, badge, releaseHidden, autostart: { on, sites[] } }`; a site is `{ host, durationMin }`, at most 50. Records from older builds read as the defaults |
| `at.v1.session`, `at.v1.stats`, `at.v1.meta` | The session engine's records |
| `at.v1.device` | `{ v: 1, id }`, a random id per browser profile |
| `at.v1.license` | Only if an earlier build stored one |

`at.v1.settings` and `at.v1.ext` are mirrored to `chrome.storage.sync` two seconds after a change, and a fresh profile is seeded from it. The licence, the device id, the session and the totals never sync. The engine's once-a-second session writes are batched to one every 10 seconds when only the awake time moved.

---

## 8. Languages, type and tokens

- **Strings.** `apps/extension/locales/<locale>.json` is the only catalog: `ext.*` keys, the same keys and placeholders in all eight locales (en, es, pt-br, de, fr, ja, zh, hi). `scripts/i18n.mjs` gives each page its catalog on demand, gives the worker the `ext.pill.*` keys for the tooltip, and writes `_locales/{en,es,pt_BR,de,fr,ja,zh_CN,hi}/messages.json` for the manifest. The language is `settings.locale`, else the browser's. No user-facing text is written in the source.
- **Fonts.** Inter and Bricolage Grotesque (variable, through Fontsource), IBM Plex Serif 300 for the faces that draw with it, Geist Mono and Archivo from `public/fonts` with their OFL licences. No page requests a font server.
- **Tokens.** `src/styles/tokens.css` holds the Glance `--at-*` colours for dark (the default), light and OLED, the type roles, radii and spacing; `data-theme` is set from `settings.theme`. The stylesheets take every colour, radius, gap and type role from a token; `pnpm lint` runs stylelint over them.
- **Motion.** The chip thumb glides for 350 ms and the options card arrives in 420 ms, both ease-out; `prefers-reduced-motion` stops all of it.

---

## 9. Store listing

The listing text is `apps/extension/store/listing.md`: the listing copy of the design (`docs/plan/glance/LISTING_COPY.md`), changed only where the first release differs from it (the popup's four lengths, written as "15 min, 30 min, 1 hour or no end"; the eight languages; the real help and privacy addresses; and no paid plan wording while Pro is switched off).

**Title:** AwakeTab — Keep your screen awake (33 of 75 characters; Chrome Web Store and Edge Add-ons both show the manifest name) · **Summary (115 of 132):** Keep your screen on with one click. A calm clock shows the time left. 46 faces, all free — no account, no tracking. (`ext.description`; each translation carries the same claim within 132 characters) · **Category:** Productivity → Tools · **Languages:** the eight in the package.

**Screenshots (1280×800), promo tiles and icons:** the design's exported files, used unchanged. They live only in `apps/extension/store/glance/chrome-web-store/`: `cws-01.png` … `cws-05.png` in that order, `promo-small-440x280.png`, `promo-marquee-1400x560.png`, `icon-128.png` and `edge-logo-300.png`. Nothing in the package renders them.

**Permission justifications:** one line each for `power`, `alarms`, `storage`, `offscreen`, `activeTab` and the optional site access, in `listing.md`.

**Privacy policy URL:** `https://awaketab.com/privacy#extension`. **Help:** `https://awaketab.com/help`. **Single purpose statement:** "Keeps the computer's display awake for a length of time the user chooses, and shows how much time is left." Data disclosure: nothing is collected by default; the extension has no usage statistics. The facts behind the privacy form are in `apps/extension/store/privacy-disclosures.md`, the reviewer's walk-through in `reviewer-instructions.md`, and the release steps in `PUBLISHING.md`.

Edge Add-ons: the same package and listing, submitted separately.

---

## 10. Compliance

- No remote code, no `eval`, no analytics, no ads.
- No synthetic input, no idle-detection tricks, no "appear online" claim anywhere in the listing or the UI.
- Accessibility: the popup and options work by keyboard alone; the pill is a live region; contrast is AA in dark, light and OLED; focus rings are sky, 2 px, 3 px offset.
- Versioning: semver, from `apps/extension/package.json`.

---

## 11. Build, package and tests

- `pnpm -F extension dev` · `pnpm -F extension build` · `pnpm -F extension zip` (a deterministic zip, `.output/awaketab-chrome-<version>.zip`: sorted entries, fixed timestamps and modes) · `pnpm -F extension zip:check` (builds twice and compares hashes) · `pnpm -F extension publish:package` (the release package, `store/PUBLISHING.md`).
- The build compiles `@awaketab/core`, `@awaketab/wake` and the site's `Face` from source; `next/font/google` is aliased to `src/next-font.ts`, because the faces' fonts are bundled here.
- Unit tests (`apps/extension/test/unit`, run by `pnpm test`): the controller against a fake `chrome` (`fake-chrome.ts`), settings, the site matcher, the badge and pill, the catalogs, the manifest, tokens and fonts.
- Browser tests (`pnpm test:e2e:ext`): the built extension in Chromium. `AT_EXT_TEST=1` builds into `.output-test/` with `chrome.power` replaced by a recorder (`src/test-hooks.ts`, log in `chrome.storage.session['at.test.power']`; `at.test.deny` makes requests throw like a policy block). The release build contains none of it.
- These tests show the browser API calls and the pages; they do not show that a real display stayed lit. Before a submission, check that by hand on a target machine, with the end chime and the shortcut (`store/PUBLISHING.md`).

---

## 12. Open items

- A Firefox version that opens the web app in a pinned tab: decide after launch, from requests.
- Stopping on low battery: a service worker cannot read the battery level, so the extension offers no such option.

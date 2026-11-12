# 05 · Front-end specification — tokens, the tool, PWA, mini clock

Status: v2.0 · 2026-11-13 · Owner: Soubhik

**Purpose.** What a developer needs to build and change the AwakeTab web front end: the design tokens, the tool (structure, state, components, copy), layout and sizing, the session-state × UI matrix, keyboard and accessibility rules, the PWA and mini clock, URL parameters, theming, error states and the performance rules. The site is Next.js 16 (App Router) with Tailwind CSS 4 and shadcn/ui in `apps/site`, deployed as a Cloudflare Worker. Identifiers (states, keys, routes, shortcuts) are used exactly as defined in `00-conventions.md`.

**Sources.** The design is "Glance": `docs/plan/glance/AGENT_PROMPT.md` (the brief; it wins over this file where they disagree), `docs/plan/glance/reference-tokens.css`, `DESIGN.md` and `docs/redesign/DECISIONS.md` (the decisions where the product differs from the brief, each with its reason). The design boards and prototypes the brief names are not kept in this repository; the code is the reference for exact values.

**Related docs.** `00-conventions.md` (identifiers) · `04-engine-spec.md` (lock state machine, `@awaketab/wake`, `@awaketab/core`) · `06-content-seo-spec.md` (pages around the tool) · `07-i18n.md` (languages, formatting) · `08-data-storage.md` (storage schemas) · `09-monetization-impl.md` (Pro).

---

## 1. Design tokens

Tokens are CSS custom properties in `apps/site/app/globals.css`, on shadcn/ui names, exposed to Tailwind through `@theme inline`. The theme is a class on `<html>`: none or `light`, `dark`, `oled` (§11). The tool also keeps its own palette, `--tg-*` in `apps/site/components/tool/glance.css`, for the three themes; clock faces draw with the face palette in `apps/site/components/face/model.ts`, not page tokens.

### 1.1 Colour

Each colour has one job.

| Role | Token | Light | Dark | OLED |
|---|---|---|---|---|
| Page | `--background` | `#F4F4F9` | `#05060A` | `#000000` |
| Surface | `--card`, `--popover` | `#FFFFFF` | `#0E1016` | `#05060A` |
| Surface 2 | `--secondary`, `--muted` | `#ECECF4` | `#15171E` | `#0E1016` |
| Surface 3 | `--surface-3` | `#E3E3EE` | `#1C1F29` | `#15171E` |
| Line | `--border` | `rgba(11,16,32,.09)` | `rgba(255,255,255,.09)` | same as dark |
| Strong line | `--border-hi` | `rgba(11,16,32,.18)` | `rgba(255,255,255,.18)` | same as dark |
| Text | `--foreground` | `#0B1020` | `#F2F4FA` | same as dark |
| Text 2 | `--muted-foreground-strong` | `#4B5165` | `#A6AFC2` | same as dark |
| Text 3 (meta) | `--muted-foreground` | `#5C6275` | `#99A1B5` | same as dark |
| Green (`volt`): awake, live only | `--lamp` | `#117A3B` | `#3DF58E` | same as dark |
| Violet: the button, act | `--primary` (text on it `--primary-foreground`) | `#6633F5` (`#FFFFFF`) | `#9F7BFF` (`#0B0718`) | same as dark |
| Amber: paused, needs a tap | `--warning` | `#8A5A00` | `#FFC53D` | same as dark |
| Red: blocked, danger | `--destructive` | `#C21D3E` | `#FF6B81` | same as dark |
| Sky: focus ring, info | `--info`, `--ring` | `#1C64B8` | `#7CBBFF` | same as dark |
| Panel | `--panel` (shadow `--shadow-panel`) | `rgba(255,255,255,.9)` | `rgba(13,16,30,.86)` | `rgba(6,7,12,.94)` |
| Glass fill | `--glass` | `#FFFFFF` | `rgba(255,255,255,.04)` | `rgba(255,255,255,.035)` |
| Grid lines | `--grid` | `rgba(11,16,32,.05)` | `rgba(255,255,255,.05)` | `rgba(255,255,255,.03)` |
| Living-background strength | `--vibe-opacity` | `1` | `1` | `0.3` |

Glass is the fill plus a 1 px line and `backdrop-filter: blur(20px) saturate(1.4)`. Soft fills (`--primary-soft`, `--accent`, `--warning-soft`, `--destructive-soft`, `--info-soft`, `--ended-soft`), hover and press ramps and the elevation shadows (`--shadow-e1/e2/e3`, drawn with the line colours above) sit beside these in `globals.css`. Every text pair is at least 4.5:1 and every border, icon and face fill at least 3:1.

OLED is a real theme, not an alias of dark: a pure black page, the living background at 30 %, and faces in their OLED drawing.

### 1.2 Type

Loaded with `next/font/google` in `apps/site/app/fonts.ts`.

| Use | Family | Spec |
|---|---|---|
| Display: headlines, panel and card titles, the wordmark | Bricolage Grotesque 700 | tool headline 64 / .98 / −4 % (tablet 52–60, phone 36); panel titles 30 (phone 26); card titles 24 |
| One accent word per headline, Latin scripts only | Instrument Serif italic 400 | 1.08em, with the volt → mint → violet gradient; other scripts keep the gradient only |
| All UI text and clock digits | Inter | body 15–17; digits Inter Light with `'tnum' 1, 'cv11' 1` |
| Eyebrows, labels, keys, counts | Geist Mono | 12–13, uppercase, wide tracking |
| Japanese, Chinese | The device's own fonts after Inter (Hiragino Sans, Yu Gothic, Meiryo; PingFang SC, Microsoft YaHei; Noto Sans where installed), set per `:lang()` in `globals.css` | no web font is downloaded |
| Hindi | Noto Sans Devanagari 400 and 700 after Inter, through `next/font/google` in the locale layout | loaded without preload |

Faces keep their own character type: Archivo (`app/fonts.ts`, not preloaded) and IBM Plex Serif (`components/face/fonts.ts`, loaded only with the faces that draw with it). Nothing renders under 12 px, and weights stop at 700 outside the faces.

### 1.3 Spacing, radii, targets

A 4 px grid (4, 8, 12, 16, 20, 24, 32, 48). Radii: 12 (controls, chips), 18 (rows, dock, tiles), 24–28 (panels, cards), full (pills, the primary button); `--radius-control`, `--radius-row`, `--radius-panel`. Every target is at least 44 px. The focus ring is 2 px `--ring` with a 3 px offset.

### 1.4 Motion

| Name | Spec |
|---|---|
| arrive | 420 ms `cubic-bezier(.16,1,.3,1)`, fade plus a 14 px rise (`--duration-arrive`, `--ease-out`, `animate-rise`) |
| drawer | 360 ms slide (`--duration-drawer`) |
| segmented thumb | 350 ms (`--duration-thumb`) |
| face size change | 500 ms |
| controls rest | after 5 s idle while awake, 450 ms fade; never while "Keep controls visible" is on |
| shine sweep · border beam | 3.6 s · 5–6 s |
| living backgrounds | 16–22 s drifts; orbit rings 240 s and 360 s |
| live dot pulse | 2 s |

Everything above stops under `prefers-reduced-motion`; living backgrounds and the orbit also stop on Still and when the battery is low and unplugged.

### 1.5 shadcn/ui names

Components in `apps/site/components/ui` read the shadcn names directly (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, the `--sidebar-*` set), so they follow the theme with no second mapping. The `dark:` variant matches both `.dark` and `.oled`.

---

## 2. The tool — structure and state

The home page `/` is the tool: one screen-high frame, then the story. Code: `apps/site/components/tool` (UI), `apps/site/lib/tool` (state and helpers), `apps/site/lib/wake.ts` (the wake controller), `apps/site/components/face` (the 46 faces).

- **Session.** A typed reducer (`lib/tool/session.ts`) with the nine session states of `00-conventions.md` §5.1. `lib/wake.ts` owns the side effects: asking for the lock, the video fallback, the one-second tick, persistence in `at.v1.session`, statistics and other tabs. UI state is derived from the browser's answers, never from the tap.
- **Frame.** `Tool` measures its own box and lays out to one of four tiers by width (§4). Until it has measured, on the server and in the first paint, it renders Set mode at rest as plain markup (`components/tool/shell.tsx`): the headline `<h1>`, the start button and the skip link's target are in the HTML.
- **Stores.** Settings (`at.v1.settings`), presets, history and journey are small localStorage stores read defensively (`lib/tool/store.ts`); panel state is in memory (`lib/tool/ui.ts`).
- **Copy.** Every string comes from `apps/site/messages/<locale>.json`: `tool.glance.*` for the tool, `face.name.*` for face names and `face.t.*` for the words inside a face, in all eight languages.

---

## 3. Components

### 3.1 Face

`<Face face theme state remain total nowSec size … />` draws any of the 46 faces on a 360 × 315 artboard scaled with one transform. The face does not clip to its box: a glow, a hand or a halo that reaches past the artboard is drawn whole. A reading of ten hours or more is eight characters, so it takes a smaller numeral size and stays inside its dial or card. `lblTop`, `lblEnd` and `lblCap` replace the words inside and under the face with translated ones; `needs` marks a session that needs a tap, which is drawn like paused (amber) but never called paused. Motion runs only while awake and stops under reduced motion. Details: `00-conventions.md` §13.31.

### 3.2 StatusPill

`components/tool/status-pill.tsx`. One line of words, a glyph and the state colour; the words, colours and glyphs are the table in `00-conventions.md` §5.1 and are a contract. The pill sits in the top bar on desktop and tablet landscape and above the face on phone and tablet portrait. It is a focus stop with its live region off, because the tool's announcer speaks each change. It reflects the session state within one frame and never says "Awake" from a click.

### 3.3 Length control and the start button

Set mode only. A radio group of five lengths with one sliding thumb: 15 min, 30 min, 1 hour (default), 2 hours, No end; on phone 15m, 30m, 1h, 2h, ∞. The start button reads "Keep awake · 1 h" ("Starting…" with a spinner while the browser is asked) and the note under it "Ends at 12:23 PM · no install, no account", with "tomorrow" when the end is past midnight.

### 3.4 Dock

Glance mode. The same slots in every state: add time (+5 min, +15 min, +1 hour; when ended +15 min, +30 min, +1 hour) · primary (Pause while running, Resume while paused or when a tap is needed, Start again when ended, "See the fix" in red when blocked, "Use video" when unsupported) · Stop (hidden once ended) · Face · Fullscreen (the real Fullscreen API; not offered where the browser has none). On phone it folds into two rows.

### 3.5 Banner

Under the top bar, only when true: blocked (red, "See the fix"), unsupported (sky, "Use video"), fallback (sky, no button), needs a tap (amber, "Resume"), another tab holds the lock ("Take over"), offline, and a new version ("Reload"; shown when a newer service worker has installed or taken over while an older one was serving the tab).

### 3.6 Toast

Sonner, centred above the dock. After adding time: "15 minutes added · now until 12:41 PM" with Undo.

### 3.7 Panels

A right drawer (460 / 440 px, inset 16, radius 28) on desktop and tablet landscape; a bottom sheet on phone and tablet portrait that fits its content. Every panel has a sticky header and, where there is a main action, a pinned footer. Panels: Faces (full screen), Recents, Settings, Vibe, Help & fixes, Face studio, Feedback, Share, Ambient sound, Clear history, Language and the Pro panels.

- **Settings** groups: Appearance (four theme cards: System, Light, Dark, OLED; "Keep controls visible": the top bar and dock stay on screen while awake, stored as `keepControls`, off by default) · Clock (12-hour clock; Show seconds, in the tab title; Dim at night, a softer glow from 10 PM to 6 AM) · Sound (Chime at the end: Two notes, Bell or Off; Ambient mixer; Face studio) · More · Privacy ("Count my visits": the same answer as the "Count this visit?" card, on only after a yes) · Account and Pro when Pro is enabled · Send feedback.
- **The 12-hour switch.** Every language follows it. Until the person touches it (`clockSet` is false, stored as `ambient.clock24h: null`), the clock follows the language: 12-hour in English, Japanese, Chinese and Hindi, 24-hour in German, Spanish, French and Portuguese (`apps/site/lib/clock-format.ts`). Once chosen, the choice wins in every language. On the 12-hour dial Japanese writes 午前 / 午後, Chinese 上午 / 下午, and Hindi names four parts of the day: सुबह from 4:00, दोपहर from 12:00, शाम from 16:00 and रात from 20:00.
- **Help & fixes** shows the real reason, when it was checked and numbered steps only while the session is blocked. With the lock held, or nothing asked yet, it says nothing is wrong; a session that needs a tap or a browser with no wake lock gets one plain line and one button.

### 3.8 Command palette

`⌘K` / `Ctrl K`, cmdk. Session commands for the current state, then Go to: Faces, Recents, Settings, Vibe, Get the browser extension, Send feedback, Help & fixes, Ambient sound, Share this setup, Language, the mini clock. Each command shows its key when it has one.

---

## 4. Layout and sizing

Tiers by the tool's own width: phone < 700 · tablet portrait 700–1099 · tablet landscape 1100–1299 · desktop ≥ 1300.

| | Desktop | Tablet landscape | Tablet portrait | Phone |
|---|---|---|---|---|
| Face, Set mode | 380 | 340 | 480 | 296 |
| Face, Glance mode | 560 | 470 | 640 | 340 |
| Top bar | 76 | 76 | 76 | 64 |

These are the largest sizes. The stage (`stageFit` in `components/tool/stage.tsx`) sizes the face from the room it really has, the smaller of the width and the height left between the top bar and the dock after the stacked parts, so the face, its halo and the orbit ring stay inside the window at any shape: a short, wide desktop window, a phone on its side, a tablet. On desktop and tablet landscape the orbit is kept clear of the dial (the face is at most the orbit's room ÷ 1.25); the orbit itself is 1.8 × the face (1.5 × on phone and tablet portrait) and never wider or taller than the window. When the controls rest after 5 s (they never rest while "Keep controls visible" is on), the stage takes the whole frame bar the hint and the face grows toward 62 % of the width, within the same limits. The frame is `100dvh` on its own and the home page gives it one small-viewport height, so mobile browser bars never cover it.

Starting a session sends the headline and the length control out while the face grows in place; nothing jumps.

---

## 5. Keyboard map and focus

The keys are those of `00-conventions.md` §5.3.

| Key | Action |
|---|---|
| `Space` | Start, pause or resume (on the stage or the pill; on a button it presses the button) |
| `Enter` | Start, in Set mode |
| `←` `→` | Shorter or longer length, in Set mode |
| `+` `−` | Add or take off 5 minutes |
| `F` · `V` · `R` · `,` | Faces · Vibe · Recents · Settings |
| `Shift+F` | Fullscreen, where the browser has it |
| `⌘K` / `Ctrl K` | Command palette, from anywhere on the page |
| `?` | Command palette |
| `Esc` | Close the open panel |

Single keys act only with focus inside the tool, no panel open and nothing being typed. Focus order: skip link, status pill, length, Keep awake, then Vibe, Faces, Recents, Settings and Search. Dialogs trap focus and return it on close. While the controls rest they are `inert`; focus that was on one moves to the stage, so the keys keep working.

---

## 6. State → UI matrix

| Session state | Pill | Face | Dock primary | Banner | Tab title |
|---|---|---|---|---|---|
| `idle` | Not keeping awake | idle, the chosen length | (Set mode: Keep awake) | none | the page title |
| `starting` | Asking the browser… | starting | (Set mode: Starting…) | none | the page title |
| `running` | Awake · until {time} | running, counting down | Pause | none | "59:12 left · AwakeTab" |
| `fallback` | Awake via video · until {time} | the fallback drawing, counting down | Pause | sky, no button | as running |
| `paused` | Paused · {dur} left | paused, frozen | Resume | none | "Paused · AwakeTab" |
| `needsyou` | Tap to resume · tab was hidden | amber, "not awake", still counting down | Resume | amber, Resume | "Not awake · AwakeTab" |
| `blocked` | Not awake · {reason} | blocked | See the fix | red, See the fix | "Not awake · AwakeTab" |
| `unsupported` | No wake lock in this browser | unsupported | Use video | sky, Use video | the page title |
| `ended` | Time’s up · it slept at {time} | time's up | Start again | none | "Time’s up · AwakeTab" |

With no end, running reads "Awake · until you stop" and the face counts up; paused reads "Paused · no end". The countdown freezes only in `paused`. In `needsyou` it runs on to the same end time, and the session ends normally if that time passes while the tab is hidden. After a reload a running session comes back as `needsyou` and asks for the lock again by itself; it shows `running` again with no tap where the browser allows it. History's "This session" row shows "Awake" while awake and the time elapsed otherwise.

---

## 7. Accessibility (WCAG 2.2 AA)

- Text pairs at least 4.5:1, borders and icons 3:1; targets at least 44 px; visible focus ring (§1.3); text at least 12 px.
- Status is always words, a glyph of its own shape and a colour, never colour alone.
- `aria-live="polite"` announces session changes; a refusal is announced assertively.
- Single-key shortcuts follow §5, so they never fire while typing or outside the tool.
- `prefers-reduced-motion` stops every decorative loop; digits still tick.
- Forced colours: buttons keep an outline, the selected item is marked with the system highlight and the switch draws with system colours (`glance.css`).
- Times are full 12-hour in English ("11:42 AM"). German, Spanish, French and Portuguese show a 24-hour clock until the person turns on the 12-hour switch; Japanese, Chinese and Hindi use their own day words (§3.7). Dates are written in full.
- Without JavaScript the home page still shows the headline and a line saying the tool needs it.

---

## 8. PWA

`apps/site/app/manifest.ts` builds the web manifest (start `/?source=pwa`, shortcuts that open the tool with a preset and `autostart=1`). The service worker is `apps/site/worker/sw.ts`, registered in production only; it serves the offline page for an uncached navigation and keeps the home-screen widgets up to date. The tool keeps working offline: the timer runs and the banner says so.

---

## 9. Mini clock

Document Picture-in-Picture where the browser has it, a `/pip` popup otherwise (`apps/site/components/pip`). About 236 × 196, glass, with a status line and the face; it holds its own wake lock while its window is open and closes when the session ends or stops. It reads the session through `apps/site/lib/surfaces/session.ts`, which follows the same state rules as the tool (§6).

---

## 10. URL parameters

Read once on arrival by `readToolQuery` (`apps/site/lib/tool/share.ts`), then taken off the address with `history.replaceState`, so a reload or a copied link never applies them again. A session restored after a reload keeps its own length and end time whatever the address says.

| Param | Effect | Validation |
|---|---|---|
| `preset=` | Sets the length | `p15` · `p30` · `p45` · `p60` · `p120` · `p240` · `pinf`, or `custom` with `minutes=` |
| `minutes=` | The length for `preset=custom` | a whole number, 1–10080 |
| `autostart=` | `1` starts straight away; `0` or absent opens Set mode | exactly `1` or `0` |
| `until=HH-MM` | Starts a session that ends at that local time (tomorrow if it has passed) | `^\d{2}-\d{2}$` |
| `face=` | Chooses the face | one of the 46 ids |
| `vibe=` | Chooses the living background | `aurora` · `night` · `rain` · `sunset` · `lava` · `calm` |
| `chime=` | End chime on or off | `on` · `off` |
| `open=` | Opens a panel | `feedback` · `settings` · `faces` · `vibes` · `recents` · `language` · `pro` |

Routes: `/15m` → `p15`, `/30m` → `p30`, `/45m` → `p45`, `/1h` → `p60`, `/2h` → `p120`, `/4h` → `p240`, `/8h` → `preset=custom&minutes=480`; `/until/HH-MM` → `until=HH-MM`; `/s/{face}-{minutes}-{chime|quiet}` → `preset`, `face`, `chime` and `autostart=1` (or `autostart=0` for "Change it first"). Invalid values are ignored.

---

## 11. Theme

`next-themes` with the class strategy: `light`, `dark`, `oled`, or the system setting, followed live. The tool's Settings offers the four as cards and stores the choice in both the library's `theme` key and `at.v1.settings.theme`; the footer offers System, Light and Dark. The footer itself is always dark (graphite), whatever the page theme. Theme changes are instant (no transition).

---

## 12. Error and empty states

- A refused lock: the red pill, the banner and Help & fixes, with the real reason (insecure page, page policy, a low unplugged battery, or "the browser said no").
- No Wake Lock API: the sky banner offers the silent video.
- Storage blocked (private windows): settings last for the visit; nothing fails.
- No presets: an illustrated "No presets yet" with one action. No history: the section is empty under its note.
- Feedback that does not send says so inline and keeps the text.

---

## 13. Performance rules

- Budgets are in `00-conventions.md` §11.
- Every page is prerendered and served from the build's copy in the Worker's static assets (`apps/site/open-next.config.ts`). The first paint of `/` is that markup (§2); the working tool replaces it in the same box, so nothing shifts.
- Ring ships with the page; every other face is its own chunk, loaded the first time it is drawn. The sign-in client loads after the first paint. The week chart in Recents is plain SVG, with no chart library.
- One timer tick per second, aligned to the wall clock; no polling elsewhere.

---

## 14. Acceptance criteria (selection)

- One tap starts a session; the pill reads "Awake" only after the browser confirms the lock.
- Hiding the tab and coming back returns to "Awake · until …" with no tap where the browser allows it, and the time left never freezes or jumps.
- A reload keeps the running session, whatever the address said when it started.
- Every state in §6 shows its own words, glyph and colour in all eight languages.
- The face, its halo and the orbit fit inside the window at 1440 × 900, 1900 × 1060, 1194 × 834, 834 × 1194 and 390 × 844, with and without the controls.

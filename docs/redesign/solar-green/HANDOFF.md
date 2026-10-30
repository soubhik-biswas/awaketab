# AwakeTab — design handoff

**Direction:** Solar Green · **Version:** final design, 30 October 2026 · **Status:** ready to build. The values in `[BRACKETS]` are placeholders, listed in §12.

AwakeTab keeps a screen awake from the browser, shows exactly when it will sleep again, and then lets it sleep. This document is the build spec; `README.md` is the build brief.

---

## 1. What's in this folder

| Path | What it is |
|---|---|
| `README.md` | Start here: the build brief, the order to build in, and what "done" means. |
| `docs/HANDOFF.md` | This spec. |
| `docs/tokens.css` | `app/globals.css`, ready to paste: shadcn/ui variables, Tailwind 4 `@theme`, face colours. |
| `prototype/` | The live design files plus their runtime (`support.js`). Serve the folder over HTTP and open `index.html`. Boards 15–19b are clickable. |
| `html/` | A static snapshot of every board; no server needed. Open `html/index.html`. |
| `../awaketab-app.html` | The main tool screen as one self-contained clickable file. |

**Shared components:** `App` (the tool on every device), `Page` (the website and system pages), `Face` (all 33 clock faces), `Mark` (the logo) and `Scene` (the illustrations). Every screen board is built from these, so a fix in a component fixes every board that uses it.

---

## 2. Brand

- **Mark:** a progress ring with a lit lamp at its tip.
  - Grid 64 × 64. Ring radius 21, stroke 9, round caps.
  - The gap is 70°, running from 12 o'clock back to 10:40.
  - The lamp is Ø 11.2 and sits at −125°. Its highlight is Ø 3.2. Its halo is Ø 22 at 28% opacity, on dark grounds only.
  - 16 px optical cut: the gap opens to 84°, stroke 10, lamp Ø 12.4.
- **Wordmark:** Geist 800 + 500 ("Awake" + "Tab"), tracking −3.5%. Minimum lockup height 24 px.
- **Mark rules:** the lamp is never removed, never orange, and never rotated away from 11 o'clock.
- **Colour roles, one job each:**
  - Green = awake / live.
  - Orange = act (Start, Pro, share, extend).
  - Midnight / paper = the stage.
  - Amber = paused.
  - Red = blocked.
  - Sky = needs you, info and the focus ring.
  - Violet = ended.
- **Loud vs quiet:**
  - Glow and the green → orange aurora appear only behind display type, the mark, hero scenes and the clock.
  - Once a session runs, the chrome goes quiet.

---

## 3. Tokens (Tailwind v4 + shadcn/ui names)

```css
:root {            /* light · paper */
  --background:#F6F4EF; --foreground:#0B1020; --card:#FFFFFF;
  --primary:#B93D0B; --primary-foreground:#FFFFFF;
  --secondary:#EFECE5; --muted:#EFECE5; --muted-foreground:#626777; --accent:#E2F6E8;
  --destructive:#C21D3E; --border:#DCD7CC; --input:#8F887A; --ring:#1C64B8;
  --lamp:#117A3B; --warning:#8A5A00; --info:#1C64B8; --ended:#6D4AD0; --radius:14px;
  /* clock faces only, only while awake */
  --face-sky:#1D5FB8; --face-violet:#6D4AD0; --face-lime:#4D7C0F; --face-amber:#A15C00; --face-ember:#C2410C;
  --face-fill-sky:#3B7DD8; --face-fill-lime:#4F9A1F; --face-fill-amber:#C47A00; --face-fill-ember:#E0531F;
}
.dark {            /* midnight */
  --background:#070B16; --foreground:#EEF2FA; --card:#0E1424;
  --primary:#FF6B2C; --primary-foreground:#0B0F1A;
  --secondary:#151D31; --muted:#151D31; --muted-foreground:#8E99AE; --accent:#0D3B22;
  --destructive:#FF6B81; --border:#26314A; --input:#6B7894; --ring:#7CBBFF;
  --lamp:#3BE47F; --warning:#FFC53D; --info:#7CBBFF; --ended:#C1B1FE;
  --face-sky:#7CBBFF; --face-violet:#C1B1FE; --face-lime:#B8F25A; --face-amber:#FFB547; --face-ember:#FF6B2C;
}
.oled { --background:#000000; --card:#05070C; }   /* dark tokens on true black */
```

**Extra tokens:**

| Group | Light | Dark |
|---|---|---|
| Surface 3 | `#E6E2D9` | `#1D273F` |
| Text 2 | `#4B5165` | `#A9B3C7` |
| Link | `#117A3B` | `#7CF0AE` |
| On lamp | `#FFFFFF` | `#052812` |
| Soft fills | primary-soft `#FDECE3`, warning-soft `#FCEFD2`, danger-soft `#FCE3E7`, info-soft `#E1ECFA`, ended-soft `#ECE6FC` | primary-soft `#3A1A0C`, warning-soft `#3A2C08`, danger-soft `#3D1220`, info-soft `#0F2645`, ended-soft `#271C4A` |

**Contrast:**

- Every text pair is ≥ 4.5:1, and every border, icon and face fill is ≥ 3:1. Measured ratios are on board 07.
- Ramps are 50–950 in OKLCH on equal-luminance steps (board 06).

**Face spectrum** (boards 06 and 14):

- While the screen is awake, faces may use green · sky · violet for layered information (session / minutes / seconds).
- They may also use a heat scale for time left: more than 50% green, 25–50% lime, 8–25% amber, the last 8% ember.
- Every other state falls back to its single status colour.

---

## 4. Type, space, shape, motion

**Fonts:** Geist for everything and Geist Mono for labels, keys and code, both from Google Fonts. Japanese, Chinese and Hindi fall back to Noto Sans JP, SC and Devanagari. The faces also use IBM Plex Serif (Luxe, Words) and DotGothic16 (LED).

| Token | Spec |
|---|---|
| display-2xl | Geist 104 / .92 / −4% / 800 |
| display-xl | Geist 72 / 1.0 / −3.5% / 800 |
| display-lg | Geist 56 / 1.05 / −3% / 700 |
| h1 | Geist 40 / 1.1 / −2% / 700 |
| count-xl | Geist 96 / 1 / −3% / 300, tabular figures |
| h2 · h3 | Geist 28 / 1.2 / 600 · 20 / 1.3 / 600 |
| body-lg · body · small | 18 / 1.6 · 16 / 1.55 · 14 / 1.5 |
| meta | Geist Mono 12 / 1.4 / +8% / 500 |
| code | Geist Mono 14 / 1.6 |

- **Text rules:** nothing renders under 12 px on screen. Times are always full 12-hour in English (`11:42 AM`), and other locales use their own clock.
- **Space:** a 4 px grid — 4, 8, 12, 16, 20, 24, 32, 40, 48, 72.
- **Radius:**
  - xs 6 — kbd, tags
  - sm 10 — inputs, tabs
  - md 14 — buttons, menus
  - lg 20 — cards, sheets
  - xl 28 — stage, dialogs
  - full — pills, status, presets
- **Elevation:** e1 card with a 1 px line, e2 popover / sheet, e3 dialog / palette. In dark mode, height means a lighter surface plus a stronger line.

| Motion token | Value | Used for |
|---|---|---|
| instant | 0 ms | theme switch, reduced motion |
| glide | 80 ms `cubic-bezier(.2,0,0,1)` | hover and press |
| fast | 120 ms same curve | toggles, chips, tab underline |
| base | 180 ms `cubic-bezier(.2,.8,.2,1)` | status pill, toasts |
| panel | 240 ms `spring(1,260,26)` | sheets, drawer, palette |
| arrive | 520 ms `cubic-bezier(.16,1,.3,1)` | lamp lights, success, face swap |
| ambient | 4 s loop, ease-in-out | lamp halo, hero float |
| face-live | 1 s steps / 60 s linear | clock faces while awake: tick, sweep, flaps, drums |

On the work path, only the clock moves. `prefers-reduced-motion` stops every decorative loop and makes state changes instant.

---

## 5. Icons

Lucide 0.460 (`lucide-react`, ISC licence) — 95 icons, listed by group on board 09.

| Size | Stroke | Used for |
|---|---|---|
| 16 px | 2 | inline, badges |
| 18 px | 2 | chips, menus |
| 20 px | 1.75 | buttons |
| 24 px | 1.5 | toolbar, empty states |

Every icon sits next to a word or has an `aria-label`.

---

## 6. Components

- **Primitives (board 10):** shadcn/ui restyled only through the tokens — no forked markup.
  - Included: Button (primary, lamp, secondary, outline, ghost, destructive, link; sizes sm 36, default 44, lg 52, xl 64, icon 44).
  - Also: Input, Select, Switch, Checkbox, Radio, Slider, Tabs, ToggleGroup, Badge, Tooltip, Popover, DropdownMenu, Dialog, Sheet, Card, Progress, Skeleton and Sonner.
- **Hit areas:** every interactive target is 44 px tall or has a 44 px hit area.
- **Focus ring:** 2 px in the info hue with a 2 px gap.

**Product components (board 11):**

| Component | Notes |
|---|---|
| `StatusPill` | 9 states, always icon + words: Not keeping awake · Starting… · Awake · until 11:42 AM · Needs you · tap to resume · Awake · video fallback (dashed) · Paused · tab hidden · Blocked · battery saver · Ended at 11:42 AM · Not supported here |
| `Countdown` + `ExtendBar` | +5 / +15 / +30 / +1 hour / Until…; Pause, Stop |
| `PresetGroup` | Presenting 1 h · Cooking 45 min · Reading 30 min · Break 15 min · Until I stop · New preset |
| `FaceSwitcher` / faces sheet | All 33 faces; selected = 2 px lamp border plus a label |
| `FixPanel` | Blocked: 3 numbered steps, primary "Use video fallback", "Open the battery guide", "Check again" |
| `Alert` | Inline, never auto-dismissed: info / success / paused / refused |
| Toasts | Extended (Undo for 6 s) · 5 minutes left (+15 min) · Couldn't sync (Retry). Bottom-centre on phone, bottom-right on desktop; they pause on hover and focus; errors stay |
| `TypedConfirm` | Clear history: type CLEAR; the button stays disabled until it matches |
| Devices presence | Pro: up to 5 devices. Each has an identity colour that is never green, amber or red (Cobalt, Grape, Plum, Bubblegum, Denim, Sand, Slate, Mauve) |
| Command palette ⌘K (board 12) | shadcn `<Command>`. Groups: recent / suggested, then session / settings / app. Matched letters are marked; loading and no-match states included. Full screen on phone |

---

## 7. The `Face` component

**Props:**

| Prop | Values | Notes |
|---|---|---|
| `face` | one of 33 ids (below) | |
| `theme` | `light` / `dark` / `oled` | |
| `state` | `idle` / `starting` / `running` / `fallback` / `paused` / `blocked` / `unsupported` / `up` | |
| `remain`, `total` | seconds | |
| `nowSec` | seconds since midnight | |
| `size` | px | |
| `lamp` | accent override | used by Face studio |
| `bare` | true / false | hides the caption |
| `indef` | true / false | no-end session |
| `motion` | `auto` / `off` | |
| `lblTop`, `lblEnd` | text | localised labels |
| `fmt` | `12` / `24` | clock format |

**Sizing rules:**

- Faces are drawn on a 360 × 360 artboard and scaled to `size`.
- At 240 px and up, every label is scaled so it stays ≥ 12 px on screen.
- Below 170 px (pickers, widgets, picture-in-picture), the face goes compact: digits and graphics only, with the full text kept in the `aria-label`.
- Product sizes:

| Device | Face size |
|---|---|
| Desktop | 440 |
| Tablet landscape | 380 |
| Tablet portrait | 420 |
| Phone | 296 |
| Fullscreen | 72% (86% on phone) of the short side |

**Motion** runs only while the state is `running` or `fallback`. Under reduced motion every animation stops and the digits still change once a second.

**The 33 faces:** ring · bold · horizon · tide · flip · rolling · analog · luxe · rings · words · nixie · lcd · led · dive (Diver) · chrono (Chronograph) · gauge · type · bars · timeline · pilot · dual (Dual time) · radar · dots · hourglass · battery · stack · board (Departure board) · orbit · disc (Time disc) · clocks (Clock of clocks) · wordgrid (Word grid) · tape · moon (Moon phase).

Each face's description, plus Ring in every state × theme, is on board 14. All faces are free; Face studio (your own accent colour and glow) is Pro.

---

## 8. Screens and states

**Devices:**

| Device | Viewport | Layout |
|---|---|---|
| Desktop | 1440 × 900 | side nav 232, tool panel 380 on the right |
| Tablet landscape | 1194 × 834 | icon rail 84, panel 352 |
| Tablet portrait | 834 × 1194 | bottom tab bar 76; tools open as inset bottom sheets with 60 px side margins |
| Phone | 390 × 844 | header 56, 5-item tab bar 76 with 60 px targets, all tools as bottom sheets |

**Session states:** idle · starting · awake · video fallback · paused · needs you · blocked · unsupported · ended.

**Banners:** offline, and "another tab holds the lamp".

**Toasts:** extended, 5 minutes left, time's up.

**Views:**

- Free: timer · faces · presets (empty and filled) · history · settings · help & fixes · share · ⌘K · fullscreen · first-visit welcome.
- Dialogs: clear-history typed confirm · extend.
- Pro: Face studio · ambient sound · devices · account.

**Where they are drawn:**

| Board | What |
|---|---|
| 20 / 20b | Desktop, every state and view |
| 21 / 22 | Phone |
| 25 / 26 / 27 | Tablet |
| 24 | German, Japanese, Chinese and Hindi |

**Website and system pages** (`Page` component; boards 19, 23 and 23b):

| Group | Pages |
|---|---|
| Content | Home `/` · scenario `/for/cooking` · use cases `/for` · device guide `/on/iphone-and-ipad` · browser support `/learn/browser-support` · comparison `/vs/mouse-jiggler` · guide `/guides/presenting` · Pro `/pro` · privacy `/legal/privacy` · terms `/legal/terms` · about `/about` · changelog `/changelog` · help centre `/help` |
| Account | Sign in `/signin` (empty, error, sent) · shared setup `/s/…` |
| System | 404 · offline · maintenance `/status` · link expired · setup removed · 500 |

**Page rules:**

- One ad slot per page, below the tool, never beside a button and never animated.
- Analytics consent sits inline under the header and never covers a button.

**Prototypes:**

| Board | Flow |
|---|---|
| 15 | The tool (J1–J13) |
| 16 | Pro purchase: plan → account → inbox → pay → processing → success / declined |
| 17 | Extension: install → pin → popup → badge |
| 18 | Picture-in-picture mini clock, home-screen widgets and kiosk mode |
| 19 | Content pages |
| 19b | Shared link, sign-in, help search, Face studio and sound |

---

## 9. Emails (board 28)

AwakeTab sends three emails, and only these:

1. **Sign-in link** — works once, for `[NUMBER]` minutes.
2. **Pro receipt.**
3. **Renewal failed** — Pro stays on until `[DATE]`.

Every email follows the same rules:

- One reason and one action, with the same action also written out as a plain link.
- 600 px max width, 16 px body text, real text (never image-only), and a plain-text version sent alongside.
- No tracking pixels and no link redirects.

---

## 10. Accessibility (board 29)

Target: WCAG 2.2 AA.

- **Keyboard:**

| Key | Action |
|---|---|
| Space | start / pause / resume |
| + | +15 min |
| ⇧ + | +1 hour |
| U | until… |
| F | fullscreen |
| ⇧ D | theme |
| ? | help |
| 1–9 | presets |
| ⌘K | palette |
| Esc | close |

  - Single-key shortcuts only fire when the stage has focus.
  - Tab order: header → stage → primary action → panel.
- **Screen readers:**
  - Polite `aria-live` messages for start, extend, 5 minutes left, tab hidden and ended; assertive only when the lock is refused.
  - The face has `role="timer"` and its label refreshes once a minute; seconds are `aria-hidden`.
- **Status is never colour alone:** icon + word, plus a solid or hollow dot.
- **Zoom:** at 200%, layouts reflow to one column.
- **Focus:** dialogs and sheets trap focus and return it to where they opened from.

---

## 11. Copy and behaviour rules

- Say what the browser really does:
  - The wake lock is released when a tab is hidden, and the UI says "Paused — tab hidden", never "Awake".
  - The video fallback is labelled as a fallback.
  - The desktop app is only mentioned for blocking *system* sleep.
- Show the end time everywhere a duration appears (`38:12 left · until 11:42 AM`).
- Keeping awake is free. Pro is for more than one device and the extras (history export, sound, Face studio, notes).
- A shared setup link carries the length, face and chime only — never labels or device names.

---

## 12. Placeholders to fill

| Placeholder | Used in |
|---|---|
| `[COMPANY NAME]`, `[ADDRESS]`, `[CONTACT EMAIL]`, `[NO-REPLY EMAIL]` | footers, legal pages, emails |
| `[DOMAIN]`, `[TOKEN]` | share and sign-in links |
| `[PRICE]` | Pro page, purchase flow, receipt |
| `[PAYMENT PROVIDER]` | checkout, account, emails |
| `[DATE]`, `[TIME]`, `[VERSION]` | legal pages, changelog, billing |
| `[NUMBER]` | link expiry minutes, card last four |
| `[YOUR NAME]`, `[YOUR EMAIL]` | account sample |

---

## 13. Not covered by this design

- French and Portuguese are listed in the language menu, but only English, German, Japanese, Chinese and Hindi have drawn screens.
- Legal text (privacy, terms) is structure only and needs counsel.
- The ad network, analytics vendor and payment provider are not chosen.
- Clock-face motion has been checked as stills and in the HTML snapshots; check it on real devices during the build, especially Safari and low-power mode.

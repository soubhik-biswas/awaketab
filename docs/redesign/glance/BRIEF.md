# AwakeTab — build brief for the coding agent ("Glance" redesign)

You are rebuilding the AwakeTab web app. This is a **rebuild from the new design**, not a polish of the current code. Treat the current UI as wrong unless this brief or the design says to keep it. Read this whole brief before you change a file, then work in the order in §12.

---

## 0. Sources of truth (in this order)

1. **This brief.** If something here conflicts with old docs or old code, this brief wins.
2. **Design canvas — "AwakeTab — Glance".** It contains **only** the current design; all earlier explorations have been deleted, so nothing on it is stale. Boards: G00 (foundation, journey, rules — your QA checklist), G01 desktop tool, G02 tablet tool, G03 phone tool, G04 home page, G05–G07 every website page at 1440 / 834 / 1194, G08–G08b phone pages, G09 every state, banner and panel, G10 languages, G11 all 46 faces, G12 extension, mini clock, widgets and wall mode, G13 brand kit, G14 accessibility, **G15 marketing, store and launch assets**, plus the `Tool`, `Site`, `Page`, `Face` and `Scene` components. Press Play on `Tool` to click through the real behaviour.
3. **Handoff zip:** `prototype/Tool.dc.html`, `prototype/Site.dc.html`, `prototype/Face.dc.html` hold the exact values (sizes, colours, copy, logic), and `docs/tokens.css`. Marketing files are in `assets/marketing/` with the exact copy in `assets/marketing/LISTING_COPY.md`. When unsure about a pixel, open the `.dc.html` file and copy the value. Don't invent new ones.

**What changed in this version (v3.1, after two full QA rounds):**
- **New logo:** a progress ring, with a track and a bead on the arc's end (§9g). It is updated everywhere: app, website, brand board, every icon and every store asset.
- **All 46 faces have a true light version** (§6).
- **Website boards are one theme each:** G05, G06 and G08 are light; G07 and G08b are dark. Tool boards label every non-dark frame.
- **The domain is `awaketab.com`.**
- **OLED is a real theme.** Pure `#000` page, vibe layer at 30% opacity, faces in their OLED variant. Before, choosing OLED silently gave Dark. See §4 and G09 S27–S29.
- **Vibe previews follow the theme.** The picker and the home-page cards use light pastel previews in light theme (`VBL` in `Tool.dc.html`, `VBSL` in `Site.dc.html`).
- **Every tap target is ≥ 44 px.** This includes banner buttons, nudge buttons, the toast Undo, chime / motion / mix chips, the Copy chip and the phone length control (54 px track, 44 px cells).
- **Dark text-3 is now `#99A1B5`** (7.8:1). It was `#8A93A8`, which dropped under AA on glass on phone.
- **Aurora face in light theme** uses pastel blobs (`#6FDDA0`, `#B29CFF`, `#8FD3FF`), so the dark digits keep contrast.
- **The Pro "SAVE %" tag** is weight 700 and `#0B5F2D` in light theme (7.1:1).
- **The extension popup footer** reads "Works in any tab". The extension uses `chrome.power`, so it is not limited to one tab (§9f).
- **The filter chips scroll on phone** and fade out at the right edge, so it is clear there are more.
- **New board G15:** share images, Chrome Web Store kit, Product Hunt kit, icons and listing copy (§9h).

---

## 1. What the product is

AwakeTab keeps a screen awake from the browser (Screen Wake Lock API, with a silent-video fallback), then lets it sleep again. People touch it for **three seconds** and look at it for **an hour**. Every decision serves two jobs:

1. **Start in one tap.**
2. **Be calm, beautiful and readable from across the room.**

Everything else must get out of the way.

The bar is a modern, "wow" product in the spirit of the best of 21st.dev, Magic UI, Aceternity, Linear, Vercel, Raycast and Apple. That means smooth, clean, clear and thoughtful. It does not mean busy.

---

## 2. Stack and libraries (don't hand-build what already exists)

- **Next.js 16 (App Router) + React 19 + TypeScript, strict mode.**
- **Tailwind CSS v4.** Put the tokens from §4 in `@theme`, with dark, light and OLED variants.
- **shadcn/ui** as the base: Dialog, Sheet, Drawer (Vaul), Command (cmdk), Switch, Tabs, ToggleGroup, Tooltip, Sonner (toasts).
- **Motion** (`motion/react`) for every transition. Respect `prefers-reduced-motion`.
- **lucide-react** for all icons.
- **Fonts with `next/font/google` — FINAL (v3, confirmed):**
  - **Bricolage Grotesque** (variable: `opsz`, `wdth`, `wght`) for **display only**: headlines, panel titles, card titles, the wordmark and big numbers in marketing. Weight 700, tracking −3.5% to −4.5%, `font-optical-sizing: auto`. It is modern, friendly and a little playful, which is the voice of the brand.
  - **Inter** (variable, with `opsz`) for **all UI text**: buttons, rows, body and leads. Clock digits use Inter Light with `font-feature-settings: 'tnum' 1, 'cv11' 1`.
  - **Instrument Serif Italic** for **one accent word per headline**, with the gradient (for example "Keep this screen *awake.*"). Size it at 1.08em, weight 400.
  - **Geist Mono** for eyebrows, labels, keyboard keys and counts.
  - Faces keep their own character type exactly as in `Face.dc.html`: Archivo for Neon, Bauhaus, Poster and HUD; IBM Plex Serif for Luxe, Words and E-ink; DotGothic16 for LED.
- **Effects:** use proven components from **21st.dev / Magic UI / Aceternity** and restyle them to our tokens:
  - Border Beam (primary CTA, Pro card, final CTA).
  - Shine / Shimmer Button (primary CTA).
  - Aurora or gradient-blob background (soft, slow, 18–22 s).
  - Grid Pattern with a radial mask.
  - Marquee (faces on the home page).
  - Bento Grid (home features, faces store).
  - Spotlight / glow card hover.
  - Animated Beam (optional, home "How it works").
- Keep each effect subtle, and give each one a reduced-motion fallback.

---

## 3. Information architecture: three places, nothing else

**Delete the current 13-item "Menu" entirely.** There is no sidebar and no hamburger menu inside the tool.

The **top bar** has:

- Logo on the left.
- **Status pill** in the centre. On phone it moves into the stage.
- On the right: **Search ⌘K** (desktop and tablet), then **Faces**, **Recents** and **Settings** as icon buttons (with labels on desktop, icon-only below 1300 px, every target ≥ 44 px).

| Place | What it is |
|---|---|
| **Faces** | Full-screen gallery: sticky header with search, filter chips (Featured 18 · Digital · Analog · Ambient · All 46, each with a count badge), and a bento grid whose first tile is a 2×2 featured tile showing the current face. Tapping a tile applies it **live** behind the panel. |
| **Recents** | Presets (cards with a mini face, name, length and face name, plus "Save current as a preset") and History grouped by full date (e.g. "TODAY · SATURDAY, 31 OCTOBER"). |
| **Settings** | Theme as **four cards** (System, Light, Dark, OLED), never a cycling row. Then clock toggles, sound (chime segmented control), Ambient mixer, Face studio, account card, **Send feedback**, and the optional Pro card. |
| **⌘K** | The cmdk palette: Session (Extend, Pause, Stop), Go to (Faces, Recents, Settings, Get the extension, **Send feedback**). |

**How panels open:**

- Desktop and tablet landscape: a **right drawer**, 440–460 px wide, inset 16 px, radius 28.
- Phone and tablet portrait: a **bottom sheet** (Vaul). On tablet portrait it is inset 24 px.
- Every panel has a sticky header and a scrolling body. Where there is a main action, it sits in a **pinned footer**, so the primary button is never below the fold.
- A panel's height fits its content, up to the maximum. Never leave a half-empty fixed-height box.

---

## 4. Foundation tokens (copy exactly)

**Colour — each colour has one job:**

| Token | Dark | Light | Job |
|---|---|---|---|
| bg | `#05060A` | `#F4F4F9` | page |
| text | `#F2F4FA` (18.4:1) | `#0B1020` (17.3:1) | text |
| text-2 | `#A6AFC2` (9.2:1) | `#4B5165` (7.2:1) | secondary text |
| text-3 | `#99A1B5` (7.8:1) | `#5C6275` (5.5:1) | meta |
| volt | `#3DF58E` | `#117A3B` | **awake / live only** |
| violet | `#9F7BFF` (text on it `#0B0718`) | `#6633F5` (text on it `#FFFFFF`) | **the button / act** |
| amber | `#FFC53D` | `#8A5A00` | paused |
| red | `#FF6B81` | `#C21D3E` | blocked / danger |
| sky | `#7CBBFF` | `#1C64B8` | focus ring, info |

**Surfaces:**

- Glass: 4% white fill, 1 px line at 9% white, `backdrop-blur(20px) saturate(1.4)`.
- Panel: `rgba(13,16,30,.86)` with shadow `0 30px 80px rgba(0,0,0,.55)`.
- Light mode equivalents: `#FFFFFF` and `rgba(255,255,255,.9)`.
- **OLED** (a real theme, not an alias of Dark):
  - Dark tokens, except bg `#000000`, solid `#05060A`, panel `rgba(6,7,12,.94)`, glass fill 3.5%, grid lines 3%.
  - The whole vibe layer (blobs, ribbons, floor, orbit) renders at **30% opacity**, so most pixels stay off.
  - Faces use their `oled` variant: no graphite case, a pure-black dial, and a 1 px `#1A2236` outline.
  - The Settings theme cards are four real values (`system`, `light`, `dark`, `oled`). The selected card is the one in use, and `system` follows `prefers-color-scheme`.

**Radii:** 12 (controls, chips), 18 (rows, dock, tiles, cards in panels), 24–28 (panels, cards), 999 (pills and the primary button). No other values.

**Space:** a 4 px grid (4, 8, 12, 16, 20, 24, 32, 48).

**Type** (Bricolage Grotesque 700 for headings, Inter for everything else; never 800+):

| Use | Spec | Smaller screens |
|---|---|---|
| Page hero | Bricolage 700, 96/.96, −4.5% | tablet 68–80, phone 46 |
| Tool headline | Bricolage 700, 64/.98, −4% | tablet 52–60, phone 36 |
| Accent word | Instrument Serif Italic 400, 1.08em | |
| Section heads | 52 | tablet 46, phone 34 |
| Panel titles | 30 | phone 26 |
| Card titles | 24 | phone 21 |
| Lead | Geist 20/1.55 | phone 17 |
| Body | 15–17 | |
| Meta | Geist Mono 12–13, +14% tracking, uppercase | |

Nothing on screen is smaller than **12 px**.

**Motion:**

| Name | Spec |
|---|---|
| arrive | 420 ms `cubic-bezier(.16,1,.3,1)`, fade plus 14 px rise |
| drawer | 360 ms slide |
| segmented thumb | 350 ms |
| face size change | 500 ms |
| controls hide | after **5 s** idle while awake, 450 ms fade |
| shine sweep | 3.6 s |
| border beam | 5–6 s |
| aurora drift | 18–22 s |
| live dot pulse | 2 s |

Everything above stops under reduced motion.

---

## 4b. Finishing layer (this is what makes it feel premium)

- **Grain:** an SVG fractal-noise overlay at 6% opacity (`mix-blend-mode: overlay`) on dark, or 3.5% (`multiply`) on light.
- **Spotlight:** a soft radial light from the top centre over the stage (white at 7% on dark).
- **Floor shadow:** a blurred ellipse under the face, so the clock sits on something.
- **Hairline gradient borders:** glass elements use `border: 1px solid transparent` with `linear-gradient(fill) padding-box, linear-gradient(180deg, white 20% → white 4%) border-box`, plus an inner top highlight. This applies to the top-bar capsule, the dock and the status pill.
- **Top bar right side:** one capsule containing Search ⌘K, Faces, Recents and Settings, not four separate boxes.
- **The live status pill** gets a soft glow in its own colour.

---

## 4b-2. Signature background: "time orbit" (the default Aurora vibe)

Layers, back to front:
1. Graphite `#05060A` base.
2. **Aurora ribbons:** two wide, heavily blurred (46–60 px) horizontal gradient bands (volt → mint → sky → violet). They are masked top and bottom, and sway and skew over 16 s and 22 s.
3. Soft volt and violet blobs.
4. About 28 twinkling **dust stars** in the top half.
5. A **perspective floor grid:** 64 px cells, `rotateX(72deg)`, faded with a mask, sitting in the bottom 34% of the screen. A glowing **horizon line** sits on top of it.
6. **Time orbit rings**, centred on the clock at 1.8× the face size (1.5× on phone and tablet portrait):
   - an outer ring of 120 ticks (major tick every 10) rotating once every 240 s;
   - a dashed ring and a plain ring counter-rotating once every 360 s;
   - a **progress orbit**: a volt → violet arc with a glowing dot showing the time left.
   The progress orbit's opacity follows the state: running 0.6, paused 0.3, idle 0.15, hidden on phone. Mask it with `radial-gradient(circle closest-side, #000 62%, transparent)`.
7. A **state tint:** a faint radial wash in the state colour (volt running, amber paused, red blocked, sky ended).
8. Spotlight, vignette and grain on top.

When the vibe is Aurora, the flat grid is hidden because the floor replaces it. Every animated layer stops on Still, under reduced motion, and on battery saver.

---

## 4c. Vibes — living backgrounds (engagement, playful, optional)

The top-bar capsule gets a **Vibe** button (wand icon). It opens a drawer or sheet with six preview cards (each a mini scene with "38:12") and a Motion control (**Still · Calm · Lively**). The choice persists.

| Vibe | What it is |
|---|---|
| Aurora (default) | Green and violet blobs drifting over 18–22 s, plus the grid. |
| Night sky | A deep navy gradient, about 70 twinkling stars (seeded positions), a moon glow (small and in the corner on phone and tablet portrait so it never sits behind text), and a shooting star every 9 s. |
| Rain on glass | Two layers of 102° streaks scrolling at 1.1 s and 1.7 s, masked at the top and bottom, plus soft coloured bokeh. |
| Sunset | A gradient from `#120821 → #3A1647 → #8E2F57 → #D9644A → #F2A35E`, a low sun that "breathes" over 6 s, and warm haze. |
| Lava lamp | Four blurred organic blobs (volt, violet, pink, amber, 70 px blur) morphing over 16–21 s. |
| Calm | No motion, grain only. |

**Rules for vibes:**

- Implement them with CSS or canvas. Use Magic UI / Aceternity pieces where they fit (Meteors for the shooting star, Particles for stars).
- Every vibe sits under the same spotlight, grain and vignette layers. On Sunset and Lava the vignette darkens the centre slightly so the clock keeps AA contrast.
- **Still**, reduced motion and battery saver all stop every vibe animation.
- **Previews follow the theme:** dark scenes in dark and OLED, light pastel versions with dark labels in light. In light theme the live background is the pastel version too.
- Labels on bright previews (Sunset, Lava) sit on a bottom scrim (`transparent 55% → rgba(0,0,0,.55)`), so white text keeps AA contrast.
- The home page has a **"Set the mood. *Six living backgrounds.*"** section with six tall preview cards, each showing a face.

---

## 4d. Habit and engagement

- **Recents** opens with a **"This week"** card: total time awake (e.g. "9 h 40 min awake"), a streak chip ("🔥 4"), a line like "4-day streak · your longest yet", and a 7-day bar chart where today glows volt. Data stays local.
- The first-session feedback card, the vibes and the faces gallery are the three engagement hooks. **Never use dark patterns:** no fake urgency, no locked features, no streak-loss guilt messages.

---

## 5. The tool (the home page `/` *is* the tool)

### 5.1 Set mode (state `idle`)

- **Background:** aurora blobs (volt at top-left, violet at bottom-right, faint sky), a 64 px grid with a radial mask, and a vignette.
- **Stage, centred, top to bottom:**
  1. A mono eyebrow with the date and time, e.g. "SATURDAY, 31 OCTOBER · 11:23 AM".
  2. The headline "Keep this screen **awake.**", where "awake." uses the volt → mint → violet gradient.
  3. The face in its idle state (Ring by default; 380 px on desktop, 340 on tablet landscape, 480 on tablet portrait, 296 on phone).
  4. The **length control**: a segmented control with a sliding thumb. Options are 15 min, 30 min, **1 hour (default)**, 2 hours and No end. On phone the labels are 15m, 30m, 1h, 2h and ∞.
  5. The **primary CTA**: "Keep awake · 1 h", a pill 64 px tall, violet gradient, with a shine sweep and a border beam. On phone it is full width.
  6. A note under it: "Ends at 12:23 PM · no install, no account".
- **One tap starts the session.** No sign-up, no tour and no modal first.

### 5.2 Glance mode (states `running`, `paused`, `ended`, `blocked`)

- The headline and length control animate out, and the face **grows** (500 ms) to 560 px on desktop, 470 on tablet landscape, 640 on tablet portrait and 340 on phone. It stays perfectly centred in the space between the top bar and the dock. **Nothing jumps.**
- A soft halo glows behind the face in the state colour.
- The **dock** is a glass capsule at the bottom centre. It has the **same slots in every state**:
  1. **Add time chips:** +5 min, +15 min, +1 hour. When ended: +15 min, +30 min, +1 hour.
  2. **Primary:** Pause while running, Resume while paused, Start again when ended, or "See the fix" (in red) when blocked.
  3. **Stop:** a square icon, labelled "Stop" on desktop. Hidden only when the session has ended.
  4. A divider.
  5. **Face button:** a 44 px mini face, plus its name on desktop. It opens Faces.
  6. **Fullscreen:** this must use the real Fullscreen API, not just an in-page mode.
- On phone the dock becomes **two rows**: the chips on top, then Primary (flexible width), Stop, Face and Fullscreen.
- **Auto-hide:** after 5 s with no pointer movement or touch while running (and only when no panel is open), the top bar and dock fade out. The face grows to about 62% of the width. A small pill reads "Move the pointer for controls" (desktop) or "Tap anywhere for controls" (touch). Any movement or tap brings the controls back.
- **Status pill text:**
  - "Not keeping awake" (hollow dot)
  - "Awake · until 12:26 PM" (volt, pulsing)
  - "Paused · 57 min left" (amber)
  - "Time's up · it slept at 12:26 PM" (hollow)
  - "Not awake · battery saver" (red)
- The tab title is live, e.g. "59:12 left · AwakeTab".
- **Toast** after extending: "15 minutes added · now until 12:41 PM [Undo]" (Sonner). It sits centred above the dock.

### 5.3 Honest problems

- The red banner under the top bar ("**Battery saver is blocking the wake lock.** Your screen may still go dark." with a [See the fix] button) appears **only** when the browser has refused or released the lock.
- Help & fixes opens **only** from that banner, or from ⌘K. It shows the real reason, the time it was checked, and numbered steps. The pinned footer has "Use the video fallback" as the primary action and "Check again" as the secondary.
- **Never** show a battery-saver warning while the lock is actually held. The current build does this; it is a bug.

### 5.4 State machine

Model this with a reducer or XState, not scattered booleans:

```
idle --start--> running
running --pause--> paused --resume--> running
running|paused --stop--> idle
running --remain==0--> ended
ended --start again | +time--> running
running --lock released / refused--> blocked
blocked --fix | fallback--> running
```

The wake lock is acquired on `start` and re-acquired on `visibilitychange`. Store the end time as a timestamp, not as a counter.

---

## 6. Clock faces

**Final set: 46 faces.** LED, Pulse and Terminal were retired: LED duplicated LCD and Neon and clipped its marquee, Pulse read as a medical monitor, and Terminal's small text was cramped. Don't build them. They're also gone from the `face` enum in `Face.dc.html`.

**Theme compatibility:**
- Every face renders in **light, dark and OLED** from the same component.
- Aurora switches to a light pastel mesh with dark ink in light theme.
- E-ink becomes "night paper" in dark and OLED.
- **Every face has a real light version** (v3.1). None of them stays a dark slab on a light page:
  - Flip and Rolling: porcelain cards (`#FFFFFF → #EEF0F6`) with ink digits and a soft hinge line.
  - Nixie: frosted glass tubes and a pale base, with deep-green digits and a soft glow.
  - Departure board: a white board with pale split-flap tiles and ink characters.
  - Neon: a white-washed brick wall, with the tube glow in the deep accent.
  - Liquid: a clear glass sphere with a pastel fill and ink digits.
  - HUD: a pale dash, light-grey off segments and heat-coloured on segments.
  - Constellation: a dawn sky with ink-green stars.
  - Eclipse: a bright sky, a slate moon and an amber corona.
  - Moon phase: a pale daytime sky.
  - Only LCD and Diver keep a dark bezel, because the real object has one. Their readouts still pass AA.
  - Dark and OLED are unchanged. The light keys (`drumFade`, `nx*`, `bd*`, `ne*`, `lq*`, `ec*`, `hud*`, `cs*`, `mn*`, `fxInk`) are in `Face.dc.html`.

**Responsiveness:**
- A face is drawn on a 360 × 315 artboard and scaled with one transform, so its proportions never change.
- Below 200 px, secondary text hides. A 44 px thumbnail shows only the main shape and digits.
- The automated check that text never leaves the face box at 44, 96, 160, 360 and 640 px, in all three themes, passed. The only exceptions are the intentional, masked scroll effects in Rolling and Tape.


- **All 46 faces stay** and **all are free.** The "Featured 18" collection is: ring, aurora, liquid, halo, eclipse, skeleton, neon, dive, flip, bold, glass, chrono, pilot, orbit, nixie, poster, moon, constellation.
- **Face material (v2): graphite, not navy.** Dark dials use `#1B1E28 → #0E1016 → #08090D` with a soft accent glow at the bottom edge (accent at 15% opacity), a top sheen (7% white), a 1 px inner highlight and a two-ring bezel. Lines are `#2A2D38`, tracks `#1C1F29`, panels `#0F1117`. Copy these exact values from `Face.dc.html`.
- Port the drawings from `Face.dc.html`. Each face is a component that takes `state`, `remaining`, `total`, `now`, `size`, `theme`, `motion` and `accent`.
- **Hard rules:**
  - A face never draws outside its box. Test every face at 44, 64, 160, 300 and 640 px.
  - Text never sits under a moving hand. Diver's "LEFT" readout sits in a raised pill above the hands.
  - Clock of clocks drops a leading zero (it shows "1:00", not "01:00").
  - Each face shows one heat colour for the time left. State colours (amber, red) override the accent.
  - Motion runs only while awake and stops under reduced motion.
  - Below 200 px, hide secondary text.
- In the gallery, the **tile is the frame**: every face sits on the same glass tile, so cased and uncased faces look like one family.
- The **selected tile** gets a 2 px volt border, a 4 px soft halo and a check badge. Scroll containers get 8 px padding so the ring is **never clipped**.

---

## 7. Customer journey and monetisation (critical)

**Experience first. Sell much later, and gently.**

1. **Second 0:** the visitor lands on the working tool. No sign-up wall, no onboarding carousel, no paywall.
2. **First session ends:** a calm "Time's up" screen plus a **first-session feedback card** under the face. It reads "FIRST SESSION DONE · 1 H" and "How did it go?", with three one-tap chips: 😍 Loved it · 🙂 It worked · 😕 Something broke. Tapping one opens the Feedback panel with that choice already selected. This card has **no sales message.**
3. **Week one:** everything is usable. Face studio, the ambient mixer, presets, history and every face and theme are **free, with no locks, no "Pro" badges that block, and no blurred previews.** Settings rows show a small "Free" badge.
4. **After real use only:** show **one** nudge, and only when sessions ≥ 10, presets ≥ 2, or a second device is seen. It reads "You've made it yours. 12 sessions and 2 presets in. Running more than one screen? Pro keeps them all in sync." with [Try Pro free] [Not now].
   - Desktop: top-right, under the top bar. Phone: above the dock. Never over the clock.
   - "Not now" silences it for 30 days.
   - Never show it during the first session or on the first day.
5. **Pro** = sync across up to 5 devices plus priority help. Everything else stays free, for good. The Settings Pro card reads "Many screens? Keep them in sync." with a border beam.
6. **Account:** the app works with no account. The account card shows **one consistent state**: "Not signed in · Everything works without an account. Sign in only to sync Pro. [Sign in]". Never mix a signed-out state with Pro billing or "Delete account". The current build does this; it is a bug.

---

## 8. Feedback system

The Feedback panel (drawer or sheet) contains:

1. A 3-way rating (large tiles).
2. An optional textarea: "Anything we should know?"
3. Topic chips: Faces · Ease of use · Battery · Something else.
4. The note "Sent anonymously with your browser and device type. Your answers shape what we build next."
5. A pinned footer with "Send feedback" (primary) and "Maybe later".

**Entry points:** the first-session card, Settings → Send feedback, and ⌘K "feedback". The home FAQ also points to it.

Send to `/api/feedback` with rating, topics, text, app version, browser and anonymous session count. **Never ask for or store an email address or any other personal data.** Feedback is the only support channel: there is no contact email anywhere in the product or on the website.

---

## 9. Website (`Site.dc.html`, board G04; every other page: `Page.dc.html`, boards G05–G08b)

- `/` = the tool, filling the first viewport, plus the story below it.
- **Sections, in order:**
  1. **Faces marquee:** two rows of tiles scrolling in opposite directions, with masked edges, under the heading "A clock for every room *you work in.*"
  2. **Bento:** "Touch it for three seconds. *Trust it for an hour.*" Six cells:
     - Readable from across the room (2×2, big Bold face)
     - One tap
     - It never pretends (three status pills)
     - Free. All of it ($0 in gradient)
     - Phone, tablet, laptop, wall (device frames)
     - ⌘K for everything
  3. **How it works:** three steps, **each with an illustration** (Scene: firstaction, hero, success) and a numbered volt badge.
  4. **Made for:** four glow cards with scene illustrations (cooking, presenting, dashboards, night desk).
  5. **FAQ:** a real accordion. The first item is open, the rest closed. A plus/minus icon reflects the state. The left column has the heading and a feedback pointer.
  6. **Final CTA:** a beam-bordered card with a grid texture and the heading "Your screen, awake *in one tap.*"
  7. **Footer.**
- **Analytics consent** is a small floating card ("Count this visit? [No thanks] [Allow]"), never a block in the page flow. Preselect nothing; "No thanks" is equal in weight.
- **Content pages** (use cases, guides, browser support, Pro, legal, help, about, changelog, status, sign-in, 404, offline, error) are all on boards **G05 (1440), G06 (834), G07 (1194), G08 and G08b (390)**. Use the floating glass pill nav, graphite dark and porcelain light, Bricolage headings and a real accordion (first item open, plus/minus icons). Pro page copy: Free = "Everything AwakeTab does, on this screen, for good"; Pro = sync up to 5 screens, start or stop every screen from one, cross-device history, priority help, early faces, "keeps a small, independent team going". Use the same tokens, the floating glass nav, full-width callouts and an illustration where a section would otherwise be text only. The theme **follows the system on every page**. No light/dark mismatch between pages.
- **Responsive tiers:** phone < 700, tablet portrait 700–1099, tablet landscape 1100–1299, desktop ≥ 1300.

---

## 9b. Footer (same on the home page and every website page)

Always graphite dark, whatever the page theme. It has:

1. A gradient top hairline (volt → violet), a soft aurora glow and a masked grid.
2. A **feedback CTA card** with a gradient border: kicker "MADE BY HUMANS · READ BY HUMANS", heading "Tell us what would make it *yours.*" (serif accent), and two buttons, [Open the timer] (primary) and [Send feedback] (ghost).
3. A brand column: logo, one line of copy, a live **status pill** ("All systems normal · wake lock API healthy", with a pulsing dot that links to `/status`), and three 44 px social icon buttons (GitHub, X, RSS changelog).
4. Four link columns (two on phone): Product (with "NEW" tags on Faces and Vibes), Use cases, Learn, Company.
5. A **giant "AwakeTab" wordmark** at 20.5% of the viewport width (21.5% on phone) in Bricolage, filled with a gradient that fades from 16% to 0% white and cut off at the bottom edge.
6. A bottom bar: copyright placeholder, "No tracking cookies", a System / Light / Dark segmented theme switch, and a language pill.

---

## 9c. No email, anywhere (product decision)

- **Sign-in (Pro sync only)** is **Continue with Apple · Continue with Google · Use a passkey**. There is no email field and no magic link.
  - States: default; cancelled (red note "Sign-in was cancelled. Nothing changed — try again."); done ("You're signed in. Sync is on.").
  - "Session expired" asks the person to sign in again.
- **Help, privacy, terms, refunds and about** all point to **Settings → Send feedback** or **Settings → Account / Manage plan**. There are no `mailto:` links.
- **No transactional emails exist.** Receipts live in Settings → Manage plan → Receipts, and the payment provider sends its own.

---

## 9d. Every state, banner and panel (board G09)

**Session states:**
- `starting`: the CTA shows a spinner and the label "Starting…"; the pill reads "Asking the browser…".
- `fallback`: no Wake Lock API, so a silent video keeps the screen on. Sky pill, info banner, and the dock works the same as running.
- `unsupported`: a banner with a [Use video] button, and the primary button is "Use video".
- `needsyou`: the tab was hidden and the browser released the lock. Amber banner and pill, primary "Resume".
- `blocked`: battery saver. Red banner with [See the fix].

**Banners** (a `banner` prop, shown over any running state):
- `conflict`: "Another tab is keeping this screen awake." [Take over]
- `offline`: "The timer keeps working; sync waits."
- `update`: "A new version is ready." [Reload] (the session carries on)

**Panels** (all open as the same drawer on desktop and as a sheet on phone, with a pinned footer):
- **Share:** a preview card, a link field with a Copy button, and three Include toggles. The link never contains personal data.
- **Your screens (Pro):** a summary card ("2 awake right now") and device rows with presence dots and Start / Stop.
- **Ambient sound (free):** a now-playing card, four sliders (rain, café, fireplace, brown noise) and mix chips.
- **Clear history:** a red warning card and a typed "CLEAR" confirmation. The red button unlocks only when all five letters match.
- **Language:** English, Deutsch, 日本語, 中文, हिन्दी and Español, with the time format shown beside each.
- **Pro offer:** a hero, Yearly (preselected, "SAVE [NUMBER]%") or Monthly, a feature list, a "Start 14-day free trial" button, and "Secure checkout by [PAYMENT PROVIDER]".
- **Pro is on:** success scene plus three next steps for the second screen.
- **Manage plan:** an account card ("Signed in with Apple"), then Change, Payment method, Screens and Cancel Pro, then Receipts.

**Settings** gets a **More** group: Ambient sound, Language, Share this setup and Clear history (red). Recents with no presets shows an illustrated empty state ("No presets yet") with one action.

---

## 9e. Languages (board G10)

- Ship `en`, `de`, `ja`, `zh` and `hi` from day one. Every string in the top bar, Set mode, the dock, the pill and the face labels is translated.
- Times follow the locale: 11:42 AM · 11:42 · 午前11:42 · 上午11:42 · सुबह 11:42.
- CJK and Devanagari use Noto Sans JP / SC / Devanagari as fallbacks after Inter.
- The serif-italic accent word is used only for Latin scripts. Other scripts keep only the gradient, and the accent phrase never breaks across lines (`white-space: nowrap`, `word-break: keep-all` for CJK).
- Allow German strings to be up to 40% longer: the top-bar capsule and the buttons grow, and nothing truncates.

---

## 9f. Extension, mini clock, widgets and wall mode (board G12)

- **How it keeps the screen on:** use `chrome.power.requestKeepAwake('display')` from the service worker, and `releaseKeepAwake()` on stop or end. Use `chrome.alarms` for the end time and the badge countdown. This works in any tab and while other apps are in front. The web app keeps using the Screen Wake Lock API with the video fallback.
- **Permissions:** exactly `power`, `alarms`, `storage`, `offscreen` (for the chime) and `activeTab` (for "Add this site"), plus `optional_host_permissions`, requested one site at a time for auto-wake. Nothing else. The justification text for each is in LISTING_COPY.md.
- **Extension popup** (360 wide): logo, status pill, a 220 px face, length chips, the primary button, and a footer with "Works in any tab" and "Open full app ↗". Show it ready, awake and blocked.
- **Toolbar badge:** ready (no badge), awake (volt badge with minutes), paused (amber "II"), blocked (red "!").
- **Options page:** a badge-timer toggle, auto-wake on chosen sites (chips, plus "Add this site"), and release-when-hidden.
- **Picture-in-picture mini clock:** about 236 px, glass, with a status line and the face. It closes when the session ends.
- **Home-screen widgets:** large (face, status, preset name), small (face) and quick start (one violet button).
- **Wall mode** (TV or kiosk): fullscreen OLED face, a pixel shift every 3 minutes, dimming to 40% after 10 PM, and a small status pill.

---

## 9g. Brand kit (G13) and accessibility (G14)

- **Brand:**
  - **The mark (v3.1)** is a progress ring, read like the clock: the bold arc (300°, from 12 o'clock clockwise) is the time left; a faint full track at 22% ink is the time used; a volt bead (r 4.6 on a 32 grid) sits exactly on the end of the arc, meaning *now*. Nothing is empty or accidental.
    - SVG: `<circle cx="16" cy="16" r="11" stroke-opacity=".22" stroke-width="4"/>` + `<path d="M16 5 A11 11 0 1 1 6.47 10.5" stroke-width="4" stroke-linecap="round"/>` + `<circle cx="6.47" cy="10.5" r="4.6"/>`.
    - The wordmark is Bricolage 700 + 500. Clear space is the bead's diameter. The bead is volt on dark and `#117A3B` on light.
  - Four approved backgrounds: graphite, porcelain, one-colour volt and one-colour violet.
  - App icons: iOS squircle, Android adaptive, macOS and the Chrome Web Store 128 px.
  - Favicons at 16, 32, 48, 64 and 180 px.
  - Two 1200 × 630 share images (the full set is on G15).
- **Accessibility:** the shortcut table (Space, Enter, ← →, + −, F, V, R, the comma key, ⌘K, ⇧F, Esc, ?), the focus order, the screen-reader announcements, the contrast pairs, the focus states and eight rules. Board G14 is the checklist.

---

## 9h. Marketing, store listing and launch assets (board G15)

Every file is exported at its exact pixel size in `assets/marketing/`. The text for every store field is in `assets/marketing/LISTING_COPY.md`. Use those files; don't recreate them. If the product UI changes, re-export from G15 (`tools/export_assets.js` renders every `[data-asset]` frame).

| Surface | Files | Spec |
|---|---|---|
| **Open Graph / X / Slack / LinkedIn / iMessage** | `og/og-01 … og-08.png` | 1200 × 630. og-01 is the default (dark), og-02 is light, og-03 Faces, og-04 Pro, og-08 changelog. og-05 (use case), og-06 (guide / help / device) and og-07 (shared link) are **templates**: generate them per page at build time (Satori / `@vercel/og`) from the page H1 and its scene, or for a shared link from its length and face. Keep text inside the central 1100 × 560. `twitter:card = summary_large_image`. |
| **Chrome Web Store** (also Edge / Firefox) | `chrome-web-store/` | `icon-128.png` (96 px artwork, 16 px transparent padding); `cws-01 … cws-05.png` at 1280 × 800 (alternating dark and light, so the listing proves both themes); `promo-small-440x280.png` (required); `promo-marquee-1400x560.png`; `edge-logo-300.png`. |
| **Product Hunt** | `product-hunt/` | `thumbnail-240.png`; `ph-01 … ph-05.png` at 1270 × 760. ph-01 shows the real product and goes first. Add a ≤ 60 s screen recording as item 2 if you have one. |
| **Launch posts** | `social/` | `soc-01-square.png` (1080 × 1080) and `soc-02-story.png` (1080 × 1920). |
| **Icons for the code** | `icons/` | `favicon-16/32/48.png` (dark tile, legible on light and dark tabs); `extension-16/32/48/128.png` (the toolbar icons sit on a dark tile, so they read on light and dark toolbars); `apple-touch-icon-180.png` (square, no transparency); `icon-192.png`, `icon-512.png` and `icon-maskable-512.png` (mark inside the 80% safe zone) for `manifest.webmanifest`. Also ship `favicon.svg`, the logo SVG from G13. |

**Copy rules:**
- Store name "AwakeTab — Keep your screen awake" (33/75).
- Summary 115/132.
- Product Hunt tagline 53/60, description 232/260.
- Meta description on the home page is 134 characters.
- Every page gets its own `<title>` ("{H1} · AwakeTab", under 60 characters), a meta description (140–155 characters), `og:title`, `og:description`, `og:image` (with width, height and alt), and `theme-color` for both schemes. The `<head>` snippet and the extension `manifest.json` are in LISTING_COPY.md.
- The privacy answers on the store must match what the build really sends. Nothing is sent by default; feedback sends the message plus browser and device type; Pro sends the sign-in ID. Get legal review before submitting.
- **No email address** in any listing, page or asset.

---

## 10. Accessibility and quality: non-negotiable

- WCAG 2.2 AA. Use the contrast pairs in §4 only.
- Visible focus rings (sky, 2 px, 3 px offset). Full keyboard path: Tab order, Esc closes panels, ⌘K / Ctrl K, Space toggles Pause, arrow keys move in the segmented control.
- Targets ≥ 44 px. This includes chips, segmented cells, banner and toast buttons, and the phone length control. Text ≥ 12 px.
- Status is always words, icon and dot shape as well as colour. Never colour alone.
- **No dark-on-dark selected states.** The current "Signature" tab is unreadable; selected chips must invert.
- `aria-live="polite"` for status changes. Dialogs trap focus. Sheets can be swiped down.
- Times in full 12-hour English ("11:42 AM"); other locales use their own format. Dates in full ("Saturday, 31 October 2026").
- Placeholders stay in `[BRACKETS]`: `[COMPANY NAME]`, `[YEAR]`, `[PRICE]`, `[DATE]`, `[NUMBER]`, `[PAYMENT PROVIDER]`. Never invent prices or names. **No email addresses anywhere:** not in the footer, legal pages, help or forms.
- Lighthouse ≥ 95 on Performance and Accessibility. No layout shift on start (CLS ≈ 0).

---

## 11. Bugs seen in the current build (all must be gone)

1. Help & fixes claims "battery saver is on" while the lock is held.
2. Account shows "Not signed in" together with Pro renewal, Manage billing, Sign out and Delete account.
3. Pro features are labelled Pro but fully usable, and Devices says "0 of 0". (New rule: everything is free, so remove the labels and fix the copy.)
4. The fullscreen button doesn't enter real fullscreen, and fullscreen changes the button order.
5. FAQ answers are always open while the chevrons say closed.
6. Phone width (390 px) returned an "Internal Server Error". Find and fix the SSR crash, and add a test.
7. Clock of clocks (the old default face) is unreadable; "01:00" reads as one minute. The default face is now **Ring**.
8. Diver's readout sits under the hands.
9. Faces render inconsistently (some cased, some bare) and Flip floats at the top of its tile.
10. A translucent slab appears under the face in the hero.
11. The selected faces tab is dark-on-dark and unreadable. Faces tabs scroll away instead of sticking. The sheet opens on the wrong collection. Labels are clipped.
12. The menu runs off the bottom of the screen. Theme silently cycles dark → OLED → light.
13. Sheets have a fixed height: half empty, or the primary button is cut off (Face studio, Sound).
14. The bottom bar changes width and contents between states.
15. Starting a session makes the headline vanish and the clock jump off-centre.
16. The cookie banner sits inside the page flow, between the tool and the content, and over every page.
17. The home page is dark while content pages are light.
18. Pro page copy: "Several notes per session" and "Supports an independent tool". Rewrite from the Pro board.
19. The palette doesn't find the extension command.
20. The Next.js dev badge is visible in screenshots. Hide it for reviews.

---

## 12. Work order

1. **Foundation:** tokens, fonts, the theme provider (System, Light, Dark, OLED), and the base components (Button variants, IconButton, Segmented, Chip, StatusPill, Toggle row, Glass, Panel shell with drawer/sheet switching, Toast).
2. **Session engine:** the state machine, wake lock with video fallback, the timer from an end timestamp, and the live title.
3. **Tool:** Set mode, Glance mode, the dock, auto-hide, the banner and toast. Compare against G01, G02 and G03 frame by frame.
4. **Panels:** Faces store, Recents, Settings, Help, Face studio, Feedback, ⌘K.
5. **Faces:** port all 46 and run the size test (§6).
6. **Journey:** first-session card, feedback API, nudge rules, persisting counts in localStorage (wrapped in try/catch).
7. **Website:** home sections, then the content pages, then consent.
8. **Extension:** MV3 with `chrome.power`, the popup, the badge and options (§9f).
9. **Marketing:** OG tags on every page, per-page OG templates, the icons and manifest, and the store listings from G15 / LISTING_COPY.md (§9h).
10. **QA:** run the G00 rule list and §10–§11 at **1440, 1194, 834 and 390**, each in dark, light and OLED. Attach screenshots of every G01–G04 frame next to your build's equivalent.

---

## 13. Definition of done

- Every frame on G01–G04 is reproduced at its device size in both themes, with the same spacing, type and copy.
- Every rule on G00 and every item in §11 passes. Report each one as pass or fail with a screenshot.
- A first-time visitor can start a session in one tap and finish it.
- Feedback can be sent. The nudge appears only under the §7 rules.
- No feature is locked.
- OLED is a real theme on every screen (pure black, vibe at 30%, faces in OLED).
- Every page has the right title, meta description and OG image, and the store and Product Hunt assets in `assets/marketing/` are used as-is.

Before writing code, state your plan in five bullets. Then work through §12 one step at a time, showing screenshots at each step. If something in the design is unclear, ask. Don't guess, and don't fall back to the old UI.

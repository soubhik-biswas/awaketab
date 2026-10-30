# AwakeTab — build handoff

AwakeTab keeps a screen awake from the browser, always shows when it will sleep again, and then lets it sleep. This folder is everything needed to build it: the spec, the tokens, a clickable prototype and static HTML of every screen.

> **For Claude Code:** read this file first, then `docs/HANDOFF.md`, then build in **Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui + TypeScript**. Open the prototype and the HTML as the visual reference. Match them exactly, but write real components; never copy the prototype's inline markup.

---

## Folder map

| Path | Use it for |
|---|---|
| `docs/HANDOFF.md` | The full spec: brand, tokens, type, motion, icons, components, the 33 clock faces, every state and page, emails, accessibility, copy rules and placeholders. |
| `docs/tokens.css` | Ready-to-paste `app/globals.css` with the shadcn/ui variables, Tailwind 4 `@theme` and the face colours. |
| `prototype/` | The live design, clickable. Serve it, then open `prototype/index.html` (see below). Boards 15–19b are interactive. |
| `prototype/App.dc.html`, `Face.dc.html`, `Page.dc.html` | The source of truth for layout, copy and the logic of every state. Read the `renderVals()` script at the bottom of each file. |
| `html/` | A static snapshot of every board — no server needed. Open `html/index.html`. |
| `../awaketab-app.html` | The main tool screen as one self-contained clickable file, if you only need a single page. |

**Running the prototype** (it needs a local server because the screens load shared components):

```bash
cd awaketab/prototype
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000/index.html  → start with 15 · the tool
```

---

## What to build (in this order)

1. **Foundation.**
   - Create the Next.js 16 app with Tailwind 4 and shadcn/ui.
   - Paste `docs/tokens.css` into `app/globals.css`.
   - Load Geist and Geist Mono with `next/font/google`.
   - Use themes `light`, `dark` and `oled`, plus Auto, which follows the system. Use `next-themes` with the classes `dark` and `oled`.
   - Icons: `lucide-react`.

2. **Primitives.**
   - Use the shadcn/ui components, restyled only through the tokens: Button, Input, Select, Switch, Checkbox, RadioGroup, Slider, Tabs, ToggleGroup, Badge, Tooltip, Popover, DropdownMenu, Dialog, Sheet, Card, Progress, Skeleton, Sonner and Command.
   - Button sizes: sm 36 · default 44 · lg 52 · xl 64 · icon 44.
   - Focus ring: 2 px `--ring` with a 2 px offset.

3. **The wake engine** — `lib/wake.ts`, a small state machine with a React hook.
   - **States:** `idle → starting → running | fallback | blocked | unsupported`, plus `paused` (tab hidden), `needsyou` (lock lost while away) and `ended`.
   - **Locking:** call `navigator.wakeLock.request('screen')`. Re-request it on `visibilitychange` when the tab is visible again, and listen for the lock's `release` event.
   - **Video fallback:** a muted, looping, inline video, used only when the API is missing or refused, and labelled as a fallback.
   - **Timing:** keep time from `Date.now()` and an end timestamp, never from interval counting. Extend adds to the end time. At zero, release the lock, then show "Time's up".
   - **Storage:** everything lives in `localStorage` — settings, presets and history. No account is needed.

4. **Clock faces** — `components/face/`.
   - Port `prototype/Face.dc.html` into one `<Face>` component with the same props: `face`, `theme`, `state`, `remain`, `total`, `nowSec`, `size`, `lamp`, `bare`, `indef`, `motion`, `lblTop`, `lblEnd`, `fmt`.
   - Draw on a 360 × 360 artboard and scale to `size`.
   - Keep labels at 12 px or more on screen at 240 px and up. Below 170 px, show digits only.
   - Animate only in `running` or `fallback`, and honour `prefers-reduced-motion`.
   - The 33 faces and their rules are in `docs/HANDOFF.md` §7.
   - Build Ring, Bold, Flip, Analog and Time disc first, then the rest.

5. **The tool.**
   - Port `App.dc.html` for desktop (1440), tablet (1194 landscape, 834 portrait) and phone (390).
   - Layout per device:
     - **Desktop:** side nav, stage and tool panel.
     - **Tablet landscape:** icon rail and panel.
     - **Tablet portrait and phone:** bottom tab bar, with tools as bottom sheets.
   - **Views:** timer, faces, presets, history, settings, help & fixes, share, the ⌘K palette (`Command`), fullscreen and the first-visit welcome.
   - **Pro views:** Face studio, ambient sound, devices and account.
   - Match boards 20 and 20b (desktop), 21 and 22 (phone), and 25–27 (tablet) state by state.

6. **Content site.**
   - Port `Page.dc.html` into App Router routes: `/`, `/for`, `/for/[scenario]`, `/on/[device]`, `/learn/browser-support`, `/vs/[tool]`, `/guides/[slug]`, `/pro`, `/help`, `/about`, `/changelog`, `/legal/privacy`, `/legal/terms`, `/signin`, `/s/[setup]`, `not-found` and `error`.
   - Add the system pages for offline, maintenance, link expired and setup removed.
   - Reference boards: 19, 23 and 23b.

7. **Pro, account and emails.**
   - Checkout flow: board 16 (plan → account → inbox → pay → success / declined).
   - Magic-link sign-in.
   - The three emails on board 28.
   - Payment provider: `[PAYMENT PROVIDER]`, not chosen yet.

8. **Later.**
   - The browser extension (board 17).
   - The Document Picture-in-Picture mini clock, home-screen widgets and kiosk mode (board 18).

## Done means

- [ ] Every state on boards 20 / 20b, 21 / 22 and 25–27 can be reached and matches the design in light, dark and OLED.
- [ ] Status always shows as an icon plus words (plus a dot), never colour alone. Times are full 12-hour (`11:42 AM`) in English, and each locale uses its own clock.
- [ ] No text under 12 px. Every target is ≥ 44 px. The focus ring is always visible. WCAG 2.2 AA contrast in all three themes.
- [ ] The keyboard map in `docs/HANDOFF.md` §10 works.
  - Single-key shortcuts only fire when the stage has focus.
  - Screen readers hear the `aria-live` messages, and the countdown is not read out every second.
- [ ] `prefers-reduced-motion` stops every decorative animation, and the digits still tick.
- [ ] A hidden tab shows "Paused — tab hidden", never "Awake". The video fallback is labelled.
- [ ] The countdown stays correct after sleep, a backgrounded tab or a clock change, because it is derived from the end timestamp.
- [ ] Lighthouse accessibility 100. No layout shift when a session starts.
- [ ] All `[PLACEHOLDERS]` are listed in `docs/HANDOFF.md` §12 and stay as visible placeholders until real values exist.

## Notes

- **Dev-only controls:** the dashed "Prototype controls" tray in the prototype is review tooling, not product UI. Keep the same jumps behind a dev-only panel if that helps QA.
- **Ads and analytics:**
  - One ad slot per content page, below the tool, never beside a button and never animated.
  - Analytics consent sits inline under the header and must never cover a button.
- **Languages:** English, German, Japanese, Chinese and Hindi have drawn screens (board 24). French and Portuguese are in the language menu but have no designs yet.

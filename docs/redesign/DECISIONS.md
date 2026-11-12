# Design decisions

AwakeTab's design is "Glance". Its brief is [`docs/plan/glance/AGENT_PROMPT.md`](../plan/glance/AGENT_PROMPT.md), the design system is [`DESIGN.md`](../../DESIGN.md) and the front-end specification is [`docs/05-frontend-spec.md`](../05-frontend-spec.md).

This page records the decisions that still govern the code, each with its date, what was decided and why. Most of them are places where the product deliberately differs from the brief: the brief wins everywhere else, so a difference that is not listed here is a bug. The boards and prototypes the brief names are not kept in this repository.

To change a decision, open an issue that links the entry and says what is new ([GOVERNANCE.md](../../GOVERNANCE.md)). A decision that is replaced is removed from this page; the history is in git.

---

## Sessions and honest status

- **Nine session states, one reducer** · 31 Oct 2026. The session is a typed reducer (`apps/site/lib/tool/session.ts`) with the brief's nine states; asking for the lock, the video, saving and other tabs live beside it in `apps/site/lib/wake.ts`. One place decides what the pill may say, so the mini clock, the widgets and wall mode cannot disagree with the tool.
- **A hidden tab is "needs you", never paused** · 13 Nov 2026. "Paused" happens only when the person presses Pause: the clock stops, and Resume moves the end time by the length of the pause. A tab that was hidden and lost the lock is "needs you" instead (amber, "Tap to resume · tab was hidden"). Its clock keeps running to the same end time, the lock is asked for again as soon as the tab is visible, and it reads "Awake" again with no tap where the browser allows it. If the end time passes while the tab is hidden, the session ends normally. The brief's state machine sends a released lock to "blocked"; the product keeps "blocked" for a real refusal. Why: the pill had promised an end time, and a clock that stopped by itself broke that promise; "Paused" also described something the person never did.
- **The end time is the real end** · 13 Nov 2026. The stored end time is the moment the session will really end, and it moves forward when a pause is resumed. The tool, the extension and the saved session follow the same rule. Why: with a fixed end time and a separate paused total, a session that had been paused and resumed could be treated as over after a reload.
- **A running session survives a reload without a tap** · 13 Nov 2026. After a reload a running session asks for the lock again by itself. It waits as "needs you" only when the browser wants a tap first, and shows "blocked" only for a cause a tap cannot fix. Why: the update banner's reload, or an accidental refresh, should not cost the person their session.
- **Blocked names the real reason** · 31 Oct 2026. The brief draws the blocked state as "battery saver". Browsers never report battery saver, and battery savers do not refuse a wake lock in Chromium or WebKit. So the pill, the banner and Help & fixes name what the browser actually said: an insecure page, a page policy, or "the browser said no". The "battery saver" wording appears only when the Battery Status API reports a low, unplugged battery.
- **A warning only while the browser is refusing** · 31 Oct 2026. A refusal is ignored while a lock is held, and a blocked state records when it was checked. "Not awake", the red banner and the fix never show over a working session.
- **The video fallback must be seen playing** · 13 Nov 2026. Where the browser has no wake lock, a clip with a video track and a silent audio track plays at 1 × 1 px, not muted. The state reads "Awake via video" only once playback is seen to advance, and it stops saying so if the clip stalls. Why: browsers keep the display on only for a video they treat as real media, and a clip that the browser accepted but never played kept nothing awake.
- **Other tabs are forgotten after ten seconds** · 13 Nov 2026. A tab that holds the lock says so every 3 seconds; a tab not heard from for 10 seconds no longer counts. Why: a tab that crashed or was discarded without saying goodbye could leave "Another tab is keeping this screen awake" on screen.

## The tool

- **Keyboard** · 31 Oct 2026. Single-key shortcuts act only while focus is inside the tool, no panel is open and nothing is being typed, so Space scrolls the story below the tool when focus is on the page. `?` opens the command palette, which lists every command with its key, because the brief draws no shortcuts sheet. The palette shows only keys that are bound.
- **Focus order** · 31 Oct 2026. Focus runs: skip link, status pill, length, Keep awake, Vibe, Faces, Recents, Settings, Search. Search stays first on screen. The pill is a focus stop with its live region off, because the tool's announcer already speaks each change once.
- **Keep controls visible** · 13 Nov 2026. The brief rests the top bar and dock after 5 seconds while awake. A switch in Settings keeps them on screen, off by default. Why: some people want the buttons always in reach, and the choice costs nothing for everyone else.
- **Panels** · 31 Oct 2026. Drawers keep the full height with the footer pinned. Sheets on phone and tablet portrait size to their content, up to 86 % or 70 % of the screen, so none is half empty. Panels open inside the tool itself, so they work in fullscreen.
- **Narrow screens** · 31 Oct 2026. Below 360 px the top bar drops the wordmark (the mark stays, named for screen readers), and the status pill and the toast wrap instead of truncating.
- **The note under the start button** · 31 Oct 2026. It is 14 px in the secondary text colour. The board shows 16 px in the main text colour only because of a styling slip in the board itself.
- **Share link** · 31 Oct 2026. The share panel's link is the tool's address with its options (`/?preset=p60&face=ring&vibe=aurora`, plus `autostart=1` for "Start straight away"), because the short `/s/` page cannot carry a background or the newer faces. It never carries a name, history, device or place.
- **Face studio is free** · 31 Oct 2026. The accent and glow are saved on the device. Routing it through Pro sent people without Pro to a page that had nothing for them.
- **Tags instead of "Free" badges** · 31 Oct 2026. Everything is free, so "Free" badges say nothing. New, Hot, Staff pick and Night take their place, one tag per tile, in violet, sky and neutral tints so that green stays reserved for "awake".
- **The first-session card and the one nudge** · 31 Oct 2026. The feedback card shows once, at the first "Time's up". The Pro nudge needs 10 sessions, 2 presets or a second screen, never appears on the first day, and stays quiet for 30 days after either answer. The counts live on the device and are never sent.
- **Feedback** · 31 Oct 2026. A note stores the rating, topics, text, browser family, device tier, session count and app version for two years. Anything in the text that looks like an email address or a phone number is replaced with "[removed]" before it is stored.
- **Motion** · 31 Oct 2026. Motion drives the interface transitions, as the brief asks. The faces keep their GSAP loops, which already stop under reduced motion.
- **Effects** · 31 Oct 2026. Border Beam, Meteors and Grid Pattern come from Magic UI (MIT). Its Particles and Bento Grid are not used: the night sky's 70 stars are the design's own seeded dots, and the faces gallery needs exact column maths.
- **Living backgrounds** · 31 Oct 2026. They rest on Still, under reduced motion and when the battery is low and unplugged. Lively runs the same layers about 40 % faster; Calm is the drawn speed.
- **The week chart is plain SVG** · 13 Nov 2026. The "This week" chart in Recents is seven bars drawn directly, with no chart library. Why: seven bars do not justify the weight of a library on the tool's page.
- **Components are added when they are used** · 13 Nov 2026. Only the shadcn/ui components the product uses are kept in `apps/site/components/ui`; a new one is added when a screen needs it. Why: unused components and the packages only they needed were weight and upkeep for nothing.

## Clock faces

- **The final 46, and what old ids become** · 31 Oct 2026. LED, Pulse and Terminal are retired, as the brief says. A stored, linked or preset id moves on read: `led` and `terminal` become `lcd` (the closest digital readout), `pulse` becomes `waveform` (the closest animated face), `matrix` becomes `lcd`, and anything unknown becomes Ring. Why: nobody's saved setup should open on an error.
- **Collections** · 31 Oct 2026. Featured (the brief's 18), Digital (15), Analog (14), Ambient (17) and All (46). The faces sheet opens on Featured.
- **Faces draw with their own palette** · 31 Oct 2026. A face uses the palette of its drawing for each theme, not the page tokens, because the two differ. A state colour (amber, red, sky, the ended grey) overrides the green and any Face studio accent.
- **The face box** · 31 Oct 2026. A bare face is its 360 × 315 artboard, so it sits centred on any tile. With the status caption or the watch-glass case it is square.
- **Faces are not clipped to a rectangle** · 13 Nov 2026. A glow, a halo or a hand that reaches past the artboard is drawn whole. Why: clipping cut glows and halos off in a straight line at the edge of the box.
- **Ten hours or more uses smaller numerals** · 13 Nov 2026. A reading such as 10:00:00 is eight characters, so it takes a tighter size. Why: at the normal size it ran out of its dial or card.
- **Small faces** · 31 Oct 2026. Below 200 px a face hides its secondary text. At 64 px and under it also drops minor ticks, dial numerals and stars, keeping its main shape and digits.
- **Three faces, as drawn** · 31 Oct 2026. Clock of clocks leaves a leading zero blank, so one hour reads "1:00". Diver shows its time left in a raised pill above the hands. Chronograph has no MIN and SEC labels.
- **E-ink at night** · 31 Oct 2026. In dark and OLED the card is inverted and hue-turned, so it reads as night paper and its accent shifts slightly with it.

## Website

- **Home story order** · 31 Oct 2026. Below the tool: faces marquee, vibes, bento, how it works, made for, questions, closing card. This is the home board's order; the brief's list leaves the vibes section out.
- **Accent words on content pages** · 31 Oct 2026. Each content and system page headline ends on its serif accent word, as the brief's type rule asks; the page boards draw those headlines plain.
- **"$0" in the bento** · 31 Oct 2026. It is drawn at 96 or 120 px in the serif accent. The board draws it at 17 px through a styling slip.
- **Status dots in the bento** · 31 Oct 2026. The three dots keep different shapes (round, square, diamond), so status is never colour alone; the board draws three round dots.
- **Targets** · 31 Oct 2026. Footer links keep 40 px rows and the theme and language pills their 28 and 32 px, each with an invisible hit area that reaches 44 px.
- **The closing card** · 31 Oct 2026. Its light is a Border Beam, green to violet over 6 seconds, on a 1.5 px hairline, instead of the board's rotating gradient. The "How it works" beam is left out because the board hides that line.
- **Page titles** · 31 Oct 2026. Every title is "{headline} · AwakeTab" under 60 characters. A longer headline drops the clause after a colon or question mark, then the suffix. The home page keeps "AwakeTab — Keep this screen awake" from the listing copy.
- **Share images** · 31 Oct 2026. One default image for the home, tool and system pages, and one each for legal and about, Pro and sign-in, and the changelog. Use cases draw a light template; guides, devices, comparisons, docs, help and hubs a dark one; shared links a clock template with their length. A shared-link card leaves out the end time, which depends on when someone opens it.
- **No email** · 31 Oct 2026. Every support line points to Settings → Send feedback (`/?open=feedback`) or to Settings → Account. No page has an email address or a `mailto:` link.
- **The footer** · 13 Nov 2026. Always dark, whatever the page theme, as the brief says. Three things differ from it. The large wordmark is an outline that a spotlight under the pointer lights up, instead of a gradient fill. The bottom bar carries a hand-drawn heart. The status pill says what this browser can really do ("This browser can keep your screen awake", or that AwakeTab uses a video here) and links to the browser support page, instead of the brief's "All systems normal · wake lock API healthy". Why: the site cannot honestly report the health of something that happens in the visitor's own browser, but it can say what that browser supports.
- **Footer theme switch** · 31 Oct 2026. System, Light and Dark set the shared theme. OLED shows as Dark there; the four-card choice stays in the tool's Settings.
- **Footer links** · 31 Oct 2026. Faces and Vibes open the tool with `?open=faces` and `?open=vibes`. RSS is the changelog feed at `/rss.xml`.

## Languages and type

- **Eight tool languages** · 31 Oct 2026. The tool runs in all eight site languages, where the brief draws five. The Language panel lists the six languages the board draws and adds the current one when it is French or Portuguese.
- **The clock follows the 12-hour switch in every language** · 13 Nov 2026. Until the person chooses, English, Japanese, Chinese and Hindi show a 12-hour clock and German, Spanish, French and Portuguese a 24-hour one. Once the 12-hour switch is used, the choice wins in every language. Why: one setting should mean the same thing in every language.
- **Hindi names four parts of the day** · 13 Nov 2026. सुबह from 4:00, दोपहर from 12:00, शाम from 16:00 and रात from 20:00, in place of a two-way AM and PM. Why: Hindi names the part of the day.
- **Japanese and Chinese use the device's fonts** · 13 Nov 2026. The brief names Noto Sans JP and SC as fallbacks after Inter. The product uses the fonts already on the device (Hiragino, Yu Gothic, Meiryo; PingFang, Microsoft YaHei) and downloads nothing. Hindi keeps Noto Sans Devanagari. Why: web fonts for these scripts are large downloads, and the device's own fonts are what readers see everywhere else.
- **English-only pages keep English strings** · 31 Oct 2026. Pages served only in English (Pro checkout, manage and activate, sign-in, help, legal, hubs) keep their strings in English in every catalogue.

## Privacy and analytics

- **Analytics is opt-in** · 13 Nov 2026. Nothing is sent until the person presses Allow on the "Count this visit?" card or turns on "Count my visits" in Settings. "No thanks" sends nothing at all, not even that someone declined. Global Privacy Control and Do Not Track switch counting off even after an Allow. Why: counting people who never agreed is not honest, and the product's promise is honesty. Details: [`docs/ANALYTICS.md`](../ANALYTICS.md).
- **The two answers look the same** · 31 Oct 2026. "No thanks" and "Allow" share one outlined style. The brief says the answers carry equal weight, while the board fills Allow.

## Sign-in, Pro and prices

- **Launch free, Pro later** · 31 Oct 2026. The first release has no Pro and no sign-in. One switch, `NEXT_PUBLIC_PRO_ENABLED`, off by default, hides the Pro page, checkout, sign-in, the account section, the Pro card and the nudge, and those addresses answer 404. All Pro code stays and is tested; [`docs/plan/PREMIUM-LAUNCH.md`](../plan/PREMIUM-LAUNCH.md) is the checklist for switching it on.
- **No paid plan wording at launch** · 13 Nov 2026. While Pro is off, the site, the store listing and the launch copy do not mention a paid plan, a price or a trial. Why: nothing can be bought, so naming a plan would promise something that does not exist.
- **Sign-in is three buttons** · 31 Oct 2026. Continue with Google, Continue with GitHub and Use a passkey. GitHub takes the place of the brief's Apple button. There is no email field, no magic link and no transactional email.
- **Passkeys** · 31 Oct 2026. A passkey can start an account on its own. The account table needs a unique address, so such an account gets an undeliverable placeholder on a reserved domain that is never shown or mailed. A browser cannot tell "cancelled" from "no passkey here", so after an empty attempt the button reads "Create a passkey".
- **What the device remembers about sign-in** · 31 Oct 2026. The method and a name, never an address. When the server no longer backs it, the note is removed and the account card shows the signed-out state. The signed-in page adds a Sign out link, because nothing on the boards signs a person out.
- **Monthly Pro** · 31 Oct 2026. The boards offer Yearly and Monthly, so `pro_monthly` is a renewing plan beside `pro_yearly`. Pay once is no longer offered; pay-once licences already bought keep working.
- **Prices** · 31 Oct 2026. $12 a year is the real price and is shown. The monthly price and the saving stay blank until a monthly price exists; the saving is then computed from the two.
- **No invented former price** · 26 Sep 2026. Never a "was $29" or a struck-through price that nobody paid. Why: it is dishonest, and in some places unlawful.
- **Pro panels in the tool** · 31 Oct 2026. "Start 14-day free trial" opens the Pro page with the chosen plan, where checkout lives. The "Pro is on" panel opens once, when Pro switches on during a visit.
- **The Pro page and the Pro offer** · 31 Oct 2026. The Pro page draws the Pro board. The Yearly or Monthly choice, the 14-day trial button and "Secure checkout by" live on the first step of `/pro/checkout`, and the tool's Pro offer links straight there. The lines "Prices are placeholders until they are set" and "or want the extras" are dropped: the yearly price is real and the extras are free.
- **Checkout** · 31 Oct 2026. The account step is the three sign-in buttons, skipped when already signed in. Only the signed-in account id goes to the payment provider; no address is sent. Receipts are one row that opens the provider's portal.
- **Screens** · 31 Oct 2026. Without a presence service, only this device shows live status with Start or Stop; other screens show when they joined. Without Pro, the panel says sync starts with Pro.

## Extension

- **Scope** · 31 Oct 2026. The popup and options are what the brief draws. There is no system-only level, until-time, add-time chips, schedules, browser-start auto-start, end notification, usage statistics, licence-key entry or welcome page, and no tab opens on install.
- **Four lengths** · 31 Oct 2026. 15 min, 30 min, 1 hour and no end; 1 hour is the default and the popup remembers the last length. While awake, tapping another length restarts with it. Each chip's hit area is the full 48 px row.
- **The store listing says what the popup has** · 13 Nov 2026. The listing copy in the design says "15 min, 30 min, 1 hour, 2 hours or no end" and "five languages". The listing says "15 min, 30 min, 1 hour or no end" and "eight languages", names sign-in as Google, GitHub or a passkey, and has no paragraph about a paid plan. Why: a store listing must describe the package being reviewed.
- **The end chime is off by default** · 13 Nov 2026. Options offers None, Two tones or Bell, and None is the default. A chosen chime plays once when a timed session completes. Why: a new install should make no sound until the person chooses one.
- **The popup shows the website's own face** · 31 Oct 2026. It renders the same face component with the fonts bundled, so every face matches the tool. It shows the person's chosen face, Ring by default.
- **Pause and Stop** · 31 Oct 2026. Pause releases the keep-awake and freezes the time. The paused popup, which the board does not draw, shows Resume with a round Stop button beside it, since nothing else could end a paused session.
- **Blocked** · 31 Oct 2026. Chrome gives no battery-saver signal, so the pill says "Blocked" or "Not supported" instead of the board's "Battery saver". "See the fix" opens the help page.
- **The badge** · 31 Oct 2026. Minutes left on green (`38`, `2h` from 100 minutes, `∞` with no end). With "Show time left on the icon" off it reads ON, so the awake badge always carries words. The toolbar icon does not change; the badge carries the state.
- **Release when hidden** · 31 Oct 2026. Off by default, so the extension works in any tab. With it on, the session belongs to the tab it was started from: another tab in front, or a minimised window, pauses it ("Paused · tab hidden"), coming back resumes it, and closing that tab stops it. Here "paused" is right: the person asked for this by turning the option on, and the time really stops.
- **Add this site** · 31 Oct 2026. Chrome shows a site to the extension only after a toolbar click, so Options reads the most recent site it may see and asks for that one origin. With none, it says to click the AwakeTab icon on the site first.
- **Theme** · 31 Oct 2026. The board draws dark only. The popup and options follow the theme setting, with the light and OLED tokens.
- **Licence in the extension** · 31 Oct 2026. Everything is free, so nothing checks a licence. One stored by an earlier build is still revalidated and dropped when revoked.

## Mini clock, widgets, wall mode and embed

- **Mini clock** · 31 Oct 2026. No +15 button: the board draws a status line and the face only. Esc or Space stops and P closes. The window is 236 × 196 and closes when the session ends or stops.
- **Widgets** · 31 Oct 2026. Large, small and quick start. The Windows widget tags stay `session`, `awake` and `presets`, so installed widgets keep working. The large tile's tap adds 15 minutes while a timed session runs.
- **Wall mode** · 31 Oct 2026. Face and status pill only. Defaults are Bold on OLED; the screen shifts every 3 minutes and dims to 40 % from 10 PM to 6 AM. The board's bottom-left caption is an annotation; that corner holds the hold-to-exit control.
- **Embed** · 31 Oct 2026. The compact frame's corner is 18 px, the design's row radius, instead of 16.

## Brand and store files

- **Icons as exported** · 31 Oct 2026. The page head, the web manifest and `favicon.ico` use the design's exported icon files unchanged. `favicon.svg` is the progress-ring mark, with ink and bead following the colour scheme.
- **Store images** · 13 Nov 2026. The extension's store images are the design's exported files, used unchanged, and live in one place: `apps/extension/store/glance/chrome-web-store/`. The launch-post images and their copy are in `docs/launch/`. Why: with two copies, one goes stale.

## Licence

- **AGPL for the apps, MIT for the library** · 13 Nov 2026. The website (`apps/site`), the extension (`apps/extension`) and the session engine (`packages/core`) are under the GNU AGPL 3.0 only. The `@awaketab/wake` library (`packages/wake`) stays under MIT. The AwakeTab name and logo are covered by [`TRADEMARKS.md`](../../TRADEMARKS.md), not by either licence. Why: anyone may use, study, change and share the apps, and whoever distributes a changed version or runs one as a service must share their source the same way; the library stays MIT so that any project can use it.

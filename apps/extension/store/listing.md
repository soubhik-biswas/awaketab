# Store listing — AwakeTab — Keep your screen awake

Copy for the Chrome Web Store (also Edge and Firefox). It follows the Glance listing copy (`docs/redesign/glance/LISTING_COPY.md`), which is the source; change that first. Use with [the release guide](PUBLISHING.md), [reviewer instructions](reviewer-instructions.md) and [privacy disclosures](privacy-disclosures.md). Store form fields use plain text; keep the paragraph spacing and drop the Markdown when pasting. Placeholders stay in [BRACKETS]. No email address appears anywhere: feedback is in the app (Settings → Send feedback).

## Identity

| Field | Value |
|---|---|
| Name (33 / 75, manifest, every locale) | AwakeTab — Keep your screen awake |
| Summary (115 / 132, the manifest description in English) | Keep your screen on with one click. A calm clock shows the time left. 46 faces, all free — no account, no tracking. |
| Category | Productivity → Tools |
| Language | English (also German, Japanese, Chinese, Hindi; the extension itself also ships Spanish, French and Brazilian Portuguese) |
| Homepage | https://awaketab.com/extension |
| Help | [HELP CENTRE URL] |
| Privacy policy URL | [PRIVACY POLICY URL] |
| Minimum version | Chrome 116 (manifest `minimum_chrome_version`, from the support matrix) |
| Price | Free. Pro is optional and only syncs many screens. |

## Description

```text
Keep your screen awake — only for as long as you need.

AwakeTab stops your display from dimming or going to sleep while you read a recipe, present slides, watch a dashboard or wait for a long download. Pick a length, click once, and a big, calm clock shows exactly how much time is left. When the time is up, your computer goes back to its normal sleep settings.

WHAT YOU GET — ALL FREE
• One click from the toolbar: 15 min, 30 min, 1 hour, 2 hours or no end
• Time left on the icon badge, so you never need to open anything
• Works in any tab, and while you use other apps
• 46 clock faces — analog, digital and ambient — and six living backgrounds
• Presets for the things you do every day (Kitchen, Slides, Night desk…)
• Light, dark and OLED themes, 12- or 24-hour time, five languages
• Keyboard shortcuts and full screen-reader support

HONEST BY DESIGN
• Green means your screen really is being kept awake. If your computer or browser refuses (battery saver, a work policy), AwakeTab says so in plain words and shows the fix.
• Nothing keeps running after the time is up.

PRIVATE BY DEFAULT
• No account. No ads. No tracking.
• Settings, presets and history stay on this device.

OPTIONAL PRO
Everything above is free, for good. AwakeTab Pro ([PRICE] / year, 14 days free) syncs one setup to up to five screens and lets you start or stop any of them from one.

Help: [HELP CENTRE URL]
Feedback: open AwakeTab → Settings → Send feedback.
```

## Single purpose

Keeps the computer's display awake for a length of time the user chooses, and shows how much time is left.

## Permission justifications

| Permission | Why |
|---|---|
| `power` | Asks the operating system to keep the display awake (chrome.power.requestKeepAwake('display')) while a session runs, and releases it when the session ends or is stopped. |
| `alarms` | Ends the session at the chosen time and updates the time left on the icon badge, even when the popup is closed. |
| `storage` | Saves settings, presets, the chosen face and session history on this device. |
| `offscreen` | Plays the optional end-of-session chime, which needs an audio context. |
| `activeTab` | Used only when the user clicks 'Add this site' in Options, to read the current site's address. |
| `optional host permissions` | Requested one site at a time, only for sites the user adds to 'Always keep these sites awake', so the extension can tell when that site is open. Page content is never read. |

**Remote code:** No. All code ships inside the package.

## Images (`store/images/`, from the marketing kit, used as-is)

| File | Size | Where |
|---|---|---|
| `cws-01.png` … `cws-05.png` | 1280 × 800 | Screenshots, in that order (dark, light, dark, dark, light) |
| `promo-small-440x280.png` | 440 × 280 | Small promo tile (required) |
| `promo-marquee-1400x560.png` | 1400 × 560 | Marquee |
| `icon-128.png` | 128 × 128 | Store icon (96 px artwork, 16 px transparent padding) |
| `edge-logo-300.png` | 300 × 300 | Edge Add-ons logo |

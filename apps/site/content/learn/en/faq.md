---
title: "Questions about AwakeTab, answered — AwakeTab"
description: "Straight answers about AwakeTab: hidden tabs, closed lids, Teams status, iPhone Auto-Lock, clock faces, backgrounds, sound, battery, price and your data."
h1: "AwakeTab FAQ: the questions we are asked most"
crumb: "FAQ"
intent: "awaketab faq"
secondaryQueries:
  - "does awaketab work in the background"
  - "does awaketab keep laptop awake with lid closed"
  - "is awaketab free"
  - "awaketab battery use overnight"
  - "why does my iphone lock with awaketab open"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "These are the questions people ask most about AwakeTab, with the short answer first and the detail after. Most of them come down to one rule: a web page can keep the display on while it is visible, and the browser and the operating system decide everything else."
toc:
  getting-started: "Getting started"
  tabs-windows-and-the-lid: "Tabs, windows and the lid"
  status-sleep-and-phones: "Status, sleep and phones"
  faces-backgrounds-and-sound: "Faces, backgrounds and sound"
  the-video-fallback-and-battery: "Fallback and battery"
  price-and-privacy: "Price and privacy"
rows:
  free:
    - title: "Every length"
      text: "15 minutes, 30 minutes, 1 hour, 2 hours, or no end until you stop it."
    - title: "Every face and background"
      text: "All 46 clock faces and the six living backgrounds, in light, dark and OLED."
    - title: "Sound"
      text: "The chime at the end, and an ambient mixer of rain, café, fireplace and brown noise."
    - title: "Presets and history"
      text: "Presets you save, your session history and the \"This week\" card, kept in this browser."
    - title: "Languages and install"
      text: "Eight languages, and an offline install from your browser's menu."
    - title: "The extension"
      text: "[AwakeTab for Chrome](/extension), which keeps the screen awake from the toolbar in any tab."
faq:
  - q: "How do I know AwakeTab is working?"
    a: "Read the pill at the top of the tool. \"Awake\" appears only after your browser confirms the lock, so the pill itself is the check. Anything else names what happened instead."
  - q: "Which browsers does AwakeTab support?"
    a: "Chrome and Edge 84, Opera 70, Samsung Internet 14, Firefox 126 and Safari 16.4 hold the screen natively. iPhone and iPad Home Screen apps need iOS 18.4. Older browsers get the video fallback after a tap."
  - q: "Do I need to install anything?"
    a: "No. The tool is a web page and works offline after the first visit. Your browser's Install or Add to Home Screen option adds it to a home screen or dock, and the Chrome extension is optional."
honestLimit: "These answers describe what browsers are built to do, checked against their documentation and engine source on 26 September 2026. Our own device results are still pending, so a device can still surprise us."
related:
  - "/learn/how-awaketab-works"
  - "/learn/honest-limits"
  - "/learn/browser-support-matrix"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/extension"
author: soubhik
published: 2026-09-27
updated: 2026-11-13
---

## Getting started

### How do I start a session?

[Open AwakeTab](/), pick a length and tap **Keep awake**. The lengths are 15 min, 30 min, 1 hour, 2 hours and No end; one hour is ready when you land. On a keyboard, the left and right arrows change the length, `Enter` starts, and `Space` starts, pauses and resumes.

### Can I make it stop at a certain time?

Pick the length that ends nearest that time: the line under the button names the end before you start, such as "Ends at 12:23 PM". While it runs, the dock adds 5 minutes, 15 minutes or 1 hour, and a toast offers Undo. When the time comes you hear a soft chime and the screen sleeps normally again.

### What do the words on the pill mean?

The pill says what is happening in words, from "Not keeping awake" to "Awake · until 12:26 PM" to "Not awake" with the reason. Each state has its own words, shape and colour, and it changes only when the browser answers. [How AwakeTab works](/learn/how-awaketab-works) lists them all with what each one means.

### Does it work on a work laptop?

Usually, as long as the browser allows it and the tab stays visible. A work policy that locks the computer after some minutes without input is separate from display sleep, so it can still lock the screen. [Keep a work laptop display awake](/for/work-laptop) covers what to ask your IT team.

## Tabs, windows and the lid

### Does it still work if I switch tabs or minimise the window?

No. The browser releases the lock when the page is hidden, and switching tabs, minimising the window or changing apps all hide it. AwakeTab pauses, the tab title reads "Paused", and it asks again as soon as the tab is visible. If the browser wants a tap first, the pill reads "Tap to resume · tab was hidden".

For a display behind other windows, use the [AwakeTab extension for Chrome and Edge](/extension), which keeps working in any tab, or the mini clock. The mini clock is a small always-on-top window in desktop Chrome and Edge 116 and later and in desktop Firefox 151 and later; while a session runs, open the palette with `Ctrl K` (`⌘ K` on a Mac) and choose **Open the mini clock**. Whether it keeps the screen on while its tab is hidden has not been checked on a device yet.

### Will it keep my laptop awake with the lid closed?

No, and neither will any other web page. What happens when the lid closes is an operating-system decision. Change it in your power settings, attach an external display, or use a native tool. [Keep a Mac awake with the lid closed: what works](/guides/mac-prevent-sleep-lid-closed) covers the Mac options step by step.

## Status, sleep and phones

### Does it keep Teams or Slack showing me as available?

No. Presence follows keyboard and mouse idle time, not a lit display, so Teams still shows you as Away after a few minutes without input. AwakeTab never sends synthetic input to change that. [Does keeping your screen on keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) explains what does set your status.

### Does it stop the whole computer from sleeping, or only the screen?

The screen is the guarantee. Idle system sleep is a separate policy the page cannot control, although Windows, and a Mac running Chrome, do not idle-sleep while the browser holds the display on. For a machine that stays awake with the display off, use a native utility such as PowerToys Awake or `caffeinate`.

### Why does my iPhone lock the screen anyway?

Low Power Mode forces a 30-second Auto-Lock. Turn it off in Settings, then Battery. Safari needs iOS 16.4 or later, and a Home Screen web app needs iOS 18.4. Below those versions, AwakeTab offers the video fallback. [Keep your iPhone screen on in Safari](/on/iphone-safari) has the full steps.

## Faces, backgrounds and sound

### How do I change the clock face?

Tap **Faces** in the top bar, or the small face in the dock while a session runs, or press `F`. The gallery groups all 46 faces as Featured, Digital, Analog and Ambient, with a search field, and tapping a tile applies it straight away. Every face is free and has a light, a dark and an OLED version. With reduced motion turned on, faces update without flipping, rolling or sweeping.

### Can I change the colours and the background?

Yes. **Vibe** (`V`) sets one of six living backgrounds: Aurora, Night sky, Rain on glass, Sunset, Lava lamp or Calm, with a Still, Calm or Lively motion setting. **Settings** (`,`) has the theme as four cards, System, Light, Dark and OLED, and Face studio for an accent colour and glow of your own. The colours that carry a state, green for awake, amber for paused and red for refused, never change.

### Does the ambient sound keep the screen awake?

No. Sound never keeps the screen awake; the pill is still the only sign that it is. Open **Settings → Ambient sound** to mix rain, café, fireplace and brown noise. They are made live in your browser, nothing plays or downloads until you ask, and the mix stops when the session ends.

## The video fallback and battery

### What is the video fallback, and when does it run?

It is a silent, invisible video, so the browser treats media as playing and keeps the display on. It runs only when you choose it: where there is no Screen Wake Lock API, or from Help & fixes after the browser refuses the lock. The pill then starts with "Awake via video". It needs the tab visible and uses a little more battery than a native lock.

### How much battery does it use, and can I leave it running overnight?

The lock itself costs almost nothing; the lit screen is what drains the battery. Plug in, dim the display, and consider the [night clock](/for/night-clock) on an OLED screen. The OLED theme keeps the page pure black, and **Dim at night** in Settings softens the clock after 10:00 PM.

## Price and privacy

### Is it free, and what happens to my data?

Free, with no sign-up. Settings, the current session, your presets and your history stay in this browser, with no cookies and no fingerprinting. Visits and sessions are counted only if you press Allow on "Count this visit?", anonymously and without cookies, and feedback is sent only when you choose to send it. There are no ads on the timer, now or later.

All of this is free, with no account:

::rows free

### How do I tell you something is wrong?

Open **Settings → Send feedback**, or `Ctrl K` and type "feedback". Pick a rating, tick a topic and add a note if you like; your browser and device type are attached, and nothing that names you. There is no support email, so feedback is the one channel, and we read every message.

Ready to try it? [Open AwakeTab](/), tap Keep awake and watch the pill.

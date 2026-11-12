---
title: "Keep the screen on while presenting — AwakeTab"
description: "Full-screen slides hide the AwakeTab tab, so the browser stops keeping the screen on. Use the mini clock, AwakeTab for Chrome or a longer timeout."
h1: "Keep the screen on while presenting"
intent: "keep screen on during presentation"
secondaryQueries:
  - "stop laptop screen turning off during presentation"
  - "projector turns off during presentation"
  - "keep screen awake powerpoint"
  - "keep mac awake during keynote"
preset: p120
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["windows", "macos", "chromeos", "linux"]
lead: "Yes, AwakeTab can keep the screen on while you present, with one catch. When your slides go full screen, they hide the AwakeTab tab, and the browser stops keeping the screen on. So keep AwakeTab visible another way: the mini clock in desktop Chrome, Edge or Firefox; AwakeTab for Chrome, which works with the tab hidden; a second window on your own screen; or a longer display timeout for the talk."
crumb: "Presentations"
toc:
  set-it-up-before-youre-introduced: "Set it up"
  what-to-expect-during-the-talk: "What to expect"
  four-ways-to-keep-it-on: "Four ways to keep it on"
  the-projector-and-second-displays: "Projectors and second displays"
steps:
  - title: "Start a session that ends with your slot."
    text: "Pick 2 hours, the longest timed length, or No end for a longer slot. Tap Keep awake and wait for the pill to read \"Awake\"."
  - title: "Open the mini clock, or turn on the extension."
    text: "Start the slideshow. The mini clock should still say \"Awake\"."
  - title: "Rehearse once."
    text: "Leave the slideshow running, untouched, for longer than your display timeout. If the screen stays on, you're set."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "the AwakeTab mini clock reading Awake"
    caption: "The mini clock."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "full-screen slides in Chrome with the AwakeTab mini clock in a corner"
    caption: "Full-screen slides with the mini clock in a corner."
pills:
  - state: held
    text: "With a running time, the display, and the projector with it, is being kept on."
  - state: lost
    text: "Full-screen slides cover AwakeTab, and the normal display timeout is back in charge."
  - state: denied
    text: "The browser refused the lock. A red banner under the top bar names the cause; tap See the fix before you go on stage."
checklist:
  - "The session covers your slot: 2 hours, or No end."
  - "In Settings, \"Chime at the end\" is Off, so no sound lands in the Q&A."
  - "On an extended display, AwakeTab is on your laptop and the slides on the projector."
  - "A rehearsal past your display timeout kept the screen on."
faq:
  - q: "My slides app is in full screen. Why did the pill change?"
    a: "Full screen covers the AwakeTab tab, and browsers only keep the screen on for a page you can see. The pill reads “Paused” until the tab is visible again."
  - q: "Will the audience see AwakeTab on the projector?"
    a: "Only if you put it there. With an extended display, keep the mini clock or the AwakeTab window on your laptop screen and the slides on the projector. When you mirror the display, the mini clock shows on both, so drag it into a corner or rely on AwakeTab for Chrome instead."
  - q: "Can I stop it at the end of the talk without touching the laptop?"
    a: "Yes. Pick a timed length such as 2 hours before you start: the session ends by itself and the screen sleeps normally again. In Settings, set “Chime at the end” to Off so no sound lands in the Q&A."
  - q: "Does a longer display timeout on a shared lectern PC cause problems?"
    a: "It can, because the next person inherits it. If you change the timeout for your talk, put it back afterwards. A tab or the extension leaves the settings alone and stops when you tell it to."
honestLimit: "Full-screen slides hide the AwakeTab tab, and then the screen follows its normal timeout. The projector follows that same timeout. Keep AwakeTab visible in a mini clock or second window, or use AwakeTab for Chrome."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/guides/lock-screen-vs-sleep"
  - "/for/classroom"
  - "/extension"
  - "/guides/second-monitor-turns-off"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up before you're introduced

::steps

::figures

::ad

## What to expect during the talk

A browser keeps the screen on only for a page that is visible. PowerPoint, Keynote or Google Slides in full screen covers the AwakeTab tab, so the browser releases the wake lock. From that moment, your computer's normal display timeout runs again.

The pill at the top of the tool tells you what the browser is doing:

::pills

## Four ways to keep it on

| Option | Where it works | What to know |
|---|---|---|
| Mini clock | Desktop Chrome and Edge 116 or later, Firefox 151 or later | Stays on top of other windows. Not in Safari or on Android |
| AwakeTab for Chrome | Chrome and Edge on a computer | Uses Chrome's power setting, so the tab can be hidden or minimised |
| A second window on your screen | Any browser, with an extended display | Slides full screen on the projector, AwakeTab visible on the laptop |
| A longer display timeout | Any computer where you can change settings | Free and certain, but remember to set it back |

**The mini clock** is the quickest. While a session runs, press ⌘K (Ctrl K on Windows), type "mini" and choose **Open the mini clock**; the browser may ask you to allow pop-ups for awaketab.com. Whether it keeps the screen on while full-screen slides cover the main tab is not yet device-tested; the result will go on our how-we-tested page. Until then, rehearse.

**[AwakeTab for Chrome](/extension)** is the most dependable choice for full-screen slides. It asks the browser itself to keep the display on while the browser runs, whatever window is in front.

**A longer timeout** is the right answer on your own laptop if you present often. The steps are in [Keep the screen on in Windows 11](/on/windows-11) and on [the Mac page](/on/macos).

## The projector and second displays

A projector or second monitor follows your laptop's display timeout, so it stays on while AwakeTab keeps the display on. A projector that turns itself off after losing the signal is using its own setting; [Fix a second monitor that turns off](/guides/second-monitor-turns-off) covers that case.

A work lock policy is different: if your laptop locks during a long Q&A, AwakeTab won't prevent that. [Lock screen versus display sleep](/guides/lock-screen-vs-sleep) explains the difference. Teaching a class? See [keep the classroom screen on while you teach](/for/classroom).

## Before the talk starts

::checklist

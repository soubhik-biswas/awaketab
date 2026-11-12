---
title: "Keep the classroom screen on while you teach — AwakeTab"
description: "Keep a teacher laptop or classroom display on through the lesson, with no install and no admin rights. A school lock policy still applies; ask IT."
h1: "Keep the classroom screen on while you teach"
intent: "keep classroom screen on"
secondaryQueries:
  - "stop teacher laptop going to sleep during lesson"
  - "keep school chromebook screen on"
  - "keep projector on during class"
  - "classroom clock that keeps screen on"
preset: p60
mode: clock
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "safari", "firefox"]
os: ["chromeos", "windows", "macos", "ipados"]
lead: "AwakeTab keeps the classroom screen on through the lesson, with no install and no admin rights. It keeps the display on while this tab is visible. A school policy that locks the screen still applies, so ask IT about the timeout. Before the lesson, open AwakeTab on the teacher laptop, pick 1 hour or 2 hours to cover the lesson, then leave it on screen as a clock the class can read."
crumb: "Classroom"
toc:
  set-it-up-before-the-bell: "Set it up"
  what-to-expect-during-the-lesson: "What to expect"
  a-clock-or-countdown-the-class-can-see: "A clock or countdown"
  school-managed-chromebooks-and-windows-laptops: "School-managed devices"
steps:
  - title: "Open AwakeTab on the teacher laptop."
    text: "Use Chrome, Edge, Safari or Firefox. Pick 1 hour for a one-hour class or 2 hours for a double lesson. The line under the button shows when it will end, such as 10:50 AM."
  - title: "Choose a face the class can read."
    text: "Open Faces: Bold shows the time left in large digits, and Ring shows a countdown ring. Optional: in Settings, set \"Chime at the end\" to Off."
  - title: "Tap Keep awake."
    text: "Within a second or two, the pill should read \"Awake\"."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "AwakeTab on the Bold face, showing the time left in large digits"
    caption: "The Bold face, readable from the back of the room."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "AwakeTab's clock on a classroom board, with lesson notes on the teacher laptop"
    caption: "The clock on the board, notes on the laptop."
pills:
  - state: requesting
    text: "AwakeTab has asked the browser. It takes a second or two."
  - state: held
    text: "The laptop display, and a board connected to it, stays on through the lesson."
  - state: lost
    text: "Full-screen slides or another window cover AwakeTab. Uncover it and AwakeTab asks again."
  - state: denied
    text: "The browser refused. The card on the teacher device says why, for example that Safari on an iPad still needs one tap."
checklist:
  - "The length covers the lesson: the pill names the end time, such as 10:50 AM."
  - "AwakeTab is on a display that full-screen slides won't cover."
  - "\"Chime at the end\" in Settings is set the way you want it."
  - "You know whether your school also locks the laptop after a set time. If it does, ask IT."
faq:
  - q: "Will I still have to type my password in the middle of a lesson?"
    a: "Not if the prompt comes from the screen timing out: with the display kept on, it never gets there. If your school also locks the laptop after a set time without input, that lock still happens. Only IT can change it."
  - q: "Can I use it on a school Chromebook?"
    a: "Yes, in Chrome, while its tab is visible. Your school’s admin settings still decide the rest: a power or lock policy wins, and closing the lid sleeps the Chromebook unless the lid setting has been turned off. If wake locks are switched off, the pill tells you so."
  - q: "Is anything recorded about my students?"
    a: "No. AwakeTab has no accounts, no sign-in and no cookies, and it never asks for a name. Settings stay in the browser on your device. Anonymous usage counts are on by default, carry no personal details, and can be turned off in Settings."
  - q: "Can the class see a countdown for an activity?"
    a: "Yes. Pick a length such as 15 min and use the Ring face for the ring and the minutes left, or Bold for large digits. When it ends you get a chime, or silence if you set \"Chime at the end\" to Off."
honestLimit: "AwakeTab keeps the display on only while its tab is visible on the teacher device. A school lock policy, an admin who has switched wake locks off, or a closed Chromebook lid still wins."
related:
  - "/for/presentations"
  - "/on/chromebook"
  - "/guides/lock-screen-vs-sleep"
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/extension"
author: soubhik
published: 2026-09-27
updated: 2026-09-27
---

## Set it up before the bell

::steps

::figures

::ad

## What to expect during the lesson

Teacher laptops often turn the display off, or sleep, after a few minutes without a key press. AwakeTab deals with that display timeout, and nothing more. A separate rule that locks the laptop after a set time still runs. Not sure which one is catching you? Read [Lock screen versus display sleep](/guides/lock-screen-vs-sleep).

A projector or board connected as a second display follows your laptop's display timeout, so it stays lit too. With an extended display, put the clock on the board and your notes on the laptop. Slides in full screen on the same display cover AwakeTab; [keep the screen on while presenting](/for/presentations) covers the mini clock and other options.

The pill at the top of the tool tells you what the browser is doing:

::pills

## A clock or countdown the class can see

The Bold face shows the time left in large digits, and Settings switches the clock between 12-hour and 24-hour time. For a timed task, start a 15-minute or 30-minute session on the Ring face: the ring and the minutes left are visible across the room, and a chime marks the end.

## School-managed Chromebooks and Windows laptops

On a device your school manages, the administrator's settings come first. Google's own Chromebook Help says that at work or school "you might not be able to change your sleep settings" ([Google Chromebook Help](https://support.google.com/chromebook/answer/3420029), checked 26 September 2026).

- **A power or lock policy set by an admin wins.** A policy that locks the device still locks it.
- **The lid still matters.** A Chromebook goes to sleep when you shut it, unless someone has switched off "Sleep when cover is closed". Windows laptops usually sleep on lid close too.

If the timeout is too short for teaching, ask IT whether teacher devices can have a longer display timeout during lessons. That fixes it for every app, not only a browser tab. [Keep a Chromebook screen on](/on/chromebook) has the Chromebook settings.

If your school allows extensions, [AwakeTab for Chrome](/extension) keeps the screen on even with the tab hidden behind full-screen slides.

## Before the lesson starts

::checklist

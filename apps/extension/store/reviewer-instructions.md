# AwakeTab reviewer instructions

Product: AwakeTab — Keep your screen awake. Minimum Chrome: 116.

Every feature is free and needs no account, licence, website login or payment.

## Core flow

1. Install the package and pin the AwakeTab toolbar icon. No tab opens on install.
2. Open the popup. It reads Ready, with 1h picked. Click "Keep this tab awake": the status becomes "Awake · 60 min" after Chrome accepts `chrome.power.requestKeepAwake('display')`, and the toolbar badge shows the minutes left on a green badge.
3. Switch tabs or bring another app to the front: the display stays awake. Reopen the popup and click Pause: the badge shows an amber II and the keep-awake is released. Resume asks again; Stop (shown while paused) ends the session and clears the badge.
4. Pick ∞ for no end: the badge shows ∞. Alt+Shift+A starts or stops from any tab; Chrome's extension shortcut settings can change it.
5. When a timed session ends, the keep-awake is released and an optional chime plays from an offscreen document.
6. Open Options (right-click the icon → Options). Turn "Show time left on the icon" off: the badge reads ON instead of minutes. "Release when the tab is hidden" pauses the session while its tab is not on screen and resumes it when you come back.
7. To try auto-wake: visit an https site, click the AwakeTab icon there (this grants activeTab for that tab), return to Options and click "+ Add this site". Chrome asks for access to that one site. Reloading that site starts a session; closing its last tab stops it.

## Limits and permissions

`power`, `alarms`, `storage`, `offscreen` and `activeTab` are required. Optional HTTPS host access is requested one chosen site at a time; no site is granted on installation. The extension never reads page content and does not simulate keyboard or mouse activity.

The extension works only while Chrome runs. It cannot override a deliberately locked device, a closed laptop lid or an enterprise or OS power policy; when Chrome refuses, the popup says Blocked, the badge shows a red !, and "See the fix" opens the help page.

Public privacy policy: [PRIVACY POLICY URL]

Help: [HELP CENTRE URL]

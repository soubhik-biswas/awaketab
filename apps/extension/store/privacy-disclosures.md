# AwakeTab privacy form preparation

Use these implementation facts when completing the store's current form. The answers must match what the build really sends and the public privacy policy. Have legal review the answers and the policy before submitting.

## Single purpose

Keeps the computer's display awake for a length of time the user chooses, and shows how much time is left.

## Permission explanations

The justification text for each permission is in [the listing](listing.md#permission-justifications): `power`, `alarms`, `storage`, `offscreen`, `activeTab`, and optional host access requested one site at a time.

Remote code: No. Scripts, styles, fonts and icons are bundled.

## Data inventory

- **Data collected:** none by default. The extension sends no usage statistics and has no telemetry.
- **Stored on this device only:** settings (theme, face, last length, chime), the current session, minute totals, install metadata, the badge, auto-wake and release-when-hidden switches, the chosen auto-wake sites and a random device identifier. Chrome sync can copy the settings and the chosen sites between the user's own Chrome profiles; the developer never receives them.
- **Licence check:** the first release has no Pro and no sign-in. Only if an earlier build stored a licence on the device, it is checked against `https://awaketab.com/api/license/validate` about once a day, so a revoked one is dropped. Nothing in the extension depends on it.
- **Sold or transferred to third parties:** No. **Used for anything unrelated to the single purpose:** No. **Used for creditworthiness or lending:** No.

Ordinary network requests expose IP addresses to the first-party hosting service. The public policy describes server and network handling.

Public policy: https://awaketab.com/privacy#extension

Sources: [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).

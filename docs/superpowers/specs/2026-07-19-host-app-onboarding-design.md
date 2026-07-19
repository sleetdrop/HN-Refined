# Host App Onboarding Design

## Goal

Finish the first-release containing app so its naming, extension status, and
Safari enablement guidance are accurate on iPhone, iPad, and Mac without adding
a multi-screen onboarding flow.

## Product Naming

All user-visible app, extension, window, menu, and help-page names use
`HN Refined`. Xcode target names, product paths, Swift module names, bundle
identifiers, and source layout remain unchanged.

## iPhone and iPad

The containing app always shows the complete enablement path:

`Settings > Apps > Safari > Extensions > HN Refined`

It explicitly tells the user to turn on `Allow Extension` and set
`news.ycombinator.com` to `Allow`. This guidance remains visible regardless of
the reported extension state because the state API does not report website
permission.

On iOS and iPadOS 26.2 or later, the app uses
`SFSafariExtensionManager.getStateOfExtension` to show whether the extension is
on or off. Earlier systems retain useful static guidance and do not change the
project's deployment target. The app refreshes the reported state when its web
content becomes ready and whenever the application returns to the foreground.

The help content remains a single local page. It may scroll on small screens so
instructions are never clipped. It does not use private Settings URLs, remote
content, analytics, or additional permissions.

## Mac

The existing Safari extension state check and button that opens Safari Settings
remain. Only product naming and concise user-facing wording change. The host app
continues to terminate after handing the user to Safari Settings.

## Failure Behavior

Extension-state lookup is best-effort. An unavailable API, lookup error, or
unexpected result leaves the static instructions visible and does not show a
false enabled or disabled state.

## Verification

- Static tests cover display names, enablement wording, the iOS 26.2 availability
  guard, foreground refresh registration, and unchanged bundle identifiers.
- Existing app-host, packaging, permission, privacy, and workflow tests remain
  green.
- Build and inspect the host page on current iPhone and iPad simulators.
- Reinstall and inspect the macOS host app and Safari Settings handoff.
- Confirm small-screen content can scroll without clipping.

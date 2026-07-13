# Project Status

Last updated: 2026-07-13

HN Refined is a CSS-first Safari WebExtension for Hacker News. The product goal
is to improve readability, mobile ergonomics, and theme comfort while preserving
Hacker News behavior and information architecture.

## Current Implementation

- Host scope is limited to `https://news.ycombinator.com/*`.
- First-version release scope includes iOS and iPadOS Safari extension support,
  not only macOS Safari.
- The extension stores only local presentation preferences.
- No remote code, remote themes, analytics, arbitrary CSS, or third-party
  runtime resources are loaded.
- Default desktop presentation is `Comfortable`.
- Mobile responsive CSS rules are implemented for normal Safari browsing
  surfaces.
- The Xcode wrapper contains separate iOS, iPadOS, and macOS Safari extension
  targets generated from the Safari WebExtension converter. The repository-local
  build workflow syncs `extension/` into the Xcode wrapper before building.
- iOS simulator build, install, and host-app launch were verified on iPhone 17
  Pro / iOS 26.3. iOS Settings requires `Allow Extension` plus setting the
  `news.ycombinator.com` permission to `Allow`; the default `Ask` state did not
  prompt on Safari refresh. Live Hacker News pages were visually checked in iOS
  Safari on iPhone 17 Pro / iOS 26.3 across news, newest, ask, show, jobs,
  item/comment, submit, and login surfaces, including system dark appearance.
  The login-style forms need the mobile form-width guard because iOS Safari
  autofocus can otherwise pan/zoom horizontally on Hacker News' top-level login
  markup. iPad Air 11-inch / iOS 26.3 simulator checks covered logged-out news,
  item/comment, and submit/login pages plus logged-in news, submit, threads,
  profile/settings, and item/comment pages. Portrait and landscape layouts and
  fixed light and dark themes were checked. Top-level form spacing now applies
  beyond the phone breakpoint so iPad forms do not touch the viewport edge. The
  popup and options page fit in both orientations, and popup and options
  preference changes update open Hacker News tabs without a manual refresh. The
  normal iPad Safari page, popup, and options acceptance pass is complete.
- Private Browsing acceptance is complete on iPhone 17 Pro / iOS 26.3, iPad Air
  11-inch / iOS 26.3, and macOS Safari. With `Allow in Private Browsing` and the
  Hacker News site permission enabled, page injection, popup/options access,
  local preferences, forms, and immediate theme refresh behaved as expected.
- iOS/iPadOS Home Screen web apps are outside the supported iOS/iPadOS scope.
  iPhone simulator testing showed extension styling could appear in the
  independent web app container, but Safari preference changes and popup access
  were unavailable there. Apple documents Home Screen web apps as independent
  app containers and does not document an iOS/iPadOS extension-management UI
  for them. Do not add compatibility code for this surface.
- Theme, font, density, width, and external story-link target preferences
  exist.
- Mobile responsive layout is enabled by default instead of exposed as a
  first-version setting.
- External story links open in the current tab by default. New-tab behavior is
  opt-in and applies only to external story title links.
- Story-link behavior prefers Hacker News' current `.titleline` markup and has
  a small fallback to the surrounding story row structure for minor title-markup
  changes.
- Purely static information pages such as FAQ, guidelines, security, and legal
  documents are outside the first-version styling target. Do not add
  compatibility code solely to restyle those document-like pages.
- Toolbar popup is intentionally compact: theme quick switch, external
  story-link new-tab toggle, and a lightweight full settings entry.
- Full settings page is `extension/options/options.html`.
- Full settings are grouped by where preferences apply: shared appearance,
  desktop reading, and link behavior.
- App icon uses the full C4 design. Safari toolbar icons use the simplified
  B3f-2 small-size mark.
- The macOS host app has a native status window instead of a blank window.
- App Store and open-source readiness audits are tracked in
  `docs/release-readiness.md`. Store metadata has a first draft, contribution and
  security policies are present, and the project uses the MIT License.
- First-release public version surfaces are aligned at `1.0.0`; Xcode uses
  marketing version `1.0` and build number `1`.
- The final first-release Bundle IDs use the maintainer-owned `vetcafe.net`
  namespace: `net.vetcafe.hnrefined` for the app and
  `net.vetcafe.hnrefined.extension` for the Safari extension.

## Current Workflow

Use `make` targets as the stable interface:

```bash
make format
make lint
make check
make build-themes
make build-icons
make safari-reinstall
make safari-doctor
make safari-status
```

`make safari-reinstall` builds into `.build/xcode-derived-data`, installs the
signed app to `~/Applications/HNRefined.app`, unregisters stale HN Refined
Safari extension registrations, registers that installed app, and opens Hacker
News explicitly in Safari.

Do not use ad hoc `/tmp` builds or arbitrary Xcode DerivedData registrations.
They caused stale duplicate extension registrations during development.

## Guarded Regressions

The toolbar popup light/dark switch has regressed multiple times. Keep these
guards for popup-driven preference changes:

- `extension/shared/preference-messages.js` must notify all current-window
  Hacker News tabs, not only the active tab.
- `extension/content/content-script.js` must accept Safari storage change events
  where `areaName` is missing.
- The visible-page preference refresh fallback is intentional.
- Tests in `tests/preference-messages.test.js`, `tests/content-script.test.js`,
  and `tests/popup-behavior.test.js` cover this behavior.

Theme and style changes must be checked in both light and dark modes. Previous
dark-theme work accidentally affected light-theme navigation colors.

## Verification Baseline

Before claiming a code change is complete:

```bash
make format
make check
```

For Safari runtime work, also run:

```bash
make safari-reinstall
make safari-doctor
```

Then have the user test the real Safari extension when the behavior depends on
Safari UI or extension lifecycle behavior.

## Continuous Maintenance Rule

Future agents should keep this file and the project harness current as part of
normal development. Do not wait for a separate documentation sync. If a change
alters behavior, workflow, permissions, signing, Safari runtime assumptions,
verification commands, known regressions, or remaining-work guidance, update the
relevant docs and tests in the same change.

## Remaining Work Candidates

These are not all required for the next task, but they are useful starting
points for a fresh context:

- Run real Safari visual checks across front page, item/comment pages, forms,
  light theme, and dark theme after each style change. Static information pages
  can be sanity-checked for breakage, but they are not a required styling target.
- Register the explicit App IDs, create the App Store Connect record, confirm
  distribution signing, validate an archive, and capture release screenshots.
- Keep public README and App Store copy clear that HN Refined depends on the
  traditional Hacker News HTML structure, documents the iOS/iPadOS
  `Allow Extension` plus `news.ycombinator.com` permission steps, and accepts
  GitHub issues or pull requests for future site-compatibility fixes.

## Historical Planning Docs

Files under `docs/superpowers/` are historical specs and implementation plans.
They explain product decisions, but some commands and checklist items predate
the current Makefile workflow. Treat `docs/project-status.md` and
`docs/development.md` as the current operational source of truth.

# Project Status

Last updated: 2026-07-19

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
- HN Classic is the default font preset. System Sans, Serif, and the intentional
  retro Mono-ish option remain explicit alternatives. Mono-ish uses the
  Apple-native `Menlo, Monaco, ui-monospace, monospace` stack without bundled
  font resources.
- Automatic accessibility enhancements remain CSS-only. The
  `prefers-contrast: more` media query strengthens secondary colors across all
  themes, and `:focus-visible` exposes keyboard focus without JavaScript or a
  new setting. Comment fragment navigation and target visuals remain owned by
  Hacker News. Real Safari acceptance passed on macOS for Increase Contrast and
  keyboard focus, and on the iPhone simulator for Increase Contrast and ordinary
  touch behavior.
- Mobile comment editors keep the original Hacker News form visible in a
  two-row compact state, expand to six rows on first focus, and expose small
  equal-size CSS triangle controls that adjust by four rows between 2 and 22.
  The enhancement requires a narrow viewport and a coarse pointer; desktop
  comment textareas retain Hacker News' original rows and mouse resizing.
- Mobile layout is automatic instead of exposed as a first-version setting.
  Preference normalization discards the legacy `mobileLayout` state, while the
  content script always applies the existing `data-hnr-mobile="auto"` CSS
  binding.
- Narrow item pages wrap long author-supplied `.toptext` content before it can
  widen Hacker News' nested tables. The `#bigbox` content cell also reserves a
  12 px inline-end gutter from Safari's overlay scroll indicator without
  changing Hacker News' table layout or hiding overflow.
- The narrow footer Algolia search preserves Hacker News' centered two-line
  presentation. Its input is block-level and centered inside 12 px inline form
  gutters so font presets cannot force the field beyond the viewport.
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
  reading layout, and link behavior. Reading layout names Mac and wider iPad
  layouts rather than implying that every density effect is desktop-only.
- App icon uses the full C4 design. Safari toolbar icons use the simplified
  B3f-2 small-size mark.
- The containing app uses the user-visible name `HN Refined` while preserving
  existing Xcode target names, wrapper/executable paths, Swift modules, and
  bundle identifiers. Its iPhone/iPad help page
  gives the complete `Settings > Apps > Safari > Extensions > HN Refined` path
  and keeps both `Allow Extension` and the `news.ycombinator.com` site permission
  requirement visible. On iOS 26.2 and iPadOS 26.2 or later,
  `SFSafariExtensionManager` reports and refreshes enabled state; older systems
  and lookup failures retain static instructions. Enabled state does not reveal
  website permission. The macOS host continues to show extension state and open
  Safari Settings.
- App Store and open-source readiness audits are tracked in
  `docs/release-readiness.md`. Store metadata has a first draft, contribution and
  security policies are present, and the project uses the MIT License.
- First-release public version surfaces are aligned at `1.0.0`; Xcode uses
  marketing version `1.0` and build number `1`.
- The final first-release Bundle IDs use the maintainer-owned `vetcafe.net`
  namespace: `net.vetcafe.hnrefined` for the app and
  `net.vetcafe.hnrefined.extension` for the Safari extension.
- All iOS/macOS app and extension build configurations use a tracked shared
  signing `.xcconfig` that optionally loads an ignored developer-local Team ID.
  Interactive Xcode builds no longer require personal signing values in
  `project.pbxproj`; CLI builds retain automatic certificate-based overrides.

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

Hacker News declares Verdana directly on navigation, title, metadata, footer,
and comment classes. Keep those explicit site font selectors in the shared
`--hnr-font-family` binding so every HN Refined preset remains visually
consistent. Native form editing fonts and extension-owned settings UI remain
independent.

HN Classic remains the default font, and Mono-ish remains available as an
intentional retro choice. Mobile layout remains automatic: do not restore a
user-facing switch or accept the legacy `mobileLayout` preference. Keep setting
`data-hnr-mobile="auto"` so responsive fixes cannot be disabled by stale storage.

Hacker News story submission text uses `.toptext` and otherwise inherits the
site's muted `td` color. HN Refined treats `.toptext` as primary reading content
while leaving story metadata muted.

Mobile comment-editor behavior binds to
`#hnmain form[action="comment"] textarea[name="text"]`. Keep its row controls
inside the narrow coarse-pointer breakpoint, preserve textarea focus during
touch adjustments, restore Hacker News' original rows outside that breakpoint,
and do not read comment text or intercept the original form.

Mobile item overflow handling binds to `.toptext` and the direct content cell of
`#bigbox`. Keep its wrapping and inline-end gutter inside the width-based mobile
breakpoint. Do not replace this targeted fix with `overflow-x: hidden`, fixed
table layout, or JavaScript content inspection.

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
- Before purchasing the developer membership, complete a multi-day
  physical-iPhone Personal Team burn-in. The unsigned iOS and macOS Release
  archive preflights are complete.
- Keep public README and App Store copy clear that HN Refined depends on the
  traditional Hacker News HTML structure, documents the iOS/iPadOS
  `Allow Extension` plus `news.ycombinator.com` permission steps, and accepts
  GitHub issues or pull requests for future site-compatibility fixes.

## Historical Planning Docs

Files under `docs/superpowers/` are historical specs and implementation plans.
They explain product decisions, but some commands and checklist items predate
the current Makefile workflow. Treat `docs/project-status.md` and
`docs/development.md` as the current operational source of truth.

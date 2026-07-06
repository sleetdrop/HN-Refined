# Project Status

Last updated: 2026-07-06

HN Refined is a CSS-first Safari WebExtension for Hacker News. The product goal
is to improve readability, mobile ergonomics, and theme comfort while preserving
Hacker News behavior and information architecture.

## Current Implementation

- Host scope is limited to `https://news.ycombinator.com/*`.
- The extension stores only local presentation preferences.
- No remote code, remote themes, analytics, arbitrary CSS, or third-party
  runtime resources are loaded.
- Default desktop presentation is `Comfortable`.
- Mobile responsive and standalone/PWA-like CSS rules are implemented for normal
  Safari browsing surfaces.
- Theme, font, density, width, mobile layout, and external story-link target
  preferences exist.
- External story links open in the current tab by default. New-tab behavior is
  opt-in and applies only to external story title links.
- Toolbar popup is intentionally minimal: theme quick switch plus full settings
  entry.
- Full settings page is `extension/options/options.html`.
- App icon uses the full C4 design. Safari toolbar icons use the simplified
  B3f-2 small-size mark.
- The macOS host app has a native status window instead of a blank window.

## Current Workflow

Use `make` targets as the stable interface:

```bash
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
guards:

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
make check
```

For Safari runtime work, also run:

```bash
make safari-reinstall
make safari-doctor
```

Then have the user test the real Safari extension when the behavior depends on
Safari UI or extension lifecycle behavior.

## Remaining Work Candidates

These are not all required for the next task, but they are useful starting
points for a fresh context:

- Polish the full settings page into grouped sections: Appearance, Reading
  Layout, Mobile Behavior, and Link Behavior.
- Decide whether settings should visually mark desktop-only, mobile-only, and
  shared preferences.
- Run real Safari visual checks across front page, item/comment pages, forms,
  static pages, light theme, and dark theme after each style change.
- Verify iOS and iPadOS behavior on simulator or device, including whether
  Safari extensions apply inside home-screen web app containers.
- Verify Private Browsing behavior when the extension is allowed.
- Refresh App Store review, signing, privacy label, and distribution notes
  against current Apple documentation before public release.
- Add release/package preparation when the project is ready for App Store work.

## Historical Planning Docs

Files under `docs/superpowers/` are historical specs and implementation plans.
They explain product decisions, but some commands and checklist items predate
the current Makefile workflow. Treat `docs/project-status.md` and
`docs/development.md` as the current operational source of truth.


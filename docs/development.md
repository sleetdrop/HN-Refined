# Development

Use the `Makefile` targets as the stable development interface. Humans and AI
agents should prefer `make` commands first; npm scripts, shell scripts, and
`xcodebuild` are lower-level implementation details behind those targets.

Run all local checks:

```bash
make check
```

Format changed source and documentation files:

```bash
make format
```

Run non-writing lint and format checks:

```bash
make lint
```

Build theme CSS:

```bash
make build-themes
```

Regenerate app and extension icon PNGs:

```bash
make build-icons
```

Icon generation uses the committed SVG sources in `assets/icon/` and requires
`rsvg-convert` from `librsvg`.

Run tests:

```bash
make test
```

Build the iOS/iPadOS Safari host app:

```bash
make safari-build-ios
```

## Quality Toolchain

The quality gate is intentionally small and agent-friendly:

- Biome formats and lints JavaScript, CSS, JSON, Node scripts, and tests.
- Prettier formats Markdown, HTML, and YAML.
- Swift does not yet use a separate formatter or linter because the native host
  app surface is small; rely on Xcode build validation through the Safari
  workflow when touching Swift.

Use `make format` before committing ordinary code or documentation changes, then
use `make check` as the final local gate. Use `make lint` when you need the same
format and lint checks without modifying files.

## Continuous Harness Maintenance

Do not treat handoff docs, workflow docs, and tests as occasional cleanup work.
Every change should include a quick docs-and-harness impact check.

Update the relevant files in the same change when work affects:

- Product behavior or first-version scope.
- Safari runtime behavior, signing, registration, or local install workflow.
- Permissions, privacy posture, App Store review posture, or remote-resource
  safety.
- Generated assets, build commands, test commands, or CI behavior.
- Known regressions or rules that future agents must preserve.
- Remaining-work guidance that a fresh agent would use to pick up the project.

Common files to review are `AGENTS.md`, `docs/project-status.md`,
`docs/development.md`, `docs/privacy.md`, `docs/app-store-checklist.md`,
`docs/safari.md`, `.github/workflows/ci.yml`, and tests that lock workflow or
handoff behavior.

## Safari Local Development

Use one workflow for local Safari testing:

```bash
make safari-reinstall
```

This builds into repo-local `.build/xcode-derived-data`, copies the app to
`~/Applications/HNRefined.app`, unregisters stale HN Refined Safari extension
entries, registers only that installed app, and opens Hacker News explicitly in
Safari.

The unregister step intentionally recognizes the pre-release
`org.hnrefined.HNRefined` identifiers as well as the final
`net.vetcafe.hnrefined` identifiers. Keep that narrow migration cleanup until
old local development registrations are no longer relevant.

Do not register builds from `/tmp` or random Xcode DerivedData paths. Those
paths make Safari keep stale extension registrations and make toolbar popup
debugging unreliable.

Useful commands:

```bash
make safari-status
make safari-doctor
make safari-unregister
```

The workflow does not quit or restart Safari. If Safari is already open, reload
the Hacker News tab after reinstalling.

The workflow briefly opens the host app so macOS can discover the extension,
then closes it. To keep the host app open for visual inspection:

```bash
HNREFINED_KEEP_HOST_APP=1 make safari-reinstall
```

## iOS and iPadOS Local Development

iOS and iPadOS support is part of the first-version release scope. The current
Xcode wrapper was rebuilt with Safari WebExtension converter support for all
platforms and now contains `HNRefined (iOS)` and `HNRefined (macOS)` schemes.

Use the repo workflow instead of building stale copied extension resources by
hand:

```bash
make safari-build-ios
```

The default iOS destination is `generic/platform=iOS Simulator`. Override it
when you need a specific simulator or device:

```bash
HNREFINED_IOS_DESTINATION="platform=iOS Simulator,name=iPhone 17" make safari-build-ios
```

If simulator services are unavailable inside an agent sandbox, do not treat that
as a product limitation. Run the exact command in a normal local terminal or ask
the human maintainer to approve it. Keep build output in repo-local
`.build/xcode-derived-data` and do not register arbitrary `/tmp` or DerivedData
apps with Safari.

Installing a rebuilt app on a simulator can reset the Safari extension toggle
or return the site permission to `Ask`. After reinstalling, recheck `Allow
Extension` and set `news.ycombinator.com` to `Allow` before judging page
injection or popup behavior.

## Safari Popup Preference Refresh

Do not regress popup theme changes back to active-tab-only messaging. Safari's
toolbar popup does not reliably behave like a normal page tab, so popup-driven
preference changes must notify all current-window Hacker News tabs with
`tabs.query({ currentWindow: true, url: HN pattern })`.

The Hacker News content script also must tolerate Safari storage change events
where `areaName` is missing, and it keeps a lightweight visible-page refresh
fallback. These are intentional guards for the recurring bug where choosing
light or dark in the toolbar popup only takes effect after manually refreshing
the Hacker News page. Keep the compact popup limited to high-frequency controls:
theme, external story-link new-tab behavior, and the full settings entry.

## Hacker News Page Scope

HN Refined targets the normal interactive Hacker News surfaces: front page,
story lists, item/comment pages, forms, and the account/navigation pages that
share the traditional Hacker News table structure.

Purely static information pages such as `newsfaq.html`,
`newsguidelines.html`, `security.html`, and YC/legal documents are outside the
first-version styling target. Safari may open some of them in Reader View, and
their document-like HTML can be edited independently from the main Hacker News
application. Do not add special selectors, compatibility layers, or active
behavior just to restyle those static pages; document the limitation instead.

On item pages, author-supplied story text is rendered in `.toptext`. Hacker News
otherwise lets it inherit the muted table-cell color, but HN Refined treats this
as primary reading content. Keep the semantic `#hnmain .toptext` color override
separate from `.subtext`, scores, ages, domains, and other muted metadata.

## Mobile Comment Editor

The mobile comment-editor enhancement binds to the semantic Hacker News form
selector:

```css
#hnmain form[action="comment"] textarea[name="text"]
```

The content script preserves Hacker News' original `rows`, uses 2 rows on mobile,
expands to 6 on first focus, and provides native buttons with equal-size CSS
triangle icons that adjust by 4 rows within a 2 through 22 range. Pointer
adjustments preserve an active textarea's focus and keyboard. CSS presents the
controls on the Hacker News help row inside the phone breakpoint and uses a
shared 28 px right gutter for the textarea and controls.

Both JavaScript behavior and comment-editor CSS require
`(max-width: 700px) and (any-pointer: coarse)`. Do not reduce this to a width-only
query: narrow macOS Safari windows must retain Hacker News' native rows and
mouse-driven textarea resizing. Other responsive page styling remains
width-based.

Do not replace the textarea, read its text, persist editor size, depend on the
optional Hacker News `?` help link, or intercept the original form. Viewports
outside the narrow coarse-pointer query must restore Hacker News' original row
count.

Real Safari checks must cover iPhone virtual-keyboard behavior, symmetric
textarea gutters, all row limits, preserved text and focus during size changes,
and an unchanged desktop item page.

## Signing

The committed project does not include a personal Apple development team id.
That value is developer-local and should not be committed. All app and extension
targets use `HNRefined/Config/Signing.xcconfig`, which optionally includes the
ignored sibling file `Signing.local.xcconfig`.

For interactive Xcode device builds, create the local file with your Team ID:

```xcconfig
DEVELOPMENT_TEAM = YOUR_TEAM_ID
```

Xcode resolves this value for iOS, iPadOS, and macOS Debug/Release builds without
writing it into `project.pbxproj`. Do not select and persist a team at the target
level after this file exists; target-level settings take precedence and make the
shared project dirty again.

To use a signed local build, first create an Apple Development signing identity
in Xcode. The install script reads the first available `Apple Development`
identity, derives the real Xcode team id from the certificate `OU`, and passes
that team id to `xcodebuild`. The copied app is not re-signed after build;
`~/Applications/HNRefined.app` keeps the signature produced by Xcode.

If you need to choose a specific identity, run:

```bash
HNREFINED_SIGNING_IDENTITY="Apple Development: you@example.com (TEAMID)" make safari-reinstall
```

Check whether the machine currently has a signing identity:

```bash
security find-identity -v -p codesigning
```

If that command reports `0 valid identities found`, local Safari testing still
depends on Safari Developer settings allowing unsigned extensions. Safari may
clear that setting after restart, so verify it before treating missing toolbar
UI as an extension bug.

`HNREFINED_DEVELOPMENT_TEAM` is still available if automatic detection chooses
the wrong team. Command-line build settings take precedence over the local
configuration, so the existing Makefile workflow remains unchanged.

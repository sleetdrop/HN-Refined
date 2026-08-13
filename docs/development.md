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

Use `docs/codex-workflow.md` for task boundaries, model routing, handoffs, and
the risk-scaled verification ladder. New Codex tasks start with
`docs/current-state.md`; this document is a domain reference, not mandatory
startup context for every change.

Do not treat handoff docs, workflow docs, and tests as occasional cleanup work.
Every change should include a quick docs-and-harness impact check, but update
only files whose durable truth changed.

Update the relevant files in the same change when work affects:

- Product behavior or first-version scope.
- Safari runtime behavior, signing, registration, or local install workflow.
- Permissions, privacy posture, App Store review posture, or remote-resource
  safety.
- Generated assets, build commands, test commands, or CI behavior.
- Known regressions or rules that future agents must preserve.
- Remaining-work guidance that a fresh agent would use to pick up the project.

Use the routing in `AGENTS.md` to choose the relevant owner. Do not mechanically
edit `docs/project-status.md`, privacy, App Store, release, and workflow files
for an isolated implementation change. Update `docs/current-state.md` when the
release position, active outcomes, blockers, or next-task guidance changes.

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

## Containing App Onboarding

The containing app's user-visible name is `HN Refined`; Xcode target names,
product paths, Swift modules, and bundle identifiers intentionally retain their
existing internal names. On iPhone and iPad, the local help page always shows
the complete path `Settings > Apps > Safari > Extensions > HN Refined`, then
requires both `Allow Extension` and the `news.ycombinator.com` site permission
set to `Allow`.

On iOS 26.2 and iPadOS 26.2 or later, the containing app uses
`SFSafariExtensionManager` as a progressive enhancement to report whether the
extension is on and refreshes that state when the app returns to the foreground.
Older systems and lookup failures retain static setup guidance. Enabled state
does not report website permission, so the site-permission instruction must
remain visible even when the extension is on. Do not add private Settings URLs
or raise the deployment target solely for this status display.

The macOS host explicitly loads the packaged `AppIcon.icns` as its runtime icon.
Keep this guard while its user-visible product name is separated from the stable
wrapper and executable names; otherwise the running app can show an incomplete
white document mark in the Dock even though Finder resolves the bundle icon.

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

The shared macOS, iPhone, and iPad popup uses dynamic system colors and Safari's
native `switch` control. Keep the selected theme segment and enabled switch on
the system accent color, while `All Settings` remains a neutral navigation row.
Fine-pointer layouts stay compact; coarse-pointer theme segments, the switch
row, and the settings entry keep a minimum 44 px activation height. Check light
and dark appearance, system accent colors, keyboard focus on macOS, and touch
behavior on iPhone and iPad after popup style changes.

The full settings page shares the same restrained system-native language. Keep
its existing sections and preference behavior, using continuous setting rows,
native `select` controls, and Safari's native `switch` controls for Thread
Focus and external story-link behavior. Mac and wider iPad layouts keep labels left and controls
right within a maximum content width of 680 px. Select rows stay side by side
above 360 px, including at ordinary iPhone widths. At 360 px and below, all
non-switch select rows stack together; coarse-pointer rows and controls keep a
minimum 44 px activation height.
Safari owns the native select focus appearance; do not add a separate custom
outline, while the native switch keeps its explicit system-color focus
indication.

After options-page visual changes, check system light and dark appearance,
accent colors, and keyboard focus on Mac; check portrait, landscape, touch
targets, native pickers, native switches, and horizontal overflow on iPhone and
iPad. Confirm that options changes still refresh open Hacker News tabs without a
manual reload.

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

On narrow item pages, `.toptext` uses `overflow-wrap: anywhere` so long
author-supplied URLs cannot widen Hacker News' nested tables. The direct content
cell of `#bigbox` keeps a 12 px inline-end gutter clear of Safari's overlay
scroll indicator. Keep both rules mobile-only; do not replace them with global
overflow clipping or fixed table layout.

On `newcomments`, Hacker News puts the full linked story title after `on:`
inside `.comhead`. Keep mobile `.comhead` anchors inline so that title can wrap
as ordinary metadata. Making every metadata link `inline-block` gives a long
title an intrinsic width that can widen the enclosing comment table and the
entire page. Verify this surface separately from item pages; their `.comhead`
links are usually too short to expose the regression.

The selected mobile `newcomments` feed uses restrained rhythm rather than a
title treatment: keep the established type scale and colors, add only modest
space between metadata, prose, and adjacent entries, and enlarge the vote
target with a non-layout pseudo-element without enlarging its triangle or
widening the `.votelinks` table cell. Scope these refinements through the
selected `newcomments` navigation state so item discussions and user threads
keep their accepted hierarchy. Do not introduce cards, backgrounds, dividers,
or block-level `.comhead` links.

The mobile footer search keeps Hacker News' established centered two-line
presentation. Bind only to the semantic Algolia form action, keep `Search:`
centered, and give its block-level input 12 px inline form gutters. Do not let
the shared mobile input width put the label and field back on one overflowing
line, and do not apply this exception to other forms.

## Font Preset Scope

HN Classic is the default font preset so installing the extension preserves
Hacker News' Verdana identity. System Sans and Serif provide deliberate reading
alternatives. Mono-ish remains an intentional retro option, not the default
prose recommendation. Its Apple-native stack starts with Menlo, falls back to
Monaco for the older Mac character, and retains `ui-monospace` as the WebKit
system fallback. Do not bundle a font for this optional preset.

Font presets apply to Hacker News reading content and its page-level navigation,
title, metadata, footer, and comment typography. Hacker News declares Verdana
directly on several of these classes, so the shared `--hnr-font-family` binding
must continue to cover each explicit site font selector. Native form editing
fonts and HN Refined's Popup and Options UI remain independent of the reading
preset.

Mobile reading sizes preserve Hacker News' native hierarchy with one shared
1.2x scale rather than independently enlarging selected pages. The 10 pt base
roles become 12 pt; admin, subtext, footer/comment metadata, and comment prose
keep their original relative steps. Verify navigation plus the primary body on
`newest`, `threads`, `front`, `newcomments`, `ask`, `show`, `jobs`, and `submit`
together so a local readability change cannot make one functional page appear
zoomed relative to another.

On the narrow top bar, keep Hacker News' table structure and natural navigation
wrapping. Top-align the account cell, and top-align the logo cell with only the
small inset needed to place `y18.svg` beside the `Hacker News` title row. Font
presets may change where the navigation links wrap, but must not make the logo
or account control move with the middle cell's height. Do not replace the header
row with flex/grid, position its edge cells absolutely, or force the navigation
onto a fixed number of lines.

Mobile layout is automatic and is not a user preference. The content script
always applies `data-hnr-mobile="auto"` for the responsive CSS binding. Shared
and content-script normalization must discard the legacy `mobileLayout` state,
including an old `off` value, so it cannot disable current mobile fixes.

## Automatic Accessibility Enhancements

HN Refined keeps system accessibility behavior automatic and CSS-only. The
`prefers-contrast: more` media query strengthens secondary colors for System,
Light, and Dark themes without adding a user preference. A shared
`:focus-visible` rule exposes keyboard focus without forcing focus rings after
ordinary pointer or touch interaction. Editable Hacker News controls use the
documented control surface, border, and warm focus tokens; links and ordinary
buttons retain the system keyboard-focus indication. Leave Safari's caret and
native select treatment intact.

Comment fragment navigation and its target visuals remain owned by Hacker News.
Do not add `:target` styling, fragment observers, timers, or DOM mutation to
mark the selected comment; doing so changes the site's basic visual language and
is inconsistent across macOS and iOS WebKit because Hacker News repeats comment
IDs.

Real Safari checks must cover macOS keyboard navigation and Increase Contrast
across all three theme choices, plus Increase Contrast on iPhone or iPad.

## Hacker News Color Semantics

Normal Light preserves official Hacker News colors for HN-defined roles. Dark
is an explicit semantic translation documented in `docs/color-semantics.md`;
do not derive it by inversion or flatten secondary roles into one accent. Keep
visited links, metadata, `.hnmore`, `.topsel`, new-account usernames, own-item
markers, YC-alumni usernames, and every `.c5a` through `.cdd` comment level on
their separate semantic variables.

HN's stylesheet can win the low-specificity global `a:link` rule because its
page stylesheet loads after the extension resource. Keep the semantic fallback
for ordinary HN application links scoped to `#hnmain`, then give metadata,
footer, and each comment fade an even more specific semantic selector. This
translates unclassed links on jobs, account, and footer surfaces without
flattening visited links or the downvote ladder. Do not replace this with a
broad table-cell color override or a generic inline-color selector.

Only the exact default `td[bgcolor="#ff6600" i]` header may use the mapped dark
top bar. A custom `topcolor` keeps its original background, dark navigation
text, selected white state, and unfiltered logo. Unknown inline colors pass
through unchanged. Known account and ownership colors may be translated only
through an exact structural selector and exact source color; do not add a
generic `font[color]` rule.

The original `y18.svg` remains the only logo asset. In Dark or System-dark on
the recognized default header, apply `saturate(0.78) brightness(0.9)` and
`opacity: 0.82`. Light and custom headers remain unfiltered. Leave HN's original
SVG voting triangle unchanged.

`prefers-contrast: more` uses explicit Light and Dark values for secondary
roles and every comment fade level. Tests must verify that each level gains
contrast against its background, the ladder stays strictly ordered, and `.cdd`
never becomes equivalent to ordinary `.c00` text.

After color changes, check fixed Light, fixed Dark, and System on story lists,
item/comment pages, forms, and Thread Focus. Also check visited links, active
top navigation, `.hnmore`, the full faded-comment ladder, a custom `topcolor`,
the default-header logo, macOS Increase Contrast, and Increase Contrast on
iPhone or iPad. Account-only new/own/YC signals require a suitable logged-in
account or retained fixture coverage.

## Mobile Text Editors

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

The submit page uses the separate semantic selector
`#hnmain form:not([action="comment"]) textarea[name="text"]`. It keeps Hacker
News' native six-row mobile starting height, does not expand on first focus, and
otherwise shares the same controls and 2 through 22 range. Its main textarea
measures the title field's rendered width so it remains exactly aligned with
the title and URL fields as WebKit's native textarea box model changes; only
comment editors reserve the 28 px control gutter. A Safari reinjection must
replace rather than duplicate the adjacent control pair. Do not broaden this
to arbitrary `textarea`: account `about` fields and other forms must remain
untouched.

Both JavaScript behavior and comment-editor CSS require
`(max-width: 700px) and (any-pointer: coarse)`. Do not reduce this to a width-only
query: narrow macOS Safari windows must retain Hacker News' native rows and
mouse-driven textarea resizing. Other responsive page styling remains
width-based.

Do not replace the textarea, read its text, persist editor size, depend on the
optional Hacker News `?` help link, or intercept the original form. Viewports
outside the narrow coarse-pointer query must restore Hacker News' original row
count.

Real Safari checks must cover iPhone virtual-keyboard behavior, semantic control
surfaces and warm focus rings in Light and Dark, symmetric textarea gutters,
all row limits, preserved text and focus during size changes, the submit page's
unchanged six-row initial state, and unchanged desktop item and submit pages.

## Mobile Comment Threads

Thread Focus is a default-on Boolean preference named `threadFocusEnabled`.
When it is enabled, every comment with replies can expose `focus`, regardless
of its original depth. A leaf and the current focused root do not expose the
action. Turning Thread Focus off removes its UI and exits an active Focus View,
while progressively compressed indentation remains. Legacy
`deepThreadMode: "indentation-only"` migrates to `false`; every other legacy,
missing, or invalid value migrates to the default `true`, unless the new Boolean
is already present.

Thread Focus device eligibility uses a coarse pointer
(`any-pointer: coarse`), independently of the 700 px narrow-layout breakpoint.
Rotating an iPhone to landscape must not exit Focus View. Progressive
indentation and the rest of the narrow page treatment remain width-based; do
not reintroduce a viewport-width listener that exits Focus during rotation.

The inserted action preserves HN's existing grammar as `next | focus [–]`,
with a separator before `focus` and only whitespace before the native collapse
toggle. In focus, the site header is hidden with the story content, reply form,
spacer rows, footer, and outside comments. The focus guide becomes the top boundary
above the selected subtree, and the selected root rebases to depth zero while
descendants keep their relative progressive indentation. Surface resolution
fails closed against HN's expected `#hnmain`, `#bigbox`, direct comment-tree
cell, and site-header row structure; if those relationships cannot be
confirmed, the controller does not offer focus.

Each explicit narrow or wide transition stores one complete page-local Focus
View under `hnrCommentFocusView`. Safari Back restores the previous view and
Forward reapplies it; `all` crosses the entire Focus session and restores the
full-thread reading anchor. The state contains one root, the original return
anchor, the current view's resume anchor, and a transition index. It does not
assume roots only become deeper.

The A1 guide keeps `all` in a 48 px leading activation region. It derives
structural entries with `authorAncestryEntriesForRecord`: five authors or fewer
remain complete, while a longer path shows the first author, an ellipsis, and
the final three. The ellipsis expands the complete ancestry without changing
Focus, URL, Safari History, or scroll position, and stays expanded until the
Focus session ends. Separators use CSS-owned equal spacing around `/` so flex
wrapping cannot collapse only one side, and the visible gap after `focused:` is
also CSS-owned rather than trailing text whitespace. Compact and expanded paths
align `all` with the first visual line and keep the final parent/current pair as
one wrapping unit so the current author is never stranded alone. Ancestor links
stay muted despite Hacker News' link specificity; only the current plain-text
author uses the primary color. Ancestor authors are links that zoom to that
exact comment. The story and story author are excluded. HN-explicit `[deleted]`
steps remain in the chain; any other missing author makes that branch
ineligible. There is no side handle or handedness preference.

Scrolling never activates, creates, rebases, exits, or otherwise changes focus.
Do not add
scroll observers, scroll-event layout changes, or automatic viewport-offset
compensation here. Physical-iPhone testing showed that changing subtree width
and calling `scrollBy` during WebKit momentum scrolling interrupts the gesture
and can oscillate at scope boundaries. Scope entry is intentionally an explicit
user action.

Keep `extension/content/deep-comments.js` as reviewable vanilla JavaScript for
Safari/WebKit. It may read HN's `.comment-tree .comtr` order,
`td.ind[indent]`, row IDs, `.hnuser`, an exact `[deleted]` marker, and existing
navigation links. Do not add a framework, infer authors from ordinary comment
prose, move rows, rewrite `href` values, or add compatibility code for Gecko or
Blink.

Original HN targets remain authoritative. A `root`, `parent`, `prev`, or `next`
target inside the current subtree retains the current view. A target elsewhere
in the same top-level comment tree uses `nearestCommonAncestorIndex` to widen
only to the nearest common original comment ancestor. A target in another
top-level tree exits Focus. In every case the original `root`, `parent`, `prev`,
or `next` target remains unchanged; never reinterpret these links as the next
visible item. Back returns to the previous narrower or wider view and Forward
reapplies it. Cross-tree navigation does not restore an obsolete reading
position.

HN collapse and HN Refined scope are separate state layers. Scope may add only
HN Refined data attributes and CSS variables. The focused-page mask does not
move or reconstruct HN nodes. Never overwrite HN's `coll` class, inline
display, `[–]` / `[n more]` text, or collapsed descendant count. Leaving focus
must remove only HN Refined's page mask, comment mask, and rebase attributes.

Real Safari checks must cover Thread Focus on and off on a genuinely deep item
page, native uninterrupted long scrolling, direct and repeated nested focus,
compact and expanded author ancestry, ancestor-link zoom, `all`, Safari Back
and Forward, `[–]` and `[n more]`, every original comment navigation link,
inside-target retention, nearest-common-ancestor widening, cross-tree exit, the
hidden site header and fixed guide top boundary, restoration of the story /
reply form / footer, portrait rotation, theme-aware divider colors, and
immediate preference updates on an already-open HN tab. Keep
`https://news.ycombinator.com/item?id=49098510#49101840` in the physical-iPhone
regression pass.

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

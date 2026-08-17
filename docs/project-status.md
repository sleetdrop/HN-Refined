# Project Status

Last updated: 2026-08-17

This is the detailed product record and regression reference. New Codex tasks
start with `docs/current-state.md` and read this file only when the current
outcome needs historical or domain context.

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
- Hacker News color semantics are complete in the canonical extension source.
  Normal Light now keeps HN's official role values, including selected
  navigation, secondary links, and the full `.c5a` through `.cdd` downvote
  ladder. Dark uses an explicit warm semantic translation rather than flattening
  those roles, and Increased Contrast strengthens every fade level without
  erasing its order. Exact new-account, own-item, and YC-alumni markers map to
  separate roles; unknown inline colors fail open to HN. A custom `topcolor`
  remains unchanged with original navigation/logo treatment. The original
  `y18.svg` is filtered only on the recognized default dark header. The stable
  light/dark mapping is published in `docs/color-semantics.md`. The prior
  174-test gate, signed macOS Safari reinstall, package doctor, and canonical
  resource sync passed. A rebuilt iPhone 17 Pro / iOS 26.3 Simulator Safari pass
  checked the live item page in System Dark, fixed Dark while iOS stayed Light,
  fixed Light while iOS stayed Dark, and normal/Increase Contrast variants.
  Primary reading text, metadata, links, the default header, and the CSS-filtered
  logo remained visually distinct and coordinated. Rare account-only signals
  and every server-assigned downvote fade level remain covered structurally and
  contrast-tested rather than forced on a live account. Physical-device color
  burn-in remains the final acceptance step before release work resumes.
- The color contract also gives editable HN fields a distinct control surface,
  border, and restrained warm focus ring while preserving Safari's native caret
  and select treatment. Ordinary HN application links are scoped through
  `#hnmain` so HN's later `a:link` rule cannot leave Jobs, account, or footer
  links pure black in Dark; metadata and each faded comment selector retain
  their more-specific semantic roles. iPhone 17 Pro / iOS 26.3 Simulator checks
  cover Light and Dark submit, Jobs, and profile surfaces, including focused
  fields and no added controls on `about`; the current 193-test gate passes.
  The macOS reinstall retry is blocked on this development machine because its
  configured team has no valid Mac Development signing identity, not by the
  extension source or resources.
- Mobile comment editors keep the original Hacker News form visible in a
  two-row compact state, expand to six rows on first focus, and expose small
  equal-size CSS triangle controls that adjust by four rows between 2 and 22.
  The enhancement requires a narrow viewport and a coarse pointer; desktop
  comment textareas retain Hacker News' original rows and mouse resizing.
- The mobile submit text editor uses the same tiny CSS-triangle controls but
  starts at HN's native six rows and does not auto-expand on focus. It adjusts
  by four rows between 2 and 22, measures title's rendered field width to keep
  its outer edge exactly aligned with title and URL, replaces stale controls on
  Safari reinjection, and restores its original row count off the narrow
  coarse-pointer breakpoint. The selector excludes comment and profile `about`
  textareas.
- Mobile layout is automatic instead of exposed as a first-version setting.
  Preference normalization discards the legacy `mobileLayout` state, while the
  content script always applies the existing `data-hnr-mobile="auto"` CSS
  binding.
- Deep mobile comment threads use progressively compressed indentation instead
  of flattening every depth beyond three to the same 32 px offset. A dedicated
  vanilla JavaScript controller for Safari/WebKit now exposes `focus` on every
  comment with replies when the default-enabled Thread Focus preference is on.
  Turning it off removes Focus UI while indentation remains. Focus is
  page-local and ephemeral; only the Boolean preference is stored.
- Automatic deep-thread scope was removed after physical iPhone 17 testing
  showed it could interrupt momentum scrolling and oscillate at subtree
  boundaries. Its layout rebase changed text wrapping above the viewport while
  offset compensation called `scrollBy` from the scroll path. Scrolling now
  never activates, creates, rebases, exits, or otherwise changes focus; scope
  entry requires the user's explicit `focus` action. Legacy Indentation only
  migrates to Thread Focus off; other old values migrate to the default on.
- Existing HN navigation remains authoritative inside focused comments. An
  inside target retains the current view; another target in the same top-level
  comment tree widens only to the nearest common comment ancestor, while a
  target in another top-level tree exits Focus. The original `root`, `parent`,
  `prev`, and `next` target remains unchanged. HN collapse and HN Refined scope
  remain separate state layers, so `[–]` and `[n more]` keep their current state
  across Focus. Scrolling never changes Focus.
- Explicit focus follows the native action grammar `next | focus [–]`. The
  focused root rebases to depth zero and descendants retain only relative
  indentation. The site header is hidden with the story, reply form, spacer
  rows, footer, and outside comments, making the focus guide the top boundary
  above the selected subtree. Focus eligibility follows a coarse pointer rather
  than the 700 px narrow-layout breakpoint. Rotating an iPhone must not exit
  Focus View; progressive narrow-screen indentation remains width-based.
- Narrowing, ancestor-link zoom, and minimal navigation widening each create a
  complete Focus View History entry. Safari Back restores the previous view,
  Forward reapplies it, and `all` leaves the entire Focus session. Guide
  ancestry contains only original comment authors: five authors or fewer remain
  complete; longer paths initially show the first author, an ellipsis, and the
  final three. The ellipsis can expand the complete chain without changing
  Focus History, URL, or scroll position. Ancestor links zoom to their exact
  comments. Compact and expanded paths align `all` with their first visual line,
  keep ancestor authors muted, emphasize only the current plain-text author,
  use CSS-owned spacing after `focused:`, and keep the final parent/current pair
  together when wrapping. Explicit `[deleted]` comments retain their structural
  step; other missing authors fail closed.
- Focus surface and History validation fail closed to the complete thread when
  the expected HN structure or nested stack cannot be resolved. The earlier
  physical-iPhone build exposed a CSS cascade error that prevented the intended
  zero-indent root; automated coverage now locks the corrected selector order.
- Physical iPhone testing of
  `https://news.ycombinator.com/item?id=49098510#49101840` exposed that the prior
  guide represented clicked Focus History rather than original comment depth:
  direct focus showed only one author and pushed it to the far right. The
  current accepted revision derives structural author ancestry,
  compacts only long chains, offers explicit expansion and ancestor zoom, and
  coordinates original HN destinations through the nearest common ancestor.
  The revision passes the complete interaction-test gate, iOS build, signed macOS
  Safari reinstall, and package doctor. iPhone 17 Pro / iOS 26.3 Simulator
  checks cover complete, compact, and expanded ancestry; light and dark themes;
  Back/Forward, `all`, collapse preservation, and Focus retention through
  portrait/landscape rotation. A subsequent physical iPhone pass confirmed that
  this revision now follows the intended interaction direction. Multi-day
  device use remains the burn-in path for smaller follow-up adjustments rather
  than a blocker on the hierarchy correction itself. The second HN-alignment
  correction now restores Hacker News' color semantics in Light and translates
  those roles into a documented warm Dark palette. Release preparation stays
  paused only for physical-device color burn-in and any resulting refinements.
- Narrow item pages wrap long author-supplied `.toptext` content before it can
  widen Hacker News' nested tables. The `#bigbox` content cell also reserves a
  12 px inline-end gutter from Safari's overlay scroll indicator without
  changing Hacker News' table layout or hiding overflow.
- Mobile `newcomments` keeps `.comhead` links inline because each entry can put
  a full story title after `on:` inside that link. Physical iPhone 17 testing
  exposed that the former shared `inline-block` touch-target rule widened HN's
  nested comment table beyond the viewport. A focused CSS regression test and
  an iPhone 17 Pro / iOS 26.3 Simulator pass now confirm long titles wrap, the
  account navigation stays visible, and comment prose uses the viewport width.
  Later physical iPhone 17 testing exposed the second intrinsic-width trigger:
  long URLs used as visible comment link text. Mobile `.commtext` now receives
  `overflow-wrap: anywhere` directly so its global `break-word` declaration
  cannot keep widening the nested table.
  A subsequent mobile-only refinement keeps the same type scale and colors
  while adding modest entry rhythm and a larger invisible vote target that does
  not widen HN's table cell, scoped to the selected `newcomments` feed without
  cards or dividers.
- Mobile typography now applies one 1.2x scale to Hacker News' existing text
  roles across functional pages. Titles, base table/form copy, admin text,
  subtext, footer/comment metadata, and comment prose retain HN's relative
  hierarchy instead of receiving unrelated page-specific sizes. The CSS guard
  covers every role and cross-page Simulator checks include list, comment,
  jobs, and submit surfaces.
- The narrow top bar keeps Hacker News' native table and natural navigation
  wrapping, while independently top-aligning the logo and account cells. The
  logo receives a small title-row inset so changing among HN Classic, System
  Sans, Serif, and Mono-ish cannot make it drift with the wrapped navigation.
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
- App icon keeps the established orange, warm-paper, and `HN` composition while
  its upper-right badge uses the custom S1 uppercase `R`. The stable stem and
  open, humanist leg express Refined as a restrained step forward from Hacker
  News rather than an additive "Enhanced" layer. Safari toolbar icons keep the
  simplified small-size composition with the same vector `R` badge. Icon
  generation renders the iOS App Store asset onto an opaque orange canvas while
  retaining transparent corners for the native macOS icon set.
- The containing app uses the user-visible name `HN Refined` while preserving
  existing Xcode target names, wrapper/executable paths, Swift modules, and
  bundle identifiers. Its iPhone/iPad help page
  gives the complete `Settings > Apps > Safari > Extensions > HN Refined` path
  and keeps both `Allow Extension` and the `news.ycombinator.com` site permission
  requirement visible. On iOS 26.2 and iPadOS 26.2 or later,
  `SFSafariExtensionManager` reports and refreshes enabled state; older systems
  and lookup failures retain static instructions. Enabled state does not reveal
  website permission. The macOS host continues to show extension state and open
  Safari Settings. It also loads the packaged `AppIcon.icns` as its runtime icon
  so the Dock receives the complete mark despite the separated visible and
  internal product names.
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
and do not read comment text or intercept the original form. The submit page
may use the same controls only through
`form:not([action="comment"]) textarea[name="text"]`: it starts at native six
rows, never auto-expands on focus, and measures `input[name="title"]` on mobile
so WebKit keeps its outer width exactly aligned across the three fields. Do not
include profile `about` textareas or leave duplicate controls after Safari
reinjection.

Mobile item overflow handling binds to `.toptext` and the direct content cell of
`#bigbox`. Keep its wrapping and inline-end gutter inside the width-based mobile
breakpoint. Do not replace this targeted fix with `overflow-x: hidden`, fixed
table layout, or JavaScript content inspection.

Deep-thread handling binds only to `.comment-tree .comtr`, `td.ind[indent]`,
comment row IDs, existing HN navigation links, and a fail-closed check of HN's
`#hnmain`, `#bigbox`, direct comment-tree cell, and site-header row structure.
Keep the implementation in reviewable vanilla JavaScript for Safari/WebKit.
Thread Focus is a default-on Boolean; every comment with replies may offer
`focus`, while turning it off removes Focus UI and indentation remains. Legacy
Indentation only migrates to off and other old values migrate to on. Scrolling
never activates or changes focus. Preserve the action grammar
`next | focus [–]`. Focus hides the site header, story, reply
form, spacers, footer, and outside comments; the focus guide becomes the top
boundary above the selected subtree. The root rebases to depth zero. Back
restores the previous view and Forward reapplies it, while `all` leaves the
entire Focus session. Coarse-pointer eligibility remains independent of the
700 px breakpoint so rotation cannot exit Focus. Five authors or fewer remain complete; longer ancestry
shows the first author, an ellipsis, and the final three until the ellipsis
expands it without a History change. The guide aligns `all` to the first line,
mutes ancestors, emphasizes only the current author, and keeps the final parent
and current author together across wraps. Ancestor links zoom to exact comments.
A same-page target outside the current subtree widens to the nearest common
ancestor without changing the original target. Keep HN collapse and HN Refined
scope as separate state layers, and never overwrite HN's `coll` class, inline
display, toggle text, or descendant count.

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

- Continue multi-day physical-iPhone burn-in of Thread Focus on and off,
  including uninterrupted long scrolling, original HN navigation, collapse,
  true zero-indent narrowing, the fixed A1 top boundary, complete and compact
  author ancestry, ellipsis expansion, ancestor zoom, minimal widening,
  first-line `all` alignment, muted/current hierarchy, final-pair wrapping,
  direct and nested focus, `all`, and Safari Back/Forward. Treat observations as
  follow-up refinement unless they reveal a regression in the accepted
  direction.
- Complete physical-device burn-in for the second HN-alignment correction.
  The signed macOS Safari reinstall, package doctor, and iPhone Simulator color
  matrix already pass. Check the published Hacker News color semantics in
  fixed Light, fixed Dark, System, and Increased Contrast, including a custom
  `topcolor`, selected navigation, secondary links, the complete comment fade
  ladder, and default-header logo treatment. Release work remains paused until
  this correction is verified on the supported Safari surfaces.
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

## Deferred Product Ideas

Keyboard navigation is deliberately outside the `1.0` feature scope. Apart from
the two explicitly approved HN-alignment corrections, keep the first release
feature-frozen; there is no current plan to begin `1.1` work before `1.0` ships.

Revisit keyboard navigation after the first release as an exploratory feature,
not as an already specified backlog item. The earlier discussion was
brainstorming rather than a settled key map or interaction design. One direction
worth evaluating is offering Vi-style and Emacs-style bindings, analogous to
Readline's two editing modes and potentially familiar to Hacker News users. Do
not treat either mode, any individual shortcut, the supported page surfaces, or
the eventual release version as decided. When work resumes, define the useful
actions and conflict/focus behavior first, then dogfood a small opt-in design
before choosing the public scope.

## Historical Planning Docs

Files under `docs/superpowers/` are historical specs and implementation plans.
They explain product decisions, but some commands and checklist items predate
the current Makefile workflow. Use `docs/current-state.md` for the short current
position, `docs/codex-workflow.md` for agent workflow, and this file plus
`docs/development.md` as detailed references.

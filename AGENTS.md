# Agent Handoff

Start here for every new HN Refined task:

1. Read `docs/project-status.md`.
2. Read `docs/development.md`.
3. Run `git status --short` before changing files.

HN Refined is a restrained Safari extension for Hacker News readability and
touch ergonomics. Preserve Hacker News behavior unless the user explicitly
chooses a local preference.

Use the `Makefile` targets as the stable interface:

- `make check` for full local validation.
- `make format` before committing ordinary code or docs changes.
- `make lint` for non-writing format and lint checks.
- `make safari-reinstall` for signed local Safari installation.
- `make safari-doctor` for installed package sanity checks.

Do not register builds from `/tmp` or arbitrary DerivedData paths. Use the
repo-local workflow documented in `docs/development.md`.

Do not commit personal Apple development team ids, certificate names, local
DerivedData, `.superpowers/`, `.build/`, or `build/`.

For Safari runtime behavior, do not claim the work is fixed until the relevant
automated checks pass and the installed Safari extension is refreshed with
`make safari-reinstall`.

For ordinary code and documentation changes, run `make format && make check`
before committing. Keep formatter and lint output clean; do not bypass the
quality gate unless the user explicitly accepts the residual issue.

Maintain the project harness continuously. When a change affects product
behavior, Safari behavior, permissions, signing/build workflow, verification
commands, known regressions, or next-work guidance, update the relevant docs and
tests in the same change instead of waiting for a later documentation pass.
Check at least `AGENTS.md`, `docs/project-status.md`, `docs/development.md`,
`docs/privacy.md`, `docs/app-store-checklist.md`, and the workflow/handoff tests
before finishing.

Keep the Safari popup preference refresh guard intact:

- Popup preference changes notify all current-window Hacker News tabs.
- Content scripts tolerate Safari storage change events without `areaName`.
- The visible-page preference refresh fallback is intentional.

Keep Hacker News color meaning intact:

- Normal Light preserves official HN colors; Dark translates the same semantic
  roles using the contract in `docs/color-semantics.md`.
- Keep `.topsel`, `.hnmore`, visited links, metadata, known account/ownership
  signals, and every `.c5a` through `.cdd` level distinct.
- Only the exact default `#ff6600` header receives the dark mapping and filtered
  `y18.svg`. Custom `topcolor` and unknown inline colors remain HN-owned.
- Increased Contrast improves every faded level without flattening or reversing
  the ladder. Leave HN's SVG vote arrow unchanged.
- HN's unclassed application links need a `#hnmain`-scoped semantic fallback;
  metadata and faded comments must keep more-specific role selectors. Do not
  replace this with a generic table-cell or inline-color override.

Keep long comment metadata links compatible with Hacker News' table layout:

- On mobile, `.comhead` links must remain inline. `newcomments` places the full
  story title after `on:` inside such a link, and `inline-block` can widen the
  nested table beyond the viewport.
- Preserve natural wrapping; do not mask this regression with global overflow
  clipping or fixed table layout.

Keep deep-thread scope compatible with Hacker News navigation and collapse:

- Thread Focus is a default-on Boolean preference. When enabled, every comment
  with replies may offer `focus`; when disabled, focus UI is removed while
  progressive indentation remains.
- Scrolling never activates, rebases, or exits a local comment scope. Scope is
  entered only through the user's `focus` action.
- Thread Focus eligibility follows a coarse pointer rather than the 700 px
  narrow-layout breakpoint. Rotating a touch device must not exit Focus View;
  progressive narrow-screen indentation remains width-based.
- Preserve HN's comment-action grammar as `next | focus [–]`; do not add a
  separator between `focus` and the native collapse toggle.
- Focus hides the site header, story content, reply form, spacers, footer, and
  outside comments. The focus guide is the top boundary above the selected
  subtree until focus exits.
- Page narrowing must fail closed if HN's expected `#hnmain`, `#bigbox`, direct
  comment-tree cell, and site-header row structure cannot be resolved.
- Original `root`, `parent`, `prev`, and `next` targets remain authoritative.
- The focused root rebases to depth zero. Every explicit narrow or wide
  transition creates one complete Focus View History entry: Back restores the
  previous view, Forward reapplies it, and `all` leaves the entire Focus
  session. The current focused root does not offer a redundant `focus` action.
- The guide contains only original comment authors, never the story/topic
  author. Five authors or fewer remain complete. Longer paths initially show
  the first author, an ellipsis, and the final three; the ellipsis expands the
  complete path without changing History, URL, Focus, or scroll position.
  Expansion lasts for the current Focus session. Give `/` equal CSS-owned
  spacing on both sides and give `focused:` its visible gap through CSS rather
  than trailing text whitespace. Align `all` with the first visual path line,
  keep ancestor authors muted, emphasize only the current author, and keep the
  final parent/current pair in one wrapping unit. Ancestor authors are links
  that zoom Focus to that exact comment; the current author remains plain text.
- Targets inside the current focus retain it. Other same-page targets widen to
  the nearest common original comment ancestor, or exit Focus when the target
  belongs to another top-level comment tree. Never rewrite the original HN
  `root`, `parent`, `prev`, or `next` target.
- HN collapse and HN Refined scope remain separate layers; do not overwrite
  HN's collapse class, inline visibility, toggle text, or descendant count.

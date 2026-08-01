# HN Refined Agent Guide

Start every new task with only:

1. Read `docs/current-state.md`.
2. Run `git status --short`.
3. Identify the current outcome and classify it using the definitions below.

Do not load `docs/project-status.md` or all of `docs/development.md` by default.
Read longer references only when the current outcome touches their domain.

HN Refined is a restrained Safari extension for Hacker News readability and
touch ergonomics. Preserve Hacker News behavior and visual grammar unless the
user explicitly chooses a local preference.

## Codex Workflow

- Treat work as initiatives, independently committable outcomes, and iterations
  within an outcome. Screenshots and regressions caused by the same outcome stay
  in the current task.
- Tiny means an obvious isolated correction; Standard means a bounded feature or
  bug with known behavior; Complex means ambiguous interaction, architecture,
  security, or release work.
- The user does not need to predict task boundaries. When a new independently
  shippable outcome emerges, explain the boundary and offer a concise handoff.
  Do not create a new task without confirmation.
- If a confirmed split must cross tasks before a commit, write only the durable
  decisions and next action to `docs/work/<outcome>.md`; remove it after the
  outcome is absorbed into normal docs and Git history.
- After context compaction, ground the task again in Git status, the current
  diff, and any active handoff. Do not rely on the conversation summary alone.
- Use the project default Terra model for ordinary implementation. Reserve Sol
  for ambiguous design, difficult state reasoning, release-sensitive review, or
  explicit user choice.
- Superpowers is selective here. Tiny work does not need brainstorming, a
  design document, or an implementation-plan document. Standard work normally
  uses a short in-task plan. Use the full workflow only for genuinely Complex
  work or when the user requests it.
- Project custom agents may be used without another permission prompt when their
  bounded role materially helps: `hn_explorer` for read-only mapping,
  `safari_verifier` for runtime evidence, and `hn_reviewer` for complex or
  release-sensitive review. Do not spawn them for Tiny work, duplicate work, or
  performative parallelism. Return summaries to the main task instead of logs.

Read `docs/codex-workflow.md` when a task boundary, handoff, model choice, or
verification scope needs more detail; it is not mandatory startup context.

## Development and Verification

Use the `Makefile` as the stable interface. Read the relevant section of
`docs/development.md` before Safari installation, signing, simulator, host-app,
popup, options, theme, or release work.

- Use focused tests during iteration.
- Run `make format && make check` before committing ordinary code or docs work.
- For visual changes, reproduce the relevant state first and verify the result
  in iOS Simulator. Exercise implicated transitions such as keyboard focus,
  resize controls, rotation, History, or collapse rather than checking only the
  initial screenshot.
- For Safari runtime behavior, do not claim a fix until relevant automated
  checks pass and the installed extension is refreshed with
  `make safari-reinstall`; run `make safari-doctor` when signing is available.
- Do not register builds from `/tmp` or arbitrary DerivedData paths. Use the
  repository-local workflow.
- Do not commit personal Apple team IDs, certificate names, local DerivedData,
  `.superpowers/`, `.build/`, or `build/`.

Maintain the harness in the same change, but only where durable truth changed.
Do not mechanically touch privacy, App Store, release, status, and development
docs for every patch. Check the domain owner instead:

- Current direction or blockers: `docs/current-state.md`
- Detailed implementation history and guarded regressions:
  `docs/project-status.md`
- Build, Safari, signing, and UI verification contracts:
  `docs/development.md` and `docs/safari.md`
- Theme meaning: `docs/color-semantics.md`
- Privacy or release posture: `docs/privacy.md`, `docs/release-readiness.md`, and
  `docs/app-store-checklist.md`

## Product Contracts

Keep the Safari popup preference refresh guard intact:

- Popup changes notify all current-window Hacker News tabs.
- Content scripts tolerate Safari storage change events without `areaName`.
- The visible-page preference refresh fallback is intentional.

Keep Hacker News color meaning intact:

- Normal Light preserves official HN colors; Dark follows
  `docs/color-semantics.md`.
- Keep `.topsel`, `.hnmore`, visited links, metadata, ownership/account signals,
  and every `.c5a` through `.cdd` fade level distinct.
- Only the exact default `#ff6600` header receives the dark mapping and filtered
  `y18.svg`; custom `topcolor` and unknown inline colors remain HN-owned.
- Increased Contrast strengthens rather than flattens the semantic ladder.
- Do not replace scoped dark application-link fallbacks with generic table-cell,
  inline-color, or overflow overrides.

Keep mobile HN table layout natural:

- `.comhead` links remain inline so long `newcomments` story titles wrap.
- Do not mask overflow with global clipping or fixed table layout.
- Mobile submit and comment textarea controls remain narrow coarse-pointer
  enhancements. Submit text must align with title and URL, restore native rows
  outside the breakpoint, and exclude comment/profile `about` textareas.

Keep Thread Focus compatible with Hacker News navigation and collapse:

- It is default-on and user-entered only; scrolling never activates, rebases,
  or exits Focus.
- Eligibility follows a coarse pointer, while progressive indentation remains
  width-based. Rotation must not exit Focus.
- Preserve `next | focus [–]`, original `root`, `parent`, `prev`, and `next`
  targets, and HN collapse state.
- Focus hides the site header, story, reply form, spacers, footer, and outside
  comments; the focused root rebases to zero.
- Every explicit narrow or wide transition creates a complete History entry;
  `all` exits the session.
- The guide contains comment authors only. Up to five remain complete; longer
  chains show the first, an expandable ellipsis, and final three. Ancestors are
  muted links, only the current author is emphasized, and the final pair wraps
  together.
- Targets inside retain scope. Other same-tree targets widen to the nearest
  common original comment ancestor; other top-level trees exit Focus.
- Fail closed when expected HN structure cannot be resolved. Never overwrite
  HN's collapse class, inline visibility, toggle text, or descendant count.

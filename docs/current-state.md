# Current State

Last updated: 2026-08-02

This is the short startup brief for new Codex tasks. Read the longer references
only when the current outcome needs them.

## Release Position

- Version 1.0 is feature-frozen apart from regressions and the two accepted
  Hacker News alignment corrections.
- Mobile comment hierarchy and Thread Focus are implemented. Simulator and
  physical-iPhone checks accepted the current direction; multi-day device use
  may still produce small follow-up refinements.
- Hacker News light-theme color meaning is restored and the dark semantic
  translation is implemented. The current form, focus, logo, Jobs, profile,
  submit, and `newcomments` refinements pass the automated and simulator gates.
- Release preparation remains paused for physical-device color burn-in and any
  regressions found during that use.

## Current Constraints

- Preserve Hacker News behavior and visual grammar unless the user explicitly
  chooses a local preference.
- Keep the extension CSS-first, reviewable, vanilla JavaScript where behavior is
  necessary, and Safari/WebKit-specific.
- Canonical WebExtension source lives under `extension/`; generated Xcode
  resources must stay synchronized through the repository workflow.
- The current development machine has no valid Mac Development signing
  identity. Do not report that as a source failure; unsigned checks and iOS
  Simulator work remain available.

## Active Initiative

The HN-alignment review that began with a broad introduction to Hacker News has
two completed implementation branches under continued dogfooding:

- Comment hierarchy and Thread Focus: accepted baseline `494fd83`.
- Light/dark color semantics and mobile form refinements: accepted baseline
  `6f3f5b9`.

Codex workflow harness v1 now uses this short startup brief, a user-selected
main model, main-Agent ownership, graph-shaped task boundaries, selective
Superpowers, and risk-scaled Safari verification. Project-specific custom
subagents were removed after evaluation showed that this small, sequential,
visual-feedback-heavy project did not justify their token and coordination
cost. The harness will continue to be refined from actual use rather than
expanded speculatively.

## Read on Demand

- Product and release history: `docs/project-status.md`
- Development, build, signing, and detailed regression contracts:
  `docs/development.md`
- Human and agent workflow: `docs/codex-workflow.md`
- Theme rules: `docs/color-semantics.md`
- Safari installation and verification: `docs/safari.md`
- Release blockers: `docs/release-readiness.md`

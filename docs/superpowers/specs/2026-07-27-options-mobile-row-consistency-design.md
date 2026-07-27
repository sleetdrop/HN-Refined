# Options Mobile Row Consistency Design

Date: 2026-07-27
Status: Approved

## Context

The full settings page currently gives `Reading Density` a dedicated
`setting-row-stack-narrow` class. At every viewport up to 520 px wide, that
class forces the label and native select onto separate rows even when a normal
iPhone viewport has enough room for both. Neighboring select rows, including
`Reading Width`, remain inline until the shared 360 px fallback applies. This
creates an unnecessary visual inconsistency; Safari's native select has no
additional intrinsic-width requirement that requires the earlier stack.

## Considered Approaches

1. Keep the 520 px special case. This preserves the current implementation but
   retains the visible inconsistency on ordinary iPhones.
2. Lower the special-case breakpoint. This reduces the affected range but adds
   another row-specific threshold without a demonstrated layout need.
3. Remove the row-specific stacking behavior and rely on the existing 360 px
   fallback for all non-switch select rows. This is the selected approach
   because it is simpler and keeps neighboring settings visually consistent.

## Design

- `Reading Density` uses the same standard setting-row structure as Theme,
  Font, and `Reading Width`.
- Select rows remain label-left and control-right above 360 px, including
  ordinary iPhone portrait widths.
- At 360 px and below, the existing shared rule stacks every non-switch select
  row so labels and controls retain usable space without horizontal overflow.
- Native selects, their options, ids, storage behavior, touch height, and Safari
  appearance remain unchanged.
- The link switch row remains inline and is outside this adjustment.

## Verification

- Add a contract test that rejects the row-specific stacking class and 520 px
  stacking rule while preserving the 360 px all-select fallback.
- Synchronize the canonical extension resources into the Xcode wrapper.
- Run `make format` and `make check`.
- Build the iOS wrapper and verify the options page at an ordinary iPhone width
  and at the 360 px fallback boundary, checking light and dark appearances and
  horizontal overflow.
- Reinstall and sanity-check the macOS Safari extension because the shared
  options resources also ship there.

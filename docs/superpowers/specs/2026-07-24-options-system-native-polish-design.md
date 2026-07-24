# Options Page System-Native Polish Design

Date: 2026-07-24

Status: Approved

## Summary

Refine the full HN Refined settings page so it uses the same restrained,
system-native visual language as the toolbar popup. Preserve every existing
preference, grouping, storage key, and immediate-update behavior. The work is a
visual and semantic control refinement, not a settings redesign.

The approved direction is **A: continuous settings rows**. On Mac and wider
iPad layouts, each preference reads as a compact row with its label on the left
and its native control on the right. Narrow iPhone and iPad split-view layouts
retain the same hierarchy, enlarge touch targets, and stack only rows whose
labels and controls cannot fit comfortably side by side.

## Context

The toolbar popup now uses dynamic system colors, the system accent color for
selected states, Safari's native `switch` control, neutral navigation styling,
and coarse-pointer touch targets. The options page already has a sound base:
system fonts, `Canvas` and `CanvasText`, automatic light and dark appearance,
native selects, semantic sections, and restrained separators.

The remaining mismatch is visible in the real Safari page:

- Selects stretch across nearly the full content width, which makes a small
  preference surface feel like a generic web form.
- Preference labels sit above controls instead of forming the compact row
  rhythm established by the popup.
- The external-story-link preference remains a conventional checkbox while the
  same preference is a native switch in the popup.
- Full-width selects and the checkbox create several isolated blue control
  accents instead of reserving accent color for active state.

## Goals

- Make the popup and options page feel like two densities of one product.
- Preserve a restrained Apple-system-settings character without imitating a
  specific macOS or iOS Settings release pixel for pixel.
- Keep Mac layouts compact and easy to scan.
- Keep iPhone and iPad layouts touch-safe in portrait, landscape, and narrow
  split-view widths.
- Continue adapting automatically to system light or dark appearance and the
  user's system accent color.
- Preserve semantic HTML, native controls, keyboard access, and existing
  preference behavior.

## Non-Goals

- No new settings, settings removal, renaming, or regrouping.
- No changes to preference keys, defaults, normalization, storage, or page
  refresh behavior.
- No cards, sidebar navigation, save button, custom dropdown, or custom switch.
- No branded color system, gradients, decorative illustration, or animation.
- No attempt to reproduce the Hacker News reading theme inside extension-owned
  settings UI.

## Considered Directions

### A. Continuous settings rows — approved

Keep the existing white/system canvas and section separators. Within each
section, place labels and native controls in compact horizontal rows. Use a
native switch for the link preference. This best matches the popup, remains
calm on Mac, and adapts cleanly to touch layouts.

### B. Grouped inset panels

Place each section's rows inside rounded inset groups on a secondary
background. This is recognizable on iPhone and iPad but introduces more visual
containers than the product needs and feels overly application-like on Mac.

### C. Restrained vertical form

Keep labels above controls while limiting control width and adjusting spacing.
This is the smallest code change, but it preserves the semantic and visual
mismatch between the popup switch row and the full settings page.

## Approved Information Architecture

The existing order and language remain unchanged:

1. Header
   - HN Refined
   - Reading preferences for Hacker News.
2. Appearance
   - Theme
   - Font
3. Reading Layout
   - Reading Density
   - Reading Width
4. Links
   - Open external story links in new tabs

Section descriptions remain directly below their headings. The storage status
message remains between the page header and the first section.

## Layout and Spacing

### Page frame

- Keep a centered single-column page with a maximum content width near 680 px.
- Preserve the system canvas rather than adding a tinted page background or
  card shell.
- Keep the existing compact product header and muted explanatory text.
- Use section top separators as the primary grouping device.

### Preference rows

- Wrap each preference in a semantic label row.
- On Mac and wider iPad layouts, align the label left and the control right.
- Use approximately 42 px minimum row height for fine-pointer layouts.
- Separate adjacent rows with a lighter divider than the section divider.
- Remove the divider after the final row in a section.
- Give selects a consistent, moderate desktop width near 190 px instead of
  filling the page.
- Do not force switch width or height; Safari owns its native geometry.

### Narrow and coarse-pointer layouts

- Preserve at least 44 px activation height for every preference row and
  interactive control under a coarse pointer.
- Keep short label/control pairs side by side when they fit comfortably.
- Stack only rows that need more horizontal room, such as Reading Density at
  narrow widths; the stacked select spans the available row width.
- Keep page gutters near 12–16 px so controls do not touch the viewport edge.
- Do not introduce horizontal scrolling at supported phone or iPad widths.

## Controls and Interaction

### Select preferences

Theme, Font, Reading Density, and Reading Width remain native `select`
elements. Their options, ids, change events, and immediate storage writes remain
unchanged. CSS controls alignment and available width but does not replace the
native picker or arrow.

### Link preference

The existing checkbox gains Safari's native `switch` attribute. It remains a
checkbox semantically and continues using the same id, checked state, change
handler, and preference key. The change aligns it with the same quick setting
in the popup without adding JavaScript.

### Feedback and focus

- Keep the existing immediate-save model; no save or apply button is added.
- Keep native disabled, selected, and pressed behavior.
- Preserve visible `:focus-visible` treatment for keyboard navigation without
  showing a forced focus ring after ordinary pointer or touch input.
- Use the system accent color only through native controls and focus state.
- Keep the storage failure/status message at the top of the page and restyle it
  only enough to match the neutral separator and system-color language.

## Color and Typography

- Retain `color-scheme: light dark`.
- Continue using `Canvas`, `CanvasText`, and system-derived color mixing for
  secondary text and dividers.
- Allow Safari to apply the user's accent color to native active controls.
- Do not hard-code a blue active color.
- Continue using the system UI font independent of the Hacker News reading font
  preference.
- Keep headings compact and moderately weighted; do not add display typography.

## Behavior and Data Flow

The options page continues to:

1. Read normalized preferences through the existing shared preference store.
2. Populate the native controls.
3. Write a single changed preference immediately.
4. Notify current-window Hacker News tabs through the existing preference
   change mechanism.
5. Show the existing status message if storage or navigation behavior fails.

No JavaScript data flow changes are required for the visual refinement.

## Accessibility

- Keep every control associated with visible label text.
- Preserve the existing semantic heading order and section labeling.
- Use native select and switch semantics instead of ARIA replicas.
- Retain keyboard tab order and `focus-visible` indication on macOS.
- Ensure coarse-pointer targets meet the 44 px minimum.
- Continue inheriting system light/dark, increased-contrast, and accent choices
  where WebKit exposes them to extension pages.

## Error Handling

The existing storage-status element remains the single error/status surface.
The refinement must not hide, relocate, or replace it with transient toast
behavior. Its border, text, and background remain system-derived so it is
legible in light and dark appearance.

## Packaging

The canonical files remain under `extension/options/`. The Safari build workflow
continues to sync them into the shared Xcode extension resources. The final
change must include the synchronized wrapper copies produced by the repository
workflow.

## Verification

### Automated

- Add or extend options-page contract tests for continuous row structure.
- Assert that the link checkbox uses Safari's native `switch` attribute.
- Guard dynamic system colors and the absence of a hard-coded blue UI accent.
- Guard moderate desktop select width, narrow-screen stacking, and coarse-pointer
  44 px targets.
- Keep existing preference behavior and notification tests unchanged and
  passing.
- Verify the Xcode wrapper packages the final options HTML and CSS.
- Run `make format && make check`.

### Safari acceptance

- macOS: light and dark appearance, at least one non-default system accent,
  keyboard tab/focus traversal, select changes, and switch changes.
- iPhone: portrait and landscape layout, native picker/switch interaction,
  touch target size, and no horizontal overflow.
- iPad: portrait, landscape, and a narrow split-view width; confirm both compact
  rows and the intended stacked row behavior.
- Confirm that changes made in the options page still update open Hacker News
  tabs without manual refresh.
- For runtime work, finish with `make safari-reinstall` and
  `make safari-doctor`; build iOS/iPadOS with `make safari-build-ios`.

## Documentation Impact

Update the popup/options visual contract in `docs/development.md` so future
changes preserve the shared system-native language across both settings
surfaces. Check `docs/project-status.md`, release documentation, privacy
documentation, and App Store guidance; change only the files whose behavior or
verification guidance is materially affected.

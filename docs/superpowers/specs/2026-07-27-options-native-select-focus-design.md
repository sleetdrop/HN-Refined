# Native Select Focus Design

## Context

The full settings page adds a custom `Highlight` outline to every focused
`select`. Safari continues to match `:focus-visible` after a pointer selection,
so the outline remains around the recently used control until focus moves. The
square outer outline also conflicts with the rounded native select chrome.

## Decision

Let Safari own the complete focus appearance of native `select` controls. The
options stylesheet will no longer apply a custom outline to
`select:focus-visible`.

Keep the existing custom `input:focus-visible` outline for the native switch.
No JavaScript input-modality tracking, control markup changes, preference
changes, or new visual tokens are needed.

## Behavior

- Pointer selection must not leave a separate square outline around a select.
- Keyboard users must still be able to reach and operate every select using
  Safari's native focus treatment.
- The native switch retains its explicit system-color focus outline.
- Light mode, dark mode, accent colors, responsive layout, and preference
  persistence remain unchanged.

## Verification

- Add a static regression assertion that the options stylesheet does not group
  `select:focus-visible` into the custom outline rule.
- Keep a positive assertion that `input:focus-visible` still receives the
  `Highlight` outline.
- Run the complete local quality gate.
- Reinstall the Safari extension and verify pointer selection, keyboard Tab
  navigation, and switch focus in the real options page.

# Preference Surface Refinement Design

## Goal

Refine the first-release settings around HN Refined's current product direction:
preserve Hacker News by default, expose a few independent enhancements, and keep
automatic platform and mobile fixes out of the user's decision surface.

## Decisions

- Change the default font from `System Sans` to `HN Classic` so installation
  preserves Hacker News' Verdana identity unless the user chooses another font.
- Keep `System Sans`, `Serif`, and `Mono-ish` as explicit choices. Mono remains
  an intentional retro option despite not being the strongest prose font.
- Rename only user-facing labels:
  - `Serif Reading` becomes `Serif`.
  - `Desktop Reading` becomes `Reading Layout`.
  - The section description names Mac and wider iPad layouts.
  - `Desktop Density` becomes `Reading Density`.
  - `Classic-ish` becomes `Classic`.
  - Reading Width `Comfortable` becomes `Focused`.
- Keep existing stored values such as `serif-reading`, `classic-ish`, and
  `comfortable`. Label changes do not require preference migration.
- Remove `mobileLayout` from the preference schema. Mobile layout remains an
  automatic product behavior and the content script always applies
  `data-hnr-mobile="auto"` for the existing CSS bindings.
- Ignore and remove any legacy stored `mobileLayout` value during preference
  normalization. A legacy `off` value must never disable current mobile fixes.

## Boundaries

- Do not add settings or change the Popup surface.
- Do not change font CSS, theme tokens, density values, width values, or link
  behavior.
- Keep Popup-driven preference refresh guards intact.
- Keep mobile comment editing, item overflow, forms, and all other responsive
  rules active through the existing `data-hnr-mobile="auto"` selector.

## Verification

- Test the new default and the reduced preference schema.
- Test that legacy `mobileLayout: "off"` is dropped by shared and content-script
  normalization while `data-hnr-mobile` remains `auto`.
- Test the complete user-facing option labels and retained Mono option.
- Run the full quality gate, rebuild both Safari packages, and visually check
  Popup/Options plus a normal HN page on macOS and iPhone Simulator.

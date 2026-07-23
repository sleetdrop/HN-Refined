# Popup System-Native Polish Design

Date: 2026-07-24
Status: Approved for planning

## Purpose

Refine the existing HN Refined toolbar popup so its colors, controls, spacing,
and navigation hierarchy feel like one restrained Apple-platform interface.
The refinement applies to the shared Safari WebExtension popup on macOS, iOS,
and iPadOS without changing the popup's preference scope or runtime behavior.

The current popup mixes three visual languages:

- The selected theme segment uses a `CanvasText` and `Canvas` inversion.
- The story-link checkbox uses the system `AccentColor`.
- `All Settings` uses `LinkText`, which makes the only navigation action look
  like a default webpage link.

The approved direction is the system-accent option shown during visual
exploration, combined with Safari's native switch control.

## Goals

- Use one semantic color rule: the system accent color means selected or on.
- Make `All Settings` read as a neutral next-level navigation action instead of
  a webpage link.
- Preserve automatic light and dark appearance adaptation.
- Keep macOS compact while providing appropriate touch targets on iPhone and
  iPad.
- Use native Safari form-control behavior and accessibility wherever possible.
- Preserve all existing preference persistence and Hacker News refresh guards.

## Non-Goals

- Do not introduce HN orange or another fixed brand accent into the popup.
- Do not redesign the full settings page.
- Do not add, remove, or rename preferences.
- Do not move more full-settings controls into the popup.
- Do not change the behavior of Hacker News pages or external story links.
- Do not add platform-specific JavaScript or separate platform popup files.

## Popup Scope And Hierarchy

The popup keeps its current three-part structure:

1. `HN Refined` heading and the conditional storage warning.
2. Quick settings for theme and external story-link behavior.
3. A lightweight `All Settings` entry that opens the full settings page.

No explanatory copy, icon branding, or additional controls are added. The
popup remains visibly smaller and simpler than the full settings page.

## Color And Appearance

Keep `color-scheme: light dark` on the popup root. Backgrounds, primary text,
secondary text, borders, hover surfaces, and focus indicators continue to use
dynamic CSS system colors and system-color mixtures instead of fixed light or
dark palette values.

Use the system accent color for both enabled states:

- The selected `System`, `Light`, or `Dark` theme segment.
- The on state of the story-link switch.

Use the corresponding dynamic system text color on the selected theme segment
so the label remains legible across light appearance, dark appearance, and
user-selected macOS accent colors.

The popup appearance follows Safari and the operating system, independently of
the Hacker News theme preference. For example, if Safari is using light
appearance and the user selects the Dark Hacker News theme, the popup remains
light while the `Dark` segment is selected.

`All Settings` uses neutral primary text. It must not use `LinkText`, a fixed
blue, or HN orange.

## Controls

### Theme

Keep the existing native radio inputs, `radiogroup` semantics, three equal-width
segments, labels, preference values, and change handling. Change only the
selected visual treatment from black-and-white inversion to the system accent
pairing.

The segmented control remains compact on fine-pointer devices. On coarse-pointer
devices, each segment receives a minimum 44 px activation height without
changing the three-column layout.

### Story-Link Setting

Keep the existing checkbox value, ID, storage key, and JavaScript change
handler, but add Safari's native `switch` content attribute:

```html
<input id="openStoryLinksInNewTabs" type="checkbox" switch />
```

Safari 17.4 and later render this as an operating-system switch with native
light/dark appearance, accent-color support, keyboard behavior, and switch
accessibility semantics. A browser that does not support the attribute treats
the control as a normal checkbox, which is the required fallback.

Do not use `appearance: none`, custom thumb or track elements, or JavaScript to
recreate a switch. Remove width and height declarations that interfere with the
native control's intrinsic size. The containing row provides the activation
area and uses a minimum 44 px height on coarse-pointer devices.

### All Settings

Keep `All Settings` as a real button because it triggers the existing extension
navigation helper. Present it as a full-width neutral navigation row:

- A subtle top divider separates it from the quick settings.
- The label is leading-aligned.
- A low-emphasis trailing chevron communicates the next level.
- The entire row is interactive.
- The row has a minimum 40 px height on fine-pointer devices and 44 px on
  coarse-pointer devices.

The chevron is decorative and hidden from assistive technology. The accessible
name remains `All Settings`.

## Spacing And Interaction States

Use 16 px between the heading and the first control group and between the two
quick-setting groups. Keep 6 px between each legend and its control. Separate
the settings row from the quick settings with a 14 px lead-in and its divider.
These changes create a visible distinction between group spacing and internal
label spacing without materially enlarging the popup.

On devices that support hover, theme segments and the settings row receive a
subtle neutral hover surface. Active states use a slightly stronger neutral
surface. Avoid persistent hover styling on touch devices.

Preserve the existing `:focus-visible` system-highlight outlines for theme
segments, the story-link row, and `All Settings`. Do not remove or replace
native focus behavior from the switch.

## Behavior And Data Flow

No preference or messaging behavior changes.

- Theme changes still read the latest stored preferences, write the updated
  theme, render the persisted result, and notify current-window Hacker News
  tabs.
- Story-link changes still update only `openStoryLinksInNewTabs` through the
  same preference-store path and notify the same tabs.
- `All Settings` still uses `openFullSettingsPage()`.
- The popup still displays the existing storage warning when persistence is
  unavailable.

Keep the Safari refresh regression guards intact: popup preference changes
notify all current-window Hacker News tabs, content scripts accept storage
change events without `areaName`, and the visible-page refresh fallback remains
in place.

## Platform Behavior

The same `extension/popup/` source is packaged for macOS, iOS, and iPadOS.
Platform adaptation is CSS- and browser-native:

- macOS retains compact controls, hover feedback, and keyboard focus support.
- iPhone and iPad use coarse-pointer minimum target sizes and the same three
  equal theme segments.
- Light and dark appearance, Increase Contrast, system accent color, and native
  switch accessibility remain owned by Safari and the operating system.
- The refinement must not increase the popup's minimum width or introduce
  horizontal scrolling in iPhone or iPad portrait and landscape presentations.

## Implementation Boundary

Expected product files:

- `extension/popup/popup.html`
- `extension/popup/popup.css`

Expected verification and documentation files:

- `tests/popup.test.js`
- Relevant popup handoff documentation when implementation changes the recorded
  current state or acceptance guidance.

`extension/popup/popup.js`, shared preference modules, content scripts, the
options page, and Hacker News content CSS are outside the implementation scope
unless a test reveals a regression caused by the popup markup or styling.

## Verification

Automated checks must verify at least:

- The story-link input retains its ID and checkbox type and includes the native
  `switch` attribute.
- The popup still exposes only the approved quick settings and full-settings
  entry.
- Theme selection styling uses the system accent color.
- `All Settings` no longer uses `LinkText` and keeps a visible focus state.
- Existing popup preference writes, tab notifications, and settings navigation
  tests remain unchanged and pass.

Run the repository quality gate before completion:

```bash
make format
make check
```

For macOS Safari runtime acceptance, refresh the installed extension and verify
the installed package:

```bash
make safari-reinstall
make safari-doctor
```

Then check the real macOS popup in light and dark appearance, with multiple
system accent colors, keyboard focus, hover, Increase Contrast, the storage
warning path where available, and immediate Hacker News preference refresh.

For iOS and iPadOS, build through the repository workflow and install the
rebuilt host app before testing:

```bash
make safari-build-ios
```

Check iPhone and iPad portrait and landscape presentations in light and dark
appearance. Confirm 44 px touch targets, native switch behavior, no horizontal
overflow, preference persistence, immediate Hacker News refresh, and Private
Browsing behavior after enabling the extension and allowing the
`news.ycombinator.com` site permission.

## Documentation Impact

When implementing the design, review `AGENTS.md`, `docs/project-status.md`,
`docs/development.md`, `docs/privacy.md`, `docs/app-store-checklist.md`, and the
workflow and handoff tests. Update only the files whose current-state or
verification guidance changes. No privacy, permission, storage, or App Store
data-use behavior changes are expected.

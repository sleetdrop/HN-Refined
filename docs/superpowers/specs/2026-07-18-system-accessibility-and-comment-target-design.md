# System Accessibility and Comment Target Design

**Date:** 2026-07-18

## Goal

Use native WebKit and Apple platform preferences to improve contrast, keyboard
navigation, and comment-link orientation while preserving Hacker News' compact,
traditional interface. The enhancement must remain CSS-only, automatic,
dependency-free, and auditable.

## Scope

This change covers three related behaviors on normal interactive Hacker News
pages:

- Honor the Apple system's increased-contrast preference in every HN Refined
  theme, including explicitly selected Light and Dark themes.
- Give keyboard users a clear focus indicator on links and form controls.
- Make a fragment-targeted Hacker News comment visually identifiable after
  Safari scrolls it into view.

It does not add a preference, permission, content-script behavior, animation,
or compatibility code for static information pages.

## Approach

Implement the enhancement entirely in `extension/content/content.css`. Modern
WebKit media queries and selectors provide the behavior; unsupported features
fall back to the current presentation without JavaScript detection.

This is preferred over an Accessibility settings group because system contrast
is an accessibility preference rather than a theme choice. It is also preferred
over a contrast-only change because keyboard focus and comment-link orientation
are closely related automatic accessibility improvements with the same small
CSS-only implementation boundary.

## Increased Contrast

Add an `@media (prefers-contrast: more)` block that overrides the existing
semantic custom properties after theme selection has resolved. The override
applies regardless of whether the extension theme is System, Light, or Dark.

Muted text, visited links, and subtle borders move toward the active primary
text color. Use `color-mix()` with the existing primary and content-background
tokens so one rule works across both palettes while preserving visible
information hierarchy. The mixed colors must:

- have greater contrast against the content background than their normal-theme
  values;
- keep primary text visually strongest;
- keep visited links distinguishable from unvisited links; and
- avoid changing the orange header or the overall light/dark palette.

If `color-mix()` is unavailable, the declarations are ignored and the current
validated theme colors remain in effect. No JavaScript or separate fallback
palette is required.

## Keyboard Focus

Apply a consistent `:focus-visible` outline to interactive elements in the HN
page: links, buttons, inputs, selects, and textareas. Use the system `Highlight`
color, a two-pixel outline, and a small positive offset so Safari and the user's
system appearance determine the accessible accent.

Do not remove Safari's existing focus styles and do not add `:focus` rules that
would show the keyboard indicator after ordinary touch or pointer interaction.
Existing Popup and Options focus behavior remains unchanged.

## Targeted Comment Feedback

Bind only to Hacker News comment rows with `.comtr:target`. Style the row's
`.default` content cell with:

- a narrow inset line using the active HN Refined header/accent color;
- a very lightly mixed accent background; and
- block-axis scroll margin so browser fragment positioning leaves breathing
  room around the selected comment where WebKit applies scroll margin.

The marker remains visible while the comment ID remains the document fragment.
It uses no animation, timer, DOM mutation, or generated label. Nested comment
indentation, voting, collapsing, replying, and permalink behavior remain owned
by Hacker News.

## Compatibility And Failure Behavior

All behavior is progressive enhancement:

- Browsers that do not match `prefers-contrast: more` retain current colors.
- Browsers that do not support `color-mix()` ignore only the mixed-color
  declarations.
- Browsers without `:focus-visible` retain their native focus behavior.
- Pages without a targeted `.comtr` are unchanged.

The selectors depend on Hacker News' established `.comtr` and `.default`
comment structure. This is within the project's documented stable-binding
boundary and does not justify a broader compatibility script.

## Verification

Automated checks must verify:

- the increased-contrast media query and theme-variable overrides exist;
- focus-visible covers links and native form controls without a broad `:focus`
  replacement;
- comment targeting is limited to `.comtr:target` and includes the marker and
  scroll margin;
- content JavaScript is unchanged; and
- generated and source theme validation still passes.

Real Safari acceptance must cover:

- macOS keyboard navigation through the header, story links, comment links, and
  form controls in Light and Dark themes;
- macOS Increase Contrast in System Settings with System, Light, and Dark
  extension themes;
- an iPhone or iPad direct comment permalink in portrait and landscape; and
- confirmation that normal pointer/touch use does not leave inappropriate focus
  outlines.

## Documentation

Update `docs/project-status.md` and `docs/development.md` with the automatic
system-contrast, keyboard-focus, and targeted-comment behavior and its Safari
acceptance requirements. No README or App Store preference documentation is
needed because the feature has no user-facing control.

# HN Refined Mobile Comment Editor Design

Date: 2026-07-16
Status: Approved for planning

## Purpose

Reduce the space used by Hacker News' comment textarea on iPhone without hiding
the ability to comment or replacing the original form. The interaction should
feel like a restrained enhancement of Hacker News: compact before use, generous
while writing, and fully functional without HN Refined JavaScript.

This change also corrects the textarea's asymmetric horizontal spacing on
iPhone. The current mobile `width: 100%` rule fills the remaining table cell;
Hacker News' vote columns create a left offset while the textarea border reaches
the right viewport edge. This is a layout issue, not a font-dependent issue.

## Scope

Apply the behavior only below the existing 700 px mobile breakpoint when a
coarse pointer is available, and only to Hacker News comment editors matching
the semantic form structure:

```css
#hnmain form[action="comment"] textarea[name="text"]
```

Do not change desktop textarea sizing, story submission textareas, static
information pages, form submission, or Hacker News comment data.

## Interaction

- The original textarea remains visible and focusable at all times.
- Its initial mobile size is two native textarea rows.
- First focus expands it once to six rows, a comfortable short-comment size on
  iPhone. Later focus changes preserve the user's chosen size.
- Two small controls appear immediately after the textarea: the upward triangle
  decreases its rows and the downward triangle increases them.
- Each control changes the size by four rows. The allowed range is 2 through 22
  rows, producing the sequence `2, 6, 10, 14, 18, 22`.
- The controls are native `button type="button"` elements with accessible names.
  Equal-size CSS triangles avoid font-dependent Unicode glyph rendering without
  adding image or font assets.
- Touching a size control while editing preserves textarea focus and Safari's
  virtual keyboard. Keyboard and assistive-technology activation still uses the
  button's normal click behavior.
- The selected row count lasts only for the current page. It resets naturally
  when Hacker News navigates, submits, or reloads.
- Size changes have no animation.

No disclosure link, card, dialog, overlay, toolbar, or draft storage is
introduced. The controls are styled like small Hacker News text affordances,
not modern app chrome.

## Horizontal Spacing

On mobile, the comment textarea uses `calc(100% - 28px)` for both width and
maximum width. The 28 px subtraction balances the left offset created by Hacker
News' table columns on the physical-iPhone acceptance screenshot. The controls
float right with the same 28 px gutter so they share the Hacker News help row
without modifying or depending on the optional help link.

The iPhone acceptance pass must compare both textarea borders against the
viewport edges. If Safari's rendered Hacker News geometry differs from the
expected 16 px balance, adjust this single CSS value based on the real-device
measurement; do not add viewport-specific or font-specific selectors.

## JavaScript

The existing content script enhances each matching textarea once. It records
the original Hacker News `rows` value, initializes a separate mobile row count
at 2, and inserts one control container immediately after the textarea. The
implementation must not depend on Hacker News' optional `?` help link or on a
specific table-row position.

Use `window.matchMedia("(max-width: 700px) and (any-pointer: coarse)")` to apply
the mobile row count. Outside that query, restore the original Hacker News row
count and hide the controls through CSS. Returning to the touch breakpoint
restores the user's current mobile row count. This keeps narrow macOS Safari
windows on Hacker News' native mouse-resizable textarea.

A delegated `focusin` listener changes the mobile row count from 2 to 6 only on
the first focus. Control clicks clamp row changes to the 2 through 22 range and
refresh the disabled state at each limit. A lightweight `pointerdown` guard
prevents a touch adjustment from taking focus away from an active textarea;
the `click` event remains the only event that changes rows.

The listener must not:

- Read or alter the comment text.
- Prevent or synthesize input, submit, or navigation events.
- Replace or wrap the textarea.
- Persist expansion state.
- Depend on a specific table-row position or generated element id.

This keeps the enhancement small and tolerant of minor Hacker News layout
changes while binding to the form's semantic action and field name.

## Progressive Enhancement And Accessibility

Without JavaScript, the original Hacker News textarea size and submit control
remain usable; only compact sizing and row controls are absent. Keyboard focus,
VoiceOver labeling, native text selection, spelling tools, and Hacker News
submission semantics remain owned by Safari and the original page.

The compact state must not use `display: none`, `visibility: hidden`, clipping,
or a custom replacement control.

## Verification

Automated checks must cover:

- The selector accepts only comment-form textareas.
- Mobile initialization uses 2 rows and preserves the original row count.
- First focus changes 2 rows to 6 exactly once.
- The up and down controls change the size by four rows and clamp it to 2 through 22.
- Control pointer interaction preserves an active textarea's focus.
- Viewports outside the narrow coarse-pointer query restore the original Hacker
  News rows; returning to mobile restores the selected mobile rows.
- Unrelated textareas are unchanged.
- Mobile CSS contains the right-gutter width adjustment and HN-style control
  presentation.
- Desktop rules do not compact the comment editor.
- The Xcode resource copy remains synchronized with `extension/`.

Runtime checks must cover:

- iPhone Safari at 2 rows, first-focus 6 rows, and each size limit.
- Symmetric left and right visual gutters on iPhone 17.
- Virtual-keyboard appearance without horizontal overflow or unexpected page
  jumps.
- Size controls do not dismiss the keyboard while editing.
- Comment text remains intact across size and focus changes and submits through
  Hacker News normally.
- Light and dark themes and at least two font presets.
- A desktop item page, including a narrow macOS Safari window, remains unchanged.

Run `make format`, `make check`, the relevant Safari build workflow, and real
Safari validation before committing the implementation.

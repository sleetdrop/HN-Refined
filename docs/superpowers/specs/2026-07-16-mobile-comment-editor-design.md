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

Apply the behavior only below the existing 700 px mobile breakpoint and only to
Hacker News comment editors matching the semantic form structure:

```css
#hnmain form[action="comment"] textarea[name="text"]
```

Do not change desktop textarea sizing, story submission textareas, static
information pages, form submission, or Hacker News comment data.

## Interaction

- The original textarea remains visible and focusable at all times.
- Its initial mobile height is `4.5rem`, approximately three lines of writing.
- On first focus, the textarea receives
  `data-hnr-comment-editor-expanded="true"`.
- The expanded height is `clamp(12rem, 40svh, 18rem)`.
- The textarea remains expanded after losing focus. It resets naturally only
  when Hacker News navigates, submits, or reloads the page.
- Height changes have no animation. This avoids competing with Safari's virtual
  keyboard and preserves the direct Hacker News feel.

No extra button, disclosure link, card, dialog, overlay, toolbar, or draft
storage is introduced.

## Horizontal Spacing

On mobile, the comment textarea uses `calc(100% - 16px)` for both width and
maximum width. The remaining 16 px becomes the missing right gutter and balances
the left offset already created by Hacker News' table columns.

The iPhone acceptance pass must compare both textarea borders against the
viewport edges. If Safari's rendered Hacker News geometry differs from the
expected 16 px balance, adjust this single CSS value based on the real-device
measurement; do not add viewport-specific or font-specific selectors.

## JavaScript

Add one delegated `focusin` listener to the existing content script. When the
event target matches the comment-editor selector, set the expansion data
attribute on that textarea.

The listener must not:

- Read or alter the comment text.
- Prevent or synthesize focus, input, submit, or navigation events.
- Insert or remove DOM elements.
- Persist expansion state.
- Depend on a specific table-row position or generated element id.

This keeps the enhancement small and tolerant of minor Hacker News layout
changes while binding to the form's semantic action and field name.

## Progressive Enhancement And Accessibility

Without JavaScript, the original textarea and submit control remain usable; only
the focus-driven expansion is absent. Keyboard focus, VoiceOver labeling, native
text selection, spelling tools, and Hacker News submission semantics remain
owned by Safari and the original page.

The compact state must not use `display: none`, `visibility: hidden`, clipping,
or a custom replacement control.

## Verification

Automated checks must cover:

- The selector accepts only comment-form textareas.
- First focus adds the expansion attribute.
- Repeated focus is harmless.
- Unrelated textareas are unchanged.
- Mobile CSS contains the compact height, expanded height, and right-gutter
  width adjustment.
- Desktop rules do not compact the comment editor.
- The Xcode resource copy remains synchronized with `extension/`.

Runtime checks must cover:

- iPhone Safari before focus, while editing, and after focus leaves the field.
- Symmetric left and right visual gutters on iPhone 17.
- Virtual-keyboard appearance without horizontal overflow or unexpected page
  jumps.
- Comment text remains intact after focus changes and submits through Hacker
  News normally.
- Light and dark themes and at least two font presets.
- A desktop item page remains unchanged.

Run `make format`, `make check`, the relevant Safari build workflow, and real
Safari validation before committing the implementation.

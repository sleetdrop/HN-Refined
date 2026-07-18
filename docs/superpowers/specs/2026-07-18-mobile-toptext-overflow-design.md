# Mobile Story Text Overflow Design

## Problem

Hacker News story submissions can include long URLs inside `.toptext`. On narrow
screens, those links contribute a wide intrinsic size to Hacker News' nested
automatic-layout tables. The resulting table width exceeds the viewport, so the
header, story metadata, comment form, and comments all appear horizontally
cropped.

Even when content fits, Hacker News' mobile item layout has no consistent
right-side gutter for the main story and comment area. Some lines can therefore
sit against iOS Safari's overlay scroll indicator.

The issue is reproducible on `item?id=48945241` in unmodified mobile browsers.
HN Refined should correct it on its supported mobile Safari surface without
changing Hacker News' table structure or hiding content.

## Design

Inside the existing `max-width: 700px` mobile rules, apply
`overflow-wrap: anywhere` to `#hnmain .toptext` when HN Refined's automatic
mobile presentation is active.

This rule lowers the story text's intrinsic minimum width and permits a long URL
to wrap only when normal line-breaking opportunities are insufficient. Ordinary
prose continues to wrap at spaces. The fix remains CSS-only and applies to the
author-supplied story text that causes the overflow.

In the same mobile scope, add `12px` of inline-end padding to the direct content
cell of `#bigbox`, using `box-sizing: border-box`. `#bigbox` is Hacker News' main
item-page container, so one stable binding gives the story, author text, comment
form, and comment tree a shared right gutter without changing voting or comment
indentation on the left. The top navigation remains unchanged.

## Boundaries

- Do not hide horizontal overflow on `body` or `#hnmain`.
- Do not switch Hacker News tables to fixed layout or block layout.
- Do not add JavaScript or inspect story text.
- Do not change desktop story typography.
- Do not add padding to the top navigation.
- Keep existing comment wrapping and mobile comment-editor behavior unchanged.

## Verification

- Add CSS regression tests requiring the scoped mobile `.toptext` rule and the
  `#bigbox` content-cell gutter.
- Confirm the rule is absent from desktop-only behavior.
- Run the complete formatting and test gates.
- Rebuild the iOS simulator app and verify `item?id=48945241` no longer scrolls
  or clips horizontally, main content stays clear of the scroll indicator, and
  ordinary story and comment pages remain intact.

# Mobile Story Text Overflow Design

## Problem

Hacker News story submissions can include long URLs inside `.toptext`. On narrow
screens, those links contribute a wide intrinsic size to Hacker News' nested
automatic-layout tables. The resulting table width exceeds the viewport, so the
header, story metadata, comment form, and comments all appear horizontally
cropped.

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

## Boundaries

- Do not hide horizontal overflow on `body` or `#hnmain`.
- Do not switch Hacker News tables to fixed layout or block layout.
- Do not add JavaScript or inspect story text.
- Do not change desktop story typography.
- Keep existing comment wrapping and mobile comment-editor behavior unchanged.

## Verification

- Add a CSS regression test requiring the scoped mobile `.toptext` rule.
- Confirm the rule is absent from desktop-only behavior.
- Run the complete formatting and test gates.
- Rebuild the iOS simulator app and verify `item?id=48945241` no longer scrolls
  or clips horizontally while ordinary story and comment pages remain intact.

# Focused Comment Narrowing Design

Date: 2026-07-30

## Goal

Make explicit comment focus feel like entering a temporary Hacker News comment
page rather than applying a filter to the existing item page. The focused view
must preserve Hacker News' visual language, navigation targets, and collapse
state while preventing the story and reply form from reappearing above the
focused subtree.

## Hacker News Action Grammar

Hacker News renders comment navigation and collapse as two related but distinct
groups:

```text
root | parent | prev | next [–]
```

`focus` joins the separated navigation actions. The collapse toggle remains the
unseparated terminal control:

```text
root | parent | prev | next | focus [–]
```

There is no separator between `focus` and `[–]`.

## Focused Page Surface

Entering focus creates a temporary narrowed Hacker News page:

- Keep Hacker News' orange site header.
- Keep the focus guide and the selected comment subtree.
- Hide the story/topic, reply form, page spacers, footer, and comments outside
  the selected subtree.
- Do not move or clone Hacker News nodes.
- Mark only existing page blocks and comment rows with HN Refined-owned data
  attributes; CSS owns their temporary visibility.

The controller resolves the comment tree's containing Hacker News content row.
Within that row, it marks element siblings outside the guide and comment tree as
page-excluded. At the outer `#hnmain` level, it keeps the site-header row and the
row containing the comment tree, and marks other rows as page-excluded. If this
surface cannot be resolved safely, focus is not offered and native Hacker News
remains unchanged.

## Entry and Exit

On the first explicit `focus` action:

1. Save the selected comment ID and its viewport offset.
2. Push one focus History entry.
3. Apply the page-level narrowing mask.
4. Mask comment rows outside the selected subtree and rebase indentation within
   it.
5. Render `focused: <user>'s replies | all`.
6. Reveal the focused root immediately below the guide.

Focusing a deeper subtree replaces the existing focus History state instead of
stacking another Back step.

`all` and Safari Back remove both page-level and comment-row masks, then restore
the saved comment and viewport offset. A same-page Hacker News target outside
the focused subtree exits focus without restoring the old offset, so the
requested native target wins. Page-changing links remain untouched.

## Scrolling Semantics

Focus never reacts to scrolling:

- No scroll listener, observer, threshold, direction detection, or automatic
  exit.
- No scroll-position clamping or touch-event interception.
- Pulling upward reaches the Hacker News site header and focus guide, never the
  story or reply form.
- The guide remains sticky while reading down the narrowed subtree.

This avoids both an undisclosed gesture rule and the WebKit momentum-scroll
problems previously caused by changing layout from the scroll path.

## Hacker News State

HN Refined does not modify HN's `coll` class, inline visibility, toggle text,
descendant count, IDs, or `href` values. `[–]` and `[n more]` remain independent
from focus. `root`, `parent`, `prev`, and `next` retain their original targets
and follow the established inside/outside focus rules.

## Accessibility and Failure Behavior

`focus` and `all` remain real links with accessible names. Page-excluded and
comment-excluded content uses `display: none`, so it also leaves keyboard and
assistive-technology traversal while narrowed. Exiting focus removes only HN
Refined attributes.

If expected Hacker News structure is absent, malformed, or ambiguous, the
controller leaves the page unmodified and does not expose focus.

## Verification

Automated tests cover:

- Exact `next | focus [–]` action grammar.
- Safe focused-surface resolution and fail-closed behavior.
- Topic, reply form, footer, spacers, and outside comments hidden only during
  focus.
- Site header, guide, and focused subtree retained.
- Focus root revealed below the guide on entry.
- `all`, Safari Back, nested focus, HN navigation, and collapse preservation.
- No scroll-triggered state changes or registered scroll handling.

iPhone Safari acceptance covers portrait and landscape entry, long upward and
downward scrolling, the top boundary, nested focus, `all`, Safari Back, HN
navigation, `[–]` / `[n more]`, and restoration of the original item page and
reading position.

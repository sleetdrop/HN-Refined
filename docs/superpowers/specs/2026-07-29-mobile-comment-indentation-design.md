# Mobile Comment Indentation Design

Date: 2026-07-29

## Goal

Preserve Hacker News' existing mobile comment hierarchy while preventing deep
threads from consuming excessive horizontal space.

HN Refined already retains visible indentation for shallow comments. The defect
is narrower: the current `max-width: 32px` rule makes all comments at depth four
and beyond share the same left position. This removes meaningful tree structure
from deep threads.

## Product Decision

Replace the 32 px hard cap with monotonically increasing, progressively
compressed indentation.

Do not add branch lines, closure marks, depth badges, path-highlighting
interactions, settings, or new controls. Keep Hacker News' existing visual and
interaction language:

- The indentation spacer remains the hierarchy signal.
- The vote triangle continues to move with the comment depth.
- Comment metadata remains in its original order.
- `[–]` / `[n more]` remains at the end of Hacker News' metadata navigation.
- `root`, `parent`, `prev`, and `next` retain their current placement and
  behavior.

## Indentation Scale

Treat top-level comments as depth zero.

| Depth range  |       Increment | Resulting examples         |
| ------------ | --------------: | -------------------------- |
| 0            |               — | 0 px                       |
| 1–2          | 12 px per level | 12 px, 24 px               |
| 3–6          |  8 px per level | 32 px, 40 px, 48 px, 56 px |
| 7 and deeper |  4 px per level | 60 px, 64 px, 68 px, …     |

In formula form:

```text
indent(0) = 0
indent(d) = 12d                              for 1 <= d <= 2
indent(d) = 24 + 8(d - 2)                   for 3 <= d <= 6
indent(d) = 56 + 4(d - 6)                   for d >= 7
```

This scale preserves HN's native 12 px distinction for the first two nested
levels, matches the current HN Refined position at depth three, and restores a
visible difference at every deeper level. The decreasing increments reserve
more paragraph width than Hacker News' native linear 12 px scale.

## Implementation Boundary

Keep the change CSS-only and inside the existing automatic mobile breakpoint.
Desktop and wider layouts remain unchanged.

Use selectors based on Hacker News' existing indentation spacer image widths,
following the same structural contract used by HN's own mobile stylesheet.
Cover the depth values for which HN currently publishes mobile indentation
rules. Do not inspect comment text, reconstruct the comment tree in JavaScript,
or observe collapse mutations.

If Hacker News later changes its indentation markup, ordinary HN fallback
behavior is preferable to adding speculative compatibility code.

## Interaction and Accessibility

The change affects horizontal position only. It must not alter:

- Vote targets or vote state.
- Collapse targets, subtree visibility, or collapsed counts.
- Fragment navigation and target highlighting.
- Comment link hit areas.
- Reading order or assistive-technology semantics.
- Theme colors, typography, density, or stored preferences.

No animation or transition is needed.

## Verification

Automated checks should guard that:

- The generic 32 px maximum is removed.
- Depths zero through at least eight follow the approved scale.
- Every covered depth is strictly farther right than the preceding depth.
- The rules remain scoped to automatic mobile layout.
- No JavaScript behavior or preference surface is introduced.

After `make format && make check`, rebuild and install the iOS Safari extension
using the repository workflow. Inspect the same deep Hacker News chain on the
iPhone 17 Pro simulator used during design review:

- `https://news.ycombinator.com/item?id=49096188`
- Comment `49097812` at depth six.
- Comment `49097531` at depth four.
- Comment `49097702` at depth five.

The three comments must no longer share the same left edge. Depth six must sit
farther right than depth five, which must sit farther right than depth four,
while all three paragraphs remain comfortably readable in portrait width.

Also check a top-level comment and depths one through three to confirm their
existing visual rhythm is preserved. Collapse and expand one subtree and use a
`parent` link to confirm Hacker News behavior is unchanged.

## Documentation Impact

Update `docs/project-status.md` in the implementation change to replace any
remaining guidance that implies mobile comment indentation is hard-capped.
No privacy, permission, App Store, signing, or settings documentation changes
are expected.

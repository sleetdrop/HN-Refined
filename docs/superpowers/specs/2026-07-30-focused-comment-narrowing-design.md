# Focused Comment View Stack Design

Date: 2026-07-30

## Goal

Make explicit comment focus behave as a stable, nested reading view rather than
as a filter on the existing item page. The focused root must gain the full
reading width, the top guide must remain the top of the view, and repeated focus
actions must form a History-aware stack that still respects Hacker News'
navigation targets and collapse state.

## Physical-Device Findings

The first narrowing implementation exposed three gaps during physical iPhone
testing:

- The focused root did not move left. The scope and baseline indentation rules
  have equal specificity, and the later baseline rule wins the cascade.
- Retaining Hacker News' orange site header leaves content above the sticky
  guide. At the top of the document, the guide returns to normal flow beneath
  the header and no longer feels like persistent Focus View navigation.
- A side-mounted exit handle would consume scarce reading width. Focus is an
  explicit close-reading action, and Safari Back already provides a convenient
  one-handed way to leave nested views.

The revised design treats these as one state-model problem rather than three
isolated visual patches.

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

## Focus View Surface

Entering the first focus creates a temporary narrow Hacker News view:

- Hide Hacker News' orange site header, story/topic, reply form, page spacers,
  footer, and comments outside the selected subtree.
- Keep the focus guide and selected subtree as the only visible page content.
- Make the guide the first visible element and keep it sticky at the top for the
  entire Focus View lifetime.
- Do not move, clone, or reconstruct Hacker News nodes.
- Mark only existing page blocks and comment rows with HN Refined-owned data
  attributes; CSS owns their temporary visibility.

The controller resolves the comment tree's direct Hacker News content cell,
`#bigbox`, `#hnmain`, its body, and the site-header row. If these relationships
cannot be established unambiguously, focus is not offered. Although the header
is resolved as a structural guard, it is excluded while focused.

## Indentation Rebase

The selected focus root becomes relative depth zero and receives no indentation.
Its descendants keep only their depth relative to that root, using the existing
progressive indentation formula.

The focus-specific CSS rule must either follow the baseline rule or have
unambiguously greater specificity. Automated coverage must lock the effective
cascade relationship so the baseline custom property cannot again override
`--hnr-comment-indent`.

## Fixed Guide

The guide uses the approved A1 layout:

```text
all | focused: nolok / loumf / current
```

- `all` is the leading action and the only interactive element in the path.
- `all` looks like an ordinary HN text link but receives a 44–48 px transparent
  touch target.
- The path is informational rather than clickable. This avoids creating a
  second navigation system beside Safari History and HN's original links.
- The current focus step is stronger; prior steps use the current theme's muted
  text color.
- One through three focus steps are shown in full. Four or more preserve the
  first and current steps and collapse the middle to an ellipsis.
- A missing username renders as the neutral label `comment`.
- Overflow truncation must preserve the leading `all` action and current step
  before sacrificing earlier path text.

The guide's one-pixel divider derives from each active theme's existing
`topBarBackground` and `contentBackground`. Light and dark modes may use
different mixing strengths so the line remains recognizably HN orange without
becoming loud in light mode or muddy in dark mode. The component does not own a
fixed raw orange value.

## Focus View Stack

Each explicit focus action creates one stack entry. An entry identifies its
focused root and the reading anchor needed to restore the containing view.

On the first focus:

1. Save the full-thread comment anchor and viewport offset.
2. Push a History state containing the first focus stack.
3. Apply the page mask, comment mask, and indentation rebase.
4. Render the fixed guide and reveal the selected root below it.

Before entering a deeper focus, update the current History state with its
reading anchor, then push a new History state containing the extended stack.

History behavior is view-like:

- Safari Back removes one focus level and restores the containing Focus View's
  reading position.
- Safari Forward re-enters the focus level when its records remain valid.
- Back from the first focus returns to the complete thread and restores the
  original reading position.
- `all` exits every focus level in one action and restores the complete thread's
  original reading position.

If a History state refers to comments that no longer exist or no longer form a
valid nested stack, the controller clears its masks and returns to the complete
thread rather than rendering a partial view.

## Hacker News Navigation in a Stack

Original same-page `root`, `parent`, `prev`, and `next` targets remain the source
of truth. The controller compares the target with the current and ancestor focus
subtrees:

- A target inside the current subtree keeps the current focus.
- A target outside the current subtree but inside an ancestor focus returns to
  the deepest ancestor view that contains it, then navigates to the requested
  target.
- A target outside every focus subtree exits the complete stack, then navigates
  to the requested target.

This means `parent` may naturally return one level while `root` may naturally
leave several levels. The requested HN target wins over restoring an obsolete
reading position. Page-changing links remain outside focus coordination.

HN Refined does not reinterpret HN links as next or previous visible items, and
it does not change their destination IDs.

## Scrolling Semantics

Focus never reacts to scrolling:

- No scroll listener, observer, threshold, direction detection, or automatic
  exit.
- No scroll-position clamp, touch-event interception, or momentum-scroll
  compensation.
- The guide is the top boundary of the focused document, so upward scrolling
  cannot reveal the HN header, story, or reply form.
- The guide remains sticky while reading down the narrowed subtree.

This preserves native WebKit scrolling and avoids the interruption and
oscillation found in the removed Automatic mode.

## Hacker News State

Focus and HN collapse remain separate state layers. HN Refined does not modify
HN's `coll` class, inline visibility, toggle text, descendant count, IDs, vote
actions, reply actions, or comment order. `[–]` and `[n more]` retain their
current state across focus transitions.

## Accessibility and Failure Behavior

`focus` and `all` remain real links with accessible names. The enlarged `all`
target must not introduce a visible button treatment. Page-excluded and
comment-excluded content uses `display: none`, removing it from keyboard and
assistive-technology traversal while narrowed.

Every exit path removes only HN Refined's page mask, comment mask, indentation
properties, and guide content. Structure resolution and History restoration
fail closed to the complete Hacker News thread.

## Non-Goals

- No side-mounted exit handle or handedness preference.
- No clickable breadcrumb steps.
- No automatic focus, scroll-driven scope, or gesture interception.
- No replacement HN header or rewritten HN navigation.
- No framework, dependency, permission, or cross-engine compatibility layer.

## Verification

Automated tests cover:

- Exact `next | focus [–]` action grammar.
- Effective focus indentation precedence, zero-indent roots, and relative child
  indentation.
- Safe surface resolution and fail-closed behavior.
- Site header, story, reply form, footer, spacers, and outside comments hidden
  only during focus.
- Fixed A1 guide structure, accessible `all`, path rendering, long and missing
  usernames, and four-level path folding.
- First focus, nested focus, Back, Forward, `all`, per-level reading-position
  restoration, and invalid History states.
- HN targets inside the current scope, inside an ancestor scope, and outside the
  complete stack.
- Collapse-state preservation and the absence of scroll-triggered state changes.
- Theme-aware divider rules for Light, Dark, System Dark, and Increase Contrast.

Physical iPhone Safari acceptance covers portrait and landscape, genuine root
rebasing, repeated nested focus, long upward and downward scrolling, the fixed
top boundary, one-handed Safari Back, Forward, `all`, original HN navigation,
`[–]` / `[n more]`, theme coordination, and restoration of each containing view
and the original item page.

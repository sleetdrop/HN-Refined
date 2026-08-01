# Focused Comment View and Ancestry Guide Design

Date: 2026-07-30
Revised: 2026-08-01

## Goal

Make explicit comment focus behave as a stable, scoped reading view rather than
as a filter on the existing item page. The focused root must gain the full
reading width, the top guide must remain the top of the view, and every focus or
zoom transition must participate in Safari History while still respecting
Hacker News' navigation targets and collapse state. The guide must describe the
focused comment's real position in Hacker News' original comment tree,
independently of how the reader reached it, and act as restrained ancestor
navigation when the reader asks to widen the view.

## Physical-Device Findings

The first narrowing implementation exposed five gaps during physical iPhone
testing:

- The focused root did not move left. The scope and baseline indentation rules
  have equal specificity, and the later baseline rule wins the cascade.
- Retaining Hacker News' orange site header leaves content above the sticky
  guide. At the top of the document, the guide returns to normal flow beneath
  the header and no longer feels like persistent Focus View navigation.
- A side-mounted exit handle would consume scarce reading width. Focus is an
  explicit close-reading action, and Safari Back already provides a convenient
  one-handed way to leave nested views.
- The first ancestry guide treated the user's Focus View History entries as
  comment hierarchy. Directly focusing a deeply nested comment therefore showed
  only one label, and an empty flexible prior-label region pushed that label to
  the far right. The visible hierarchy must instead come from Hacker News'
  parent chain and wrap naturally beside the leading `all` action.
- Once the real ancestry was visible, a permanently complete long chain became
  more visually expensive than the earlier middle ellipsis, while a purely
  informational chain created a strong but unfulfilled expectation that an
  ancestor author could be tapped to zoom out. The guide therefore needs a
  compact default and explicit ancestor navigation without redefining HN's own
  target links.

A later physical-iPhone pass exposed four presentation defects after ancestor
links were enabled:

- A compact path could leave the current author alone on a continuation line,
  separating it from the parent context that explains it.
- The 44 px `all` target centered its label within its own box and therefore
  appeared aligned with the middle of a multi-line path rather than the first
  navigation line.
- Hacker News' `#hnmain td a` link selector could override inherited guide color,
  making every linked ancestor compete visually with the current author.
- A trailing text-space after `focused:` could collapse at the flex-item
  boundary, visually joining the prefix to the first author.

The revised design treats these gaps as one state-model problem rather than a
collection of isolated visual patches.

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

When Thread Focus is enabled, every comment that owns a nonempty reply subtree
offers `focus`, regardless of its original depth. Leaf comments do not. Inside a
Focus View, the current focused root does not repeat the same `focus` action,
while eligible descendants continue to offer it for entering a narrower view.

## Indentation Rebase

The selected focus root becomes relative depth zero and receives no indentation.
Its descendants keep only their depth relative to that root, using the existing
progressive indentation formula.

The focus-specific CSS rule must either follow the baseline rule or have
unambiguously greater specificity. Automated coverage must lock the effective
cascade relationship so the baseline custom property cannot again override
`--hnr-comment-indent`.

## Comment Relationship Model

The ordered Hacker News comment rows remain the only source for focus
relationships. Each record retains its original parent index and subtree end.
The controller derives an ordered ancestry of structural entries—record index,
row ID, and validated author label—rather than reducing ancestry to display
strings. The guide uses the IDs for real same-page ancestor links and the labels
for presentation.

Minimal widening compares the ancestor-index chains of the current focused root
and HN's requested target. Their deepest shared index is the nearest common
comment ancestor. No comment prose, story identity, network API, or reconstructed
tree is used. A missing target record, invalid parent chain, or unexpected
missing author fails closed by leaving Focus View before following HN's unchanged
target.

## Ancestry Guide

The guide uses the approved A1 layout:

```text
all | focused: root-user / child-user / current-user
```

- `all` remains the leading exit action.
- `all` looks like an ordinary HN text link but receives a 44–48 px transparent
  touch target.
- `all` aligns with the first visual line of the ancestry path in compact and
  expanded states. It does not center against the total height of a multi-line
  path because it exits the entire Focus View rather than labeling the current
  author.
- The path contains the original Hacker News author ancestry from the focused
  branch's top-level comment through the current focused comment. The story,
  topic, and story author never enter it.
- The path is derived by following the comment model's original parent indexes;
  it does not display the Focus View History stack. Directly focusing a deep
  comment and reaching it through several nested Focus Views produce the same
  path.
- Ancestor authors are real links. Selecting one widens the Focus View to that
  author's comment. Their `href` remains the corresponding same-page comment
  fragment so the DOM retains understandable link semantics. The current author
  is stronger plain text because selecting the already-current root would be
  redundant.
- The current author is stronger; ancestor authors, separators, and the
  `| focused:` prefix use the current theme's muted text color.
- Ancestor link color is set explicitly with enough specificity to win inside
  Hacker News' `#hnmain td` structure in both link and visited states. Only the
  current author uses the primary reading color; link semantics are conveyed by
  underline and interaction rather than a second high-emphasis color.
- `focused:` owns explicit CSS inline-end spacing before the first author. The
  layout does not depend on trailing text whitespace surviving a flex boundary.
- The hierarchy uses `/`, while HN's `|` remains reserved for peer actions and
  region separation. Every slash has equal visible spacing on both sides, as in
  `alice / bob`; CSS spacing rather than a trailing text-space must enforce this
  because WebKit may collapse whitespace at flex-item boundaries. Each author
  and its following slash remain one wrapping unit so a line never starts with
  a stranded separator.
- An ancestry of five authors or fewer is shown completely. A longer ancestry
  initially shows the first author, an ellipsis, and the final three authors:
  `root / … / grandparent / parent / current`. The ellipsis is a semantic button
  styled like restrained HN navigation text. Selecting it reveals the complete
  chain without changing focus, URL, or History.
- The final `parent / current` pair is one wrapping group in both compact and
  expanded states. If the remaining line cannot contain both, the pair moves to
  the next line together; the current author is never orphaned by ordinary guide
  wrapping. Hacker News usernames are short enough for this pair to remain
  within the path column at the guide's fixed 12 px type size.
- Expansion is one-way for the current Focus session: after the reader asks for
  the complete chain, later focus and zoom transitions keep complete ancestry
  visible until the Focus session ends. There is no second collapse control.
- Neither the compact nor expanded path truncates an ordinary visible author.
  Both wrap naturally in the path region. An unexpectedly long individual
  author may wrap rather than widening the page.
- The layout keeps `all` in a fixed leading touch region and lets the path wrap
  in the remaining region. Continuation lines use that path region as a hanging
  indent instead of occupying the `all` target.
- Normal Hacker News comments are attributed to users. If Hacker News itself
  explicitly marks a retained ancestor as deleted, its structural position is
  labeled `[deleted]`. A missing `.hnuser` without an explicit HN deletion marker
  makes that branch ineligible for Focus rather than inventing an author label.

The guide's one-pixel divider derives from each active theme's existing
`topBarBackground` and `contentBackground`. Light and dark modes may use
different mixing strengths so the line remains recognizably HN orange without
becoming loud in light mode or muddy in dark mode. The component does not own a
fixed raw orange value.

## Thread Focus Preference

The full settings page gives mobile comment focus one Boolean control under its
own group:

```text
Mobile Comment Threads
Focus isolates one comment and its replies in a dedicated reading view.
Turn it off to keep indentation only.

Thread Focus                                      [ on ]
```

Thread Focus defaults to on. Turning it off removes every `focus` action and the
guide while retaining the automatic progressive mobile indentation. If a reader
turns it off from an active Focus View, the controller leaves the complete Focus
session and restores the full discussion position. Turning it on adds eligible
links without entering a view or moving the page.

The persisted preference is Boolean. Existing local `indentation-only` state
migrates to off; existing `on-demand`, removed `automatic`, missing, or invalid
state migrates to the default on state. The preference remains local, and it
adds no permission, remote request, or persisted reading history.

## Focus View History

Each Focus View History state identifies its current focused root, the session's
full-thread return anchor, and any reading anchor needed to restore the previous
view. The sequence records user navigation, not tree ancestry: a later state may
be narrower because the reader focused a descendant, or wider because the
reader selected an ancestor or followed an HN target outside the current
subtree.

On the first focus:

1. Save the full-thread comment anchor and viewport offset.
2. Push a History state containing the first focused root and session anchor.
3. Apply the page mask, comment mask, and indentation rebase.
4. Render the fixed guide and reveal the selected root below it.

Before any focus-root transition, update the current History state with its
reading anchor, then push a new state containing the complete next Focus View.
This applies to descendant `focus`, ancestor-author zoom, and the minimal
widening needed for an original HN navigation target.

History behavior is view-like:

- Safari Back reverses one user transition and restores that earlier Focus
  View, even when the earlier view was narrower rather than wider.
- Safari Forward reapplies the transition when its records remain valid.
- Back from the first focus returns to the complete thread and restores the
  original reading position.
- `all` traverses past every Focus-marked History entry in one action and
  restores the complete thread's original reading position.

The ancestry-expanded flag is page-local session presentation state rather than
a separate History entry. If a History state refers to comments that no longer
exist or cannot form a valid Focus View, the controller clears its masks and
returns to the complete thread rather than rendering a partial view.

## Hacker News Navigation and Minimal Widening

Original same-page `root`, `parent`, `prev`, and `next` targets remain the source
of truth. HN Refined never substitutes a different destination or redefines
`prev` and `next` as traversal among currently visible comments. It changes only
the Focus View root needed to contain HN's unchanged target:

- A target inside the current subtree keeps the current focus.
- A target outside the current subtree but sharing an original comment ancestor
  with the current focused root widens focus to their nearest common ancestor,
  then navigates to the requested target. If the target itself is an ancestor,
  that target becomes the widened root.
- A target in another top-level comment tree, with no shared comment ancestor,
  exits Focus View and then navigates to the requested target.

An HN navigation that changes the Focus root creates a Focus View History state,
so Safari Back restores the exact preceding view. A same-page target already
inside the current subtree retains that view and its corresponding fragment
History state. The requested HN target wins over restoring an obsolete reading
position. Page-changing links remain outside focus coordination.

The same original parent model powers ancestor links in the guide. Selecting an
ancestor author pushes a wider Focus View rooted at that exact comment; Back
returns to the narrower view, Forward reapplies the zoom, and `all` still exits
the complete Focus session.

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

`focus`, `all`, and ancestor authors remain real links with accessible names.
The ellipsis is a semantic button whose accessible name describes revealing the
complete comment ancestry. The enlarged targets must not introduce a visible
modern button treatment. The Thread Focus setting uses Safari's native switch
presentation. Page-excluded and comment-excluded content uses `display: none`,
removing it from keyboard and assistive-technology traversal while narrowed.

Every exit path removes only HN Refined's page mask, comment mask, indentation
properties, and guide content. Structure resolution and History restoration
fail closed to the complete Hacker News thread.

## Non-Goals

- No side-mounted exit handle or handedness preference.
- No automatic focus, scroll-driven scope, or gesture interception.
- No depth threshold or numeric level preference for showing `focus`.
- No replacement HN header, changed HN destination, or Focus-local rewrite of
  `prev` and `next`.
- No framework, dependency, permission, or cross-engine compatibility layer.

## Verification

Automated tests cover:

- Exact `next | focus [–]` action grammar.
- Effective focus indentation precedence, zero-indent roots, and relative child
  indentation.
- Safe surface resolution and fail-closed behavior.
- Site header, story, reply form, footer, spacers, and outside comments hidden
  only during focus.
- Fixed A1 guide structure; accessible `all`, ellipsis, and ancestor links;
  symmetric slash spacing; parent-derived author ancestry; five-step compact
  threshold; one-way expansion; first-line `all` alignment; explicit prefix
  spacing; muted ancestor links; an inseparable final parent/current wrapping
  group; deleted-author handling; natural path wrapping; and direct-versus-
  nested Focus path equivalence.
- Default-on Thread Focus normalization, legacy preference migration, native
  settings behavior, immediate current-window HN-tab refresh, every eligible
  subtree receiving `focus`, leaf exclusion, and current-root exclusion.
- First focus, descendant focus, ancestor zoom, minimal-widening navigation,
  Back, Forward, `all`, per-view reading-position restoration, and invalid
  History states.
- HN targets inside the current scope, outside it with a nearest common comment
  ancestor, and in another top-level tree.
- Collapse-state preservation and the absence of scroll-triggered state changes.
- Theme-aware divider rules for Light, Dark, System Dark, and Increase Contrast.

Physical iPhone Safari acceptance covers portrait and landscape, genuine root
rebasing, repeated nested focus, long upward and downward scrolling, the fixed
top boundary, one-handed Safari Back, Forward, `all`, original HN navigation,
`[–]` / `[n more]`, theme coordination, long wrapping ancestry, direct deep
focus, compact and expanded ancestry, ancestor-author zoom, nearest-common-
ancestor widening for `parent` / `root` / `prev` / `next`, shallow top-level-
thread focus, Thread Focus toggling, and restoration of each visited view and
the original item page. Compact and expanded paths must keep `all` aligned with
their first line, keep ancestors muted and only the current author primary,
preserve visible spacing after `focused:`, and never strand the current author
without its parent. The item page
`item?id=49098510#49101840` is the primary regression case: focusing `apitman`
must show every comment author from that branch's top-level comment through
`apitman`, with no story identity and no far-right displacement.

Thread Focus eligibility follows coarse-pointer capability rather than the
700 px narrow-layout breakpoint. Rotating an entered iPhone Focus View to
landscape and back must preserve the same Focus History state; progressive
narrow-screen indentation remains width-based.

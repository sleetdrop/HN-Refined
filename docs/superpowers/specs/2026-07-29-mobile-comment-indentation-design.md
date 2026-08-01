# Deep Mobile Comment Threads Design

> Superseded behavior, 2026-07-30: physical-iPhone testing found that the
> automatic local scope interrupted momentum scrolling and could oscillate at
> subtree boundaries. Automatic scope is removed. The progressive indentation
> baseline and explicit `focus` / `all` design remain current; sections below
> describing automatic entry are retained only as decision history.

Date: 2026-07-29

## Goal

Make deeply nested Hacker News discussions readable on narrow Safari viewports
without replacing Hacker News' comment model or making ordinary threads look
like a redesigned product.

HN Refined already retains visible indentation for shallow comments. The current
`max-width: 32px` rule makes all comments at depth four and beyond share the same
left position. A purely linear replacement would restore hierarchy, but very
deep threads would eventually leave too little room for text. The design must
therefore preserve indentation while also providing a local reading viewport
when indentation becomes the limiting factor.

## Product Principle

This feature is an enhancement, not a reskin.

Most users should install HN Refined and continue to recognize Hacker News
immediately. The enhancement should remain nearly invisible in ordinary use and
appear only at the point where the original interface becomes difficult: a long,
deeply nested mobile discussion. At that moment it should feel like the product
understood the reader's situation.

The effect comes from revealing useful structure at the right time, not from
decoration. Modern CSS and small amounts of JavaScript may illuminate the
old-school interface, but must not translate it into a different product's
visual or interaction language.

This gives the feature four acceptance principles:

1. **Quiet by default.** Shallow and ordinary threads gain no persistent chrome.
2. **Triggered by need.** New guidance appears only when deep indentation begins
   to compete materially with readable line width.
3. **HN remains the source of truth.** Existing comment relationships, link
   targets, voting, and collapse state are not reconstructed or redefined.
4. **Every new element explains or enables something.** No branch line, badge,
   animation, or control exists solely to make the page look modern.

## Progressive Indentation Baseline

Treat top-level comments as depth zero. Replace the 32 px hard cap with
monotonically increasing, progressively compressed indentation:

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

The small comment controller derives this value from HN's existing numeric
`indent` attribute and exposes it as a CSS custom property; one mobile CSS rule
binds that value to HN's spacer image. This keeps the formula reviewable and
works at arbitrary depth without enumerating selectors. It is the complete
behavior for users who choose indentation-only mode. If JavaScript does not run,
the custom-property declaration is invalid and Safari falls back to HN's native
spacer width rather than flattening or hiding the thread.

## Three Reading States

The implementation has three explicit states. Only one may be active at a time.

### 1. Global

All comments use progressive indentation. There is no local root and no added
guide. This is the normal state for almost the entire page.

### 2. Automatic local scope

When a deep subtree reaches the top reading edge and its accumulated indentation
is materially reducing line width, HN Refined temporarily treats a stable
ancestor as the viewport's local root. The subtree is rebased left relative to
that root; no comments are hidden.

A compact sticky guide appears only while this rebase is active. It uses HN's
plain metadata vocabulary and restrained punctuation, for example:

```text
… 4 levels above | root | parent
```

The guide communicates that the viewport has shifted and exposes existing HN
relationships. It is not a breadcrumb reconstruction of every ancestor. The
scope remains stable while the reader traverses the subtree, then disappears
when the subtree ends. It must not continuously choose a new root during normal
scrolling.

### 3. Explicit focus

For an eligible comment with descendants, a small `focus` action allows the
reader to make that comment a deliberate local root. Outside rows are visually
excluded and the selected subtree is rebased to the left edge. The status line
remains HN-like:

```text
focused: username's replies | all
```

`all` returns to the full discussion. The action is offered only where a subtree
exists and deep nesting makes it useful; it must not add a new link to every
ordinary or leaf comment.

Focus is a page-navigation state, not merely a CSS visibility effect. Entering
it adds a same-page history state so Safari Back first leaves focus and restores
the prior reading anchor rather than immediately leaving the item page.

## Preference Model

Expose one deep-thread preference with three choices:

- **Automatic:** progressive indentation, automatic local scope, and the
  explicit `focus` action. This is the recommended default.
- **On demand:** progressive indentation and the explicit `focus` action, with
  no automatic viewport rebase.
- **Indentation only:** progressive indentation without JavaScript scope UI.

Automatic and explicit focus are not competing visual treatments. They answer
different intentions: automatic scope helps a reader continue scrolling;
explicit focus helps a reader deliberately study one branch. Entering focus
suspends automatic scope, and leaving focus allows automatic scope to resume.

## Navigation Semantics

Introducing focus changes page state, so correct behavior cannot be defined as
preserving an identical screen after every original HN action. The higher-level
invariant is:

> An original HN link must retain its original target comment. Focus may remain
> active or be exited according to whether that target belongs to the focused
> subtree.

Apply the same rule to all existing fragment-navigation actions:

| Action             | Target is inside focused subtree           | Target is outside focused subtree            |
| ------------------ | ------------------------------------------ | -------------------------------------------- |
| `parent`, `root`   | Keep focus and move to the original target | Exit focus, then move to the original target |
| `prev`, `next`     | Keep focus and move to the original target | Exit focus, then move to the original target |
| Sticky-guide links | Use the local root's existing HN target    | Exit scope if required, then use that target |

Do not reinterpret `prev` and `next` as previous or next _visible_ comment in
focus. HN's server-generated target ID remains authoritative even when it points
outside the current branch.

Cross-scope navigation gives the requested target priority: exit focus and land
on the target comment. It does not restore the pre-focus scroll position. The
`all` action and Safari Back are the explicit ways to restore the prior reading
anchor.

Store that anchor as a comment ID plus its viewport offset rather than a raw
scroll position, because collapsing or expanding comments may change document
height while focus is active.

## Collapse, Voting, and Reply Semantics

HN's collapse state and HN Refined's scope state are orthogonal.

- `[–]` and `[n more]` continue to call HN's existing collapse behavior.
- Collapsing the focused root keeps focus active, leaves the root visible, and
  lets HN hide or restore its descendants.
- A comment hidden by an HN collapse still belongs to its logical focused
  subtree.
- Leaving focus must not blindly reveal rows. It restores the scope mask while
  respecting HN's current collapsed subtrees.
- Vote targets and state are unchanged.
- `reply` remains an ordinary page navigation; ephemeral scope need not survive
  the new page load.

Focus visibility must therefore be represented as a separate layer, attribute,
or class. It must never overwrite HN's `coll` class, toggle text, inline display
state, or descendant count.

## JavaScript Boundary

Necessary JavaScript is acceptable, but it must remain small enough for a user
to review and understand.

Use vanilla JavaScript and Safari/WebKit as the supported runtime. Do not add a
framework, general tree library, compatibility layer for Gecko or Blink, or a
second model of the comment graph.

The script may:

- Read HN's existing comment rows, indentation values, comment IDs, and links.
- Identify a contiguous subtree by walking following rows until indentation is
  no longer deeper than its root.
- Maintain the three-state scope machine and a stable local-root identity.
- Apply narrowly named data attributes or classes for CSS layout and masking.
- Observe scroll position with WebKit-supported browser primitives and schedule
  visual updates without per-row work on every scroll event.
- Intercept an existing HN fragment link only long enough to decide whether to
  keep or exit explicit focus, then preserve its exact target.
- Use same-document History API state for entering and leaving explicit focus.

The script must not:

- Parse comment prose or usernames to infer hierarchy.
- Replace HN's collapse, vote, reply, or fragment-scrolling implementation.
- Rewrite existing `href` targets.
- Persist ephemeral focus or scroll state in extension storage.
- continuously mutate layout while a subtree scope remains valid.

Prefer a few pure helpers around HN's DOM contract plus one state transition
function. Automatic scope detection and explicit focus should share subtree and
target-containment helpers rather than grow into parallel implementations.

## Motion and Accessibility

The memorable moment should come from the subtree becoming comfortably readable
and the guide explaining why, not from spectacle. A brief restrained appearance
transition is acceptable, but no scrolling animation or decorative movement is
required. Respect `prefers-reduced-motion`.

New actions must be real links or buttons with keyboard focus and appropriate
accessible names. Scope masking must remove excluded comments from interaction
and assistive-technology traversal while focused. Reading order within the
subtree remains unchanged.

The sticky guide must not obscure the targeted comment after `root`, `parent`,
`prev`, or `next` navigation; account for its height when revealing a target.

## Failure and Fallback Behavior

If expected HN comment structure is absent or inconsistent, do not activate a
local scope or write indentation custom properties. Native HN indentation and
behavior remain usable.

If JavaScript fails after entering automatic scope, removing HN Refined's scope
attributes must restore the ordinary full thread. The implementation must not
move comment nodes or destructively change HN's inline visibility state.

## Verification

Automated checks should cover:

- The progressive indentation scale and mobile-only scoping.
- State transitions among global, automatic, and focused modes.
- Stable automatic roots during scrolling and release at subtree end.
- Focus subtree boundaries for adjacent, nested, and final-page comments.
- Original target preservation for `root`, `parent`, `prev`, and `next`.
- Retaining focus for internal targets and leaving it for external targets.
- Collapse and expand inside focus without corrupting HN state.
- `all`, Safari Back, and anchor-plus-offset restoration.
- Preference changes on already-open Hacker News tabs.
- No scope activation when HN markup does not satisfy the expected contract.

After `make format && make check`, rebuild and install the iOS Safari extension
using the repository workflow. Inspect the deep chain at:

- `https://news.ycombinator.com/item?id=49096188`
- Comment `49097812` at depth six.
- Comment `49097531` at depth four.
- Comment `49097702` at depth five.

On the iPhone simulator, verify ordinary shallow comments first, then automatic
entry and exit, explicit focus, scrolling, collapse, every original navigation
link, Safari Back, rotation, and each preference choice. Also verify that a
cross-scope `next` target is reached even when it is shallower than the focused
root.

## Documentation Impact

The implementation change must update product status, development guidance,
privacy documentation, App Store review notes, and preference tests where
applicable. The feature adds no new network access or data collection. Focus and
automatic scope are page-local and ephemeral; only the user's selected
deep-thread preference is stored.

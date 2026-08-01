# Comment Focus Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Focus guide into a compact, expandable ancestor navigator and keep original Hacker News navigation inside the smallest Focus View that can contain its unchanged target.

**Architecture:** Extend the existing comment records with structural ancestry entries and a nearest-common-ancestor helper. Replace the current nested-only Focus stack payload with one complete Focus View per Safari History entry so transitions may narrow or widen without falsifying tree ancestry. Keep guide expansion as page-local presentation state, and keep Hacker News comment IDs as the authoritative navigation destinations.

**Tech Stack:** Safari WebExtension Manifest V3, vanilla JavaScript, Safari/WebKit DOM and History APIs, CSS Grid/Flexbox, Node.js built-in test runner, Biome, Prettier, Makefile, Xcode, and physical iPhone Safari.

## Global Constraints

- Preserve Hacker News' action grammar exactly as `next | focus [–]`; never add a separator between `focus` and the native collapse toggle.
- Keep `/` for hierarchy and `|` for HN peer actions or region separation.
- Render equal visible spacing on both sides of `/` with CSS-owned spacing; do not depend on trailing collapsible whitespace.
- Show complete ancestry at five authors or fewer. Above five, initially show the first author, `…`, and the final three authors.
- The ellipsis expands the complete chain without changing Focus, URL, scroll position, or Safari History. Expansion remains active until the Focus session ends.
- Ancestor authors are links; the current author remains stronger plain text.
- Clicking an ancestor widens Focus to that exact comment and pushes one Safari History state. Back restores the previous narrower view and Forward reapplies the zoom.
- Original HN `root`, `parent`, `prev`, and `next` IDs remain authoritative. Never reinterpret them as traversal among visible Focus rows.
- A target inside the current subtree retains the current Focus root.
- A target outside the current subtree widens Focus to the target and current root's nearest common comment ancestor. Only a target with no common comment ancestor exits Focus.
- Scrolling never activates, rebases, widens, narrows, or exits Focus. Add no scroll listener, observer, gesture interception, or momentum compensation.
- HN collapse and HN Refined Focus remain separate layers; do not alter `coll`, inline display, `[–]`, `[n more]`, descendant counts, or comment order.
- Use only existing HN rows, indentation, IDs, `.hnuser`, and exact `[deleted]` markers. Missing or malformed relationships fail closed.
- Add no dependency, permission, remote request, analytics, or persisted reading history.
- Use `extension/` as canonical source. Synchronize `HNRefined/Shared (Extension)/Resources/` only through the documented Makefile build workflow.
- Preserve the unrelated whitespace-only change in `HNRefined/Shared (App)/ViewController.swift`.
- Keep the complete physical-device acceptance batch uncommitted and unstaged until the maintainer accepts the iPhone result.
- Keep release preparation paused until physical iPhone acceptance and the remaining HN-alignment work are complete.

## File Responsibility Map

- `extension/content/deep-comments.js`: structural ancestry, common-ancestor resolution, guide presentation, Focus View History state, zoom transitions, and HN navigation coordination.
- `extension/content/content.css`: symmetric hierarchy spacing, compact ellipsis control, ancestor link treatment, wrapping, theme color, and touch geometry.
- `tests/deep-comments.test.js`: pure relationship helpers, guide collapse and expansion, History, ancestor zoom, HN target preservation, collapse isolation, and no-scroll behavior.
- `tests/css-rules.test.js`: guide separator spacing, link/button reset, wrapping, current-author distinction, and removal of obsolete path classes.
- `tests/docs-handoff.test.js`: maintained Focus navigation and release-gate contracts.
- `AGENTS.md`, `README.md`, `docs/project-status.md`, `docs/development.md`, `docs/privacy.md`, `docs/app-store-checklist.md`, `docs/release-readiness.md`: public behavior, implementation boundaries, privacy posture, and device acceptance state.
- `HNRefined/Shared (Extension)/Resources/**`: generated mirror updated by Makefile only.

---

### Task 1: Produce Structural Ancestry and Nearest Common Ancestors

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `extension/content/deep-comments.js`

**Interfaces:**

- Produces: `authorAncestryEntriesForRecord(index, records) -> Array<{ index: number, id: string, label: string }> | null`.
- Produces: `nearestCommonAncestorIndex(leftIndex, rightIndex, records) -> number | -1 | null`.
- Preserves: `authorLabelForRecord(record) -> string | null`, `record.parentIndex`, and `record.endIndex`.
- Consumed by Tasks 2–4: guide links, eligibility, ancestor zoom, and HN minimal widening.

- [ ] **Step 1: Write failing structural-ancestry tests**

Replace label-only ancestry assertions with literal structural entries:

```js
const entries = api.authorAncestryEntriesForRecord(2, records);
assert.deepEqual(JSON.parse(JSON.stringify(entries)), [
  { index: 0, id: "comment-0", label: "root-user" },
  { index: 1, id: "comment-1", label: "[deleted]" },
  { index: 2, id: "comment-2", label: "focused-user" },
]);
```

Keep separate cases proving all of these boundaries:

- Original depths may start above zero; the first displayed row still becomes the first structural entry.
- An exact HN `[deleted]` marker remains a valid entry.
- A missing `.hnuser` without `[deleted]` makes the current record and every descendant ancestry return `null`.
- An invalid index, invalid parent index, or parent cycle returns `null`.

- [ ] **Step 2: Write failing nearest-common-ancestor tests**

Use a hand-checked tree with depths `[0, 1, 2, 2, 1, 2, 0]` and assert literal results:

```js
assert.equal(api.nearestCommonAncestorIndex(2, 3, records), 1);
assert.equal(api.nearestCommonAncestorIndex(2, 4, records), 0);
assert.equal(api.nearestCommonAncestorIndex(2, 1, records), 1);
assert.equal(api.nearestCommonAncestorIndex(2, 6, records), -1);
assert.equal(api.nearestCommonAncestorIndex(-1, 2, records), null);
```

Mutate one record's `parentIndex` to an impossible value and assert `null`, distinguishing malformed structure from two valid top-level trees that legitimately return `-1`.

- [ ] **Step 3: Run the pure model tests and verify RED**

Run:

```bash
node --test --test-name-pattern='ancestry|common ancestor' tests/deep-comments.test.js
```

Expected: the new structural helper and common-ancestor helper are missing, while the existing label-only helper cannot satisfy the entry assertions.

- [ ] **Step 4: Implement the structural helpers**

Add the helpers beside `authorLabelForRecord`:

```js
function authorAncestryEntriesForRecord(index, records) {
  if (!Number.isInteger(index) || index < 0 || index >= records.length) {
    return null;
  }

  const entries = [];
  const visited = new Set();
  let cursor = index;

  while (cursor >= 0) {
    if (visited.has(cursor) || cursor >= records.length) {
      return null;
    }
    visited.add(cursor);

    const record = records[cursor];
    if (!record) {
      return null;
    }
    const label = authorLabelForRecord(record);
    if (!label || typeof record.id !== "string" || !record.id) {
      return null;
    }

    entries.push({ index: cursor, id: record.id, label });
    cursor = record.parentIndex;
  }

  return entries.reverse();
}

function nearestCommonAncestorIndex(leftIndex, rightIndex, records) {
  const left = authorAncestryEntriesForRecord(leftIndex, records);
  const right = authorAncestryEntriesForRecord(rightIndex, records);
  if (!left || !right) {
    return null;
  }

  let common = -1;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index].index !== right[index].index) {
      break;
    }
    common = left[index].index;
  }
  return common;
}
```

Export both through `HNRefinedDeepComments`. Keep a temporary label wrapper only if the current controller still needs it during this task:

```js
function authorAncestryForRecord(index, records) {
  return authorAncestryEntriesForRecord(index, records)?.map(({ label }) => label) || null;
}
```

- [ ] **Step 5: Run the pure model tests and verify GREEN**

Run the Step 3 command.

Expected: structural ancestry, deleted handling, malformed ancestry, sibling ancestry, ancestor targets, and unrelated top-level trees all pass.

- [ ] **Step 6: Run the full comment-controller regression file**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: existing focus, History, HN navigation, collapse, and no-scroll tests remain green before the state-model refactor.

- [ ] **Step 7: Check the task diff without staging**

Run:

```bash
git diff --check -- extension/content/deep-comments.js tests/deep-comments.test.js
```

Do not stage or commit.

---

### Task 2: Add Compact, Expandable Ancestry Presentation and Symmetric Separators

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/deep-comments.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: `authorAncestryEntriesForRecord(index, records)` from Task 1.
- Produces: `ancestryPresentation(entries, expanded) -> Array<{ kind: "author", entry } | { kind: "ellipsis" }>`.
- Produces: page-local `ancestryExpanded: boolean`, reset when Focus returns to the complete discussion.
- Produces DOM classes: `.hnr-comment-scope-step`, `.hnr-comment-scope-step-ancestor`, `.hnr-comment-scope-step-current`, `.hnr-comment-scope-author`, `.hnr-comment-scope-separator`, and `.hnr-comment-scope-ellipsis`.
- Preserves: fixed 48 px `all` region, natural wrapping, theme divider, and current-author color.

- [ ] **Step 1: Write failing pure presentation tests**

Use literal entry arrays and verify the exact threshold:

```js
assert.deepEqual(
  JSON.parse(JSON.stringify(api.ancestryPresentation(entries.slice(0, 5), false))),
  entries.slice(0, 5).map((entry) => ({ kind: "author", entry })),
);

assert.deepEqual(JSON.parse(JSON.stringify(api.ancestryPresentation(entries, false))), [
  { kind: "author", entry: entries[0] },
  { kind: "ellipsis" },
  { kind: "author", entry: entries[3] },
  { kind: "author", entry: entries[4] },
  { kind: "author", entry: entries[5] },
]);

assert.equal(api.ancestryPresentation(entries, true).length, 6);
```

Also assert that an empty or non-array input returns an empty presentation rather than throwing.

- [ ] **Step 2: Write failing guide expansion tests**

First add small fake-DOM traversal helpers to the test harness so assertions do not depend on browser-only query APIs:

```js
function descendantNodes(root) {
  const nodes = [];
  for (const child of root.children || []) {
    nodes.push(child, ...descendantNodes(child));
  }
  return nodes;
}

function findDescendant(root, predicate) {
  return descendantNodes(root).find(predicate) || null;
}

function renderedGuideLabels(guide) {
  return descendantNodes(guide)
    .filter((node) =>
      ["hnr-comment-scope-author", "hnr-comment-scope-ellipsis"].some((className) =>
        String(node.className || "")
          .split(/\s+/)
          .includes(className),
      ),
    )
    .map((node) => node.textContent);
}
```

Focus index 6 in a depth chain `[0, 1, 2, 3, 4, 5, 6, 7]` and inspect DOM roles rather than concatenated `textContent` spacing:

```js
assert.deepEqual(renderedGuideLabels(fixture.guide), ["user0", "…", "user4", "user5", "user6"]);
const ellipsis = findDescendant(fixture.guide, (node) => node.tagName === "BUTTON");
assert.equal(ellipsis.getAttribute("aria-label"), "Show complete comment ancestry");

const historyCount = fixture.historyEntries.length;
const scrollCount = fixture.scrolls.length;
ellipsis.dispatch("click");

assert.deepEqual(renderedGuideLabels(fixture.guide), [
  "user0",
  "user1",
  "user2",
  "user3",
  "user4",
  "user5",
  "user6",
]);
assert.equal(fixture.historyEntries.length, historyCount);
assert.equal(fixture.scrolls.length, scrollCount);
```

After expansion, enter a descendant Focus and go Back; assert the guide remains expanded. Then activate `all`, enter Focus again, and assert a long path returns to the compact presentation.

- [ ] **Step 3: Write failing separator and ellipsis CSS tests**

In `tests/css-rules.test.js`, require:

```js
assert.match(
  mobileCss,
  /\.hnr-comment-scope-step\s*{[^}]*display:\s*inline-flex[^}]*flex:\s*0 0 auto/s,
);
assert.match(mobileCss, /\.hnr-comment-scope-separator\s*{[^}]*padding-inline:\s*0\.35em/s);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-ellipsis\s*{[^}]*appearance:\s*none[^}]*border:\s*0[^}]*background:\s*transparent/s,
);
assert.doesNotMatch(mobileCss, /text-overflow:\s*ellipsis/);
```

Retain the existing assertions for grid columns, wrapping, `overflow-wrap: anywhere`, current-author color, sticky top, and theme divider.

- [ ] **Step 4: Run guide and CSS tests and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js tests/css-rules.test.js
```

Expected: failures identify the missing five-author threshold, missing ellipsis button, lack of expansion state, and absent separator/button CSS.

- [ ] **Step 5: Implement the pure presentation function**

Add and export:

```js
function ancestryPresentation(entries, expanded) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }
  if (expanded || entries.length <= 5) {
    return entries.map((entry) => ({ kind: "author", entry }));
  }
  return [
    { kind: "author", entry: entries[0] },
    { kind: "ellipsis" },
    ...entries.slice(-3).map((entry) => ({ kind: "author", entry })),
  ];
}
```

- [ ] **Step 6: Render compact and expanded guide tokens**

Add `let ancestryExpanded = false` to the controller. Change guide rendering to consume structural entries. For each non-current presentation token, append a separator inside the same `.hnr-comment-scope-step`:

```js
function appendSeparator(segment) {
  const separator = document.createElement("span");
  separator.className = "hnr-comment-scope-separator";
  separator.textContent = "/";
  separator.setAttribute("aria-hidden", "true");
  segment.append(separator);
}
```

Give every author label the shared `.hnr-comment-scope-author` class in addition to its ancestor/current class. For the ellipsis token, create:

```js
const ellipsis = document.createElement("button");
ellipsis.type = "button";
ellipsis.className = "hnr-comment-scope-ellipsis";
ellipsis.textContent = "…";
ellipsis.setAttribute("aria-label", "Show complete comment ancestry");
ellipsis.addEventListener("click", () => {
  ancestryExpanded = true;
  renderCurrentFocusGuide();
});
```

`renderCurrentFocusGuide()` derives the current structural ancestry and replaces only guide children. It must not call `pushState`, `replaceState`, `scrollBy`, or `scrollIntoView`. Set the path's accessible label from the complete labels joined with `/`.

Reset `ancestryExpanded = false` only when `applyFocusStack` reaches the global discussion state. Do not reset it when Focus narrows, widens, or traverses Back/Forward within the same session.

Keep ancestor steps as spans in this task; Task 3 will turn them into working links together with the compatible History model.

- [ ] **Step 7: Implement robust visual spacing and button reset**

Use CSS-owned separator spacing and HN-like controls:

```css
html[data-hnr-mobile="auto"] .hnr-comment-scope-step {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  max-width: 100%;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-separator {
  padding-inline: 0.35em;
  color: var(--hnr-text-muted, #828282);
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-ellipsis {
  appearance: none;
  padding: 6px 4px;
  color: inherit;
  font: inherit;
  border: 0;
  background: transparent;
}
```

Do not add radius, fill, shadow, animation, or a custom accent color. Preserve a visible `:focus-visible` outline through the project's shared accessibility rule or add the same system `Highlight` outline if the shared selector does not cover buttons.

- [ ] **Step 8: Run guide and CSS tests and verify GREEN**

Run the Step 4 command.

Expected: five authors remain complete, six or more compact to first/ellipsis/final-three, expansion is History- and scroll-neutral, expansion persists within the session, exit resets it, and spacing is CSS-owned.

- [ ] **Step 9: Check the task diff without staging**

Run:

```bash
git diff --check -- extension/content/deep-comments.js extension/content/content.css tests/deep-comments.test.js tests/css-rules.test.js
```

Do not stage or commit.

---

### Task 3: Replace the Nested-Only Stack With Complete Focus View History States

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `extension/content/deep-comments.js`

**Interfaces:**

- Consumes: structural ancestry entries and guide rendering from Tasks 1–2.
- Produces: `historyStateForView(view, currentState) -> object`.
- Produces: `resolveHistoryView(state, records) -> FocusView | undefined | null`, where `undefined` means no HN Refined Focus state and `null` means malformed state.
- Produces runtime `focusView: { rootId, rootIndex, label, returnAnchor, resumeAnchor, transitionIndex } | null`.
- Produces: `pushFocusView(rootIndex, options)` for descendant focus and ancestor zoom.
- Removes: `FOCUS_HISTORY_KEY = "hnrCommentFocusStack"`, `focusStack`, `historyStateFor`, `resolveHistoryStack`, and length-based History direction logic.

- [ ] **Step 1: Write failing Focus View serialization tests**

Replace stack serialization tests with one complete view:

```js
const state = api.historyStateForView(
  {
    rootId: "comment-4",
    label: "user4",
    returnAnchor: { id: "comment-4", offset: 80 },
    resumeAnchor: { id: "comment-5", offset: 236 },
    transitionIndex: 2,
  },
  { preserved: true },
);

assert.deepEqual(JSON.parse(JSON.stringify(state)), {
  preserved: true,
  hnrCommentFocusView: {
    rootId: "comment-4",
    label: "user4",
    returnAnchor: { id: "comment-4", offset: 80 },
    resumeAnchor: { id: "comment-5", offset: 236 },
    transitionIndex: 2,
  },
});
```

Assert `resolveHistoryView` returns:

- `undefined` when the key is absent.
- `null` for missing roots, empty labels, invalid anchors, invalid transition indexes, or malformed objects.
- A runtime view with `rootIndex` for a valid state.

- [ ] **Step 2: Write failing bidirectional-view History tests**

Add this harness helper using the traversal function from Task 2:

```js
function clickGuideAuthor(guide, label) {
  const link = findDescendant(
    guide,
    (node) =>
      node.tagName === "A" &&
      String(node.className || "")
        .split(/\s+/)
        .includes("hnr-comment-scope-ancestor") &&
      node.textContent === label,
  );
  assert.ok(link, `missing guide ancestor link for ${label}`);
  link.dispatch("click");
}
```

Keep the existing descendant Focus test, then add an ancestor transition that is wider rather than narrower:

```js
findLink(rows[4].navs, "focus").dispatch("click");
findLink(rows[5].navs, "focus").dispatch("click");
clickGuideAuthor(guide, "user3");

assert.equal(controller.getState().rootId, "comment-3");
window.history.back();
assert.equal(controller.getState().rootId, "comment-5");
window.history.forward();
assert.equal(controller.getState().rootId, "comment-3");
```

Assert the three pushed views use transition indexes `1`, `2`, and `3`; do not assert that root depth is monotonic.

- [ ] **Step 3: Write failing `all` and anchor-restoration tests across mixed views**

Create the sequence deep Focus → deeper Focus → ancestor zoom → native fragment inside the widened view. Activate `all` once and assert:

- Every Focus-marked History entry is crossed.
- The controller returns to global state.
- The original full-thread anchor is restored once.
- Page masks, row masks, and rebase properties are removed.
- HN collapse display and toggle text are untouched.

Back and Forward between mixed views must restore each view's stored `resumeAnchor`; tests should mutate row `rect.top` values and assert literal `scrollBy` deltas.

- [ ] **Step 4: Run History tests and verify RED**

Run:

```bash
node --test --test-name-pattern='History|ancestor zoom|all leaves|Safari Back' tests/deep-comments.test.js
```

Expected: the current nested-stack validator rejects a wider ancestor transition, and the guide ancestors are not yet actionable links.

- [ ] **Step 5: Implement single-view History serialization**

Use a new key and tri-state resolver:

```js
const FOCUS_HISTORY_KEY = "hnrCommentFocusView";

function historyStateForView(view, currentState) {
  return {
    ...(currentState && typeof currentState === "object" ? currentState : {}),
    [FOCUS_HISTORY_KEY]: {
      rootId: view.rootId,
      label: view.label,
      returnAnchor: view.returnAnchor,
      resumeAnchor: view.resumeAnchor,
      transitionIndex: view.transitionIndex,
    },
  };
}
```

`resolveHistoryView` must validate the root ID, author label, a required `returnAnchor`, a `resumeAnchor` that is either `null` or valid, and a positive integer transition index. It adds `rootIndex` from the current records. Do not validate a nested-root ordering because one later view may intentionally be wider.

- [ ] **Step 6: Refactor controller state and view application**

Replace `focusStack` with `focusView`. `state()` reads the current `rootIndex`. Rename `applyFocusStack` to:

```js
function applyFocusView(nextView, { restoreAnchor: anchor = null, revealIndex = -1 } = {})
```

The function must:

1. Clear the previous page mask and row scope.
2. Validate `nextView.rootIndex`, its structural ancestry, and the Focus surface.
3. Fail closed to global state when validation fails.
4. Apply the page mask and rebase the selected subtree.
5. Render the current guide and rebuild `focus` affordances.
6. Restore the supplied anchor, or reveal `records[revealIndex]` when the index is valid.
7. Reset ancestry expansion only when the resulting state is global.

- [ ] **Step 7: Add one transition helper for narrower and wider views**

Implement:

```js
function pushFocusView(
  rootIndex,
  {
    url = window.location.href,
    revealIndex = rootIndex,
    saveAnchorIndex = focusView?.rootIndex ?? rootIndex,
  } = {},
)
```

The helper validates the new root and author. If a current view exists, capture `records[saveAnchorIndex]`, write it into the current view's `resumeAnchor`, and `replaceState` that updated view. The new view inherits the original `returnAnchor`, increments `transitionIndex`, starts with `resumeAnchor: null`, and is pushed with the requested URL. The first view captures its own row as the full-thread return anchor and starts at transition index `1`.

Use this helper for existing descendant `focus` actions. A descendant action keeps its current URL and saves the descendant's pre-focus viewport position so Back restores its location in the wider view.

- [ ] **Step 8: Turn ancestor steps into working links**

For each non-current author token, render:

```js
const ancestor = document.createElement("a");
ancestor.href = `#${entry.id}`;
ancestor.className = "hnr-comment-scope-author hnr-comment-scope-ancestor";
ancestor.textContent = entry.label;
ancestor.setAttribute("aria-label", `Widen focus to comments by ${entry.label}`);
ancestor.addEventListener("click", (event) => {
  event.preventDefault();
  pushFocusView(entry.index, {
    url: ancestor.href,
    revealIndex: entry.index,
    saveAnchorIndex: focusView.rootIndex,
  });
});
```

Do not render a link for the current entry. Hidden ancestors become links after ellipsis expansion through the same renderer.

- [ ] **Step 9: Rewrite popstate, fragment-state, and `all` coordination**

Use `transitionIndex` to distinguish Back from Forward:

- Lower index: apply the resolved prior view and restore its `resumeAnchor`.
- Higher index: apply the resolved later view and reveal its root unless the browser fragment names another row inside that view.
- Equal index: retain the same root across native fragment History entries without revealing or rebasing.
- Absent state: leave Focus and restore the current session's `returnAnchor`.
- Malformed state: fail closed to global without applying a partial mask.

Retain a `hashchange` handler for native same-page HN links. If Focus is active and the new browser entry lacks the exact current Focus View payload, call `replaceState(historyStateForView(focusView, window.history.state), "", window.location.href)`. This stamps the unchanged root and transition index onto the native fragment entry; it does not push a second entry, reveal a row, or change the URL.

`all` continues calling `history.back()` while resolved states contain the Focus key, including native fragment entries. It restores the session return anchor only after reaching a non-Focus state.

- [ ] **Step 10: Run History tests and verify GREEN**

Run the Step 4 command, then:

```bash
node --test tests/deep-comments.test.js
```

Expected: descendant Focus, ancestor zoom, Back, Forward, `all`, native fragment entries, invalid states, anchors, collapse, and no-scroll behavior all pass with no nested-depth assumption.

- [ ] **Step 11: Check removed APIs and task diff**

Run:

```bash
! rg -n 'focusStack|resolveHistoryStack|historyStateFor\(|focusDepthForTarget' extension/content/deep-comments.js tests/deep-comments.test.js
git diff --check -- extension/content/deep-comments.js tests/deep-comments.test.js
```

Do not stage or commit.

---

### Task 4: Coordinate Original HN Targets Through Minimal Focus Widening

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `extension/content/deep-comments.js`

**Interfaces:**

- Consumes: `nearestCommonAncestorIndex`, `focusView`, and `pushFocusView` from Tasks 1 and 3.
- Produces: unchanged target navigation with one of three view outcomes: retain current root, widen to nearest common ancestor, or exit Focus.
- Preserves: page-changing links and HN-owned destinations.

- [ ] **Step 1: Keep and strengthen the inside-subtree regression test**

Click an HN `prev` or `next` whose literal target row is inside the current root's `[rootIndex, endIndex]`. Assert:

```js
assert.equal(prevented, false);
assert.equal(controller.getState().rootId, "comment-4");
assert.equal(historyEntries.length, operationCount);
```

After simulating the native hash entry, assert that its History state contains the same `hnrCommentFocusView.rootId` and Back/Forward never expose the story or outside comments.

- [ ] **Step 2: Write failing nearest-common-ancestor navigation tests**

Use depths `[0, 1, 2, 2, 1, 2, 0, 1]`:

- Focus index 2 and navigate to sibling index 3; root widens to index 1.
- Focus index 2 and navigate to cousin index 5; root widens to index 0.
- Focus index 2 and navigate to ancestor index 1; root becomes index 1.
- Focus index 2 and navigate to index 7 under another top-level index 6; Focus exits.

For every case assert the final URL remains the exact original target URL. For widening cases assert one new Focus History state is pushed and Safari Back restores index 2.

- [ ] **Step 3: Write failing `root`, `parent`, `prev`, and `next` matrix tests**

Build real fake `.comhead a[href]` links for all four labels and assign literal comment IDs. Test each action in both situations:

- Destination remains inside the selected subtree: keep the root.
- Destination leaves the selected subtree but shares an ancestor: widen minimally.

The assertion must use the link's original `href`; do not calculate an expected replacement target from visible rows.

- [ ] **Step 4: Write failing unresolved-target fail-closed test**

While focused, dispatch a same-page HN comment navigation link whose hash does not match any current record. Assert the controller removes Focus and then assigns the unchanged target URL. This prevents a hidden or malformed destination from remaining behind the Focus mask.

- [ ] **Step 5: Run navigation tests and verify RED**

Run:

```bash
node --test --test-name-pattern='target|navigation|root|parent|prev|next|common ancestor' tests/deep-comments.test.js
```

Expected: the existing stack-based handler exits or searches only previously clicked scopes instead of computing the original-tree common ancestor.

- [ ] **Step 6: Implement the three-way navigation decision**

After validating same-origin, pathname, query, and hash, resolve the target record. Then use:

```js
const root = records[focusView.rootIndex];
if (targetIndex >= focusView.rootIndex && targetIndex <= root.endIndex) {
  return;
}

const commonIndex = nearestCommonAncestorIndex(focusView.rootIndex, targetIndex, records);
if (commonIndex == null) {
  event.preventDefault();
  exitFocusThenNavigate(target.href);
  return;
}

if (commonIndex >= 0) {
  event.preventDefault();
  pushFocusView(commonIndex, {
    url: target.href,
    revealIndex: targetIndex,
    saveAnchorIndex: focusView.rootIndex,
  });
  return;
}

event.preventDefault();
exitFocusThenNavigate(target.href);
```

An unresolved same-page target uses `exitFocusThenNavigate` as well. Page-changing URLs continue without interception.

- [ ] **Step 7: Keep exit navigation asynchronous and anchor-safe**

`exitFocusThenNavigate(href)` stores the unchanged URL, clears any competing pending `all` action, and traverses backward over every Focus-marked History entry. When a non-Focus state arrives, clear masks without restoring an obsolete reading anchor, then assign `window.location.href = href` exactly once.

Do not call `scrollBy` or `scrollIntoView` during this exit-to-target path.

- [ ] **Step 8: Run navigation and full controller tests and verify GREEN**

Run the Step 5 command, then:

```bash
node --test tests/deep-comments.test.js tests/content-script.test.js
```

Expected: exact HN IDs always win, inside targets retain Focus, shared-tree targets widen only as far as necessary, unrelated top-level targets exit, and no page-changing link is intercepted.

- [ ] **Step 9: Check for prohibited navigation rewrites**

Run:

```bash
! rg -n 'next visible|previous visible|rewrite.*href|setAttribute\("href"' extension/content/deep-comments.js
git diff --check -- extension/content/deep-comments.js tests/deep-comments.test.js
```

Do not stage or commit.

---

### Task 5: Update Handoff Contracts and Complete Automated Safari Verification

**Files:**

- Modify: `tests/docs-handoff.test.js`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Review and modify if behavior wording changes: `docs/privacy.md`
- Modify: `docs/app-store-checklist.md`
- Modify: `docs/release-readiness.md`
- Generated by Makefile: `HNRefined/Shared (Extension)/Resources/**`

**Interfaces:**

- Consumes: completed compact guide, view History, ancestor zoom, and minimal-widening behavior from Tasks 1–4.
- Produces: maintained contributor rules, public feature wording, privacy accuracy, release evidence, synchronized Xcode resources, and a physical-device acceptance gate.

- [ ] **Step 1: Write failing handoff-document tests**

Require both `docs/development.md` and `docs/project-status.md` to state:

```js
for (const doc of [development, status]) {
  assert.match(doc, /five.*authors.*complete/is);
  assert.match(doc, /first.*ellipsis.*final three/is);
  assert.match(doc, /ellipsis.*expand.*without.*History/is);
  assert.match(doc, /ancestor.*link.*zoom|zoom.*ancestor.*link/is);
  assert.match(doc, /nearest common.*ancestor/is);
  assert.match(doc, /original.*(?:root|parent|prev|next).*target.*unchanged/is);
  assert.match(doc, /Back.*previous.*view.*Forward/is);
  assert.match(doc, /scrolling.*never.*focus/is);
}
```

Retain checks for `next | focus [–]`, hidden page surface, zero-indent root, separate collapse state, Boolean Thread Focus preference, current-window HN-tab refresh, and the physical-iPhone release pause.

- [ ] **Step 2: Run the handoff tests and verify RED**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: the current documents still describe complete always-visible ancestry and non-clickable guide steps.

- [ ] **Step 3: Update product and maintainer documentation**

Apply the confirmed semantics consistently:

- `AGENTS.md`: preserve symmetric slash spacing, five-step threshold, one-way ellipsis expansion, ancestor links, single-view History entries, unchanged HN targets, and nearest-common-ancestor widening.
- `README.md`: describe the guide as compact and expandable, with ancestor zoom, without exposing internal state-machine terminology.
- `docs/project-status.md`: record the physical-device observations that motivated the change and mark the new implementation as automated/build verified but physical-iPhone pending.
- `docs/development.md`: document `authorAncestryEntriesForRecord`, `nearestCommonAncestorIndex`, the `hnrCommentFocusView` History payload, expansion lifetime, exact navigation decision table, and primary regression URL.
- `docs/privacy.md`: keep ancestry, expansion, and Focus View History page-local and ephemeral; only the Boolean Thread Focus preference persists.
- `docs/app-store-checklist.md`: add compact/expanded ancestry, ancestor zoom, inside-target retention, shared-tree widening, unrelated-tree exit, Back/Forward, and unchanged collapse checks.
- `docs/release-readiness.md`: keep release preparation paused until this physical-iPhone pass and the remaining HN-alignment correction close.

- [ ] **Step 4: Run documentation tests and format the batch**

Run:

```bash
node --test tests/docs-handoff.test.js
make format
```

Expected: handoff tests pass and Biome/Prettier change no unrelated product behavior.

- [ ] **Step 5: Run the complete local quality gate**

Run:

```bash
make check
```

Expected: formatting, lint, theme validation, theme build, manifest validation, no-remote checks, and the complete Node test suite all pass with zero failures.

- [ ] **Step 6: Build iOS and synchronize Xcode resources through Makefile**

Run:

```bash
make safari-build-ios
```

Expected: the iOS scheme builds successfully and the canonical `extension/` directory is synchronized into the Xcode wrapper. Do not hand-edit the generated mirror.

- [ ] **Step 7: Refresh the installed Safari extension and run package checks**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: the macOS host and extension build with the local signing identity, the installed signature validates, the final extension registration is present, and packaged manifest, popup, options, content, and icon resources pass sanity checks.

- [ ] **Step 8: Verify canonical/generated equality and diff hygiene**

Run:

```bash
diff -rq --exclude=.DS_Store extension 'HNRefined/Shared (Extension)/Resources'
git diff --check -- . ':(exclude)HNRefined/Shared (App)/ViewController.swift'
git status --short
```

Expected: canonical and generated resources match, this batch has no whitespace errors, the unrelated Swift whitespace remains untouched, and nothing is staged.

- [ ] **Step 9: Keep the batch uncommitted for physical acceptance**

Do not stage or commit. Report the fresh test count, iOS build result, signed reinstall result, package-doctor result, and exact physical-device checklist to the maintainer.

---

### Task 6: Complete Physical iPhone Acceptance Before Release or Commit

**Files:**

- Modify after acceptance: `docs/project-status.md`
- Modify after acceptance: `docs/release-readiness.md`

**Interfaces:**

- Consumes: installed current iPhone build and the primary regression item page.
- Produces: maintainer acceptance or a concrete reproducible defect; no inferred pass from Simulator or automated tests.

- [ ] **Step 1: Install the current build on the physical iPhone**

Use Xcode with the maintainer's Personal Team to run the current `HNRefined (iOS)` build on the iPhone. Recheck `Allow Extension`, `Allow in Private Browsing` when applicable, and `news.ycombinator.com: Allow` because reinstalling can reset them.

- [ ] **Step 2: Verify guide typography and compact expansion**

Open:

```text
https://news.ycombinator.com/item?id=49098510#49101840
```

Focus `apitman` and verify:

- Slashes have visibly equal spacing on both sides.
- Five or fewer authors remain complete.
- Longer paths show first / ellipsis / final three.
- The ellipsis expands the complete chain without changing the focused root, URL, or reading position.
- Expanded ancestry remains expanded during nested Focus and Back/Forward, then resets after leaving the Focus session.
- Long individual authors and complete expanded paths wrap without horizontal overflow or far-right displacement.

- [ ] **Step 3: Verify ancestor zoom and Safari History**

Tap each visible ancestor and at least one ancestor revealed by the ellipsis. Confirm the selected ancestor becomes the zero-indent Focus root, the target comment appears at the guide boundary, Back restores the previous narrower view and its reading position, Forward reapplies the zoom, and `all` exits every Focus-marked entry to the original full-thread anchor.

- [ ] **Step 4: Verify the original HN navigation matrix**

Exercise `root`, `parent`, `prev`, and `next` from comments whose targets represent all three cases:

- Inside current subtree: current Focus root remains unchanged.
- Outside current subtree with a common comment ancestor: Focus widens only to the nearest common ancestor.
- Another top-level tree: Focus exits.

In every case confirm the exact original HN destination is reached. Verify `[–]`, `[n more]`, voting, and reply links remain unchanged.

- [ ] **Step 5: Verify native scrolling and preference transitions**

Perform uninterrupted long upward/downward and momentum scrolling in portrait and landscape. Confirm no automatic focus change, oscillation, jump, or stuck scroll. Turn Thread Focus off while zoomed: the full discussion and original position return, focus actions disappear, and progressive indentation remains. Turn it on: links return without entering Focus or moving the page.

- [ ] **Step 6: Record the physical result without premature release work**

If any check fails, record the exact comment ID, Focus root, HN action, orientation, theme, and Back/Forward sequence before changing code. If all checks pass, update `docs/project-status.md` and `docs/release-readiness.md` with the physical iPhone model, iOS version, regression URL, and accepted matrix. Run:

```bash
make format
make check
```

Keep screenshot capture, final release copy, archive validation, submission work, staging, and commit decisions separate until the maintainer explicitly closes the complete acceptance batch.

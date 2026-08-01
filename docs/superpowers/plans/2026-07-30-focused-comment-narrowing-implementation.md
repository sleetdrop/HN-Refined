# Focused Comment View Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn explicit deep-comment focus into a stable, full-width, History-aware mobile reading view with an A1 guide, nested focus stack, and HN-native navigation semantics.

**Architecture:** Keep the existing vanilla `deep-comments.js` controller and add a serializable focus-stack state whose entries identify the focused root, display label, containing-view return anchor, and containing-view resume anchor. The controller renders only the current stack top, while History owns Back and Forward; existing HN fragment targets choose the deepest remaining focus scope that contains the destination. CSS hides all non-view page rows, gives the scope indentation rule decisive cascade precedence, and derives the guide divider from the active HN theme tokens.

**Tech Stack:** Safari WebExtension Manifest V3, vanilla JavaScript, Safari/WebKit DOM and History APIs, CSS media queries/custom properties/`color-mix()`, Node.js built-in test runner, Makefile, Xcode, and physical iPhone Safari.

## Global Constraints

- Preserve HN's action grammar exactly as `next | focus [–]`.
- The focused root is relative depth zero; descendants retain only relative progressive indentation.
- Focus hides the HN site header, story, reply form, spacers, footer, and comments outside the current subtree.
- The A1 guide is the first visible page element and stays sticky; `all` is the leading real link with a 44–48 px invisible touch target.
- Each explicit nested focus creates one History entry. Back and Forward move one focus level; `all` leaves the entire stack.
- The informational path is not clickable. Show all labels through depth three; at depth four or greater show first, ellipsis, and current.
- Original same-page HN targets choose the deepest focus scope containing their unchanged destination ID. Page-changing links remain untouched.
- Do not modify HN collapse classes, inline display, toggle text, descendant count, vote actions, reply actions, IDs, or comment order.
- Register no scroll listener or observer and add no scroll clamp, gesture interception, automatic exit, or momentum compensation.
- Structure and History validation fail closed to the complete HN thread.
- Keep implementation vanilla and Safari/WebKit-only with no dependency, permission, or preference additions.
- The current deep-thread implementation is an intentionally uncommitted physical-device acceptance batch. Do not create intermediate code commits or stage unrelated files. Preserve the unrelated whitespace-only change in `HNRefined/Shared (App)/ViewController.swift`.
- Use `extension/` as canonical source. Let Makefile targets synchronize `HNRefined/Shared (Extension)/Resources/`; do not hand-edit the generated copies.

## File Responsibility Map

- `extension/content/deep-comments.js`: comment model, fail-closed surface resolver, focus stack, guide rendering, History transitions, HN fragment coordination.
- `extension/content/content.css`: baseline/scope indentation precedence, focused page mask, A1 guide layout, theme-derived divider, accessible touch target.
- `tests/deep-comments.test.js`: fake DOM/History runtime and controller state/navigation regression tests.
- `tests/css-rules.test.js`: effective selector order, mobile-only masks, fixed-guide presentation, and theme-divider contracts.
- `AGENTS.md`, `README.md`, `docs/project-status.md`, `docs/development.md`, `docs/app-store-checklist.md`, `docs/release-readiness.md`: current behavioral contract, release pause, and physical-device evidence.
- `tests/docs-handoff.test.js`: guards the current Focus View Stack semantics for future work.

---

### Task 1: True Indentation Rebase and Focus-Only Page Surface

**Files:**

- Modify: `tests/deep-comments.test.js:390-450`
- Modify: `tests/css-rules.test.js:168-200`
- Modify: `extension/content/deep-comments.js:55-82`
- Modify: `extension/content/content.css:395-445`

**Interfaces:**

- Consumes: `resolveFocusSurface(document, tree, guide)` and existing `data-hnr-scope-row` / `data-hnr-focus-page-excluded` attributes.
- Produces: `focusSurface.pageElements` containing every direct `#hnmain` row except `#bigbox`, plus every direct comment-cell child except guide/tree; decisive `.comment-tree .comtr[data-hnr-scope-row]` indentation precedence.

- [ ] **Step 1: Write the failing surface and cascade tests**

Change the focus behavior test so the site-header row is excluded with the rest of the non-view page:

```js
for (const element of [
  page.headerRow,
  page.spacerRow,
  page.fatitem,
  page.breakNode,
  page.replyForm,
  page.footerRow,
]) {
  assert.equal(element.dataset.hnrFocusPageExcluded, "");
}
assert.equal(page.tree.dataset.hnrFocusPageExcluded, undefined);
assert.equal(guide.dataset.hnrFocusPageExcluded, undefined);
```

In the CSS contract test, require the focus rule to use the comment-tree selector and appear after the baseline rule:

```js
const baseRule = mobileCss.match(
  /\.comment-tree\s+\.comtr\s+\.ind img\[width\]\s*{[^}]*width:\s*var\(--hnr-comment-base-indent\)/s,
);
const focusRule = mobileCss.match(
  /\.comment-tree\s+\.comtr\[data-hnr-scope-row\]\s+\.ind\s+img\[width\]\s*{[^}]*width:\s*var\(--hnr-comment-indent\)/s,
);
assert.ok(baseRule);
assert.ok(focusRule);
assert.ok(focusRule.index > baseRule.index);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js tests/css-rules.test.js
```

Expected: the header remains visible and the baseline indentation rule occurs after the scope rule.

- [ ] **Step 3: Make the resolver exclude the header**

Replace the outer-row filter in `resolveFocusSurface`:

```js
return {
  pageElements: [
    ...Array.from(body.children).filter((row) => row !== bigbox),
    ...Array.from(treeCell.children).filter((node) => node !== guide && node !== tree),
  ],
};
```

Keep `headerRow` in the validation guard so a malformed HN surface still disables focus.

- [ ] **Step 4: Give focused indentation decisive precedence**

Place the baseline rule first, followed by the stronger scope rule:

```css
html[data-hnr-mobile="auto"] .comment-tree .comtr .ind img[width] {
  width: var(--hnr-comment-base-indent);
  max-width: none;
}

html[data-hnr-mobile="auto"] .comment-tree .comtr[data-hnr-scope-row] .ind img[width] {
  width: var(--hnr-comment-indent);
  max-width: none;
}
```

Remove the earlier weaker scope rule so there is one owner for `--hnr-comment-indent`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 2 command and expect every deep-comment and CSS test to pass.

---

### Task 2: A1 Guide and In-Memory Focus Path

**Files:**

- Modify: `tests/deep-comments.test.js:142-183,390-520`
- Modify: `extension/content/deep-comments.js:84-302`
- Modify: `extension/content/content.css:410-445`

**Interfaces:**

- Produces runtime `focusStack` entries shaped as `{ rootId, rootIndex, label, returnAnchor, resumeAnchor }`.
- Produces `labelForRecord(record) -> string`, returning trimmed `.hnuser` text or `"comment"`.
- Produces `visibleFocusLabels(stack) -> string[]`, returning all labels for one to three entries or `[first, "…", current]` for four or more.
- Produces guide classes `.hnr-comment-scope-exit`, `.hnr-comment-scope-prefix`, `.hnr-comment-scope-path-prior`, and `.hnr-comment-scope-path-current`.

- [ ] **Step 1: Extend the row fixture for missing usernames**

Allow `createInteractiveRow` to represent a missing `.hnuser`:

```js
const user = username == null ? null : createNode("a");
if (user) {
  user.textContent = username;
}
// ...
if (selector === ".hnuser") {
  return user;
}
```

Add a `usernames` fixture option with an explicit default:

```js
function createControllerFixture(
  depths,
  {
    mode = "on-demand",
    mobile = true,
    validSurface = true,
    usernames = depths.map((_, index) => `user${index}`),
  } = {},
) {
  const rows = depths.map((depth, index) =>
    createInteractiveRow(`comment-${index}`, depth, usernames[index], 80 + index * 80),
  );
```

- [ ] **Step 2: Write failing guide-path tests**

Replace the current guide-text assertion with the A1 grammar and leading action:

```js
assert.equal(guide.children[0].tagName, "A");
assert.equal(guide.children[0].textContent, "all");
assert.match(guide.textContent, /^all \| focused: user4$/);
```

Add a four-level nested focus test using depths `[0, 1, 2, 3, 4, 5, 6, 7, 8]`:

```js
for (const index of [4, 5, 6, 7]) {
  findLink(rows[index].navs, "focus").dispatch("click");
}
assert.equal(guide.textContent, "all | focused: user4 / … / user7");
assert.equal(findLink(guide, "user4"), undefined);
```

Add a missing-user test with an explicit username list:

```js
const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6], {
  usernames: ["user0", "user1", "user2", "user3", "user4", null, "user6"],
});
findLink(fixture.rows[4].navs, "focus").dispatch("click");
findLink(fixture.rows[5].navs, "focus").dispatch("click");
assert.equal(fixture.guide.textContent, "all | focused: user4 / comment");
```

- [ ] **Step 3: Run the controller test and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: the current guide puts `all` last, has no stack path, and lacks the path helper functions.

- [ ] **Step 4: Add focus-stack labels and path folding**

Add pure helpers before `createController`:

```js
function labelForRecord(record) {
  return record?.row.querySelector(".hnuser")?.textContent?.trim() || "comment";
}

function visibleFocusLabels(stack) {
  const labels = stack.map(({ label }) => label);
  return labels.length < 4 ? labels : [labels[0], "…", labels.at(-1)];
}
```

Replace `focusRootIndex` with `focusStack`; derive the active index from `focusStack.at(-1)?.rootIndex ?? -1`. On focus, create an entry with `rootId`, `rootIndex`, `label`, the captured containing-view anchor, and `resumeAnchor: null`. Append nested entries instead of replacing the runtime path.

- [ ] **Step 5: Render the A1 guide without clickable crumbs**

Build guide children in this order:

```js
const all = document.createElement("a");
all.href = "#";
all.className = "hnr-comment-scope-exit";
all.textContent = "all";
all.setAttribute("aria-label", "Exit focused comments");
all.addEventListener("click", exitFromGuide);

const prefix = document.createElement("span");
prefix.className = "hnr-comment-scope-prefix";
prefix.textContent = " | focused: ";

const labels = visibleFocusLabels(focusStack);
const path = document.createElement("span");
path.className = "hnr-comment-scope-path";
const prior = document.createElement("span");
prior.className = "hnr-comment-scope-path-prior";
prior.textContent = labels.length > 1 ? `${labels.slice(0, -1).join(" / ")} / ` : "";
const current = document.createElement("span");
current.className = "hnr-comment-scope-path-current";
current.textContent = labels.at(-1);
path.replaceChildren(prefix, prior, current);

scopeGuide.replaceChildren(all, path);
```

Export `labelForRecord` and `visibleFocusLabels` beside the existing testable helpers.

- [ ] **Step 6: Add the width-preserving guide layout**

Keep the guide in normal document width and add:

```css
html[data-hnr-mobile="auto"] .hnr-comment-scope-guide:not([hidden]) {
  display: flex;
  align-items: center;
  min-height: 44px;
  overflow: hidden;
  white-space: nowrap;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-exit {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  box-sizing: border-box;
  min-width: 48px;
  min-height: 44px;
  padding-inline: 8px;
  color: inherit;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-path {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-prefix {
  flex: 0 0 auto;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-path-prior {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--hnr-text-muted, #828282);
  text-overflow: ellipsis;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-path-current {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
  color: var(--hnr-text-primary, #000);
  text-overflow: ellipsis;
}
```

Give prior path spans muted color and no pointer styling. Do not add a side control, border radius, shadow, or transition.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/deep-comments.test.js tests/css-rules.test.js
```

Expected: guide order, path folding, fallback label, and restrained CSS contracts pass.

---

### Task 3: Browser History Focus Stack

**Files:**

- Modify: `tests/deep-comments.test.js:185-323,452-620`
- Modify: `extension/content/deep-comments.js:84-255,375-418`

**Interfaces:**

- Produces History key `hnrCommentFocusStack` containing serializable entries `{ rootId, label, returnAnchor, resumeAnchor }`.
- Produces `captureAnchor(record) -> { id: string, offset: number }`.
- Produces `historyStateFor(stack, currentState) -> object`, preserving unrelated keys from `window.history.state`.
- Produces `resolveHistoryStack(state, records) -> runtimeEntry[] | null`; `null` means an HN Refined state was present but invalid, while `[]` means global state.
- Consumes `applyFocusStack(stack, { restoreAnchor, revealRoot })` from the controller to render one complete state transaction.

- [ ] **Step 1: Replace the fake History logger with a real cursor model**

In `createControllerFixture`, keep an operation log but model browser entries:

```js
const initialUrl = "https://news.ycombinator.com/item?id=1";
const historyOperations = [];
const historyStack = [{ state: null, url: initialUrl }];
let historyIndex = 0;

function emitPop() {
  const entry = historyStack[historyIndex];
  window.history.state = entry.state;
  window.location.href = entry.url;
  windowListeners.get("popstate")?.({ state: entry.state });
}
```

Implement `pushState` by truncating forward entries and incrementing the cursor, `replaceState` by replacing the current entry, and `go(delta)`, `back()`, and `forward()` by moving the cursor and calling `emitPop`. Return `historyOperations`, `historyStack`, and a `historyIndex` getter from the fixture.

- [ ] **Step 2: Write failing Back, Forward, and all-stack tests**

Replace the old nested-replace assertion with:

```js
findLink(rows[4].navs, "focus").dispatch("click");
rows[5].rect.top = 236;
findLink(rows[5].navs, "focus").dispatch("click");
rows[5].rect.top = 286;

assert.deepEqual(
  historyOperations.map(({ type }) => type),
  ["push", "replace", "push"],
);
assert.equal(controller.getState().rootId, "comment-5");

window.history.back();
assert.equal(controller.getState().rootId, "comment-4");
assert.deepEqual(scrolls.at(-1), { x: 0, y: 50 });

window.history.forward();
assert.equal(controller.getState().rootId, "comment-5");
```

For a three-level stack, click `all` once and assert History walks back through all three focused entries, the controller is global, and the first entry's return anchor is restored. Include native fragment entries between focused entries and assert the same single user action still reaches the complete thread.

Add an invalid-state test that dispatches:

```js
fixture.dispatchWindow("popstate", {
  state: { hnrCommentFocusStack: [{ rootId: "missing", label: "missing" }] },
});
assert.equal(controller.getState().kind, "global");
assert.equal(page.headerRow.dataset.hnrFocusPageExcluded, undefined);
```

- [ ] **Step 3: Run the controller tests and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: nested focus still replaces History, Back exits all focus, Forward cannot restore a level, and `all` calls only one Back.

- [ ] **Step 4: Add serializable stack helpers**

Add:

```js
const FOCUS_HISTORY_KEY = "hnrCommentFocusStack";

function captureAnchor(record) {
  return { id: record.id, offset: record.row.getBoundingClientRect().top };
}

function historyStateFor(stack, currentState) {
  return {
    ...(currentState && typeof currentState === "object" ? currentState : {}),
    [FOCUS_HISTORY_KEY]: stack.map(({ rootId, label, returnAnchor, resumeAnchor }) => ({
      rootId,
      label,
      returnAnchor,
      resumeAnchor,
    })),
  };
}
```

`resolveHistoryStack` returns `[]` when the state has no `FOCUS_HISTORY_KEY`. When the key is present, it must reject non-arrays, missing roots, invalid labels, non-finite anchor offsets, and any child root outside its preceding root's contiguous subtree by returning `null`. Resolve every accepted `rootId` back to `rootIndex`; allow `resumeAnchor` to be `null`, but validate it with the same ID and finite-offset rules when present.

- [ ] **Step 5: Make focus entry a History push**

For the first focus, create an entry whose `returnAnchor` is the selected row's current position and push a one-entry state. For nested focus:

1. Capture the selected child row as the containing view's resume anchor.
2. Store it on the current top entry.
3. `replaceState(historyStateFor(focusStack, window.history.state), "", window.location.href)`.
4. Append the child entry with the same containing-view anchor as its `returnAnchor`.
5. `pushState(historyStateFor(nextStack, window.history.state), "", window.location.href)`.

Apply the new current root, render the path, and call `scrollIntoView({ block: "start" })` only after masks are complete.

- [ ] **Step 6: Render popstate as a state transaction**

Replace the Boolean History flags with stack comparison:

```js
function handleHistoryPop(event) {
  const nextStack = resolveHistoryStack(event.state, records);
  if (nextStack == null) {
    leaveAllFocus({ restoreAnchor: null });
    return;
  }

  if (nextStack.length < focusStack.length) {
    const completesNavigation = pendingNavigation?.targetDepth === nextStack.length;
    const restoreAnchor = completesNavigation
      ? null
      : nextStack.at(-1)?.resumeAnchor || focusStack[0]?.returnAnchor || null;
    applyFocusStack(nextStack, { restoreAnchor, revealRoot: false });
    completePendingNavigationIfReady();
    return;
  }

  applyFocusStack(nextStack, { restoreAnchor: null, revealRoot: nextStack.length > 0 });
  completePendingNavigationIfReady();
}
```

`applyFocusStack` must clear old row/page attributes first, render global when the stack is empty, validate the current root, then apply page mask, subtree mask, guide, and optional reveal as one synchronous operation.

- [ ] **Step 7: Make all and mode changes leave the entire stack**

The A1 `all` link and a switch to Indentation only or a non-mobile viewport start a pending full-stack exit, then walk backward one History entry at a time:

```js
pendingExitAll = {
  returnAnchor: focusStack[0]?.returnAnchor || null,
};
if (focusStack.length > 0) {
  window.history.back();
}
```

On each `popstate`, continue calling `history.back()` while the resolved HN Refined stack is still non-empty. This is necessary because HN's native fragment navigation can add History entries that do not correspond one-for-one with focus depth. Retain the first stack entry until the global entry is reached so its full-thread return anchor remains available. If History traversal is unavailable, clear HN Refined state fail-closed and restore that first return anchor directly.

Listen for `hashchange` and stamp the current serialized focus stack into the new native fragment entry with `replaceState`. This keeps Back and Forward inside the same focus level instead of interpreting an otherwise state-less fragment entry as the complete thread.

- [ ] **Step 8: Run controller tests and verify GREEN**

Run the Step 3 command and expect Back, Forward, all, mode-change, invalid-state, masks, and per-level anchor tests to pass.

---

### Task 4: HN Navigation Across Focus Levels

**Files:**

- Modify: `tests/deep-comments.test.js:557-605`
- Modify: `extension/content/deep-comments.js:328-373`

**Interfaces:**

- Produces `focusDepthForTarget(targetIndex, stack, records) -> number`, where `0` means the complete thread and `stack.length` means the current view.
- Produces controller-local `pendingNavigation = { href: string, targetDepth: number } | null`.
- Walks History backward until `targetDepth` is reached and completes the original destination after the matching `popstate`.

- [ ] **Step 1: Extend the fake location with observable same-page navigation**

Model location navigation without reloading the fixture:

```js
const navigations = [];
const location = {
  _href: "https://news.ycombinator.com/item?id=1",
  get href() {
    return this._href;
  },
  set href(value) {
    this._href = new URL(value, this._href).href;
    navigations.push(this._href);
  },
};
```

Return `navigations` from the fixture.

- [ ] **Step 2: Write failing three-scope navigation tests**

With focus roots at indices 4 and 5:

- Click a target at index 6 and assert no prevention, no History movement, and current root `comment-5`.
- Click a target at index 4 and assert prevention, one-level History movement, final root `comment-4`, and navigation to `#comment-4`.
- Click a target outside the index-4 subtree and assert prevention, exit to global, and navigation to the original fragment.
- Click `reply?id=comment-5` and assert no prevention or History movement.

Assert every completed navigation ends with exactly the anchor's original absolute destination string; do not substitute a visible-row neighbor.

- [ ] **Step 3: Run the navigation tests and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: the current controller only distinguishes inside current versus outside all, does not preserve an ancestor focus, and does not coordinate asynchronous History movement with the requested fragment.

- [ ] **Step 4: Add target-depth resolution**

Add the pure helper:

```js
function focusDepthForTarget(targetIndex, stack, records) {
  let containingDepth = 0;
  stack.forEach(({ rootIndex }, index) => {
    const root = records[rootIndex];
    if (targetIndex >= rootIndex && targetIndex <= root.endIndex) {
      containingDepth = index + 1;
    }
  });
  return containingDepth;
}
```

Export it for direct unit tests.

- [ ] **Step 5: Coordinate History before completing cross-scope targets**

Keep the existing URL-origin/path/search/hash validation. When the target depth is smaller than the current depth:

```js
event.preventDefault();
pendingNavigation = { href: target.href, targetDepth };
window.history.back();
```

When `handleHistoryPop` encounters native fragment entries at a deeper or equal focus depth, it continues backward one entry at a time. Once it reaches `pendingNavigation.targetDepth`, it must suppress the stale containing-view anchor restoration, apply the target stack, then consume the pending navigation:

```js
function completePendingNavigationIfReady() {
  if (pendingNavigation && focusStack.length === pendingNavigation.targetDepth) {
    const { href } = pendingNavigation;
    pendingNavigation = null;
    window.location.href = href;
  }
}
```

A target inside the current subtree and every page-changing link return without interception.

- [ ] **Step 6: Preserve HN collapse and ordinary actions**

Retain the existing test that hides a collapsed descendant with inline `display: none`, then focus, navigate, Back, and `all`; assert its display value and toggle text remain unchanged. Add no handler for vote, reply, `.togg`, or `[n more]` controls.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run the Step 3 command and expect current-scope, ancestor-scope, outside-stack, page-changing, and collapse tests to pass.

---

### Task 5: Theme-Aware Divider, Accessibility Contract, and Handoff Docs

**Files:**

- Modify: `extension/content/content.css:280-320,410-445`
- Modify: `tests/css-rules.test.js:180-200`
- Modify: `AGENTS.md:49-65`
- Modify: `README.md:7-16`
- Modify: `docs/project-status.md:71-104,250-270`
- Modify: `docs/development.md:318-368`
- Review: `docs/privacy.md`
- Modify: `docs/app-store-checklist.md:41-48`
- Modify: `docs/release-readiness.md:5-32`
- Modify: `tests/docs-handoff.test.js:244-270`

**Interfaces:**

- Produces custom property `--hnr-focus-divider` derived from `--hnr-top-bar-background` and `--hnr-content-background`.
- Documents A1, hidden site header, true rebase, focus-stack History, non-clickable path, nearest-containing HN navigation, and the physical-iPhone release gate.

- [ ] **Step 1: Write failing theme and accessibility CSS tests**

Require theme-aware divider declarations and A1 touch geometry:

```js
assert.match(
  css,
  /html\[data-hnr-theme="light"\][\s\S]*--hnr-focus-divider:\s*color-mix\([^;]*--hnr-top-bar-background[^;]*--hnr-content-background/s,
);
assert.match(css, /html\[data-hnr-theme="dark"\][\s\S]*--hnr-focus-divider:\s*color-mix\(/s);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-exit\s*{[^}]*min-width:\s*48px[^}]*min-height:\s*44px/s,
);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-guide:not\(\[hidden\]\)\s*{[^}]*border-bottom:\s*1px solid var\(--hnr-focus-divider\)/s,
);
```

Keep the existing prohibition on border radius, shadow, and transition for the guide.

- [ ] **Step 2: Run CSS and handoff tests and verify RED**

Run:

```bash
node --test tests/css-rules.test.js tests/docs-handoff.test.js
```

Expected: the guide still uses the neutral border token and current docs still say the site header remains visible and Back exits the whole focus state.

- [ ] **Step 3: Derive the divider from active HN theme tokens**

Before the contrast media query, define light and dark values without raw component colors:

```css
html[data-hnr-theme="light"],
html[data-hnr-theme="system"] {
  --hnr-focus-divider: color-mix(
    in srgb,
    var(--hnr-top-bar-background) 42%,
    var(--hnr-content-background)
  );
}

html[data-hnr-theme="dark"] {
  --hnr-focus-divider: color-mix(
    in srgb,
    var(--hnr-top-bar-background) 52%,
    var(--hnr-content-background)
  );
}

@media (prefers-color-scheme: dark) {
  html[data-hnr-theme="system"] {
    --hnr-focus-divider: color-mix(
      in srgb,
      var(--hnr-top-bar-background) 52%,
      var(--hnr-content-background)
    );
  }
}
```

Inside `prefers-contrast: more`, strengthen the same derived relationship rather than assigning a fixed color. Bind the guide border to `var(--hnr-focus-divider)`.

Use the same tokens at 68% in Increase Contrast:

```css
@media (prefers-contrast: more) {
  html[data-hnr-theme] {
    --hnr-focus-divider: color-mix(
      in srgb,
      var(--hnr-top-bar-background) 68%,
      var(--hnr-content-background)
    );
  }
}
```

- [ ] **Step 4: Update operational documentation and release state**

Update active docs to state:

- Focus hides the site header and makes the A1 guide the top boundary.
- The root genuinely rebases to zero; the prior implementation's cascade bug was found on physical iPhone.
- Back and Forward move one focus level, while `all` leaves the whole stack.
- The path is informational and folded after three levels.
- Same-page HN targets retain the deepest containing focus scope.
- Scrolling never changes focus.
- No handedness preference or side handle was added.
- Release preparation remains paused until physical-iPhone Focus View Stack acceptance and the second HN-alignment correction are complete.

`docs/privacy.md` should remain semantically unchanged because History state is page-local and no new preference or stored data is introduced; mention that it was reviewed in the final handoff.

- [ ] **Step 5: Strengthen the handoff guard**

Replace the old retained-header assertions with contracts such as:

```js
for (const doc of [development, status]) {
  assert.match(doc, /site header.*hidden.*focus guide.*top boundary/is);
  assert.match(doc, /Back.*one.*focus level.*Forward/is);
  assert.match(doc, /all.*entire.*stack/is);
  assert.match(doc, /path.*informational.*not clickable/is);
  assert.match(doc, /target.*deepest.*focus.*contain/is);
  assert.match(doc, /root.*(?:depth zero|zero indent|rebases? to zero)/is);
}
```

Keep guards for On demand/Indentation only, vanilla Safari/WebKit, no scroll activation, fail-closed structure, HN collapse separation, release pause, and page-local ephemeral state.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run the Step 2 command and expect CSS and documentation contracts to pass.

---

### Task 6: Full Validation, Safari Refresh, and Physical-iPhone Gate

**Files:**

- Synchronize through Makefile: `HNRefined/Shared (Extension)/Resources/**`
- Update after observed results: `docs/project-status.md`
- Update after observed results: `docs/release-readiness.md`
- Update after observed results: `docs/app-store-checklist.md`

**Interfaces:**

- Consumes the complete canonical `extension/` feature and all automated contracts.
- Produces a signed registered Safari build, an installed iOS Simulator build, recorded simulator evidence, and an explicit physical-iPhone acceptance result without overstating Simulator coverage.

- [ ] **Step 1: Format and run the complete local gate**

Run:

```bash
make format
make check
```

Expected: Biome and Prettier remain clean; every test passes with zero failures.

- [ ] **Step 2: Build iOS and refresh the signed Safari extension**

Run:

```bash
make safari-build-ios
make safari-reinstall
make safari-doctor
```

Expected: iOS build succeeds, the signed macOS app installs at the stable local path, Safari registers `net.vetcafe.hnrefined.extension`, and package sanity checks find manifest, popup, options, content, and icons. If sandboxed Keychain or CoreSimulator access fails, rerun the same Makefile target with approved unsandboxed access; do not change build paths.

- [ ] **Step 3: Build and inspect the iPhone Simulator runtime**

Using XcodeBuildMCP:

1. Call `session_show_defaults` and confirm the repo project, `HNRefined (iOS)` scheme, repo-local DerivedData, and intended iPhone simulator.
2. Call `build_run_sim`.
3. Open a genuinely deep HN item with a fresh query parameter.
4. Capture the global action row and focused view screenshots.
5. Confirm the root begins at zero indent, HN header/topic/form are absent, A1 remains at the top, and light/dark divider colors match the approved design.

Do not claim webpage-link automation when Simulator accessibility exposes only Safari chrome.

- [ ] **Step 4: Exercise History and HN navigation in real Safari**

In the deepest available Simulator or physical-device interaction surface, verify:

- Focus four nested levels; path folds to first / ellipsis / current.
- Safari Back walks 4 → 3 → 2 → 1 → global and restores each containing position.
- Safari Forward re-enters each level.
- `all` from depth four returns directly to global and restores the original position.
- `parent` can return to an ancestor focus; `root` can leave the complete stack; an inside `next` retains current focus.
- `[–]`, `[n more]`, vote, and reply remain HN-owned.
- Long upward/downward scrolling never changes focus or reveals the HN header.

- [ ] **Step 5: Run the physical iPhone acceptance matrix**

On the maintainer's iPhone 17, test On demand in portrait and landscape with Light, Dark, and System Dark, then confirm Indentation only has no focus UI. Repeat long momentum scrolling, nested Back/Forward, `all`, HN targets, collapse, long/missing username paths, and Increase Contrast. Record any remaining mismatch as a release blocker; do not mark the correction closed from Simulator evidence alone.

- [ ] **Step 6: Record only observed verification evidence**

Update project status, release readiness, and the App Store checklist with exact passed commands and device results. Keep release preparation paused if physical iPhone acceptance or the second HN-alignment correction remains incomplete. Run:

```bash
node --test tests/docs-handoff.test.js
make check
```

- [ ] **Step 7: Confirm resource sync and repository scope**

Run:

```bash
diff -rq --exclude=.DS_Store extension "HNRefined/Shared (Extension)/Resources"
git diff --check -- . ":(exclude)HNRefined/Shared (App)/ViewController.swift"
git status --short
```

Expected: canonical and Xcode resources match; task-owned changes have no whitespace errors; the unrelated Swift whitespace remains untouched and is reported separately.

- [ ] **Step 8: Hold the code batch for user acceptance**

Do not stage or commit the existing deep-thread feature batch until the user accepts the physical-iPhone result. Report the exact uncommitted files, automated result count, installed build state, Simulator limits, and physical-device outcome.

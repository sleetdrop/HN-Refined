# Comment Thread Focus Ancestry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default-on Thread Focus action available on every Hacker News comment subtree and make its sticky guide show the focused comment's complete original author ancestry with natural mobile wrapping.

**Architecture:** Replace the enum-shaped deep-thread preference with a Boolean `threadFocusEnabled` preference while keeping progressive indentation automatic. Extend the existing comment model with a fail-closed author-ancestry helper, use that original parent chain to render the guide, and keep the separate History-backed Focus View stack unchanged for Back, Forward, `all`, and HN navigation. Keep the implementation in the existing reviewable vanilla JavaScript controller and CSS; use the Makefile workflow to synchronize the canonical `extension/` tree into Xcode resources.

**Tech Stack:** Safari WebExtension Manifest V3, vanilla JavaScript, Safari/WebKit DOM and History APIs, CSS Grid/Flexbox, Node.js built-in test runner, Biome, Prettier, Makefile, Xcode, and physical iPhone Safari.

## Global Constraints

- Preserve Hacker News' action grammar exactly as `next | focus [–]`; never add a separator between `focus` and the native collapse toggle.
- Thread Focus defaults to enabled, remains entirely user-triggered, and never activates, changes, or exits because of scrolling.
- When enabled, every comment with a nonempty reply subtree may offer `focus`, regardless of original depth; leaf comments and the current focused root do not.
- When disabled, remove Focus UI and exit any active Focus View, but retain automatic progressive mobile indentation.
- The visible guide shows the complete original comment-author ancestry from the top-level comment through the focused comment. It never shows the story, topic, story author, Focus click count, or History stack.
- The complete ancestry wraps naturally and never folds, truncates, or ellipsizes ordinary ancestry.
- A normal row uses `.hnuser`; an HN-explicit `[deleted]` marker preserves that structural step; any other missing author makes the affected branch ineligible for Focus.
- Original HN `root`, `parent`, `prev`, and `next` targets remain authoritative. HN collapse and HN Refined focus remain separate state layers.
- Register no scroll listener or observer and add no automatic scope, scroll clamp, gesture interception, or momentum compensation.
- Add no dependency, remote request, permission, analytics, or persisted Focus reading history.
- Use `extension/` as the canonical source. Synchronize `HNRefined/Shared (Extension)/Resources/` only through the documented Makefile build workflow; do not hand-edit generated copies.
- Preserve the unrelated whitespace-only change in `HNRefined/Shared (App)/ViewController.swift`.
- This remains one intentionally uncommitted physical-device acceptance batch. Do not stage or commit intermediate tasks; create the final commit only after the maintainer accepts the physical iPhone result.
- Keep release preparation paused until the physical iPhone matrix passes.

## File Responsibility Map

- `extension/shared/defaults.js`: canonical preference default, legacy migration, and normalization.
- `extension/options/options.html`: native Thread Focus switch and Mobile Comment Threads explanatory copy.
- `extension/options/options.js`: switch rendering, form reads, persistence, and live-tab notification.
- `extension/content/content-script.js`: content-side preference normalization and Boolean controller updates while retaining Safari refresh guards.
- `extension/content/deep-comments.js`: author ancestry, eligibility, Focus UI, guide rendering, History transitions, and HN-navigation coordination.
- `extension/content/content.css`: sticky two-region guide, wrapping ancestry, theme-aware divider, and focused indentation.
- `tests/defaults.test.js`: preference schema and migration contract.
- `tests/options-behavior.test.js`: native switch persistence and notification behavior.
- `tests/popup.test.js`: first-release settings surface and static HTML/CSS contract.
- `tests/preference-store.test.js`, `tests/popup-behavior.test.js`: complete normalized preference fixtures.
- `tests/content-script.test.js`: content normalization and `start(enabled)` / `setEnabled(enabled)` coordination.
- `tests/deep-comments.test.js`: comment ancestry, fail-closed author handling, eligibility, guide output, History, HN navigation, and collapse behavior.
- `tests/css-rules.test.js`: wrapping guide geometry and removal of the single-line/ellipsis layout.
- `tests/docs-handoff.test.js`: maintained project behavior and release-gate wording.
- `AGENTS.md`, `README.md`, `docs/project-status.md`, `docs/development.md`, `docs/privacy.md`, `docs/app-store-checklist.md`, `docs/release-readiness.md`: public and maintainer-facing behavior, privacy, regression, and acceptance state.
- `HNRefined/Shared (Extension)/Resources/**`: generated mirror updated only by Makefile targets.

---

### Task 1: Replace Deep-Thread Mode With a Default-On Thread Focus Preference

**Files:**

- Modify: `tests/defaults.test.js`
- Modify: `tests/options-behavior.test.js`
- Modify: `tests/popup.test.js`
- Modify: `tests/preference-store.test.js`
- Modify: `tests/popup-behavior.test.js`
- Modify: `extension/shared/defaults.js`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.js`

**Interfaces:**

- Produces: `preferences.threadFocusEnabled: boolean`, default `true`.
- Produces: `normalizePreferences(raw)` output without `deepThreadMode`.
- Produces: `<input id="threadFocusEnabled" type="checkbox" switch>` under `Mobile Comment Threads`.
- Consumes later: Task 3 passes the Boolean preference into the content controller.

- [ ] **Step 1: Write failing default and migration tests**

Replace the expected `deepThreadMode` property in `tests/defaults.test.js` with `threadFocusEnabled: true`, assert that it is not an enum member, and add exact legacy migration cases:

```js
assert.equal(ALLOWED_PREFERENCES.threadFocusEnabled, undefined);

assert.equal(
  normalizePreferences({ threadFocusEnabled: false, deepThreadMode: "on-demand" })
    .threadFocusEnabled,
  false,
);
assert.equal(
  normalizePreferences({ deepThreadMode: "indentation-only" }).threadFocusEnabled,
  false,
);
assert.equal(normalizePreferences({ deepThreadMode: "on-demand" }).threadFocusEnabled, true);
assert.equal(normalizePreferences({ deepThreadMode: "automatic" }).threadFocusEnabled, true);
assert.equal(normalizePreferences({ deepThreadMode: "sideways" }).threadFocusEnabled, true);
assert.equal("deepThreadMode" in normalizePreferences({ deepThreadMode: "on-demand" }), false);
```

Update every complete preference fixture in the listed tests from
`deepThreadMode: "on-demand"` to `threadFocusEnabled: true`.

- [ ] **Step 2: Write failing options-page behavior and structure tests**

In `tests/options-behavior.test.js`, replace the `deepThreadMode` fake select with a Boolean switch and verify persistence plus current-window HN-tab notification:

```js
assert.equal(fields.threadFocusEnabled.checked, true);
assert.equal(typeof fields.threadFocusEnabled.listeners.change, "function");

fields.threadFocusEnabled.checked = false;
await fields.threadFocusEnabled.listeners.change();

assert.equal(writes.at(-1).hnRefinedPreferences.threadFocusEnabled, false);
assert.equal(messages.at(-1).message.preferences.threadFocusEnabled, false);
```

In `tests/popup.test.js`, require all of the following static structure:

```js
assert.match(optionsHtml, /<h2[^>]*>Mobile Comment Threads<\/h2>/);
assert.match(optionsHtml, /Focus isolates one comment and its replies/);
assert.match(optionsHtml, /<input id="threadFocusEnabled" type="checkbox" switch\s*\/>/);
assert.doesNotMatch(optionsHtml, /id="deepThreadMode"/);
assert.doesNotMatch(optionsHtml, /Starting Level|Focus Links/);
```

- [ ] **Step 3: Run the focused preference tests and verify RED**

Run:

```bash
node --test tests/defaults.test.js tests/options-behavior.test.js tests/popup.test.js tests/preference-store.test.js tests/popup-behavior.test.js
```

Expected: failures report the missing `threadFocusEnabled` default and field, the retained `deepThreadMode` output, and the absent Mobile Comment Threads section.

- [ ] **Step 4: Implement canonical Boolean normalization and legacy migration**

In `extension/shared/defaults.js`, replace `deepThreadMode` with the Boolean default and remove the enum from `ALLOWED_PREFERENCES`:

```js
export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "system",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
});

function threadFocusEnabledOrDefault(preferences) {
  if (typeof preferences.threadFocusEnabled === "boolean") {
    return preferences.threadFocusEnabled;
  }
  if (preferences.deepThreadMode === "indentation-only") {
    return false;
  }
  return DEFAULT_PREFERENCES.threadFocusEnabled;
}
```

Return `threadFocusEnabled: threadFocusEnabledOrDefault(preferences)` from
`normalizePreferences`; do not return the legacy key. The new Boolean takes
precedence when both keys exist.

- [ ] **Step 5: Replace the deep-thread select with the native switch**

Remove the `Deep Threads` row from Reading Layout and add this separate section before Links in `extension/options/options.html`:

```html
<section aria-labelledby="comment-threads-heading">
  <div class="section-heading">
    <h2 id="comment-threads-heading">Mobile Comment Threads</h2>
    <p>
      Focus isolates one comment and its replies in a dedicated reading view. Turn it off to keep
      indentation only.
    </p>
  </div>

  <label class="setting-row setting-row-switch">
    <span class="setting-label">Thread Focus</span>
    <input id="threadFocusEnabled" type="checkbox" switch />
  </label>
</section>
```

Change the Reading Layout description so it mentions only width and density on Mac and wider iPad layouts. In `extension/options/options.js`, bind the new field and use `.checked` in both directions:

```js
threadFocusEnabled: document.querySelector("#threadFocusEnabled"),
```

```js
fields.threadFocusEnabled.checked = preferences.threadFocusEnabled;
```

```js
threadFocusEnabled: fields.threadFocusEnabled.checked,
```

Reuse the existing `.setting-row-switch` and native switch CSS; add no custom switch visuals.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run the Step 3 command.

Expected: all listed tests pass, normalized writes contain only
`threadFocusEnabled`, and the settings surface contains one default-on native
switch with no depth control.

- [ ] **Step 7: Acceptance checkpoint without committing**

Run `git diff --check` for the Task 1 files and review that no unrelated file was staged. Do not commit this task because the physical-device batch must remain uncommitted until final acceptance.

---

### Task 2: Derive a Fail-Closed Original Author Ancestry

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `extension/content/deep-comments.js`

**Interfaces:**

- Produces: `authorLabelForRecord(record) -> string | null`.
- Produces: `authorAncestryForRecord(index, records) -> string[] | null`.
- Consumes: existing `record.parentIndex`, `.hnuser`, and `.commtext` DOM structure.
- Consumed by Task 3: Focus eligibility, History entry labels, and guide rendering.

- [ ] **Step 1: Extend the comment fixture with explicit deletion state**

Give `createInteractiveRow` a `deleted` option. When true, omit `.hnuser` and return a `.commtext` node whose trimmed text is `[deleted]`. Keep `username: null` without `deleted` as an unexpected missing-author case:

```js
function createInteractiveRow(id, depth, username, top, { deleted = false, display = "" } = {}) {
  const row = createRow(id, depth);
  const user = username == null ? null : createNode("a");
  const commentText = createNode("div");
  commentText.textContent = deleted ? "[deleted]" : "visible comment";
  if (user) {
    user.textContent = username;
  }

  const originalQuerySelector = row.querySelector;
  row.querySelector = (selector) => {
    if (selector === ".commtext") {
      return commentText;
    }
    if (selector === ".hnuser") {
      return user;
    }
    return originalQuerySelector(selector);
  };
}
```

Add a `deletedIndexes` fixture option and pass it into each row without changing normal usernames.

- [ ] **Step 2: Write failing pure ancestry tests**

Build records with depths `[0, 1, 2, 3, 4, 5]` and author names matching a real branch shape. Assert the complete original path:

```js
assert.deepEqual(authorAncestryForRecord(5, records), [
  "root-user",
  "level-2-user",
  "level-3-user",
  "level-4-user",
  "level-5-user",
  "current-user",
]);
```

Also assert:

```js
assert.deepEqual(authorAncestryForRecord(0, records), ["root-user"]);
assert.deepEqual(authorAncestryForRecord(1, deletedRecords), ["root-user", "[deleted]"]);
assert.equal(authorAncestryForRecord(1, missingRecords), null);
assert.equal(authorAncestryForRecord(2, missingRecords), null);
```

Construct `deletedRecords` from depths `[0, 1]`, usernames
`["root-user", null]`, and `deletedIndexes: [1]`. Construct `missingRecords`
from depths `[0, 1, 2]` and usernames `["root-user", null, "child-user"]`.

Use this nonzero first-visible-depth assertion to verify that the function
follows the model's `parentIndex` chain and does not invent the story as a root:

```js
const offsetRows = [
  createInteractiveRow("offset-root", 4, "offset-root-user", 80),
  createInteractiveRow("offset-child", 5, "offset-child-user", 160),
];
const offsetRecords = buildCommentRecords(offsetRows);
assert.deepEqual(authorAncestryForRecord(1, offsetRecords), [
  "offset-root-user",
  "offset-child-user",
]);
```

- [ ] **Step 3: Run the ancestry tests and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: failures report that `authorAncestryForRecord` and explicit deleted-author handling do not exist.

- [ ] **Step 4: Implement the pure author helpers**

Replace `labelForRecord` and `visibleFocusLabels` with:

```js
function authorLabelForRecord(record) {
  const username = record?.row.querySelector(".hnuser")?.textContent?.trim();
  if (username) {
    return username;
  }

  const marker = record?.row.querySelector(".commtext")?.textContent?.trim();
  return marker === "[deleted]" ? "[deleted]" : null;
}

function authorAncestryForRecord(index, records) {
  const labels = [];
  let cursor = index;
  const visited = new Set();

  while (cursor >= 0) {
    if (visited.has(cursor)) {
      return null;
    }
    visited.add(cursor);

    const record = records[cursor];
    const label = authorLabelForRecord(record);
    if (!record || !label) {
      return null;
    }

    labels.unshift(label);
    cursor = record.parentIndex;
  }

  return labels;
}
```

Export both helpers from `HNRefinedDeepComments`. Remove
`visibleFocusLabels`; no caller may keep focus-stack folding behavior.

- [ ] **Step 5: Run the ancestry tests and verify GREEN**

Run the Step 3 command.

Expected: complete original ancestry, top-level-only ancestry, explicit deletion, missing author, and missing ancestor tests pass without altering History behavior.

- [ ] **Step 6: Acceptance checkpoint without committing**

Run `git diff --check -- extension/content/deep-comments.js tests/deep-comments.test.js`. Do not stage or commit.

---

### Task 3: Make Thread Focus Boolean, Depth-Independent, and Ancestry-Driven

**Files:**

- Modify: `tests/content-script.test.js`
- Modify: `tests/deep-comments.test.js`
- Modify: `extension/content/content-script.js`
- Modify: `extension/content/deep-comments.js`

**Interfaces:**

- Consumes: `preferences.threadFocusEnabled: boolean` from Task 1.
- Consumes: `authorLabelForRecord` and `authorAncestryForRecord` from Task 2.
- Produces controller methods: `start(enabled = true)`, `setEnabled(enabled)`, `refresh()`, and `getState()`.
- Preserves: `historyStateFor`, `resolveHistoryStack`, `focusDepthForTarget`, pending HN navigation, and pending full-stack exit.

- [ ] **Step 1: Write failing content-script Boolean coordination tests**

Replace the fake controller's mode strings with Boolean calls:

```js
start(enabled) {
  threadFocusUpdates.push(["start", enabled]);
},
setEnabled(enabled) {
  threadFocusUpdates.push(["set", enabled]);
},
```

Assert initial and refreshed behavior:

```js
assert.deepEqual(context.threadFocusUpdates, [["start", true]]);
// After a stored preference change:
assert.deepEqual(context.threadFocusUpdates.at(-1), ["set", false]);
assert.equal(context.document.documentElement.dataset.hnrDeepThreads, undefined);
```

Keep the existing Safari storage-change-without-`areaName`, visible-page refresh,
and current-window notification tests intact.

- [ ] **Step 2: Write failing controller eligibility and toggle tests**

Replace mode-based fixtures with `enabled: true | false`. Add these assertions:

```js
const fixture = createControllerFixture([0, 1, 2, 3, 4, 5], { enabled: true });
for (const index of [0, 1, 2, 3, 4]) {
  assert.ok(findLink(fixture.rows[index].navs, "focus"));
}
assert.equal(findLink(fixture.rows[5].navs, "focus"), undefined);
```

After focusing index 0, assert its own action is absent and an eligible child remains:

```js
findLink(fixture.rows[0].navs, "focus").dispatch("click");
assert.equal(findLink(fixture.rows[0].navs, "focus"), undefined);
assert.ok(findLink(fixture.rows[1].navs, "focus"));
```

Add cases for a disabled initial controller, explicit deleted ancestry remaining
eligible, unexpected missing-author ancestry remaining ineligible, enabling
without navigation or scrolling, and disabling from a nested Focus View:

```js
controller.setEnabled(false);
assert.equal(controller.getState().kind, "global");
assert.equal(findLink(rows[0].navs, "focus"), undefined);
assert.equal(rows[3].style.getPropertyValue("--hnr-comment-base-indent"), "32px");
```

The fake History implementation may deliver the global `popstate`
synchronously; assert one user setting change unwinds the full Focus stack and
restores the first return anchor.

- [ ] **Step 3: Write failing ancestry-guide integration tests**

Create a fixture with depths `[0, 1, 2, 3, 4, 5, 6]`. Focus row 5 directly—it
is eligible because row 6 is its descendant—and assert its guide uses original
parents rather than the one-entry History stack:

```js
const { guide, rows } = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
findLink(rows[5].navs, "focus").dispatch("click");
assert.equal(guide.textContent, "all | focused: user0 / user1 / user2 / user3 / user4 / user5");
```

Create a second fixture that focuses indices `3`, `4`, then `5`; assert the same
final guide string even though its History stack contains three entries. Then
assert Back changes the guide to the complete ancestry of index `4`, not to a
list of clicked focus roots.

- [ ] **Step 4: Run the controller and content tests and verify RED**

Run:

```bash
node --test tests/content-script.test.js tests/deep-comments.test.js
```

Expected: failures report the enum controller API, the depth-four eligibility gate, repeated current-root `focus`, and focus-stack-derived guide text.

- [ ] **Step 5: Normalize the Boolean in the content script**

Mirror Task 1's default and legacy migration in the non-module content script:

```js
const DEFAULT_PREFERENCES = {
  theme: "system",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
};
```

Add the same `threadFocusEnabledOrDefault(next)` helper, remove
`deepThreadMode` from `ALLOWED`, remove `root.dataset.hnrDeepThreads`, and pass
the Boolean through:

```js
function updateDeepComments(enabled) {
  if (!deepCommentsController) {
    deepCommentsController = globalThis.HNRefinedDeepComments?.createController?.({
      document,
      window,
    });
    deepCommentsController?.start(enabled);
    return;
  }

  deepCommentsController.setEnabled(enabled);
}
```

- [ ] **Step 6: Replace controller mode state with enabled state**

Use `let enabled = true`, rename `setMode` to `setEnabled`, and keep viewport exit independent from the user preference:

```js
function setEnabled(nextEnabled) {
  enabled = nextEnabled !== false;

  if (focusStack.length > 0 && (!enabled || !mobileQuery.matches)) {
    pendingNavigation = null;
    pendingExitAll = { anchor: focusStack[0]?.returnAnchor || null };
    window.history.back();
  }
  addFocusAffordances();
}

function handleViewportChange() {
  setEnabled(enabled);
}
```

`start(initialEnabled = true)` installs the same listeners once, calls
`refresh()`, then `setEnabled(initialEnabled)`. Do not add any scroll listener.

- [ ] **Step 7: Make affordance eligibility depth-independent and current-aware**

In `addFocusAffordances`, remove `record.depth < 4`. Skip all of these cases:

```js
const currentRootIndex = focusStack.at(-1)?.rootIndex ?? -1;
if (
  !enabled ||
  !mobileQuery.matches ||
  record.endIndex <= index ||
  index === currentRootIndex ||
  authorAncestryForRecord(index, records) == null
) {
  return;
}
```

Rebuild affordances after every `applyFocusStack` transaction so Back, Forward,
`all`, nested focus, and HN navigation always omit only the current root. Keep
the three inserted nodes exactly as separator, `focus`, and one trailing space
to preserve `next | focus [–]`.

- [ ] **Step 8: Render the original ancestry without changing History entries**

In `enterFocus`, use `authorLabelForRecord(record)` for the serializable stack
entry label and return if it is null. Keep the label field for History
validation/backward compatibility, but do not render it as hierarchy.

Validate the visible ancestry in `applyFocusStack` before applying masks or
revealing the root:

```js
const rootIndex = focusStack.at(-1)?.rootIndex ?? -1;
const labels = authorAncestryForRecord(rootIndex, records);
const root = records[rootIndex];
if (!focusSurface || !root || !labels) {
  focusStack = [];
}
```

Pass the validated array to `renderFocusGuide(labels)`. Do not call
`leaveAllFocus()` recursively from inside guide rendering; an invalid ancestry
must take the existing empty-stack fail-closed path before any root reveal.

Create one prefix node plus one segment per label. Ancestor segments include the
following slash inside the same segment so wrapping does not strand a slash at
the start of a line:

```js
labels.forEach((label, index) => {
  const segment = document.createElement("span");
  const current = index === labels.length - 1;
  segment.className = current
    ? "hnr-comment-scope-step hnr-comment-scope-step-current"
    : "hnr-comment-scope-step hnr-comment-scope-step-ancestor";
  segment.textContent = current ? label : `${label} / `;
  path.append(segment);
});
```

The guide text for one focused top-level comment is
`all | focused: username`; for a deep direct focus it contains every original
parent author.

- [ ] **Step 9: Run the controller and content tests and verify GREEN**

Run the Step 4 command.

Expected: Boolean preference updates, every eligible depth, current-root
exclusion, disabled state, direct and nested ancestry equivalence, History,
navigation, collapse, and no-scroll tests all pass.

- [ ] **Step 10: Acceptance checkpoint without committing**

Run `git diff --check` for the Task 3 files. Search the live source and tests for
controller uses of `setMode`, `deepThreadMode`, `visibleFocusLabels`, and
`record.depth < 4`; the search must find none outside historical documents. Do
not stage or commit.

---

### Task 4: Let the Complete Ancestry Wrap Without Far-Right Displacement

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: `.hnr-comment-scope-exit`, `.hnr-comment-scope-path`, `.hnr-comment-scope-prefix`, `.hnr-comment-scope-step-ancestor`, and `.hnr-comment-scope-step-current` from Task 3.
- Produces: a sticky two-column guide with a 48 px leading exit region and a naturally wrapping ancestry region.
- Preserves: `--hnr-focus-divider`, theme variants, 44 px minimum touch height, and focused-row scroll margin.

- [ ] **Step 1: Write failing wrapping-layout CSS tests**

Replace the old ellipsis and `max-width: 50%` assertions with exact layout requirements:

```js
assert.match(
  mobileCss,
  /\.hnr-comment-scope-guide:not\(\[hidden\]\)\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*48px minmax\(0, 1fr\)[^}]*white-space:\s*normal/s,
);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-path\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap[^}]*min-height:\s*44px[^}]*overflow-wrap:\s*anywhere/s,
);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-step-current\s*{[^}]*color:\s*var\(--hnr-text-primary/s,
);
assert.match(
  mobileCss,
  /\.hnr-comment-scope-prefix,[^{]*\.hnr-comment-scope-step\s*{[^}]*flex:\s*0 0 auto[^}]*max-width:\s*100%/s,
);
assert.doesNotMatch(mobileCss, /\.hnr-comment-scope-path-(?:prior|current)/);
assert.doesNotMatch(mobileCss, /text-overflow:\s*ellipsis/);
assert.doesNotMatch(mobileCss, /max-width:\s*50%/);
```

Retain assertions for sticky positioning, safe-area top, theme-aware divider,
and the 44–48 px `all` activation geometry.

- [ ] **Step 2: Run the CSS tests and verify RED**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: failures identify the current single-line flex guide, expanding empty
prior region, hidden overflow, ellipsis, and right-pinned current label.

- [ ] **Step 3: Implement the two-region wrapping layout**

Replace the guide and path layout with:

```css
html[data-hnr-mobile="auto"] .hnr-comment-scope-guide:not([hidden]) {
  position: sticky;
  top: env(safe-area-inset-top);
  z-index: 2;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: start;
  box-sizing: border-box;
  min-height: 44px;
  white-space: normal;
  color: var(--hnr-text-muted, #828282);
  font-family: var(--hnr-font-family, Verdana, Geneva, sans-serif);
  font-size: 12px;
  line-height: 1.4;
  background: var(--hnr-content-background, #f6f6ef);
  border-bottom: 1px solid var(--hnr-focus-divider);
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-path {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  min-width: 0;
  min-height: 44px;
  padding-inline-end: 8px;
  overflow-wrap: anywhere;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-prefix,
html[data-hnr-mobile="auto"] .hnr-comment-scope-step {
  flex: 0 0 auto;
  max-width: 100%;
}

html[data-hnr-mobile="auto"] .hnr-comment-scope-step-current {
  color: var(--hnr-text-primary, #000);
}
```

Keep `.hnr-comment-scope-exit` as an inline flex link with `min-width: 48px`,
`min-height: 44px`, and centered text. Remove the old prior/current flex growth,
`overflow: hidden`, `text-overflow`, and current-label width cap.

- [ ] **Step 4: Run controller and CSS tests and verify GREEN**

Run:

```bash
node --test tests/deep-comments.test.js tests/css-rules.test.js
```

Expected: the full ancestry DOM and wrapping CSS tests pass, with unchanged
divider and focused indentation coverage.

- [ ] **Step 5: Acceptance checkpoint without committing**

Run `git diff --check -- extension/content/content.css tests/css-rules.test.js`.
Do not stage or commit.

---

### Task 5: Update Handoff Contracts and Complete Automated Safari Verification

**Files:**

- Modify: `tests/docs-handoff.test.js`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Review and modify if wording changes: `docs/privacy.md`
- Modify: `docs/app-store-checklist.md`
- Modify: `docs/release-readiness.md`
- Generated by Makefile: `HNRefined/Shared (Extension)/Resources/**`

**Interfaces:**

- Consumes: completed preference, controller, ancestry, and guide behavior from Tasks 1–4.
- Produces: maintained project handoff rules, public feature wording, exact verification evidence, and synchronized Safari resources.
- Preserves: release pause until physical iPhone acceptance.

- [ ] **Step 1: Write failing handoff-document tests**

Replace old assertions about On demand, Indentation only, focus-step folding, or
deep-only eligibility with requirements that both `docs/project-status.md` and
`docs/development.md` state:

```js
for (const doc of [development, status]) {
  assert.match(doc, /Thread Focus.*default.*(?:on|enabled)/is);
  assert.match(doc, /every.*comment.*repl(?:y|ies).*focus/is);
  assert.match(doc, /complete.*author.*ancestry.*wrap/is);
  assert.match(doc, /History.*separate.*ancestry/is);
  assert.match(doc, /off.*indentation.*remain/is);
  assert.match(doc, /scrolling.*never.*focus/is);
}
```

Keep existing checks for `next | focus [–]`, hidden page surface, zero-indent
root, authoritative HN targets, separate collapse state, and physical-iPhone
release gate.

- [ ] **Step 2: Run handoff tests and verify RED**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: failures identify the old deep-only, enum-mode, and folded focus-stack path wording.

- [ ] **Step 3: Update product, development, privacy, and release documentation**

Make these exact semantic changes:

- `AGENTS.md`: require default-on Thread Focus on every comment subtree, complete original author ancestry with wrapping, current-root exclusion, Boolean off behavior, and separation from History.
- `README.md`: describe the optional manual Focus View and default-on switch without claiming automatic focus or deep-only availability.
- `docs/project-status.md`: record the physical screenshot finding, the corrected ancestry interpretation, the wrapping requirement, and the new unverified implementation status.
- `docs/development.md`: document `threadFocusEnabled`, legacy migration, controller `setEnabled`, full ancestry DOM dependencies, and the physical regression URL.
- `docs/privacy.md`: state that only the Boolean Thread Focus preference persists locally; comment ancestry and Focus History remain page-local and ephemeral. If the current wording already says this without naming the removed enum, leave it unchanged.
- `docs/app-store-checklist.md` and `docs/release-readiness.md`: keep release paused and list full ancestry, shallow focus, switch toggling, wrapping, Back/Forward, HN navigation, collapse, and theme checks.

Do not rewrite historical design and implementation plans other than the active
2026-07-30 design spec and this plan; historical files may retain superseded
decisions as history.

- [ ] **Step 4: Run formatting and the full local quality gate**

Run:

```bash
make format
make check
```

Expected: formatting is clean and every test passes with zero failures. Record
the new exact test count in project status and release-readiness evidence, then
rerun `make check` so the recorded count is itself verified.

- [ ] **Step 5: Verify canonical and generated resources through the Makefile workflow**

Run:

```bash
make safari-build-ios
diff -rq --exclude=.DS_Store extension "HNRefined/Shared (Extension)/Resources"
```

Expected: the iOS build succeeds using repo-local DerivedData, and the resource
diff prints no differences. Do not manually edit the generated resource tree.

- [ ] **Step 6: Reinstall and inspect the signed Safari package**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: Safari registers only `net.vetcafe.hnrefined.extension`; package
sanity checks find the manifest, popup, options, content, and icons. Reload the
HN tab because the workflow intentionally does not restart Safari.

- [ ] **Step 7: Run final source and worktree checks**

Run:

```bash
rg -n "deepThreadMode|visibleFocusLabels|four-level path folding|missing username renders|record\.depth < 4" extension tests AGENTS.md README.md docs/project-status.md docs/development.md docs/privacy.md docs/app-store-checklist.md docs/release-readiness.md
git diff --check -- . ":(exclude)HNRefined/Shared (App)/ViewController.swift"
git status --short
```

Expected: the semantic search finds no live-code or current-document references
to the removed behavior; diff validation is clean; the unrelated
`ViewController.swift` change is still present and untouched; nothing is staged.

---

### Task 6: Complete the Physical iPhone Acceptance Gate

**Files:**

- Modify after observed results: `docs/project-status.md`
- Modify after observed results: `docs/app-store-checklist.md`
- Modify after observed results: `docs/release-readiness.md`

**Interfaces:**

- Consumes: the signed, reinstalled build from Task 5.
- Produces: observed physical-device evidence or an explicit release blocker.
- Does not produce: a completion claim from Simulator-only evidence.

- [ ] **Step 1: Verify the primary ancestry regression in portrait**

On the maintainer's iPhone 17, open:

```text
https://news.ycombinator.com/item?id=49098510#49101840
```

Focus `apitman`. Confirm the guide begins with `all | focused:`, contains every
comment author from that branch's top-level comment through `apitman`, contains
no topic or story author, wraps instead of folding, and does not pin `apitman`
to the far right.

- [ ] **Step 2: Verify shallow manual thread isolation**

Choose a top-level or shallow comment that has replies. Confirm it offers
`focus`, entering it hides adjacent threads and preserves full-width reading,
and its current root no longer repeats `focus`. Confirm eligible descendants can
enter a narrower Focus View.

- [ ] **Step 3: Verify switch behavior and indentation fallback**

From full settings, turn Thread Focus off. Confirm an active Focus View exits to
the complete discussion, all `focus` links and the guide disappear, and
progressive indentation remains. Turn it back on and confirm links return
without automatic focus, navigation, or scroll movement.

- [ ] **Step 4: Verify History, HN navigation, collapse, and scrolling**

Enter at least three nested Focus Views. Confirm Safari Back and Forward traverse
the entered views while each guide shows that focused comment's complete
original ancestry. Confirm `all` exits the whole stack; `parent`, `prev`,
`next`, and `root` reach their original HN targets; `[–]` and `[n more]` retain
HN state; long momentum scrolling never activates, exits, or rebases focus.

- [ ] **Step 5: Verify responsive and theme presentation**

Repeat the ancestry guide in portrait and landscape with Light, Dark, and System
Dark. Confirm the guide grows for wrapped paths, remains sticky, leaves the
reading width intact, keeps `all` easy to hit, and preserves the restrained HN
orange divider. Repeat with Increase Contrast.

- [ ] **Step 6: Record only observed evidence and decide final commit readiness**

If every physical check passes, update the three release/status documents with
the exact device, OS, URL, themes, and interactions observed; run
`make format && make check` one final time; then review the full diff excluding
the unrelated `ViewController.swift` change and ask the maintainer before the
final stage/commit operation. If any check fails, record it as a release blocker,
leave the batch uncommitted, and return to root-cause debugging.

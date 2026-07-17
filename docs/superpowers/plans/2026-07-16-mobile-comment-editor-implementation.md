# Mobile Comment Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give mobile Hacker News comment editors native two-row compact sizing, a one-time six-row focus size, and HN-style controls that adjust by four rows between 2 and 22.

**Architecture:** Enhance only semantic comment-form textareas. A small WeakMap-backed JavaScript controller preserves Hacker News' original `rows`, tracks mobile rows, inserts two native buttons, and responds to focus, control clicks, and the existing 700 px breakpoint; CSS only corrects the gutter and presents controls inside that breakpoint.

**Tech Stack:** Safari WebExtension content script, modern JavaScript DOM APIs, CSS, Node.js built-in test runner, Xcode Safari WebExtension wrapper.

## Global Constraints

- Target only `#hnmain form[action="comment"] textarea[name="text"]`.
- Require `(max-width: 700px) and (any-pointer: coarse)` so narrow desktop Safari
  retains native mouse resizing.
- Mobile sequence is `2, 6, 10, 14, 18, 22` rows.
- First mobile focus changes 2 rows to 6 once; later focus never overrides user sizing.
- Equal-size CSS up/down triangles decrease and increase by four rows; both controls are `button type="button"` with accessible labels.
- Touch size adjustments preserve an active textarea's focus and Safari keyboard.
- Wider viewports restore the original Hacker News `rows`; returning to mobile restores mobile state.
- Mobile width and maximum width use `calc(100% - 28px)`, as established by physical-iPhone acceptance.
- Do not read comment text, persist editor state, intercept submission, add dependencies, or introduce card/dialog UI.
- Do not commit developer-local Xcode team values.
- Do not commit implementation files until automated checks and real Safari acceptance pass.

---

### Task 1: Native Row Controller

**Files:**

- Modify: `tests/content-script.test.js`
- Modify: `extension/content/content-script.js`

**Interfaces:**

- Consumes: matching textarea elements, `focusin`, button `pointerdown`/`click`, and `matchMedia("(max-width: 700px)")`.
- Produces: one enhancement state per textarea with `{ originalRows, mobileRows, focusedOnce, controls, decreaseButton, increaseButton }`.

- [ ] **Step 1: Replace fixed-expansion tests with DOM and media-query mocks**

Extend the test context with one stable media-query object whose default
`matches` value is false, a `setMobileMatches(next)` dispatcher, a minimal
`document.createElement()` button/container mock, and `document.activeElement`.

Replace the old textarea helper with a mock that supplies `rows`, `dataset`,
`matches()`, and `insertAdjacentElement("afterend", element)`.

Add tests that prove:

```js
test("mobile comment editors initialize at two rows and first focus expands once", () => {
  // Original rows: 6. Mobile initialization: 2. First focus: 6.
  // Shrink to 2 using the control, blur/refocus, and assert it remains 2.
});

test("comment editor controls step by four rows and clamp between two and twenty-two", () => {
  // Repeated increase clicks stop at 22 and disable the increase button.
  // Repeated decrease clicks stop at 2 and disable the decrease button.
});

test("comment editor controls preserve active textarea focus on pointer input", () => {
  // pointerdown calls preventDefault only while document.activeElement is the textarea.
});

test("comment editors restore original rows outside the mobile breakpoint", () => {
  // Mobile selection survives mobile -> desktop -> mobile while desktop uses original rows.
});

test("content script ignores unrelated textareas", () => {
  // No controls are inserted and rows remain unchanged.
});
```

- [ ] **Step 2: Run the test and verify red**

Run:

```bash
node --test tests/content-script.test.js
```

Expected: new row/control tests fail because the current fixed expansion
attribute has no controls, native row state, clamp, or media-query restoration.

- [ ] **Step 3: Implement constants and per-editor state**

Add:

```js
const COMMENT_EDITOR_SELECTOR = '#hnmain form[action="comment"] textarea[name="text"]';
const MOBILE_COMMENT_EDITOR_QUERY = "(max-width: 700px)";
const COMMENT_EDITOR_MIN_ROWS = 2;
const COMMENT_EDITOR_FOCUS_ROWS = 6;
const COMMENT_EDITOR_ROW_STEP = 4;
const COMMENT_EDITOR_MAX_ROWS = 22;
const commentEditorStates = new WeakMap();
const mobileCommentEditorQuery = window.matchMedia(MOBILE_COMMENT_EDITOR_QUERY);
```

Implement these focused functions:

```js
function clampCommentEditorRows(rows) {
  return Math.min(COMMENT_EDITOR_MAX_ROWS, Math.max(COMMENT_EDITOR_MIN_ROWS, rows));
}

function applyCommentEditorRows(editor, state) {
  editor.rows = mobileCommentEditorQuery.matches ? state.mobileRows : state.originalRows;
  state.decreaseButton.disabled = state.mobileRows <= COMMENT_EDITOR_MIN_ROWS;
  state.increaseButton.disabled = state.mobileRows >= COMMENT_EDITOR_MAX_ROWS;
}

function changeCommentEditorRows(editor, delta) {
  const state = commentEditorStates.get(editor);
  if (!state) return;
  state.mobileRows = clampCommentEditorRows(state.mobileRows + delta);
  applyCommentEditorRows(editor, state);
}
```

- [ ] **Step 4: Create accessible controls without binding to HN's help link**

Create a helper that returns a `span.hnr-comment-editor-controls` containing:

```html
<button
  type="button"
  aria-label="Decrease comment editor height"
  title="Decrease comment editor height"
></button>
<button
  type="button"
  aria-label="Increase comment editor height"
  title="Increase comment editor height"
></button>
```

Both buttons use class `hnr-comment-editor-size-button` plus a direction modifier
that draws an equal-size CSS triangle. On `pointerdown`, call
`preventDefault()` only when `document.activeElement === editor`. On `click`,
call `changeCommentEditorRows(editor, -4)` or
`changeCommentEditorRows(editor, 4)`. Insert the span with
`editor.insertAdjacentElement("afterend", controls)`.

- [ ] **Step 5: Initialize editors and handle focus and viewport changes**

Implement:

```js
function enhanceCommentEditor(editor) {
  if (commentEditorStates.has(editor)) return;
  const controls = createCommentEditorControls(editor);
  const [decreaseButton, increaseButton] = controls.children;
  const state = {
    originalRows: editor.rows,
    mobileRows: COMMENT_EDITOR_MIN_ROWS,
    focusedOnce: false,
    controls,
    decreaseButton,
    increaseButton,
  };
  commentEditorStates.set(editor, state);
  editor.insertAdjacentElement("afterend", controls);
  applyCommentEditorRows(editor, state);
}

function enhanceCommentEditors() {
  for (const editor of document.querySelectorAll(COMMENT_EDITOR_SELECTOR)) {
    enhanceCommentEditor(editor);
  }
}

function handleCommentEditorFocus(event) {
  const editor = event.target;
  const state = commentEditorStates.get(editor);
  if (!state || state.focusedOnce || !mobileCommentEditorQuery.matches) return;
  state.focusedOnce = true;
  state.mobileRows = Math.max(state.mobileRows, COMMENT_EDITOR_FOCUS_ROWS);
  applyCommentEditorRows(editor, state);
}

function refreshCommentEditorViewports() {
  for (const editor of document.querySelectorAll(COMMENT_EDITOR_SELECTOR)) {
    const state = commentEditorStates.get(editor);
    if (state) applyCommentEditorRows(editor, state);
  }
}
```

Register one `focusin` listener and one media-query `change` listener. Run
`enhanceCommentEditors()` at startup or once on `DOMContentLoaded`, following the
existing story-target initialization pattern.

- [ ] **Step 6: Run the focused test and verify green**

Run:

```bash
node --test tests/content-script.test.js
```

Expected: all row, control, focus-preservation, media-query, unrelated-textarea,
and existing preference/story tests pass.

### Task 2: HN-Style Mobile Controls And Gutter

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: `.hnr-comment-editor-controls` and `.hnr-comment-editor-size-button` from Task 1.
- Produces: controls hidden by default and shown as restrained touch controls only inside the mobile breakpoint.

- [ ] **Step 1: Replace fixed-height CSS assertions with control assertions**

Update the mobile comment-editor test to assert:

```js
assert.doesNotMatch(desktopCss, /hnr-comment-editor-controls[^\n]*display:\s*flex/s);
assert.match(
  mobileCss,
  /#hnmain\s+form\[action="comment"\]\s+textarea\[name="text"\]\s*{[^}]*width:\s*calc\(100% - 28px\)[^}]*max-width:\s*calc\(100% - 28px\)/s,
);
assert.match(mobileCss, /\.hnr-comment-editor-controls\s*{[^}]*display:\s*flex/s);
assert.match(
  mobileCss,
  /\.hnr-comment-editor-size-button\s*{[^}]*min-width:\s*32px[^}]*min-height:\s*32px[^}]*border:\s*0[^}]*background:\s*transparent/s,
);
assert.match(mobileCss, /\.hnr-comment-editor-size-button:disabled/);
assert.doesNotMatch(mobileCss, /transition:/);
```

- [ ] **Step 2: Run CSS tests and verify red**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: control-presentation assertions fail because the current CSS still
uses the superseded fixed height and expansion attribute.

- [ ] **Step 3: Replace fixed heights with gutter and control presentation**

Keep the semantic textarea rule inside `@media (max-width: 700px)` with only:

```css
width: calc(100% - 28px);
max-width: calc(100% - 28px);
```

Add outside the media query:

```css
.hnr-comment-editor-controls {
  display: none;
}
```

Inside the mobile query add:

```css
html[data-hnr-mobile="auto"] #hnmain form[action="comment"] .hnr-comment-editor-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  float: right;
  margin-right: 28px;
}

html[data-hnr-mobile="auto"] .hnr-comment-editor-size-button {
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  color: var(--hnr-text-muted, #828282);
  font: inherit;
  border: 0;
  background: transparent;
}

html[data-hnr-mobile="auto"] .hnr-comment-editor-size-button:disabled {
  opacity: 0.35;
}
```

Do not add rounded containers, shadows, transitions, emoji, or fixed positioning.

- [ ] **Step 4: Run JS and CSS focused tests**

Run:

```bash
node --test tests/content-script.test.js tests/css-rules.test.js
```

Expected: all focused tests pass.

### Task 3: Documentation, Packaging, And Acceptance

**Files:**

- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Synchronize: `HNRefined/Shared (Extension)/Resources/content/content-script.js`
- Synchronize: `HNRefined/Shared (Extension)/Resources/content/content.css`

- [ ] **Step 1: Replace superseded fixed-expansion documentation**

Document the exact `2 → 6`, `±4`, `2–22` row behavior, native button controls,
focus/keyboard preservation, semantic selector, mobile-only presentation, and
unchanged desktop/original form behavior. Remove references to a single fixed
expanded height or `data-hnr-comment-editor-expanded`.

- [ ] **Step 2: Format and run focused checks**

Run:

```bash
make format
node --test tests/content-script.test.js tests/css-rules.test.js tests/docs-handoff.test.js
```

Expected: formatting is clean and all focused tests pass.

- [ ] **Step 3: Synchronize and build iOS resources**

Run:

```bash
make safari-build-ios
cmp extension/content/content-script.js "HNRefined/Shared (Extension)/Resources/content/content-script.js"
cmp extension/content/content.css "HNRefined/Shared (Extension)/Resources/content/content.css"
```

Expected: build exits 0 and both comparisons produce no output.

- [ ] **Step 4: Stage only implementation-owned files and verify their exact tree**

Stage canonical JS/CSS, their two tests, two operational docs, and two Xcode
resource copies. Do not stage `HNRefined/HNRefined.xcodeproj/project.pbxproj`.

Materialize the staged index under `.build/staged-check` and run:

```bash
PATH="../../node_modules/.bin:$PATH" make check
```

Expected: the complete staged-tree gate passes, including open-source safety.

- [ ] **Step 5: Perform real Safari acceptance**

On iPhone 17 Safari verify:

1. Initial editor is 2 rows with symmetric gutters.
2. First focus changes it to 6 rows without excessive growth.
3. The down control follows `6, 10, 14, 18, 22`; the up control returns through
   the same sequence to 2.
4. Limit buttons disable correctly.
5. Touch adjustments preserve the keyboard and comment text.
6. Refocusing after manual shrink does not force 6 rows again.
7. Light/dark themes and two fonts remain aligned without horizontal overflow.

On desktop Safari verify original textarea rows and form behavior remain unchanged.

The physical-iPhone screenshot established a shared 28 px right gutter. If a
later device remains asymmetric, change only that shared value and its test/docs
value, then repeat automated and runtime checks.

- [ ] **Step 6: Commit after acceptance**

Commit exactly the eight implementation files with:

```bash
git commit -m "Improve mobile comment editing"
```

Expected: only developer-local Xcode signing configuration remains modified.

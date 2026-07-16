# Mobile Comment Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hacker News comment textareas compact before use, persistently expand them after first focus, and restore symmetric iPhone gutters without changing desktop or Hacker News form behavior.

**Architecture:** Add one semantic comment-editor selector and one delegated `focusin` handler to the existing content script. Keep all presentation inside the existing mobile media query: CSS provides compact and expanded heights plus a right-gutter width correction, while the original Hacker News textarea and form remain intact.

**Tech Stack:** Safari WebExtension content script, modern JavaScript, CSS, Node.js built-in test runner, Xcode Safari WebExtension wrapper.

## Global Constraints

- Apply visual behavior only below the existing 700 px mobile breakpoint.
- Target only `#hnmain form[action="comment"] textarea[name="text"]`.
- Initial height is `4.5rem`; expanded height is `clamp(12rem, 40svh, 18rem)`.
- Mobile width and maximum width are `calc(100% - 16px)`.
- Expansion persists only in the current DOM through `data-hnr-comment-editor-expanded="true"`.
- Do not add UI elements, animation, storage, dependencies, form interception, or comment-text access.
- Desktop textarea behavior remains unchanged.
- Do not commit the developer-local `DEVELOPMENT_TEAM` values currently present in the working Xcode project.
- Do not commit until automated checks and real Safari acceptance pass.

---

## File Map

- Modify `extension/content/content-script.js`: recognize comment editors and mark them expanded after first focus.
- Modify `tests/content-script.test.js`: exercise the delegated focus behavior with matching and unrelated textarea mocks.
- Modify `extension/content/content.css`: add mobile-only compact, expanded, and gutter rules.
- Modify `tests/css-rules.test.js`: lock exact mobile sizing and confirm no compact rule appears before the mobile breakpoint.
- Modify `docs/project-status.md`: record the implemented behavior and its real-Safari acceptance state.
- Modify `docs/development.md`: preserve the semantic selector, progressive-enhancement, and runtime-check constraints.
- Synchronize `extension/content/content-script.js` to `HNRefined/Shared (Extension)/Resources/content/content-script.js`.
- Synchronize `extension/content/content.css` to `HNRefined/Shared (Extension)/Resources/content/content.css`.

### Task 1: Delegated Expansion State

**Files:**

- Modify: `tests/content-script.test.js`
- Modify: `extension/content/content-script.js`

**Interfaces:**

- Consumes: browser `focusin` events and `Element.matches(selector)`.
- Produces: `COMMENT_EDITOR_SELECTOR`, `expandCommentEditor(event)`, `observeCommentEditors()`, and `target.dataset.hnrCommentEditorExpanded = "true"`.

- [ ] **Step 1: Extend the test harness and add failing behavior tests**

Add this mock helper after `createAnchor`:

```js
function createTextarea({ isCommentEditor = false } = {}) {
  return {
    dataset: {},
    matches(selector) {
      return isCommentEditor && selector === '#hnmain form[action="comment"] textarea[name="text"]';
    },
  };
}
```

Change `dispatchDocumentEvent` so the test can pass an event object:

```js
dispatchDocumentEvent(type, event) {
  documentListeners.get(type)?.(event);
},
```

Add these tests after the default-attributes test:

```js
test("content script keeps a focused Hacker News comment editor expanded", () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");
  const textarea = createTextarea({ isCommentEditor: true });

  vm.runInContext(script, context);
  context.dispatchDocumentEvent("focusin", { target: textarea });
  context.dispatchDocumentEvent("focusin", { target: textarea });

  assert.equal(textarea.dataset.hnrCommentEditorExpanded, "true");
});

test("content script ignores unrelated textareas", () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");
  const textarea = createTextarea();

  vm.runInContext(script, context);
  context.dispatchDocumentEvent("focusin", { target: textarea });

  assert.equal(textarea.dataset.hnrCommentEditorExpanded, undefined);
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
node --test tests/content-script.test.js
```

Expected: both new tests fail because no `focusin` listener marks the matching textarea.

- [ ] **Step 3: Implement the minimal delegated listener**

Add beside the existing selector constants:

```js
const COMMENT_EDITOR_SELECTOR = '#hnmain form[action="comment"] textarea[name="text"]';
```

Add before `start()`:

```js
function expandCommentEditor(event) {
  const target = event.target;
  if (!target?.matches?.(COMMENT_EDITOR_SELECTOR)) {
    return;
  }

  target.dataset.hnrCommentEditorExpanded = "true";
}

function observeCommentEditors() {
  document.addEventListener("focusin", expandCommentEditor);
}
```

Call it once from `start()` after `observePageActivation()`:

```js
observeCommentEditors();
```

- [ ] **Step 4: Run the focused test and verify green**

Run:

```bash
node --test tests/content-script.test.js
```

Expected: all content-script tests pass, including repeated focus and unrelated textarea coverage.

### Task 2: Mobile Sizing And Symmetric Gutter

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: `data-hnr-comment-editor-expanded="true"` from Task 1.
- Produces: mobile-only compact and expanded textarea geometry.

- [ ] **Step 1: Add a failing mobile CSS regression test**

Add after `mobile CSS keeps Hacker News dense while improving reading rhythm`:

```js
test("mobile comment editors start compact and remain expanded after focus", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const phoneMediaIndex = css.indexOf("@media (max-width: 700px)");
  const desktopCss = css.slice(0, phoneMediaIndex);
  const mobileCss = css.slice(phoneMediaIndex);

  assert.ok(phoneMediaIndex >= 0);
  assert.doesNotMatch(desktopCss, /hnr-comment-editor-expanded/);
  assert.match(
    mobileCss,
    /#hnmain\s+form\[action="comment"\]\s+textarea\[name="text"\]\s*{[^}]*width:\s*calc\(100% - 16px\)[^}]*max-width:\s*calc\(100% - 16px\)[^}]*height:\s*4\.5rem/s,
  );
  assert.match(
    mobileCss,
    /textarea\[name="text"\]\[data-hnr-comment-editor-expanded="true"\]\s*{[^}]*height:\s*clamp\(12rem,\s*40svh,\s*18rem\)/s,
  );
});
```

- [ ] **Step 2: Run the CSS test and verify red**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: the new test fails because the compact and expanded comment-editor rules do not exist.

- [ ] **Step 3: Add the exact mobile-only CSS rules**

Inside `@media (max-width: 700px)`, after the generic mobile `textarea` rule, add:

```css
html[data-hnr-mobile="auto"] #hnmain form[action="comment"] textarea[name="text"] {
  width: calc(100% - 16px);
  max-width: calc(100% - 16px);
  height: 4.5rem;
}

html[data-hnr-mobile="auto"]
  #hnmain
  form[action="comment"]
  textarea[name="text"][data-hnr-comment-editor-expanded="true"] {
  height: clamp(12rem, 40svh, 18rem);
}
```

Do not add transitions, resize suppression, fixed positioning, or overflow rules.

- [ ] **Step 4: Run CSS and content-script tests**

Run:

```bash
node --test tests/css-rules.test.js tests/content-script.test.js
```

Expected: all focused tests pass.

### Task 3: Documentation, Xcode Synchronization, And Acceptance

**Files:**

- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Synchronize: `HNRefined/Shared (Extension)/Resources/content/content-script.js`
- Synchronize: `HNRefined/Shared (Extension)/Resources/content/content.css`

**Interfaces:**

- Consumes: canonical files completed by Tasks 1 and 2.
- Produces: packaged Safari resources, maintained handoff guidance, and verified runtime behavior.

- [ ] **Step 1: Update operational documentation**

In `docs/project-status.md`, add a current-implementation note that mobile comment editors begin compact, remain expanded after first focus, and retain the original Hacker News form. Add the semantic selector and desktop-unchanged rule under guarded regressions.

In `docs/development.md`, add a short `Mobile Comment Editor` section requiring:

```text
#hnmain form[action="comment"] textarea[name="text"]
```

Document that CSS owns mobile geometry, JavaScript only adds the expansion attribute, and real Safari checks must cover iPhone keyboard behavior, symmetric gutters, and unchanged desktop behavior.

- [ ] **Step 2: Format and run focused tests**

Run:

```bash
make format
node --test tests/content-script.test.js tests/css-rules.test.js tests/docs-handoff.test.js
```

Expected: formatting is clean and all focused tests pass.

- [ ] **Step 3: Synchronize and build the iOS wrapper**

Run:

```bash
make safari-build-ios
```

Expected: the command synchronizes `extension/` into the Xcode wrapper and exits 0. Verify exact copies:

```bash
cmp extension/content/content-script.js "HNRefined/Shared (Extension)/Resources/content/content-script.js"
cmp extension/content/content.css "HNRefined/Shared (Extension)/Resources/content/content.css"
```

Expected: both commands exit 0 with no output.

- [ ] **Step 4: Stage only implementation-owned files and verify the exact staged tree**

Stage these files, excluding `HNRefined/HNRefined.xcodeproj/project.pbxproj`:

```bash
git add -- \
  extension/content/content-script.js \
  extension/content/content.css \
  tests/content-script.test.js \
  tests/css-rules.test.js \
  docs/project-status.md \
  docs/development.md \
  "HNRefined/Shared (Extension)/Resources/content/content-script.js" \
  "HNRefined/Shared (Extension)/Resources/content/content.css"
git diff --cached --name-only
git diff --cached --check
```

Expected: exactly the eight listed files are staged and the diff check exits 0.

Materialize the staged index under the ignored repo-local build directory and run the full gate there so developer-local signing values cannot affect the open-source safety test:

```bash
mkdir -p .build/staged-check
git checkout-index -f --prefix="$PWD/.build/staged-check/" -a
cd .build/staged-check
PATH="../../node_modules/.bin:$PATH" make check
```

Expected: all checks and tests pass, including the no-personal-team safety test.

- [ ] **Step 5: Perform real Safari acceptance before commit**

On iPhone 17 Safari, verify:

1. Before focus, the comment textarea is approximately three lines high.
2. Left and right viewport gutters look symmetric in portrait orientation.
3. First focus expands the textarea and opens the keyboard without horizontal overflow.
4. Tapping elsewhere leaves the textarea expanded and preserves typed text.
5. Hacker News' original submit control still posts normally.
6. Light and dark themes plus two font presets retain correct geometry.

On desktop Safari, verify the same item-page textarea retains its original size and behavior.

If the iPhone right gutter is visibly asymmetric, change only the shared `16px` subtraction, update its test and documentation value, repeat Steps 2 through 5, and do not add device- or font-specific selectors.

- [ ] **Step 6: Commit the accepted implementation**

After automated and runtime acceptance pass:

```bash
git diff --cached --stat
git commit -m "Improve mobile comment editing"
git status --short
```

Expected: the commit contains only the eight implementation-owned files. The only remaining working-tree modification is the developer-local Xcode signing configuration.

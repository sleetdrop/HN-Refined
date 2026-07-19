# Mobile Item Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent author-supplied story URLs from widening mobile Hacker News item pages and keep the main content clear of iOS Safari's scroll indicator.

**Architecture:** Extend the existing width-based mobile CSS only. Bind wrapping to semantic `.toptext` and place one inline-end gutter on `#bigbox`'s direct content cell so the story, form, and comments share the same boundary.

**Tech Stack:** CSS, Node.js built-in test runner, Makefile validation, Safari WebExtension Xcode wrapper.

## Global Constraints

- Apply only inside `@media (max-width: 700px)` when `data-hnr-mobile="auto"` is active.
- Do not hide horizontal overflow or change Hacker News table display/layout.
- Do not add JavaScript or inspect story text.
- Do not alter the top navigation, desktop layout, comment wrapping, or comment-editor behavior.

---

### Task 1: Mobile Item Width Guard

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`
- Modify: `HNRefined/Shared (Extension)/Resources/content/content.css`
- Modify: `docs/development.md`
- Modify: `docs/project-status.md`

**Interfaces:**

- Consumes: Hacker News `.toptext`, `#bigbox`, and the existing `data-hnr-mobile="auto"` page attribute.
- Produces: CSS-only mobile wrapping and a `12px` inline-end content gutter.

- [x] **Step 1: Write the failing CSS regression test**

Add this test to `tests/css-rules.test.js` after the mobile reading-rhythm test:

```js
test("mobile item pages wrap story text and preserve a right gutter", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileMediaIndex = css.indexOf("@media (max-width: 700px)");
  const desktopCss = css.slice(0, mobileMediaIndex);
  const mobileCss = css.slice(mobileMediaIndex);

  assert.notEqual(mobileMediaIndex, -1);
  assert.doesNotMatch(desktopCss, /\.toptext\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(mobileCss, /#hnmain\s+\.toptext\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(
    mobileCss,
    /#bigbox\s*>\s*td\s*{[^}]*box-sizing:\s*border-box[^}]*padding-inline-end:\s*12px/s,
  );
  assert.doesNotMatch(css, /overflow-x:\s*hidden|table-layout:\s*fixed/);
});
```

- [x] **Step 2: Verify the regression test fails for the missing rules**

Run: `node --test --test-name-pattern="mobile item pages" tests/css-rules.test.js`

Expected: FAIL because the scoped `.toptext` and `#bigbox > td` declarations are absent.

- [x] **Step 3: Add the minimal mobile CSS**

Add these declarations inside the existing `@media (max-width: 700px)` block in `extension/content/content.css`, after the `#hnmain` rule:

```css
html[data-hnr-mobile="auto"] #bigbox > td {
  box-sizing: border-box;
  padding-inline-end: 12px;
}

html[data-hnr-mobile="auto"] #hnmain .toptext {
  overflow-wrap: anywhere;
}
```

- [x] **Step 4: Verify the focused test passes**

Run: `node --test --test-name-pattern="mobile item pages" tests/css-rules.test.js`

Expected: PASS.

- [x] **Step 5: Document the guarded behavior**

Add to `docs/development.md` under Hacker News Page Scope:

```markdown
On narrow item pages, `.toptext` uses `overflow-wrap: anywhere` so long
author-supplied URLs cannot widen Hacker News' nested tables. The direct content
cell of `#bigbox` keeps a 12 px inline-end gutter clear of Safari's overlay
scroll indicator. Keep both rules mobile-only; do not replace them with global
overflow clipping or fixed table layout.
```

Add the same constraint concisely to the mobile implementation and guarded-regression sections of `docs/project-status.md`.

- [x] **Step 6: Format, validate, and synchronize Xcode resources**

Run: `make format && make check && make safari-build-ios`

Expected: formatting clean, all tests pass, iOS build succeeds, and the canonical CSS is copied into the Xcode wrapper.

- [x] **Step 7: Verify on iPhone Simulator**

Reinstall/run `HNRefined (iOS)`, reload `https://news.ycombinator.com/item?id=48945241`, and inspect the top story, form, and first comments.

Expected: no horizontal clipping; long URLs wrap; story/form/comments retain a visible right gutter; top navigation and comment indentation remain unchanged.

- [x] **Step 8: Commit the implementation**

```bash
git add tests/css-rules.test.js extension/content/content.css \
  "HNRefined/Shared (Extension)/Resources/content/content.css" \
  docs/development.md docs/project-status.md \
  docs/superpowers/plans/2026-07-19-mobile-item-overflow-implementation.md
git commit -m "Fix mobile item page overflow"
```

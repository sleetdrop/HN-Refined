# Options Mobile Row Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep all native select settings inline at ordinary iPhone widths and stack all non-switch rows only at 360 px and below.

**Architecture:** Remove the `Reading Density`-only responsive class and CSS rule, leaving the existing standard two-column row and shared 360 px fallback as the only select-row layout behaviors. Lock the responsive contract in source-level tests and current development guidance, then synchronize the shared extension resources into the Xcode wrapper for iOS, iPadOS, and macOS.

**Tech Stack:** Semantic HTML, CSS media queries, Safari native form controls, Node.js test runner, Makefile-driven Xcode/Safari workflow.

## Global Constraints

- `Reading Density` uses the same standard setting-row structure as Theme, Font, and `Reading Width`.
- Select rows remain label-left and control-right above 360 px.
- At 360 px and below, every non-switch select row stacks without horizontal overflow.
- Native select ids, options, storage behavior, touch height, and Safari appearance remain unchanged.
- The link switch row remains inline.
- Canonical `extension/` resources and Xcode wrapper resources must remain identical.

---

### Task 1: Unify mobile select-row layout

**Files:**

- Modify: `tests/popup.test.js`
- Modify: `tests/docs-handoff.test.js`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.css`
- Modify: `docs/development.md`
- Modify: `HNRefined/Shared (Extension)/Resources/options/options.html`
- Modify: `HNRefined/Shared (Extension)/Resources/options/options.css`

**Interfaces:**

- Consumes: Existing `.setting-row` two-column layout and `@media (max-width: 360px)` non-switch fallback.
- Produces: One responsive contract shared by Theme, Font, Reading Density, and Reading Width.

- [ ] **Step 1: Write the failing layout and documentation tests**

In `tests/popup.test.js`, require a standard Reading Density row, reject the dedicated stacking class and selector, and preserve the shared 360 px fallback:

```js
assert.match(
  optionsHtml,
  /<label class="setting-row">\s*<span class="setting-label">Reading Density<\/span>\s*<select id="desktopDensity">/s,
);
assert.doesNotMatch(optionsHtml, /setting-row-stack-narrow/);
assert.doesNotMatch(optionsCss, /\.setting-row-stack-narrow/);
assert.match(
  optionsCss,
  /@media \(max-width: 360px\)\s*{\s*\.setting-row:not\(\.setting-row-switch\)\s*{[^}]*grid-template-columns: 1fr;/s,
);
```

In the existing full-settings contract test in `tests/docs-handoff.test.js`, require current guidance:

```js
assert.match(development, /Select rows stay side by side above 360 px/i);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/popup.test.js tests/docs-handoff.test.js
```

Expected: FAIL because the HTML still contains `setting-row-stack-narrow`, the CSS still defines its 520 px stacking rule, and the development guide still describes an approved long-row exception.

- [ ] **Step 3: Implement the minimum source and documentation change**

In `extension/options/options.html`, change the Reading Density label from:

```html
<label class="setting-row setting-row-stack-narrow"></label>
```

to:

```html
<label class="setting-row"></label>
```

In `extension/options/options.css`, retain the narrow-screen `main` sizing but delete only the `.setting-row-stack-narrow` block from the 520 px media query. Leave the 360 px fallback and coarse-pointer 44 px rules unchanged.

In `docs/development.md`, replace the long-row exception with this explicit contract:

```text
Select rows stay side by side above 360 px, including at ordinary iPhone widths. At 360 px and below, all non-switch select rows stack together; coarse-pointer rows and controls keep a minimum 44 px activation height.
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/popup.test.js tests/docs-handoff.test.js
```

Expected: all focused tests pass with no failures or warnings.

- [ ] **Step 5: Synchronize the Xcode wrapper resources**

Run:

```bash
make safari-build-ios
```

Confirm the build succeeds and the canonical resources exactly match the wrapper copies:

```bash
cmp extension/options/options.html "HNRefined/Shared (Extension)/Resources/options/options.html"
cmp extension/options/options.css "HNRefined/Shared (Extension)/Resources/options/options.css"
```

Expected: both `cmp` commands exit 0 with no output.

- [ ] **Step 6: Run the full local quality gate**

Run:

```bash
make format
make check
git diff --check
```

Expected: formatting is clean, all tests pass, and `git diff --check` exits 0.

- [ ] **Step 7: Commit the responsive layout change**

```bash
git add tests/popup.test.js tests/docs-handoff.test.js extension/options/options.html extension/options/options.css docs/development.md "HNRefined/Shared (Extension)/Resources/options/options.html" "HNRefined/Shared (Extension)/Resources/options/options.css"
git commit -m "fix: keep mobile settings rows aligned"
```

### Task 2: Verify shared Safari behavior

**Files:**

- Verify: `extension/options/options.html`
- Verify: `extension/options/options.css`
- Verify: installed macOS Safari extension resources

**Interfaces:**

- Consumes: The synchronized options HTML and CSS from Task 1.
- Produces: Evidence that the shared page remains correct on iPhone-size and macOS Safari surfaces.

- [ ] **Step 1: Verify iPhone responsive behavior**

Open the built options page in iPhone Safari or an iPhone simulator. At an ordinary portrait width above 360 px, confirm Theme, Font, Reading Density, and Reading Width are all label-left/control-right. At 360 px or below, confirm all four select rows stack, keep 44 px touch targets, and introduce no horizontal overflow. Repeat the ordinary-width check in system light and dark appearances.

- [ ] **Step 2: Refresh and verify the installed macOS Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Open the installed full settings page and confirm the desktop layout remains label-left/control-right, native select focus remains Safari-owned, and the native switch retains its keyboard focus indication.

- [ ] **Step 3: Run final verification on the committed tree**

Run:

```bash
make check
git status --short
```

Expected: all tests pass and the worktree is clean.

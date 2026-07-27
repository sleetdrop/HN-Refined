# Native Select Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the lingering custom square outline from pointer-selected native selects while preserving native keyboard focus and the switch's explicit focus indication.

**Architecture:** Keep the fix CSS-only: Safari owns native `select` focus rendering, while the existing `input:focus-visible` rule continues to cover the native switch. Static contract tests protect both sides of that boundary, and the existing resource-sync workflow copies the canonical stylesheet into the Xcode wrapper.

**Tech Stack:** Safari WebExtension HTML/CSS, Node.js built-in test runner, Makefile Safari workflow, macOS Safari.

## Global Constraints

- Native `select` controls must not receive a custom HN Refined focus outline.
- The native switch must retain its explicit `Highlight` focus outline.
- Do not add JavaScript input-modality tracking, markup changes, preference changes, dependencies, or visual tokens.
- Preserve light/dark appearance, accent-color behavior, responsive layout, preference persistence, and popup refresh guards.
- Treat `extension/options/options.css` as canonical and sync it through the documented Makefile workflow.

---

### Task 1: Restore Native Select Focus Ownership

**Files:**

- Modify: `tests/popup.test.js:110`
- Modify: `tests/docs-handoff.test.js:71-81`
- Modify: `extension/options/options.css:92-96`
- Modify: `docs/development.md:201-211`
- Generated: `HNRefined/HNRefined Shared (Extension)/Resources/options/options.css`

**Interfaces:**

- Consumes: Safari's native focus rendering for HTML `select` controls.
- Produces: A stylesheet contract where only `input:focus-visible` receives the explicit `Highlight` outline.

- [ ] **Step 1: Write the failing focus ownership tests**

Replace the broad focus assertion in `tests/popup.test.js` with:

```js
assert.doesNotMatch(optionsCss, /select:focus-visible/);
assert.match(
  optionsCss,
  /input:focus-visible\s*{[^}]*outline: 2px solid Highlight;[^}]*outline-offset: 2px;/s,
);
```

Add this assertion to `development docs preserve the system-native settings surfaces contract` in `tests/docs-handoff.test.js`:

```js
assert.match(development, /Safari owns the native select focus appearance/i);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/popup.test.js tests/docs-handoff.test.js
```

Expected: FAIL because `options.css` still contains `select:focus-visible` and `docs/development.md` does not yet state the native focus ownership contract.

- [ ] **Step 3: Apply the minimal CSS fix**

Change the options focus rule to:

```css
input:focus-visible {
  outline: 2px solid Highlight;
  outline-offset: 2px;
}
```

Do not add a replacement rule for `select`; its native appearance remains intact.

- [ ] **Step 4: Document the focus ownership boundary**

Add this sentence to the full-settings contract in `docs/development.md`:

```text
Safari owns the native select focus appearance; do not add a separate custom outline, while the native switch keeps its explicit system-color focus indication.
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
node --test tests/popup.test.js tests/docs-handoff.test.js
```

Expected: PASS with zero failures.

- [ ] **Step 6: Sync the canonical stylesheet into the Xcode wrapper**

Run:

```bash
make safari-build
cmp extension/options/options.css "HNRefined/HNRefined Shared (Extension)/Resources/options/options.css"
```

Expected: the build succeeds and `cmp` exits with status 0.

- [ ] **Step 7: Run the complete source quality gate**

Run:

```bash
make format
make check
git diff --check
```

Expected: formatting makes no unrelated changes, all tests pass, and `git diff --check` reports nothing.

- [ ] **Step 8: Reinstall and validate the real Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

In the installed full settings page:

1. Select the current Theme value with the pointer and confirm no separate square outer outline remains after the menu closes.
2. Press Tab through Theme, Font, Reading Density, and Reading Width; confirm every native select remains visibly focused and operable using Safari's own treatment.
3. Continue to the external-link switch and confirm its explicit system-color focus outline remains visible.
4. Repeat the visual check in system light and dark appearance, then restore the user's original appearance.

Expected: the pointer artifact is gone, keyboard navigation remains clear, and the switch focus indication is unchanged.

- [ ] **Step 9: Commit the verified fix**

```bash
git add tests/popup.test.js tests/docs-handoff.test.js extension/options/options.css docs/development.md "HNRefined/HNRefined Shared (Extension)/Resources/options/options.css"
git commit -m "fix: use native select focus appearance"
```

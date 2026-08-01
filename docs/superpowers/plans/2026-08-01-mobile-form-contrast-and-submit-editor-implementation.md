# Mobile Form Contrast and Submit Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hacker News forms legible and focused coherently in Light, Dark,
and Increased Contrast, while adding mobile row-size controls to the story
submission textarea without changing its six-row starting state.

**Architecture:** Extend the existing static theme contract with three form-only
tokens and consume them only in the existing form CSS. Keep link and ordinary
button keyboard focus Safari-owned; use the themed ring only for form controls.
Refactor the current comment-editor controller into two explicit editor
profiles, sharing controls and row limits while giving the submission editor its
own no-auto-expansion lifecycle.

**Tech Stack:** Vanilla JavaScript, CSS custom properties, static JSON themes,
Node.js built-in test runner, Safari WebExtension, iOS Simulator.

## Global Constraints

- Preserve Hacker News behavior and information architecture; no new
  preference, storage key, remote resource, or bundled dependency.
- Keep native Safari caret and select appearance; do not use `appearance: none`.
- Keep unknown inline colors and user-authored formatting Hacker News-owned.
- Mobile editor behavior applies only at `(max-width: 700px) and (any-pointer:
coarse)`.
- Do not replace textareas, read their contents, persist rows, or intercept form
  submission.
- Canonical source is `extension/`; sync the Xcode wrapper through the Makefile
  workflow rather than editing its copied resources directly.

---

## File Structure

- `extension/themes/hn-light.json` and `extension/themes/hn-dark.json` define
  static `controlSurface`, `controlBorder`, and `controlFocus` values.
- `scripts/validate-themes.js` makes those values part of the complete semantic
  contract; `scripts/build-themes.js` emits them without bespoke handling.
- `extension/content/content.css` consumes the tokens for form surfaces and
  field-only focus, and supplies precisely scoped HN default-text correction.
- `extension/content/content-script.js` recognizes comment and submission text
  editors as separate profiles sharing the same button mechanics.
- `tests/theme-validator.test.js`, `tests/css-rules.test.js`, and
  `tests/content-script.test.js` lock each contract.
- `docs/theme-contribution.md`, `docs/color-semantics.md`,
  `docs/development.md`, `docs/project-status.md`, and
  `docs/app-store-checklist.md` record the new theme roles and validation
  matrix.

## Theme Values

Use these static values:

| Role             | Light     | Dark      | Purpose                                       |
| ---------------- | --------- | --------- | --------------------------------------------- |
| `controlSurface` | `#fbfaf3` | `#2f2b23` | Separate editable areas softly from the page. |
| `controlBorder`  | `#d9d0b1` | `#5b5141` | Keep an unfocused one-pixel boundary.         |
| `controlFocus`   | `#c96d24` | `#c67836` | Provide a warm, visible field focus ring.     |

In Increased Contrast, override the three values in `content.css` to
`#ffffff`, `#706a57`, `#9c480d` for Light and `#302d25`, `#9b917d`, `#e29a58`
for Dark. The System theme follows the active system scheme just as the current
semantic tokens do.

### Task 1: Extend and verify the form-control theme contract

**Files:**

- Modify: `scripts/validate-themes.js:4-31`
- Modify: `extension/themes/hn-light.json:5-32`
- Modify: `extension/themes/hn-dark.json:5-32`
- Generated: `extension/generated/themes.css`
- Modify: `tests/theme-validator.test.js:7-58, 129-196`
- Modify: `docs/theme-contribution.md:12-31`
- Modify: `docs/color-semantics.md`

**Interfaces:**

- Consumes: `REQUIRED_TOKENS` and the existing camel-case-to-kebab-case theme
  generator.
- Produces: `--hnr-control-surface`, `--hnr-control-border`, and
  `--hnr-control-focus` on Light, Dark, and System-dark generated CSS blocks.

- [ ] **Step 1: Write the failing theme-contract tests**

  Add the three tokens to the expected `validTheme.tokens` and
  `semanticTokenNames`, then add this dark contrast assertion:

  ```js
  for (const token of ["controlSurface", "controlBorder", "controlFocus"]) {
    assert.equal(typeof tokens[token], "string", `missing semantic token: ${token}`);
  }

  assert.ok(
    contrastRatio(tokens.controlFocus, tokens.controlSurface) >= 3,
    "dark control focus must remain visible without system-blue glare",
  );
  assert.ok(
    contrastRatio(tokens.controlBorder, tokens.controlSurface) >= 1.5,
    "dark control border must distinguish unfocused fields",
  );
  ```

- [ ] **Step 2: Run the theme tests to verify they fail**

  Run: `node --test tests/theme-validator.test.js`

  Expected: FAIL because the existing themes and `REQUIRED_TOKENS` do not yet
  provide the three form-control roles.

- [ ] **Step 3: Add the static tokens and regenerate CSS**

  Append `controlSurface`, `controlBorder`, and `controlFocus` after
  `borderSubtle` in `REQUIRED_TOKENS`, both JSON files, and the complete-token
  test fixtures. Use the values in the Theme Values table. Run
  `make build-themes` to regenerate `extension/generated/themes.css`; do not
  edit that file by hand.

- [ ] **Step 4: Document the roles**

  Add the three names to `docs/theme-contribution.md` and explain in
  `docs/color-semantics.md` that they express control geometry, not HN content
  meaning. Keep the statement that native Safari caret and select rendering
  remain outside the theme contract.

- [ ] **Step 5: Run the focused tests to verify they pass**

  Run: `node --test tests/theme-validator.test.js`

  Expected: PASS, including complete-token, Light, Dark, and contrast checks.

- [ ] **Step 6: Commit the isolated contract change**

  ```bash
  git add scripts/validate-themes.js extension/themes/hn-light.json extension/themes/hn-dark.json extension/generated/themes.css tests/theme-validator.test.js docs/theme-contribution.md docs/color-semantics.md
  git commit -m "feat: add semantic form control colors"
  ```

### Task 2: Apply restrained form surfaces and field-only focus styling

**Files:**

- Modify: `extension/content/content.css:319-364, 399-445`
- Modify: `tests/css-rules.test.js:338-370, 508-519`
- Modify: `docs/development.md:278-320`
- Modify: `docs/app-store-checklist.md:37-68`

**Interfaces:**

- Consumes: `--hnr-control-surface`, `--hnr-control-border`, and
  `--hnr-control-focus` generated by Task 1.
- Produces: unchanged native form behavior with HN-themed static and focused
  presentation.

- [ ] **Step 1: Write the failing CSS behavior tests**

  Replace the current one-rule focus expectation with these independent
  assertions:

  ```js
  assert.match(
    css,
    /input\[type="text"\],[\s\S]*textarea\s*{[^}]*background:\s*var\(--hnr-control-surface[^}]*border:\s*1px solid var\(--hnr-control-border/s,
  );
  assert.match(
    css,
    /:where\(input, select, textarea\):focus-visible\s*{[^}]*outline:\s*2px solid var\(--hnr-control-focus\)[^}]*outline-offset:\s*1px/s,
  );
  assert.match(
    css,
    /:where\(a\[href\], button\):focus-visible\s*{[^}]*outline:\s*2px solid Highlight/s,
  );
  ```

  Add explicit expectations for the Light, Dark, and System-dark Increased
  Contrast overrides from the Theme Values section.

- [ ] **Step 2: Run the focused CSS test to verify it fails**

  Run: `node --test --test-name-pattern='form|focus' tests/css-rules.test.js`

  Expected: FAIL because controls still use `contentBackground`/
  `borderSubtle` and the shared focus rule still uses `Highlight`.

- [ ] **Step 3: Implement the smallest CSS change**

  Keep the existing explicit text-input/select/textarea selector list, but
  change its background and border variables to the new control roles. Apply
  the same roles to `input[type="submit"]`. Split the current focus rule into:

  ```css
  :where(a[href], button):focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  :where(input, select, textarea):focus-visible {
    outline: 2px solid var(--hnr-control-focus);
    outline-offset: 1px;
  }
  ```

  Add the exact Increased Contrast values from the Theme Values table to
  Light, Dark, and System-dark blocks. Do not set `appearance`, `caret-color`,
  box shadows, or transitions.

- [ ] **Step 4: Verify ordinary and focused CSS rules**

  Run: `node --test --test-name-pattern='form|focus' tests/css-rules.test.js`

  Expected: PASS; the old single shared focus selector must no longer exist.

- [ ] **Step 5: Record the visual regression guard**

  Document that a focused form field uses the semantic warm focus ring while
  links/buttons keep the OS focus ring. Add iPhone Light/Dark keyboard-open
  checks for submit, reply, profile/settings, and footer search to the release
  checklist.

- [ ] **Step 6: Commit the scoped CSS change**

  ```bash
  git add extension/content/content.css tests/css-rules.test.js docs/development.md docs/app-store-checklist.md
  git commit -m "fix: refine mobile form contrast"
  ```

### Task 3: Translate only confirmed HN default-black content

**Files:**

- Modify: `extension/content/content.css`
- Modify: `tests/css-rules.test.js`
- Modify: `docs/development.md:291-320`
- Modify: `docs/project-status.md`

**Interfaces:**

- Consumes: the current color-semantics rule that exact known HN values may be
  translated but unknown inline colors must pass through.
- Produces: primary-text rendering for the exact official Jobs, profile, and
  footer default-black structures observed in Safari, with no generic
  `font[color]`, `[style*="color"]`, or table-wide override.

- [ ] **Step 1: Capture and name the exact HN structures before editing CSS**

  In Safari Inspector or a read-only DOM snapshot, inspect the dark Jobs,
  `user?id=...`, and front-page footer elements from the reported screenshots.
  Record each selector and its source color in the CSS test as a literal table:

  ```js
  const officialDefaultBlackSelectors = [
    "#hnmain .toptext a",
    "#hnmain .yclinks + table a",
    '#hnmain td[align="right"] + td',
  ];
  ```

  Retain only selectors that actually match an official `#000000` source in
  the inspected pages; remove a candidate if the snapshot shows a class with
  separate HN metadata meaning. This keeps the test tied to an observed HN
  structure rather than a broad CSS guess.

- [ ] **Step 2: Write the failing scoped-color test**

  Assert that every retained selector has a `color:
var(--hnr-text-primary, #000)` rule and add these safety assertions:

  ```js
  assert.doesNotMatch(css, /font\[color\]\s*{/);
  assert.doesNotMatch(css, /\[style\*=[^\]]*color[^\]]*\]/);
  assert.doesNotMatch(css, /#hnmain\s+td\s*{[^}]*color:/);
  ```

- [ ] **Step 3: Run the focused test to verify it fails**

  Run: `node --test --test-name-pattern='default-black|semantic signals' tests/css-rules.test.js`

  Expected: FAIL because at least one confirmed default-black structure has no
  primary-color translation.

- [ ] **Step 4: Add only the observed selectors**

  Add a separate CSS rule for the retained selector list, using
  `var(--hnr-text-primary, #000)`. Preserve existing `.subtext`, `.comhead`,
  `.score`, `.age`, `.sitebit`, `.sitestr`, and `.rank` secondary rules and do
  not add `!important` unless the Inspector confirms an official HN inline
  declaration wins without it.

- [ ] **Step 5: Run the scoped-color test to verify it passes**

  Run: `node --test --test-name-pattern='default-black|semantic signals' tests/css-rules.test.js`

  Expected: PASS with the generic-selector guards intact.

- [ ] **Step 6: Commit the semantic correction**

  ```bash
  git add extension/content/content.css tests/css-rules.test.js docs/development.md docs/project-status.md
  git commit -m "fix: preserve default content text in dark mode"
  ```

### Task 4: Add the mobile submission-editor profile

**Files:**

- Modify: `extension/content/content-script.js:16-22, 286-394`
- Modify: `extension/content/content.css:687-732`
- Modify: `tests/content-script.test.js:310-407`
- Modify: `tests/css-rules.test.js:303-336`
- Modify: `docs/development.md:322-350`
- Modify: `docs/project-status.md`

**Interfaces:**

- Consumes: `MOBILE_COMMENT_EDITOR_QUERY`, the existing 2/6/4/22 row constants,
  and the existing `WeakMap` editor state model.
- Produces: a comment profile with `initialMobileRows: 2` and
  `expandOnFirstFocus: true`, plus a submission profile with
  `initialMobileRows: originalRows` and `expandOnFirstFocus: false`.

- [ ] **Step 1: Write the failing submission-editor lifecycle test**

  Add a submission fixture with `rows: 6` and only the new submission selector
  in `selectorMatches`. Assert its initial and first-focus rows remain six,
  then assert both controls work and keep active focus:

  ```js
  assert.equal(textarea.rows, 6);
  context.dispatchDocumentEvent("focusin", { target: textarea });
  assert.equal(textarea.rows, 6);

  const [decreaseButton, increaseButton] = textarea.insertedElement.children;
  decreaseButton.dispatch("click");
  assert.equal(textarea.rows, 2);
  increaseButton.dispatch("click");
  assert.equal(textarea.rows, 6);
  assert.equal(increaseButton.getAttribute("aria-label"), "Increase submission editor height");
  ```

  Extend the existing unrelated-textarea test with an `about` textarea and
  assert it remains unenhanced.

- [ ] **Step 2: Run the editor tests to verify they fail**

  Run: `node --test --test-name-pattern='comment editor|submission editor|unrelated textareas' tests/content-script.test.js`

  Expected: FAIL because only the comment form selector is currently enhanced.

- [ ] **Step 3: Introduce explicit editor profiles**

  Add a `SUBMISSION_EDITOR_SELECTOR` that matches only
  `#hnmain form:not([action="comment"]) textarea[name="text"]`. Represent the
  two profiles as immutable objects:

  ```js
  const COMMENT_EDITOR_PROFILE = Object.freeze({
    initialMobileRows: COMMENT_EDITOR_MIN_ROWS,
    expandOnFirstFocus: true,
    label: "comment editor",
  });
  const SUBMISSION_EDITOR_PROFILE = Object.freeze({
    initialMobileRows: null,
    expandOnFirstFocus: false,
    label: "submission editor",
  });
  ```

  For the submission profile, translate `null` to `editor.rows` during state
  creation. Store `profile` on each state; use `profile.label` in the existing
  button labels. Query and refresh both selectors. Keep the existing comment
  behavior exactly unchanged.

- [ ] **Step 4: Extend the mobile control presentation**

  Make the control container visible for both the comment and submission form
  selectors. Keep the existing 28 px textarea reservation only on comments;
  submission keeps its full-width six-row writing area and shows the controls
  in the following whitespace before the original submit button. Retain the
  32 px transparent triangle buttons, no transition, and current color token.

- [ ] **Step 5: Run editor and CSS tests to verify they pass**

  Run: `node --test tests/content-script.test.js tests/css-rules.test.js`

  Expected: PASS; comment editors still start at two rows and submission starts
  at six, while both clamp to 2–22 and restore their original rows outside the
  coarse mobile query.

- [ ] **Step 6: Update behavior documentation and commit**

  Document the two profiles and the exclusion of profile `about` textareas.

  ```bash
  git add extension/content/content-script.js extension/content/content.css tests/content-script.test.js tests/css-rules.test.js docs/development.md docs/project-status.md
  git commit -m "feat: resize submission textareas on mobile"
  ```

### Task 5: Integrate, install, and visually verify the Safari extension

**Files:**

- Modify: `docs/project-status.md`
- Verify generated mirror: `HNRefined/Shared (Extension)/Resources/`

**Interfaces:**

- Consumes: the complete canonical extension changes from Tasks 1–4.
- Produces: a signed local Safari install and an iPhone simulator visual
  acceptance record.

- [ ] **Step 1: Run full formatting and verification**

  Run: `make format && make check`

  Expected: formatter clean, theme validation clean, generated themes current,
  manifest/no-remote checks clean, and every test passing.

- [ ] **Step 2: Build and install through the repo-local workflow**

  Run: `make safari-build-ios`, then `make safari-reinstall`, then
  `make safari-doctor`.

  Expected: canonical resources sync into the Xcode wrapper, iOS build succeeds,
  macOS package has a valid signature and an active HN Refined extension
  registration.

- [ ] **Step 3: Perform the iPhone 17 Pro / iOS 26.3 Simulator matrix**

  Check System Light, System Dark, fixed Light, fixed Dark, and Increased
  Contrast on:

  - `submit`: title focus, URL focus, six-row text focus, submission arrows,
    row limits, keyboard visibility, and preserved text/focus.
  - A reply form: two-to-six comment behavior, arrows, keyboard visibility, and
    focus preservation.
  - `user?id=...`: profile textarea, text inputs, selects, labels, values, and
    the absence of submission controls on `about`.
  - `jobs`, the news footer/search, and an item page: no pure-black default HN
    text on Dark; metadata and known semantic colors remain distinct.

- [ ] **Step 4: Verify source and wrapper agree**

  Run: `diff -qr extension 'HNRefined/Shared (Extension)/Resources'`

  Expected: no source differences other than the ignored `.DS_Store` in
  `extension/`.

- [ ] **Step 5: Record outcome and create the final coherent commit**

  Update `docs/project-status.md` with simulator evidence and any remaining
  physical-device follow-up. If earlier task commits were intentionally deferred
  because the color-semantics worktree was already dirty, stage only the exact
  form-refinement files and create one clear final commit after `git diff --check`.

# Comment Focus Guide Layout Refinement Implementation Plan

> **For Codex:** Execute this plan inline. Keep the acceptance batch uncommitted until physical-iPhone approval.

**Goal:** Make long focus paths remain legible and visually native to Hacker News on narrow screens without changing focus navigation semantics.

**Architecture:** Keep the existing fixed-count ancestry presentation and DOM-driven wrapping. Add one semantic wrapper around the final parent/current pair, and solve alignment, spacing, and hierarchy entirely in CSS; do not add viewport measurement or adaptive JavaScript.

**Tech Stack:** Vanilla JavaScript, CSS, Node test harness, Safari Web Extension, Xcode/iOS Simulator.

---

### Task 1: Lock the guide contract with failing tests

**Files:**

- Modify: `tests/deep-comments.test.js`
- Modify: `tests/css-rules.test.js`

1. Add a DOM test proving the final parent/current authors share one `.hnr-comment-scope-nearest` wrapper in both compact and expanded long paths.
2. Assert that the prefix text does not depend on trailing whitespace.
3. Add CSS assertions for first-line baseline alignment, explicit prefix spacing, muted ancestor links, primary current author, and the non-wrapping nearest pair.
4. Run the focused tests and confirm they fail for the intended missing behavior.

### Task 2: Implement the approved layout

**Files:**

- Modify: `extension/content/deep-comments.js`
- Modify: `extension/content/content.css`

1. Render the final parent/current steps inside one semantic nearest-pair wrapper while preserving the existing separators and compact ancestry selection.
2. Remove the prefix's trailing text whitespace and supply the visible gap through CSS.
3. Align `all` to the first path line using baseline layout.
4. Override Hacker News link specificity so ancestors remain muted while the current author alone is primary.
5. Run the focused tests until green.

### Task 3: Maintain project guidance and validate the build

**Files:**

- Modify as needed: `AGENTS.md`
- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Modify: `docs/app-store-checklist.md`
- Modify as needed: workflow/handoff tests

1. Record the final-pair wrapping and first-line alignment contract wherever future implementation work depends on it.
2. Run `make format`.
3. Run `make check`.
4. Run `make safari-build-ios`.

### Task 4: Verify varied narrow-screen scenarios in iOS Simulator

1. Build and run the Safari extension host on the designated iPhone simulator and refresh the enabled extension.
2. Verify a short ancestry path, compact long path, expanded long path, nested focus/back/all behavior, and portrait wrapping.
3. Check both light and dark appearances, including divider and muted/current contrast.
4. Capture and inspect simulator screenshots; correct any visible regression and rerun the relevant automated checks.
5. Hand the uncommitted build back for physical-iPhone acceptance.

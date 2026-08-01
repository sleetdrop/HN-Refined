# Deep Mobile Comments Implementation Plan

> Follow-up, 2026-07-30: Automatic scope was removed after physical-iPhone
> momentum-scroll testing. On demand is now the default, legacy `automatic`
> preferences migrate to it, and scrolling never changes scope. Automatic tasks
> below are retained only as implementation history.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore meaningful mobile comment indentation and add restrained local-scope reading for deeply nested Hacker News discussions.

**Architecture:** Add one locally stored three-value preference and load a dedicated vanilla JavaScript comment-scope controller before the existing content script. The controller reads HN's existing `.comtr` order, `td.ind[indent]`, IDs, navigation links, and collapse visibility without moving nodes or replacing HN behavior; it exposes the approved indentation formula through a CSS custom property and applies separate data attributes for automatic rebasing and explicit focus. If the controller cannot read HN's structure, the property remains unset and native HN indentation wins.

**Tech Stack:** Safari WebExtension Manifest V3, vanilla JavaScript, Safari/WebKit DOM and History APIs, CSS media queries and custom properties, Node.js built-in test runner, Makefile-driven checks and Xcode synchronization.

## Global Constraints

- Support Safari/WebKit only; add no Gecko/Blink compatibility layer.
- Add no runtime dependency or framework.
- Keep HN's target IDs, `href` values, voting, reply, and collapse implementation authoritative.
- Never overwrite HN's `coll` class, toggle text, inline `display`, or collapsed counts.
- Keep the ordinary and shallow-thread page free of persistent added chrome.
- Limit enhanced indentation and interactive scope behavior to `(max-width: 700px)`; native HN indentation remains the no-JavaScript fallback.
- Store only `deepThreadMode`; automatic and focused scope state remains page-local and ephemeral.
- Keep popup preference refresh guards intact and update project/release status in the same change.

---

### Task 1: Preference Surface and Progressive Indentation

**Files:**

- Modify: `extension/shared/defaults.js`
- Modify: `extension/content/content-script.js`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.js`
- Modify: `extension/content/content.css`
- Test: `tests/defaults.test.js`
- Test: `tests/content-script.test.js`
- Test: `tests/popup.test.js`
- Test: `tests/css-rules.test.js`

**Interfaces:**

- Produces: `preferences.deepThreadMode` with values `automatic`, `on-demand`, or `indentation-only` and default `automatic`.
- Produces: `html[data-hnr-deep-threads]` for the comment controller and CSS.
- Produces: a formula-derived `--hnr-comment-base-indent` value for every valid HN comment row and one mobile CSS binding, with no enumerated depth ceiling.

- [ ] **Step 1: Write failing preference and options tests**

Add literal expectations that the normalized default is `automatic`, invalid values fall back to it, the options page exposes `Automatic`, `On demand`, and `Indentation only`, and changing it remains part of the existing whole-preference write/notification flow.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/defaults.test.js tests/content-script.test.js tests/popup.test.js
```

Expected: failures because `deepThreadMode`, its field binding, and its root data attribute do not exist.

- [ ] **Step 3: Implement the preference minimally**

Add:

```js
deepThreadMode: "automatic";
```

to both canonical and content-script defaults; add the allowed enum and normalization; bind `#deepThreadMode` in options rendering/form reads; add a native select row under Reading Layout.

- [ ] **Step 4: Verify preference tests GREEN**

Run the focused command from Step 2 and expect all tests to pass.

- [ ] **Step 5: Write failing progressive-indent controller and CSS tests**

Assert hand-derived formula values, confirm rows receive the base custom property, confirm mobile CSS binds the property without enumerated width selectors, and assert the old `max-width: 32px` cap is absent.

- [ ] **Step 6: Run the CSS test and verify RED**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: failure on the existing `max-width: 32px` rule and missing custom-property binding.

- [ ] **Step 7: Implement formula-driven progressive indentation**

Use HN's existing `td.ind[indent]` attribute as the structural contract. Compute
the approved value once per comment row and expose it to the spacer image:

```css
html[data-hnr-mobile="auto"] .comment-tree .comtr .ind img[width] {
  width: var(--hnr-comment-base-indent);
  max-width: none;
}
```

Do not enumerate widths or impose a maximum supported depth. An unset custom
property must leave the original HN width untouched.

- [ ] **Step 8: Verify Task 1 GREEN**

Run:

```bash
node --test tests/defaults.test.js tests/content-script.test.js tests/popup.test.js tests/css-rules.test.js
```

Expected: all focused tests pass.

### Task 2: Reviewable Comment Model and Explicit Focus

**Files:**

- Create: `extension/content/deep-comments.js`
- Modify: `extension/manifest.json`
- Modify: `extension/content/content-script.js`
- Modify: `extension/content/content.css`
- Create: `tests/deep-comments.test.js`

**Interfaces:**

- Produces: `globalThis.HNRefinedDeepComments.createController({ document, window })`.
- Controller methods: `start(mode)`, `setMode(mode)`, `refresh()`, and `getState()`.
- Internal comment records: `{ row, id, depth, parentIndex, endIndex }` in HN DOM order.

- [ ] **Step 1: Write failing comment-model tests**

Build small real test doubles for `.comtr` rows and assert that records read literal `indent` values, calculate parents, and end a subtree before the first row whose depth is not deeper than the root.

- [ ] **Step 2: Run the model test and verify RED**

Run:

```bash
node --test tests/deep-comments.test.js
```

Expected: failure because `HNRefinedDeepComments` is not defined.

- [ ] **Step 3: Add the isolated controller shell and comment model**

Wrap the file in an IIFE so manifest content-script globals do not collide. Read only `.comment-tree .comtr`, `td.ind[indent]`, row IDs, and direct DOM relationships. Return an inert controller when the expected structure is absent.

- [ ] **Step 4: Verify model tests GREEN**

Run the Task 2 focused test and expect the record and subtree cases to pass.

- [ ] **Step 5: Write failing explicit-focus tests**

Assert that on a matching narrow viewport:

- only depth-four-or-deeper comments with descendants receive a `focus` action;
- activating it marks only outside rows with `data-hnr-focus-excluded`;
- focused subtree rows receive relative indentation variables;
- the guide exposes `focused: <user>'s replies | all`;
- HN inline display and collapse classes remain untouched;
- `all` removes only HN Refined attributes and restores comment-ID-plus-offset position.

- [ ] **Step 6: Run focus tests and verify RED**

Run the focused test and expect missing focus behavior failures.

- [ ] **Step 7: Implement explicit focus minimally**

Insert a real `focus` anchor immediately before HN's existing `.togg` affordance only for eligible rows. Store the selected row ID and viewport offset; mask outside rows with a dedicated data attribute; use a shared `indentForDepth(depth)` helper to set `--hnr-comment-indent`; create one guide before `.comment-tree`; and expose `all` as a real link.

- [ ] **Step 8: Add same-page history behavior**

Push one focus history entry. Safari Back and `all` leave focus and restore the saved anchor; nested focus replaces the current focus history state rather than stacking entries.

- [ ] **Step 9: Add manifest and content-script lifecycle wiring**

Load `content/deep-comments.js` before `content/content-script.js`. Create one controller from the existing script and call `setMode(preferences.deepThreadMode)` from `applyPreferences`, including storage events, runtime messages, and the visible-page refresh fallback.

- [ ] **Step 10: Verify Task 2 GREEN**

Run:

```bash
node --test tests/deep-comments.test.js tests/content-script.test.js
```

Expected: all focused tests pass.

### Task 3: Automatic Local Scope and Native HN Navigation

**Files:**

- Modify: `extension/content/deep-comments.js`
- Modify: `extension/content/content.css`
- Modify: `tests/deep-comments.test.js`
- Modify: `tests/css-rules.test.js`

**Interfaces:**

- Consumes: comment records, subtree boundaries, `indentForDepth`, and the single guide from Task 2.
- Produces: stable automatic scope rooted at the depth-four ancestor of the first visible deeper comment.
- Produces: capture-phase target containment handling for original same-page HN fragment links.

- [ ] **Step 1: Write failing automatic-scope tests**

Use literal row rectangles to assert no activation for shallow rows, activation after a depth-four root scrolls above the reading edge, stability while the first visible row remains in that subtree, release at its end, no comment masking, and no activation in `on-demand` or `indentation-only` modes.

- [ ] **Step 2: Run automatic tests and verify RED**

Run `node --test tests/deep-comments.test.js` and expect automatic-state failures.

- [ ] **Step 3: Implement scheduled automatic scope**

Use one passive scroll listener and one `requestAnimationFrame` callback. Skip HN-collapsed rows by rendered geometry. Select a depth-four ancestor, keep it stable until its contiguous subtree ends, apply relative indentation, and preserve the first visible row's viewport offset with `scrollBy` when applying or clearing the rebase.

- [ ] **Step 4: Render the automatic guide from existing links**

Render `… 4 levels above` and copy exact `href`/class values from the local root's existing `root` and `parent` anchors. Do not synthesize target IDs.

- [ ] **Step 5: Verify automatic tests GREEN**

Run the focused test and expect all automatic cases to pass.

- [ ] **Step 6: Write failing navigation and collapse coexistence tests**

Assert that an original same-document hash target inside focus retains focus; an outside target removes the focus mask before HN receives the click and pops the focus history entry without restoring the old viewport; external-page/reply links are not intercepted; and collapsed inline visibility remains untouched across focus exit.

- [ ] **Step 7: Run navigation tests and verify RED**

Run the focused test and expect cross-scope navigation failures.

- [ ] **Step 8: Implement target-preserving coordination**

Use a capture listener only to inspect the existing anchor. Never change its `href` or prevent HN's click. If its same-page hash target lies outside the focused record range, remove HN Refined scope synchronously, suppress anchor restoration, and pop the single focus history entry; otherwise leave focus intact.

- [ ] **Step 9: Add restrained presentation CSS**

Inside the mobile query, style the guide and `focus`/`all` links with existing theme tokens and HN metadata sizing. Mask only `[data-hnr-focus-excluded]`; override recognized spacer width only on `[data-hnr-scope-row]`; use sticky positioning, safe-area-aware offset, target scroll margin, and a reduced-motion override. Add no branch lines, cards, radius-heavy surfaces, shadows, icons, or badges.

- [ ] **Step 10: Verify Task 3 GREEN**

Run:

```bash
node --test tests/deep-comments.test.js tests/css-rules.test.js tests/content-script.test.js
```

Expected: all scope, navigation, and integration tests pass.

### Task 4: Project State, Packaging, and Safari Acceptance

**Files:**

- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Modify: `docs/privacy.md`
- Modify: `docs/app-store-checklist.md`
- Modify: `docs/release-readiness.md`
- Modify: `tests/docs-handoff.test.js`
- Synchronize: `HNRefined/Shared (Extension)/Resources/`

**Interfaces:**

- Consumes: completed feature behavior and `deepThreadMode` storage contract.
- Produces: current release-blocking status, maintenance guardrails, privacy disclosure, review checklist, and packaged canonical resources.

- [ ] **Step 1: Write failing behavior-level documentation guard tests**

Require current status and development guidance to preserve: three deep-thread modes; target-preserving inside/outside focus navigation; separate HN collapse and scope layers; vanilla Safari/WebKit implementation; and release pause until both HN-alignment corrections are completed.

- [ ] **Step 2: Run documentation tests and verify RED**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: failures because operational documents do not yet mention the feature.

- [ ] **Step 3: Update operational and release documents**

Set project status date to 2026-07-29, record the implemented behavior and guarded regressions, disclose the new local presentation preference and ephemeral page state, add iPhone acceptance steps, and state that release preparation remains paused until the two pre-release HN-alignment findings are corrected.

- [ ] **Step 4: Verify documentation tests GREEN**

Run the Task 4 focused test and expect it to pass.

- [ ] **Step 5: Format and run the complete local gate**

Run:

```bash
make format && make check
```

Expected: zero lint errors and all tests pass.

- [ ] **Step 6: Build and synchronize the iOS Safari extension**

Run:

```bash
make safari-build-ios
```

Expected: Xcode build exits 0 and canonical `extension/` resources are synchronized into the tracked shared Xcode resource directory.

- [ ] **Step 7: Refresh the installed Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: signed local macOS extension is refreshed and doctor reports the installed package sane.

- [ ] **Step 8: Run iPhone simulator acceptance**

On the existing iPhone 17 Pro / iOS 26.3 simulator, verify the real deep chain at `https://news.ycombinator.com/item?id=49096188`: shallow comments remain visually native; depth four through six no longer flatten; automatic scope appears only after its root scrolls away; explicit focus and `all` work; `[–]`, `[n more]`, `root`, `parent`, `prev`, and `next` preserve their targets; inside-target navigation retains focus; outside-target navigation exits it; Safari Back restores the pre-focus anchor; and all three settings take effect on the open page without reload.

- [ ] **Step 9: Review the final diff and status**

Run:

```bash
git diff --check
git status --short
```

Confirm only the feature, tests, synchronized resources, plan/spec, and required status documents changed. Do not claim release readiness: the second HN-alignment item remains before publication work resumes.

# Popup System-Native Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the shared Safari toolbar popup one restrained system-native visual language across macOS, iPhone, and iPad without changing preference behavior.

**Architecture:** Keep the existing popup markup, native form controls, preference IDs, and JavaScript data flow. Add Safari's native switch attribute in HTML, express the approved visual hierarchy entirely in popup CSS, and lock the platform and accessibility contract with focused static tests and handoff documentation.

**Tech Stack:** HTML, CSS system colors and media queries, vanilla JavaScript, Node.js built-in test runner, Safari WebExtension packaging, Makefile validation and Safari install workflows.

## Global Constraints

- Keep `color-scheme: light dark`; popup appearance follows Safari and the operating system, not the selected Hacker News theme.
- Use the system accent color only for selected or on states; do not introduce HN orange, fixed blue, or another brand accent.
- Keep the existing theme values, story-link preference ID and storage key, settings navigation helper, and current-window Hacker News tab notification flow unchanged.
- Use Safari's native `<input type="checkbox" switch>` and retain checkbox fallback behavior; do not create a custom switch.
- Keep the popup's current minimum width and three equal theme segments.
- Fine-pointer controls remain compact; coarse-pointer activation targets are at least 44 px high on iPhone and iPad.
- Preserve keyboard focus, Increase Contrast compatibility, Private Browsing storage warning behavior, and the Safari popup refresh regression guards.
- Do not modify the options page, shared preference modules, content scripts, or Hacker News content CSS unless a focused regression test proves it necessary.
- Preserve the user's existing uncommitted `docs/project-status.md` changes and do not stage or commit them.

---

### Task 1: Lock And Implement The Popup Visual Contract

**Files:**

- Modify: `tests/popup.test.js:5-34`
- Modify: `extension/popup/popup.html:34-44`
- Modify: `extension/popup/popup.css:14-155`

**Interfaces:**

- Consumes: `#openStoryLinksInNewTabs`, `#open-settings`, radio inputs named `theme`, and the existing `popup.js` event listeners.
- Produces: the native Safari `switch` attribute, `.settings-chevron`, system-accent selected segments, neutral full-width settings navigation, and coarse-pointer minimum target rules.

- [ ] **Step 1: Write the failing popup structure and styling test**

Add the popup stylesheet fixture beside the existing HTML fixture:

```js
const popupHtml = fs.readFileSync("extension/popup/popup.html", "utf8");
const popupCss = fs.readFileSync("extension/popup/popup.css", "utf8");
const optionsHtml = fs.readFileSync("extension/options/options.html", "utf8");
```

Add this focused test after `popup exposes only quick settings and full settings entry`:

```js
test("popup uses native system controls and adaptive interaction styling", () => {
  assert.match(popupHtml, /<input id="openStoryLinksInNewTabs" type="checkbox" switch\s*\/>/);
  assert.match(popupHtml, /class="settings-chevron" aria-hidden="true">›<\/span>/);

  assert.match(
    popupCss,
    /\.segmented-control input:checked \+ span\s*{[^}]*color: AccentColorText;[^}]*background: AccentColor;/s,
  );
  assert.match(popupCss, /\.single-option input\s*{[^}]*accent-color: AccentColor;/s);
  assert.doesNotMatch(popupCss, /LinkText/);
  assert.match(popupCss, /\.settings-link\s*{[^}]*color: CanvasText;/s);
  assert.match(popupCss, /@media \(hover: hover\)/);
  assert.match(popupCss, /@media \(any-pointer: coarse\)/);
  assert.match(popupCss, /min-height: 44px/);
});
```

- [ ] **Step 2: Run the focused test and confirm the new contract fails**

Run:

```bash
node --test tests/popup.test.js
```

Expected: FAIL in `popup uses native system controls and adaptive interaction styling` because the input lacks `switch`, the chevron is absent, selected segments still use `CanvasText`, and `All Settings` still uses `LinkText`.

- [ ] **Step 3: Add native switch and neutral settings navigation markup**

Replace the story-link input and footer button in `extension/popup/popup.html` with:

```html
<input id="openStoryLinksInNewTabs" type="checkbox" switch />
```

```html
<footer>
  <button id="open-settings" class="settings-link" type="button">
    <span>All Settings</span>
    <span class="settings-chevron" aria-hidden="true">›</span>
  </button>
</footer>
```

Keep every existing ID and input type unchanged so `popup.js` and `tests/popup-behavior.test.js` need no behavioral changes.

- [ ] **Step 4: Implement the approved spacing, color, and interaction rules**

In `extension/popup/popup.css`, replace the uniform main gap with explicit hierarchy:

```css
main {
  display: grid;
  gap: 0;
  padding: 14px;
}

header {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}

fieldset + fieldset {
  margin-top: 16px;
}
```

Make segment geometry and the selected system-accent state explicit:

```css
.segmented-control span {
  display: flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  text-align: center;
  font-size: 13px;
  line-height: 1.2;
}

.segmented-control input:checked + span {
  color: AccentColorText;
  background: AccentColor;
}

.segmented-control input:not(:checked):active + span {
  background: color-mix(in srgb, CanvasText 10%, Canvas);
}
```

Preserve the native switch by removing its fixed width and height:

```css
.single-option input {
  flex: 0 0 auto;
  margin: 0;
  accent-color: AccentColor;
}
```

Replace the footer and settings-link rules with:

```css
footer {
  display: flex;
  margin-top: 14px;
  border-top: 1px solid color-mix(in srgb, CanvasText 16%, transparent);
}

button {
  font: inherit;
}

.settings-link {
  display: flex;
  width: 100%;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  border: 0;
  border-radius: 6px;
  color: CanvasText;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
}

.settings-chevron {
  color: color-mix(in srgb, CanvasText 58%, transparent);
  font-size: 18px;
  font-weight: 400;
  line-height: 1;
}

.settings-link:active {
  background: color-mix(in srgb, CanvasText 10%, Canvas);
}

.settings-link:focus-visible {
  outline: 2px solid Highlight;
  outline-offset: 2px;
}
```

Add pointer-specific states after the base focus rules:

```css
@media (hover: hover) {
  .segmented-control input:not(:checked):hover + span,
  .settings-link:hover {
    background: color-mix(in srgb, CanvasText 6%, Canvas);
  }
}

@media (any-pointer: coarse) {
  .segmented-control span,
  .single-option,
  .settings-link {
    min-height: 44px;
  }
}
```

- [ ] **Step 5: Run focused popup tests and confirm behavior is unchanged**

Run:

```bash
node --test tests/popup.test.js tests/popup-behavior.test.js
```

Expected: both test files PASS, including preference writes, current-window Hacker News tab notifications, and full-settings navigation.

- [ ] **Step 6: Format and review the focused diff**

Run:

```bash
make format
git diff --check
git diff -- extension/popup/popup.html extension/popup/popup.css tests/popup.test.js
```

Expected: formatting succeeds, `git diff --check` prints nothing, and the diff contains no JavaScript behavior changes.

- [ ] **Step 7: Commit the popup implementation**

```bash
git add extension/popup/popup.html extension/popup/popup.css tests/popup.test.js
git commit -m "feat: polish popup system controls"
```

### Task 2: Preserve The Popup Design In Handoff Documentation

**Files:**

- Modify: `tests/docs-handoff.test.js:46-60`
- Modify: `docs/development.md:179-192`
- Review only: `AGENTS.md`
- Review only: `docs/project-status.md`
- Review only: `docs/privacy.md`
- Review only: `docs/app-store-checklist.md`

**Interfaces:**

- Consumes: the shared popup behavior and platform rules implemented in Task 1.
- Produces: a handoff guard documenting native switch semantics, dynamic system colors, coarse-pointer targets, and macOS/iPhone/iPad acceptance scope.

- [ ] **Step 1: Add a failing documentation contract test**

Add after `docs preserve the Safari popup refresh regression guard` in `tests/docs-handoff.test.js`:

```js
test("development docs preserve the system-native popup contract", () => {
  const development = read("docs/development.md");

  assert.match(development, /native `switch`/);
  assert.match(development, /system accent color/);
  assert.match(development, /44 px/);
  assert.match(development, /macOS, iPhone, and iPad/);
  assert.match(development, /light and dark appearance/);
});
```

- [ ] **Step 2: Run the focused documentation test and confirm it fails**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: FAIL in `development docs preserve the system-native popup contract` because the current handoff does not describe the approved visual and platform rules.

- [ ] **Step 3: Document the system-native popup contract**

Add this paragraph at the end of `Safari Popup Preference Refresh` in `docs/development.md`:

```markdown
The shared macOS, iPhone, and iPad popup uses dynamic system colors and Safari's
native `switch` control. Keep the selected theme segment and enabled switch on
the system accent color, while `All Settings` remains a neutral navigation row.
Fine-pointer layouts stay compact; coarse-pointer theme segments, the switch
row, and the settings entry keep a minimum 44 px activation height. Check light
and dark appearance, system accent colors, keyboard focus on macOS, and touch
behavior on iPhone and iPad after popup style changes.
```

Review `AGENTS.md`, `docs/project-status.md`, `docs/privacy.md`, and `docs/app-store-checklist.md`. Do not edit them unless the implementation changes their existing behavior, privacy, release, or workflow claims. In particular, leave the user's unrelated uncommitted `docs/project-status.md` changes untouched.

- [ ] **Step 4: Run the documentation and popup tests**

Run:

```bash
node --test tests/docs-handoff.test.js tests/popup.test.js tests/popup-behavior.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Format and commit the handoff guard**

Run:

```bash
make format
git diff --check
git add docs/development.md tests/docs-handoff.test.js
git commit -m "docs: preserve popup visual contract"
```

Expected: only `docs/development.md` and `tests/docs-handoff.test.js` are committed; `docs/project-status.md` remains unstaged and unchanged by this task.

### Task 3: Complete Automated, macOS, And iOS Build Verification

**Files:**

- Verify: `extension/popup/popup.html`
- Verify: `extension/popup/popup.css`
- Verify: `tests/popup.test.js`
- Verify: `tests/popup-behavior.test.js`
- Verify: `tests/docs-handoff.test.js`
- Verify: installed macOS Safari extension package
- Verify: iOS/iPadOS simulator build products

**Interfaces:**

- Consumes: the committed popup implementation and handoff guard from Tasks 1 and 2.
- Produces: automated validation, a refreshed installed macOS extension, package sanity evidence, and an iOS/iPadOS build result suitable for simulator acceptance.

- [ ] **Step 1: Run the full repository quality gate**

Run:

```bash
make format
make check
```

Expected: formatters make no unexpected changes and all lint, theme, manifest, no-remote, and Node test checks PASS.

- [ ] **Step 2: Refresh and verify the installed macOS Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: the signed or locally permitted app installs from repo-local `.build/xcode-derived-data`, Safari registers only the intended HN Refined extension, and the doctor reports a sane installed package.

- [ ] **Step 3: Inspect the real macOS popup**

Verify in Safari:

- Light and dark system appearance both use adaptive popup surfaces and readable text.
- Changing the macOS accent color updates the selected theme segment and enabled switch.
- `All Settings` is neutral, full-width, leading-aligned, and opens the full settings tab.
- Hover and active feedback are subtle; keyboard focus remains visible.
- Theme and story-link changes still update current-window Hacker News tabs without a manual refresh.

Expected: all checks match the approved design with no horizontal overflow or stale preference behavior.

- [ ] **Step 4: Build the shared iOS/iPadOS extension**

Run:

```bash
make safari-build-ios
```

Expected: the generic iOS Simulator build succeeds using the repo-local derived-data workflow and packages the updated shared popup resources.

- [ ] **Step 5: Complete iPhone and iPad acceptance or record the remaining device check**

On an available iPhone and iPad simulator, install the rebuilt host app, re-enable the extension if the install reset it, and set `news.ycombinator.com` permission to `Allow`. Verify portrait and landscape popup presentations in light and dark appearance, native switch rendering, minimum 44 px touch targets, no horizontal overflow, preference persistence, immediate Hacker News refresh, and Private Browsing behavior.

Expected: all simulator checks pass. If interactive simulator access is unavailable, report the exact unperformed visual checks without claiming them complete; the successful build remains valid evidence.

- [ ] **Step 6: Confirm the final worktree contains only the intended residual change**

Run:

```bash
git status --short
git log -3 --oneline
```

Expected: implementation and handoff changes are committed. The only residual change in the original workspace is the user's pre-existing unstaged `docs/project-status.md` modification.

# Options Page System-Native Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the full settings page into the approved continuous system-native row layout while preserving every preference and its immediate-update behavior across macOS, iPhone, and iPad Safari.

**Architecture:** Keep `extension/options/` as the canonical WebExtension source and let the existing Safari build workflow synchronize it into the shared Xcode extension resources. Change only semantic row markup and CSS; the ids consumed by `options.js`, the preference store, and the current-window Hacker News notification path remain untouched.

**Tech Stack:** Safari WebExtension HTML/CSS, Safari native `select` and `switch` controls, Node.js built-in test runner, Biome, Prettier, Makefile/Xcode Safari workflow.

## Global Constraints

- Preserve the existing settings, option values, ids, ordering, section language, storage keys, defaults, normalization, and immediate-save behavior.
- Do not modify `extension/options/options.js` or the shared preference store and notification modules.
- Use native `select` elements and Safari's native `switch` attribute; do not build custom controls or ARIA replicas.
- Retain `color-scheme: light dark`, `Canvas`, `CanvasText`, system-derived dividers, and the user's native system accent color; do not hard-code a blue UI accent.
- Keep a centered single column with a maximum content width of 680 px.
- Use a 42 px minimum row height for fine-pointer layouts and at least 44 px activation height under a coarse pointer.
- Keep Mac and wider iPad rows label-left/control-right; stack the approved long row on narrow layouts and prevent horizontal overflow on every supported mobile width.
- Preserve native keyboard order and visible `:focus-visible` behavior.
- Keep the existing storage-status element between the header and first section; do not replace it with a toast.
- Treat `extension/options/` as canonical and synchronize final resources through the documented Makefile workflow.
- Preserve the user's unrelated working-tree changes, especially `docs/project-status.md`.

## File Structure

- `extension/options/options.html` — canonical semantic settings-row markup and the native link switch.
- `extension/options/options.css` — continuous row layout, system-derived visual hierarchy, responsive stacking, focus, and coarse-pointer sizing.
- `tests/popup.test.js` — static product contract for options markup, CSS, native controls, and unchanged preference ids.
- `HNRefined/Shared (Extension)/Resources/options/options.html` — build-synchronized Xcode package copy; do not edit by hand.
- `HNRefined/Shared (Extension)/Resources/options/options.css` — build-synchronized Xcode package copy; do not edit by hand.
- `docs/development.md` — maintained shared popup/options visual and acceptance contract.
- `tests/docs-handoff.test.js` — regression guard for the documented options-page contract.

---

### Task 1: Implement the continuous native settings rows

**Files:**

- Modify: `tests/popup.test.js`
- Modify: `extension/options/options.html`
- Modify: `extension/options/options.css`
- Modify through build sync: `HNRefined/Shared (Extension)/Resources/options/options.html`
- Modify through build sync: `HNRefined/Shared (Extension)/Resources/options/options.css`

**Interfaces:**

- Consumes: Existing field ids `theme`, `fontPreset`, `desktopDensity`, `readingWidth`, and `openStoryLinksInNewTabs`; `options.js` queries these ids and listens for native `change` events.
- Produces: `.setting-row`, `.setting-label`, `.setting-row-switch`, and `.setting-row-stack-narrow` markup/CSS contracts; the link input remains `type="checkbox"` and gains the boolean `switch` attribute.

- [ ] **Step 1: Write the failing options-page visual contract**

Add the canonical CSS fixture beside the existing HTML fixture in `tests/popup.test.js`:

```js
const optionsHtml = fs.readFileSync("extension/options/options.html", "utf8");
const optionsCss = fs.readFileSync("extension/options/options.css", "utf8");
```

Add this test after `full settings page groups only meaningful user-facing controls`:

```js
test("full settings page uses continuous native system rows", () => {
  assert.equal(optionsHtml.match(/class="setting-row(?: [^"]+)?"/g)?.length, 5);
  assert.match(
    optionsHtml,
    /<label class="setting-row">\s*<span class="setting-label">Theme<\/span>\s*<select id="theme">/s,
  );
  assert.match(
    optionsHtml,
    /<label class="setting-row setting-row-stack-narrow">\s*<span class="setting-label">Reading Density<\/span>\s*<select id="desktopDensity">/s,
  );
  assert.match(
    optionsHtml,
    /<label class="setting-row setting-row-switch">\s*<span class="setting-label">Open external story links in new tabs<\/span>\s*<input id="openStoryLinksInNewTabs" type="checkbox" switch\s*\/>/s,
  );

  assert.match(
    optionsCss,
    /\.setting-row\s*{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(128px, 190px\);[^}]*min-height: 42px;/s,
  );
  assert.match(
    optionsCss,
    /\.setting-row-switch\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/s,
  );
  assert.match(optionsCss, /@media \(max-width: 520px\)/);
  assert.match(optionsCss, /\.setting-row-stack-narrow\s*{[^}]*grid-template-columns: 1fr;/s);
  assert.match(optionsCss, /@media \(any-pointer: coarse\)/);
  assert.match(optionsCss, /min-height: 44px/);
  assert.match(optionsCss, /:focus-visible/);
  assert.doesNotMatch(optionsCss, /#(?:007aff|0a84ff|006cff)/i);
});
```

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
node --test tests/popup.test.js
```

Expected: FAIL in `full settings page uses continuous native system rows` because `optionsCss` or `.setting-row` does not yet satisfy the new contract. Existing tests remain green.

- [ ] **Step 3: Replace vertical field markup with semantic setting rows**

In `extension/options/options.html`, keep the header, status element, sections, headings, descriptions, ids, and options unchanged. Replace only each section's current labels with these row forms:

```html
<label class="setting-row">
  <span class="setting-label">Theme</span>
  <select id="theme">
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</label>

<label class="setting-row">
  <span class="setting-label">Font</span>
  <select id="fontPreset">
    <option value="hn-classic">HN Classic</option>
    <option value="system-sans">System Sans</option>
    <option value="serif-reading">Serif</option>
    <option value="mono-ish">Mono-ish</option>
  </select>
</label>
```

```html
<label class="setting-row setting-row-stack-narrow">
  <span class="setting-label">Reading Density</span>
  <select id="desktopDensity">
    <option value="comfortable">Comfortable</option>
    <option value="classic-ish">Classic</option>
  </select>
</label>

<label class="setting-row">
  <span class="setting-label">Reading Width</span>
  <select id="readingWidth">
    <option value="comfortable">Focused</option>
    <option value="wide">Wide</option>
  </select>
</label>
```

```html
<label class="setting-row setting-row-switch">
  <span class="setting-label">Open external story links in new tabs</span>
  <input id="openStoryLinksInNewTabs" type="checkbox" switch />
</label>
```

Do not reorder the input before its text and do not change `options.js`.

- [ ] **Step 4: Replace the generic form CSS with the approved continuous-row CSS**

In `extension/options/options.css`, preserve the current root, body, heading, and system-color foundations. Replace the main/section/label/select/checkbox layout rules and extend focus/responsive rules with this exact structure:

```css
main {
  display: grid;
  width: min(680px, calc(100% - 32px));
  gap: 0;
  margin: 0 auto;
  padding: 24px 0 32px;
}

header {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
}

section {
  display: grid;
  gap: 0;
  padding-block: 16px;
  border-top: 1px solid color-mix(in srgb, CanvasText 14%, transparent);
}

.section-heading {
  display: grid;
  gap: 3px;
  margin-bottom: 8px;
}

.setting-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(128px, 190px);
  min-height: 42px;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid color-mix(in srgb, CanvasText 9%, transparent);
  font-weight: 550;
}

.setting-row:last-child {
  border-bottom: 0;
}

.setting-label {
  min-width: 0;
}

.setting-row select {
  width: 100%;
  min-height: 32px;
  font: inherit;
}

.setting-row-switch {
  grid-template-columns: minmax(0, 1fr) auto;
}

.setting-row-switch input {
  margin: 0;
  accent-color: AccentColor;
}

select:focus-visible,
input:focus-visible {
  outline: 2px solid Highlight;
  outline-offset: 2px;
}
```

Keep the existing `.status` element system-derived and add only a subtle background:

```css
.status {
  margin: 0 0 16px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, CanvasText 4%, Canvas);
}
```

Replace the current narrow breakpoint and add the coarse-pointer contract:

```css
@media (max-width: 520px) {
  main {
    width: min(100% - 24px, 680px);
    padding-block: 18px 24px;
  }

  .setting-row-stack-narrow {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-block: 8px;
  }
}

@media (max-width: 360px) {
  .setting-row:not(.setting-row-switch) {
    grid-template-columns: 1fr;
    gap: 6px;
    padding-block: 8px;
  }
}

@media (any-pointer: coarse) {
  .setting-row,
  .setting-row select {
    min-height: 44px;
  }
}
```

Delete the generic `label`, `select`, and `.checkbox` layout rules after their responsibilities move into `.setting-row`.

- [ ] **Step 5: Run the focused tests and inspect the canonical diff**

Run:

```bash
node --test tests/popup.test.js
git diff --check
git diff -- extension/options/options.html extension/options/options.css tests/popup.test.js
```

Expected: all `tests/popup.test.js` tests PASS; `git diff --check` emits no output; the diff changes only row markup and visual CSS while keeping all field ids and option values.

- [ ] **Step 6: Synchronize the canonical options resources into Xcode**

Run:

```bash
make safari-build
cmp -s extension/options/options.html "HNRefined/Shared (Extension)/Resources/options/options.html"
cmp -s extension/options/options.css "HNRefined/Shared (Extension)/Resources/options/options.css"
```

Expected: the macOS Debug build exits 0; both `cmp` commands exit 0; Git shows the two synchronized Xcode resource copies alongside the canonical source files.

- [ ] **Step 7: Re-run the focused contract after resource synchronization**

Run:

```bash
node --test tests/popup.test.js
git diff --check
```

Expected: all focused tests PASS and the synchronized resource diff is whitespace-clean.

- [ ] **Step 8: Commit the product slice**

```bash
git add tests/popup.test.js extension/options/options.html extension/options/options.css \
  "HNRefined/Shared (Extension)/Resources/options/options.html" \
  "HNRefined/Shared (Extension)/Resources/options/options.css"
git commit -m "feat: polish full settings system controls"
```

Expected: one commit containing the source UI, focused contract, and exact Xcode package mirrors; `docs/project-status.md` remains unstaged.

---

### Task 2: Preserve the shared popup/options visual contract in documentation

**Files:**

- Modify: `tests/docs-handoff.test.js`
- Modify: `docs/development.md`

**Interfaces:**

- Consumes: The approved popup contract already documented under `Safari Popup Preference Refresh`.
- Produces: A durable `development docs preserve the system-native settings surfaces contract` test covering the continuous options rows, native controls, system colors, responsive behavior, and acceptance matrix.

- [ ] **Step 1: Write the failing documentation contract**

In `tests/docs-handoff.test.js`, extend the existing popup documentation coverage with this independent test:

```js
test("development docs preserve the system-native settings surfaces contract", () => {
  assert.match(development, /full settings page/i);
  assert.match(development, /continuous setting rows/i);
  assert.match(development, /native `select` controls/i);
  assert.match(development, /native `switch` control/i);
  assert.match(development, /maximum content width of 680 px/i);
  assert.match(development, /minimum 44 px activation height/i);
  assert.match(development, /Mac.*iPhone.*iPad/s);
});
```

- [ ] **Step 2: Run the documentation test and verify the red state**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: FAIL in `development docs preserve the system-native settings surfaces contract` because the existing development guide documents the popup but not the new options-row contract.

- [ ] **Step 3: Document the approved shared settings language**

In `docs/development.md`, immediately after the existing popup paragraph under `Safari Popup Preference Refresh`, add:

```markdown
The full settings page shares the same restrained system-native language. Keep
its existing sections and preference behavior, using continuous setting rows,
native `select` controls, and Safari's native `switch` control for external
story-link behavior. Mac and wider iPad layouts keep labels left and controls
right within a maximum content width of 680 px. Narrow layouts stack only the
approved long row unless the viewport becomes too narrow for any select row;
coarse-pointer rows and controls keep a minimum 44 px activation height.

After options-page visual changes, check system light and dark appearance,
accent colors, and keyboard focus on Mac; check portrait, landscape, touch
targets, native pickers, native switches, and horizontal overflow on iPhone and
iPad. Confirm that options changes still refresh open Hacker News tabs without a
manual reload.
```

Do not change privacy or release documents because this visual refinement does not alter data collection, permissions, preference scope, or store behavior.

- [ ] **Step 4: Run the focused documentation test**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: all documentation tests PASS.

- [ ] **Step 5: Format and inspect the documentation slice**

Run:

```bash
make format
git diff --check
git diff -- docs/development.md tests/docs-handoff.test.js
```

Expected: the repository formatters complete successfully; the diff contains
only the approved contract and its test, with no unrelated handoff or
project-status text changes.

- [ ] **Step 6: Commit the documentation slice**

```bash
git add docs/development.md tests/docs-handoff.test.js
git commit -m "docs: preserve full settings visual contract"
```

Expected: one documentation/test commit; `docs/project-status.md` remains unstaged.

---

### Task 3: Verify the finished options page across packaging and Safari surfaces

**Files:**

- Verify only: all files committed in Tasks 1 and 2
- Verify generated product: `.build/xcode-derived-data/Build/Products/Debug/HNRefined.app`
- Verify generated product: `.build/xcode-derived-data/Build/Products/Debug-iphonesimulator/HNRefined.app`

**Interfaces:**

- Consumes: The committed canonical options source, synchronized Xcode resources, existing Makefile workflow, and installed Safari extension registration.
- Produces: Fresh automated, macOS Safari, and iOS/iPadOS evidence; no additional code or documentation changes unless verification discovers a real defect.

- [ ] **Step 1: Run the complete repository quality gate**

Run:

```bash
make format
make check
```

Expected: formatters report no unexpected changes; every lint, manifest, remote-resource, theme, and Node test passes with 0 failures. If `docs/project-status.md` was already modified by the user, compare its diff before and after formatting and do not stage it.

- [ ] **Step 2: Refresh and diagnose the installed macOS Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: the signed app installs at `~/Applications/HNRefined.app`; `net.vetcafe.hnrefined.extension` is registered from that stable app; doctor confirms manifest, popup, options, content, and icon resources.

- [ ] **Step 3: Confirm the installed macOS options resources are final**

Run:

```bash
HNREFINED_INSTALLED_APP="$HOME/Applications/HNRefined.app"
cmp -s extension/options/options.html "$HNREFINED_INSTALLED_APP/Contents/PlugIns/HNRefined Extension.appex/Contents/Resources/options/options.html"
cmp -s extension/options/options.css "$HNREFINED_INSTALLED_APP/Contents/PlugIns/HNRefined Extension.appex/Contents/Resources/options/options.css"
```

Expected: both commands exit 0. If Xcode places WebExtension resources under a different packaged resource root, locate the two files inside the installed `.appex` and compare those exact paths instead of registering another build.

- [ ] **Step 4: Perform macOS Safari visual and interaction acceptance**

Open the installed extension's full settings page from the toolbar popup and verify:

```text
- System light: continuous rows, moderate select width, neutral dividers, native switch.
- System dark: readable text/status/dividers with no light-only hard-coded surfaces.
- Non-default system accent: native active switch, picker, and focus use the system accent.
- Keyboard: Tab reaches every select and switch in DOM order; focus-visible is clear.
- Behavior: changing Theme, Font, Density, Width, and link switch persists immediately.
- Refresh: an open Hacker News tab reflects each change without a manual reload.
```

Expected: every item passes; the options page does not show a custom blue accent, full-width desktop selects, or horizontal overflow.

- [ ] **Step 5: Build the final iOS/iPadOS extension package**

Run:

```bash
make safari-build-ios
cmp -s extension/options/options.html ".build/xcode-derived-data/Build/Products/Debug-iphonesimulator/HNRefined.app/PlugIns/HNRefined Extension.appex/options/options.html"
cmp -s extension/options/options.css ".build/xcode-derived-data/Build/Products/Debug-iphonesimulator/HNRefined.app/PlugIns/HNRefined Extension.appex/options/options.css"
```

Expected: the Debug iOS Simulator app and extension build successfully and both packaged options files match the canonical source. If the generated resource root differs, locate the files inside the built `.appex` and compare those paths.

- [ ] **Step 6: Perform iPhone and iPad Safari acceptance**

On a booted iPhone and iPad simulator with the extension and site permission enabled, verify:

```text
- iPhone portrait and landscape: 12–16 px gutters, no overflow, 44 px targets.
- iPad portrait and landscape: compact continuous rows at wide widths.
- Narrow iPad split view: Reading Density stacks; other rows remain compact until 360 px.
- Native select pickers and link switch respond to ordinary touch.
- System light and dark appearances remain readable.
- Options changes refresh an open Hacker News page without manual reload.
```

Expected: every available simulator check passes. If no simulator is booted, record the exact unexecuted checklist instead of claiming interactive acceptance.

- [ ] **Step 7: Verify clean feature scope and hand off**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: only the user's pre-existing `docs/project-status.md` modification remains; implementation consists of the focused product commit and documentation-contract commit. Do not stage or commit the user's unrelated file.

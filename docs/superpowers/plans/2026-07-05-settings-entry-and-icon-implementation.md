# Settings Entry And Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the full Safari toolbar popup with a small theme quick-switch panel, move complete preferences into a tab settings page, and generate the approved C4 HN Refined icon assets.

**Architecture:** Keep preference persistence and active-tab refresh in the existing shared modules. Add a dedicated popup UI that only edits `theme` and opens the existing options page, then reshape the options page as the full settings surface. Generate icon assets from a committed SVG source through a local script so app and toolbar icons are reproducible.

**Tech Stack:** Safari WebExtension manifest v3, vanilla ES modules, existing `browser.storage.local` preference store, Node built-in `node:test`, SVG source assets, ImageMagick `magick` for PNG generation, Xcode asset catalog.

---

## File Structure

Modify or create these files:

- Create `extension/popup/popup.html`: minimal toolbar popup markup.
- Create `extension/popup/popup.css`: small native-feeling popup styling.
- Create `extension/popup/popup.js`: read/write only `theme`, notify active Hacker News tab, open full settings page.
- Create `extension/shared/extension-navigation.js`: tiny helper for opening the options page with Safari-compatible fallbacks.
- Create `tests/extension-navigation.test.js`: tests for preferred `tabs.create` behavior and `openOptionsPage` fallback behavior.
- Modify `extension/manifest.json`: point `action.default_popup` to `popup/popup.html`, make `options_ui.open_in_tab` true, add generated extension icons.
- Modify `extension/options/options.html`: keep complete settings but group them by purpose.
- Modify `extension/options/options.css`: tab-page settings layout rather than cramped popup layout.
- Modify `extension/options/options.js`: reuse current behavior with grouped markup; no new feature scope.
- Create `assets/icon/hn-refined-icon.svg`: source icon for the approved original-C geometry with C4 warm ink gray badge.
- Create `scripts/generate-icons.js`: render SVG to required PNG sizes using ImageMagick.
- Modify `package.json`: add `build:icons` and include it in `check` only if local ImageMagick behavior is stable; otherwise keep it as an explicit asset-generation command.
- Modify `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/Contents.json`: reference generated macOS app icon PNGs.
- Add generated PNGs under `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/`.
- Add generated WebExtension PNGs under `extension/icons/`.

Do not modify Hacker News content CSS as part of this plan unless a visual check uncovers a regression caused by the popup/options changes.

## Task 1: Add Settings Page Navigation Helper

**Files:**

- Create: `extension/shared/extension-navigation.js`
- Create: `tests/extension-navigation.test.js`

- [ ] **Step 1: Write failing tests for opening the full settings page**

Create `tests/extension-navigation.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { openFullSettingsPage } from "../extension/shared/extension-navigation.js";

function restoreBrowserApi(originalBrowser, originalChrome) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
}

test("opens options.html in a new tab when tab APIs are available", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const calls = [];

  globalThis.browser = {
    runtime: {
      getURL(path) {
        assert.equal(path, "options/options.html");
        return `safari-web-extension://example/${path}`;
      },
      async openOptionsPage() {
        calls.push("openOptionsPage");
      },
    },
    tabs: {
      async create(tab) {
        calls.push(["tabs.create", tab]);
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), true);
    assert.deepEqual(calls, [
      ["tabs.create", { url: "safari-web-extension://example/options/options.html" }],
    ]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("falls back to runtime.openOptionsPage when tab APIs are unavailable", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const calls = [];

  globalThis.browser = {
    runtime: {
      async openOptionsPage() {
        calls.push("openOptionsPage");
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), true);
    assert.deepEqual(calls, ["openOptionsPage"]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("reports false when no settings navigation API is available", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = {};
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), false);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/extension-navigation.test.js`

Expected: FAIL with `Cannot find module ... extension-navigation.js`.

- [ ] **Step 3: Implement the navigation helper**

Create `extension/shared/extension-navigation.js`:

```js
function browserApi() {
  return globalThis.browser || globalThis.chrome;
}

function isThenable(value) {
  return value && typeof value.then === "function";
}

function callMaybePromise(fn) {
  const result = fn();
  return isThenable(result) ? result : Promise.resolve(result);
}

export async function openFullSettingsPage() {
  const api = browserApi();

  try {
    if (api?.tabs?.create && api?.runtime?.getURL) {
      await callMaybePromise(() =>
        api.tabs.create({ url: api.runtime.getURL("options/options.html") }),
      );
      return true;
    }

    if (api?.runtime?.openOptionsPage) {
      await callMaybePromise(() => api.runtime.openOptionsPage());
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/extension-navigation.test.js`

Expected: PASS, 3 tests pass.

Run: `npm test`

Expected: PASS, existing tests plus the 3 new navigation tests pass.

- [ ] **Step 5: Commit**

```bash
git add extension/shared/extension-navigation.js tests/extension-navigation.test.js
git commit -m "test: add settings page navigation helper"
```

## Task 2: Split Toolbar Popup From Full Settings

**Files:**

- Create: `extension/popup/popup.html`
- Create: `extension/popup/popup.css`
- Create: `extension/popup/popup.js`
- Modify: `extension/manifest.json`
- Modify: `tests/preference-messages.test.js` if helper behavior needs coverage adjustment

- [ ] **Step 1: Add the dedicated popup markup**

Create `extension/popup/popup.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HN Refined</title>
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <main>
      <header>
        <strong>HN Refined</strong>
        <span id="page-status" class="status-pill">Ready</span>
      </header>

      <p id="storage-status" class="storage-status" hidden></p>

      <section aria-labelledby="theme-label">
        <div id="theme-label" class="section-label">Theme</div>
        <div class="segmented" role="radiogroup" aria-labelledby="theme-label">
          <label>
            <input type="radio" name="theme" value="system" />
            <span>System</span>
          </label>
          <label>
            <input type="radio" name="theme" value="light" />
            <span>Light</span>
          </label>
          <label>
            <input type="radio" name="theme" value="dark" />
            <span>Dark</span>
          </label>
        </div>
      </section>

      <button id="open-settings" type="button">Open Settings</button>
    </main>

    <script type="module" src="popup.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Add the popup CSS**

Create `extension/popup/popup.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 13px;
}

body {
  min-width: 260px;
  margin: 0;
  color: CanvasText;
  background: Canvas;
}

main {
  display: grid;
  gap: 12px;
  padding: 14px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-pill {
  padding: 2px 7px;
  border-radius: 999px;
  color: color-mix(in srgb, CanvasText 72%, transparent);
  background: color-mix(in srgb, CanvasText 9%, Canvas);
  font-size: 12px;
}

.storage-status {
  margin: 0;
  padding: 8px;
  border-radius: 7px;
  color: color-mix(in srgb, CanvasText 82%, transparent);
  background: color-mix(in srgb, CanvasText 8%, Canvas);
}

.section-label {
  margin-bottom: 6px;
  color: color-mix(in srgb, CanvasText 72%, transparent);
  font-size: 12px;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 2px;
  border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, CanvasText 6%, Canvas);
}

.segmented label {
  display: grid;
}

.segmented input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.segmented span {
  padding: 6px 8px;
  border-radius: 6px;
  text-align: center;
}

.segmented input:checked + span {
  color: Canvas;
  background: CanvasText;
}

button {
  width: 100%;
  min-height: 32px;
  border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
  border-radius: 8px;
  color: CanvasText;
  background: color-mix(in srgb, CanvasText 5%, Canvas);
  font: inherit;
}
```

- [ ] **Step 3: Add the popup behavior**

Create `extension/popup/popup.js`:

```js
import { readPreferences, writePreferences } from "../shared/preference-store.js";
import { notifyActiveTabPreferencesChanged } from "../shared/preference-messages.js";
import { openFullSettingsPage } from "../shared/extension-navigation.js";

const themeFields = Array.from(document.querySelectorAll("input[name='theme']"));
const storageStatus = document.querySelector("#storage-status");
const openSettingsButton = document.querySelector("#open-settings");

function setStatus(persisted) {
  storageStatus.hidden = persisted;
  storageStatus.textContent = persisted
    ? ""
    : "Settings may not be saved in this browsing environment.";
}

function setThemeValue(theme) {
  for (const field of themeFields) {
    field.checked = field.value === theme;
  }
}

function readThemeValue() {
  return themeFields.find((field) => field.checked)?.value || "system";
}

let current = await readPreferences();
setThemeValue(current.preferences.theme);
setStatus(current.persisted);

for (const field of themeFields) {
  field.addEventListener("change", async () => {
    const result = await writePreferences({
      ...current.preferences,
      theme: readThemeValue(),
    });
    current = result;
    setThemeValue(result.preferences.theme);
    setStatus(result.persisted);
    await notifyActiveTabPreferencesChanged(result.preferences);
  });
}

openSettingsButton.addEventListener("click", async () => {
  await openFullSettingsPage();
});
```

- [ ] **Step 4: Update the manifest to use the new popup**

Modify `extension/manifest.json`:

```json
"action": {
  "default_title": "HN Refined",
  "default_popup": "popup/popup.html"
},
"options_ui": {
  "page": "options/options.html",
  "open_in_tab": true
}
```

Do not add new permissions. Keep `permissions` as `["storage", "activeTab"]` and `host_permissions` as `["https://news.ycombinator.com/*"]`.

- [ ] **Step 5: Run checks**

Run: `npm run check`

Expected: PASS. `check:manifest` must still pass with no permission widening.

- [ ] **Step 6: Build and install locally for Safari testing**

Run:

```bash
xcodebuild -quiet -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

Expected: exit 0.

If sandboxing blocks DerivedData writes, rerun with the approved unsandboxed `xcodebuild` prefix.

- [ ] **Step 7: Manual Safari checks**

Use Safari and Computer Use where possible:

- Open `https://news.ycombinator.com/news`.
- Click the HN Refined toolbar icon.
- Confirm the popup is small and contains only status, theme segmented control, and `Open Settings`.
- Switch `System`, `Light`, and `Dark`; active Hacker News tab updates without refresh.
- Click `Open Settings`; full settings opens as a tab.
- Confirm full settings still contains font, desktop density, reading width, mobile layout, and new-tab behavior.
- Check both light and dark Hacker News page visuals after switching theme.

If Computer Use cannot perform a browser UI step reliably, ask the user to do that specific step and report the result before committing.

- [ ] **Step 8: Commit**

```bash
git add extension/manifest.json extension/popup/popup.html extension/popup/popup.css extension/popup/popup.js
git commit -m "feat: add minimal theme popup"
```

## Task 3: Reshape The Full Settings Page

**Files:**

- Modify: `extension/options/options.html`
- Modify: `extension/options/options.css`
- Modify: `extension/options/options.js` only if selectors need small updates

- [ ] **Step 1: Replace settings markup with grouped sections**

Modify the body of `extension/options/options.html` so `main` contains:

```html
<main>
  <header class="page-header">
    <h1>HN Refined Settings</h1>
    <p>Reading preferences for Hacker News.</p>
  </header>

  <p id="storage-status" class="status" hidden></p>

  <section aria-labelledby="appearance-heading">
    <h2 id="appearance-heading">Appearance</h2>
    <label>
      Theme
      <select id="theme">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>

    <label>
      Font
      <select id="fontPreset">
        <option value="system-sans">System Sans</option>
        <option value="hn-classic">HN Classic</option>
        <option value="serif-reading">Serif Reading</option>
        <option value="mono-ish">Mono-ish</option>
      </select>
    </label>
  </section>

  <section aria-labelledby="reading-heading">
    <h2 id="reading-heading">Reading Layout</h2>
    <label>
      Desktop Density
      <select id="desktopDensity">
        <option value="comfortable">Comfortable</option>
        <option value="classic-ish">Classic-ish</option>
      </select>
    </label>

    <label>
      Reading Width
      <select id="readingWidth">
        <option value="comfortable">Comfortable</option>
        <option value="wide">Wide</option>
      </select>
    </label>
  </section>

  <section aria-labelledby="mobile-heading">
    <h2 id="mobile-heading">Mobile Behavior</h2>
    <label>
      Mobile Layout
      <select id="mobileLayout">
        <option value="auto">Auto</option>
        <option value="off">Off</option>
      </select>
    </label>
  </section>

  <section aria-labelledby="links-heading">
    <h2 id="links-heading">Link Behavior</h2>
    <label class="checkbox">
      <input id="openStoryLinksInNewTabs" type="checkbox" />
      Open external story links in new tabs
    </label>
  </section>
</main>
```

- [ ] **Step 2: Replace options CSS with page-oriented styling**

Modify `extension/options/options.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 15px;
}

body {
  margin: 0;
  color: CanvasText;
  background: Canvas;
}

main {
  width: min(720px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.page-header {
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.page-header p {
  margin: 8px 0 0;
  color: color-mix(in srgb, CanvasText 62%, transparent);
}

section {
  display: grid;
  gap: 14px;
  padding: 20px 0;
  border-top: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
}

h2 {
  margin: 0;
  font-size: 15px;
}

label {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(180px, 260px);
  align-items: center;
  gap: 16px;
}

select {
  min-height: 32px;
  font: inherit;
}

.checkbox {
  grid-template-columns: auto 1fr;
  justify-content: start;
}

.status {
  margin: 0 0 18px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, CanvasText 20%, transparent);
  border-radius: 8px;
}

@media (max-width: 560px) {
  main {
    width: min(100% - 24px, 720px);
    padding-top: 22px;
  }

  label {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
```

- [ ] **Step 3: Confirm `options.js` selectors still match**

Run:

```bash
node --test tests/preference-store.test.js tests/preference-messages.test.js
```

Expected: PASS.

Open `extension/options/options.html` through Safari or the extension settings page and verify all controls render and save.

- [ ] **Step 4: Run full checks and visual checks**

Run: `npm run check`

Expected: PASS.

Visual checks:

- Full settings page on desktop width.
- Full settings page at narrow width around 390 px.
- Safari popup still only shows theme quick switch and `Open Settings`.

- [ ] **Step 5: Commit**

```bash
git add extension/options/options.html extension/options/options.css extension/options/options.js
git commit -m "feat: organize full settings page"
```

## Task 4: Generate Icon Source And Assets

**Files:**

- Create: `assets/icon/hn-refined-icon.svg`
- Create: `scripts/generate-icons.js`
- Create: `extension/icons/icon-16.png`
- Create: `extension/icons/icon-19.png`
- Create: `extension/icons/icon-32.png`
- Create: `extension/icons/icon-38.png`
- Create: `extension/icons/icon-48.png`
- Create: `extension/icons/icon-128.png`
- Modify: `extension/manifest.json`
- Create: PNG files in `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/`
- Modify: `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/Contents.json`
- Modify: `package.json`

- [ ] **Step 1: Add the approved SVG source**

Create `assets/icon/hn-refined-icon.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="HN Refined">
  <rect width="1024" height="1024" rx="224" fill="#ff6600"/>
  <g transform="translate(314 250) rotate(-2 198 256)">
    <rect width="396" height="468" rx="64" fill="#fff8ea"/>
    <text x="68" y="184"
      fill="#1b1814"
      font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
      font-size="148"
      font-weight="850"
      letter-spacing="-10">HN</text>
    <rect x="72" y="252" width="224" height="34" rx="17" fill="#6f6255"/>
    <rect x="72" y="318" width="156" height="34" rx="17" fill="#8a7f71"/>
  </g>
  <g transform="translate(676 216)">
    <circle cx="0" cy="0" r="104" fill="#3a342d"/>
    <text x="-31" y="42"
      fill="#fff8ea"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="152"
      font-style="italic"
      font-weight="700">e</text>
  </g>
</svg>
```

- [ ] **Step 2: Add the icon generation script**

Create `scripts/generate-icons.js`:

```js
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const source = "assets/icon/hn-refined-icon.svg";

const appIconDir = "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset";
const extensionIconDir = "extension/icons";

const appIcons = [
  ["AppIcon-16.png", 16],
  ["AppIcon-16@2x.png", 32],
  ["AppIcon-32.png", 32],
  ["AppIcon-32@2x.png", 64],
  ["AppIcon-128.png", 128],
  ["AppIcon-128@2x.png", 256],
  ["AppIcon-256.png", 256],
  ["AppIcon-256@2x.png", 512],
  ["AppIcon-512.png", 512],
  ["AppIcon-512@2x.png", 1024],
];

const extensionIcons = [
  ["icon-16.png", 16],
  ["icon-19.png", 19],
  ["icon-32.png", 32],
  ["icon-38.png", 38],
  ["icon-48.png", 48],
  ["icon-128.png", 128],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function renderPng(outputPath, size) {
  execFileSync("magick", ["-background", "none", source, "-resize", `${size}x${size}`, outputPath]);
}

ensureDir(appIconDir);
ensureDir(extensionIconDir);

for (const [filename, size] of appIcons) {
  renderPng(path.join(appIconDir, filename), size);
}

for (const [filename, size] of extensionIcons) {
  renderPng(path.join(extensionIconDir, filename), size);
}
```

- [ ] **Step 3: Add the package script**

Modify `package.json` scripts:

```json
"build:icons": "node scripts/generate-icons.js"
```

Do not add `build:icons` to `check` yet. Keep icon generation explicit because it depends on the local `magick` binary.

- [ ] **Step 4: Generate the icon PNG files**

Run: `npm run build:icons`

Expected: PNG files are created in `extension/icons/` and `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/`.

- [ ] **Step 5: Update `AppIcon.appiconset/Contents.json`**

Modify `HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/Contents.json`:

```json
{
  "images": [
    { "filename": "AppIcon-16.png", "idiom": "mac", "scale": "1x", "size": "16x16" },
    { "filename": "AppIcon-16@2x.png", "idiom": "mac", "scale": "2x", "size": "16x16" },
    { "filename": "AppIcon-32.png", "idiom": "mac", "scale": "1x", "size": "32x32" },
    { "filename": "AppIcon-32@2x.png", "idiom": "mac", "scale": "2x", "size": "32x32" },
    { "filename": "AppIcon-128.png", "idiom": "mac", "scale": "1x", "size": "128x128" },
    { "filename": "AppIcon-128@2x.png", "idiom": "mac", "scale": "2x", "size": "128x128" },
    { "filename": "AppIcon-256.png", "idiom": "mac", "scale": "1x", "size": "256x256" },
    { "filename": "AppIcon-256@2x.png", "idiom": "mac", "scale": "2x", "size": "256x256" },
    { "filename": "AppIcon-512.png", "idiom": "mac", "scale": "1x", "size": "512x512" },
    { "filename": "AppIcon-512@2x.png", "idiom": "mac", "scale": "2x", "size": "512x512" }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
```

- [ ] **Step 6: Add WebExtension icons to the manifest**

Modify `extension/manifest.json`:

```json
"icons": {
  "16": "icons/icon-16.png",
  "32": "icons/icon-32.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
},
"action": {
  "default_title": "HN Refined",
  "default_popup": "popup/popup.html",
  "default_icon": {
    "16": "icons/icon-16.png",
    "19": "icons/icon-19.png",
    "32": "icons/icon-32.png",
    "38": "icons/icon-38.png"
  }
}
```

Keep existing `permissions`, `host_permissions`, `content_scripts`, and `options_ui` unchanged except for the popup path already changed in Task 2.

- [ ] **Step 7: Verify icon files and build**

Run:

```bash
npm run build:icons
npm run check
xcodebuild -quiet -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

Expected:

- Icon generation exits 0.
- `npm run check` passes.
- Xcode Debug build exits 0.

- [ ] **Step 8: Visual icon checks**

Use Finder, Xcode build output, Safari extension settings, and the Safari toolbar:

- App icon follows C4 original geometry.
- Badge is warm ink gray and does not overpower the HN page.
- 16 px and 32 px app icons remain recognizable.
- Safari toolbar icon is not too dense.
- Light and dark macOS appearances do not make the icon disappear.

If Safari toolbar scale makes the full C4 icon unreadable, create a simplified toolbar-only SVG in `assets/icon/hn-refined-toolbar-icon.svg`, update `scripts/generate-icons.js` to use it for `extension/icons/`, and rerun this task's verification.

- [ ] **Step 9: Commit**

```bash
git add assets/icon/hn-refined-icon.svg scripts/generate-icons.js package.json extension/icons extension/manifest.json HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset
git commit -m "feat: add HN Refined icon assets"
```

## Task 5: Final Integration Pass

**Files:**

- Modify docs only if implementation reveals a user-facing note that should be recorded.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run check
xcodebuild -quiet -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

Expected: both commands exit 0.

- [ ] **Step 2: Real Safari behavior checks**

Use Safari with the rebuilt extension:

- Toolbar popup is small and contains no full settings controls.
- Theme switch updates active HN page without refresh.
- `Open Settings` opens the full settings page in a tab.
- Full settings writes still update active HN pages without refresh.
- Light HN theme and dark HN theme both remain readable after switching from popup and full settings.
- Private Browsing fallback message appears if storage cannot persist changes.
- Extension disabled state restores original Hacker News behavior.

- [ ] **Step 3: Decide whether docs need a small update**

If the popup/options split changes user-facing instructions, update `docs/safari.md` or `README.md` with a short note:

```md
Use the Safari toolbar popup for quick theme switching. Open the full settings page from the popup for typography, layout, mobile, and link-behavior preferences.
```

If docs already cover this adequately after implementation, skip the docs edit.

- [ ] **Step 4: Commit any final docs-only adjustment**

If Step 3 changed docs:

```bash
git add README.md docs/safari.md
git commit -m "docs: describe settings entry points"
```

If Step 3 did not change docs, do not create an empty commit.

## Plan Self-Review

Spec coverage:

- Minimal popup with theme quick switch: Task 2.
- Full settings opens in a tab: Task 1 and Task 2.
- Full settings remains complete and grouped: Task 3.
- C4 icon direction and palette: Task 4.
- App and toolbar icon assets: Task 4.
- Review/privacy posture through unofficial wording: Task 4 checks existing metadata, Task 5 docs update if needed.
- Automated and Safari visual verification: Tasks 2, 3, 4, and 5.

No planned step widens permissions, adds analytics, loads remote code, adds remote themes, or introduces arbitrary CSS.

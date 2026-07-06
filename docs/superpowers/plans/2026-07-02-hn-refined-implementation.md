# HN Refined Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of HN Refined as a CSS-first Safari Web Extension for Hacker News readability, with local preferences, structured themes, mobile/PWA-like adaptations, Private Browsing-safe defaults, and a narrow new-tab option.

**Architecture:** Create a vanilla WebExtension source tree first, then add Safari/Xcode packaging around it. Runtime behavior is split into CSS for presentation, a small content script for preference application and story-link behavior, and an extension options page for local settings. Theme contribution is build-time only: JSON tokens are validated and converted into CSS variables.

**Tech Stack:** Safari WebExtension manifest, plain JavaScript ES modules for tests/build scripts, vanilla content script, CSS custom properties, Node built-in `node:test`, Xcode/Safari tooling for final local packaging.

---

## File Structure

Create these files and keep responsibilities narrow:

- `package.json`: project scripts using Node built-ins only.
- `extension/manifest.json`: WebExtension manifest with Hacker News-only host permissions.
- `extension/content/content.css`: all Hacker News visual behavior.
- `extension/content/content-script.js`: tiny audited runtime for preferences and external story-link target behavior.
- `extension/options/options.html`: extension settings UI markup.
- `extension/options/options.css`: settings UI presentation.
- `extension/options/options.js`: settings load/save and private-storage failure handling.
- `extension/shared/defaults.js`: default preferences and allowed enum values.
- `extension/shared/link-classifier.js`: pure link classification helpers.
- `extension/shared/preference-store.js`: storage wrapper with default fallback.
- `extension/themes/hn-light.json`: bundled light theme tokens.
- `extension/themes/hn-dark.json`: bundled dark theme tokens.
- `extension/generated/themes.css`: generated theme CSS variables.
- `scripts/validate-themes.js`: validates theme token files.
- `scripts/build-themes.js`: generates `extension/generated/themes.css`.
- `scripts/check-manifest.js`: checks permissions and manifest safety.
- `scripts/check-no-remote.js`: rejects remote URLs in extension source.
- `tests/defaults.test.js`: preference default tests.
- `tests/link-classifier.test.js`: link classification tests.
- `tests/theme-validator.test.js`: theme validation tests.
- `fixtures/hn/frontpage.html`: static Hacker News-like front page fixture.
- `fixtures/hn/item.html`: static Hacker News-like comment page fixture.
- `fixtures/preview.html`: local visual preview page that loads extension CSS against fixtures.
- `docs/development.md`: local development and test commands.
- `docs/safari.md`: Safari/Xcode local loading notes and version verification checklist.
- `docs/privacy.md`: privacy and permissions explanation.
- `docs/theme-contribution.md`: theme token contribution rules.
- `docs/app-store-checklist.md`: future App Store preparation checklist.
- `.github/workflows/ci.yml`: validation workflow.

Generated later by Safari tooling:

- `HNRefined/`: Xcode wrapper project generated from `extension/` once the WebExtension source passes local tests.

## Task 1: Project Scripts and Preference Defaults

**Files:**

- Create: `package.json`
- Create: `extension/shared/defaults.js`
- Create: `tests/defaults.test.js`

- [ ] **Step 1: Add failing preference default tests**

Create `tests/defaults.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PREFERENCES,
  ALLOWED_PREFERENCES,
  normalizePreferences,
} from "../extension/shared/defaults.js";

test("default preferences match the approved spec", () => {
  assert.deepEqual(DEFAULT_PREFERENCES, {
    theme: "system",
    fontPreset: "system-sans",
    desktopDensity: "comfortable",
    readingWidth: "comfortable",
    mobileLayout: "auto",
    openStoryLinksInNewTabs: false,
  });
});

test("allowed preferences expose only first-version options", () => {
  assert.deepEqual(ALLOWED_PREFERENCES.theme, ["system", "light", "dark"]);
  assert.deepEqual(ALLOWED_PREFERENCES.fontPreset, [
    "hn-classic",
    "system-sans",
    "serif-reading",
    "mono-ish",
  ]);
  assert.deepEqual(ALLOWED_PREFERENCES.desktopDensity, ["comfortable", "classic-ish"]);
  assert.deepEqual(ALLOWED_PREFERENCES.readingWidth, ["comfortable", "wide"]);
  assert.deepEqual(ALLOWED_PREFERENCES.mobileLayout, ["auto", "off"]);
});

test("normalizePreferences falls back for invalid or missing values", () => {
  assert.deepEqual(
    normalizePreferences({
      theme: "remote",
      fontPreset: "serif-reading",
      desktopDensity: "huge",
      readingWidth: "wide",
      mobileLayout: "auto",
      openStoryLinksInNewTabs: "yes",
    }),
    {
      theme: "system",
      fontPreset: "serif-reading",
      desktopDensity: "comfortable",
      readingWidth: "wide",
      mobileLayout: "auto",
      openStoryLinksInNewTabs: false,
    },
  );
});
```

- [ ] **Step 2: Add `package.json` test script**

Create `package.json`:

```json
{
  "name": "hn-refined",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "validate:themes": "node scripts/validate-themes.js",
    "build:themes": "node scripts/build-themes.js",
    "check:manifest": "node scripts/check-manifest.js",
    "check:no-remote": "node scripts/check-no-remote.js",
    "check": "npm run validate:themes && npm run build:themes && npm run check:manifest && npm run check:no-remote && npm test"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `npm test`

Expected: FAIL with an import error for `extension/shared/defaults.js`.

- [ ] **Step 4: Implement preference defaults**

Create `extension/shared/defaults.js`:

```js
export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "system",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false,
});

export const ALLOWED_PREFERENCES = Object.freeze({
  theme: Object.freeze(["system", "light", "dark"]),
  fontPreset: Object.freeze(["hn-classic", "system-sans", "serif-reading", "mono-ish"]),
  desktopDensity: Object.freeze(["comfortable", "classic-ish"]),
  readingWidth: Object.freeze(["comfortable", "wide"]),
  mobileLayout: Object.freeze(["auto", "off"]),
});

function enumOrDefault(key, value) {
  return ALLOWED_PREFERENCES[key].includes(value) ? value : DEFAULT_PREFERENCES[key];
}

export function normalizePreferences(raw = {}) {
  return {
    theme: enumOrDefault("theme", raw.theme),
    fontPreset: enumOrDefault("fontPreset", raw.fontPreset),
    desktopDensity: enumOrDefault("desktopDensity", raw.desktopDensity),
    readingWidth: enumOrDefault("readingWidth", raw.readingWidth),
    mobileLayout: enumOrDefault("mobileLayout", raw.mobileLayout),
    openStoryLinksInNewTabs:
      typeof raw.openStoryLinksInNewTabs === "boolean"
        ? raw.openStoryLinksInNewTabs
        : DEFAULT_PREFERENCES.openStoryLinksInNewTabs,
  };
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test`

Expected: PASS.

Commit:

```bash
git add package.json extension/shared/defaults.js tests/defaults.test.js
git commit -m "test: define preference defaults"
```

## Task 2: Link Classification

**Files:**

- Create: `extension/shared/link-classifier.js`
- Create: `tests/link-classifier.test.js`

- [ ] **Step 1: Add failing tests for external story-link classification**

Create `tests/link-classifier.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  isHackerNewsInternalUrl,
  isExternalStoryLink,
  shouldForceNewTab,
} from "../extension/shared/link-classifier.js";

test("classifies Hacker News internal URLs", () => {
  assert.equal(isHackerNewsInternalUrl("https://news.ycombinator.com/item?id=1"), true);
  assert.equal(isHackerNewsInternalUrl("/item?id=1"), true);
  assert.equal(isHackerNewsInternalUrl("news"), true);
  assert.equal(isHackerNewsInternalUrl("https://example.com/article"), false);
});

test("external story links are only title links", () => {
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/article",
      className: "titleline",
      closestClassNames: ["titleline"],
    }),
    true,
  );
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/comment",
      className: "subtext",
      closestClassNames: ["subtext"],
    }),
    false,
  );
  assert.equal(
    isExternalStoryLink({
      href: "item?id=1",
      className: "titleline",
      closestClassNames: ["titleline"],
    }),
    false,
  );
});

test("new-tab behavior is opt-in", () => {
  const story = {
    href: "https://example.com/article",
    className: "",
    closestClassNames: ["titleline"],
  };

  assert.equal(shouldForceNewTab(story, { openStoryLinksInNewTabs: false }), false);
  assert.equal(shouldForceNewTab(story, { openStoryLinksInNewTabs: true }), true);
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npm test`

Expected: FAIL with an import error for `extension/shared/link-classifier.js`.

- [ ] **Step 3: Implement pure link classification**

Create `extension/shared/link-classifier.js`:

```js
const HN_ORIGIN = "https://news.ycombinator.com";

export function isHackerNewsInternalUrl(href) {
  try {
    const url = new URL(href, HN_ORIGIN);
    return url.origin === HN_ORIGIN;
  } catch {
    return false;
  }
}

export function isExternalStoryLink(linkInfo) {
  if (!linkInfo || isHackerNewsInternalUrl(linkInfo.href)) {
    return false;
  }

  return linkInfo.closestClassNames.includes("titleline");
}

export function shouldForceNewTab(linkInfo, preferences) {
  return Boolean(preferences.openStoryLinksInNewTabs && isExternalStoryLink(linkInfo));
}
```

- [ ] **Step 4: Run tests and commit**

Run: `npm test`

Expected: PASS.

Commit:

```bash
git add extension/shared/link-classifier.js tests/link-classifier.test.js
git commit -m "test: classify Hacker News story links"
```

## Task 3: Theme Validation and Generation

**Files:**

- Create: `extension/themes/hn-light.json`
- Create: `extension/themes/hn-dark.json`
- Create: `scripts/validate-themes.js`
- Create: `scripts/build-themes.js`
- Create: `tests/theme-validator.test.js`
- Create: `extension/generated/themes.css`

- [ ] **Step 1: Add theme validator tests**

Create `tests/theme-validator.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { validateTheme } from "../scripts/validate-themes.js";

const validTheme = {
  id: "hn-light",
  name: "HN Light",
  mode: "light",
  tokens: {
    pageBackground: "#f6f6ef",
    contentBackground: "#f6f6ef",
    topBarBackground: "#ff6600",
    textPrimary: "#000000",
    textMuted: "#828282",
    link: "#000000",
    visitedLink: "#828282",
    borderSubtle: "#d9d0b1",
    voteArrow: "#828282",
  },
};

test("accepts a complete static theme", () => {
  assert.deepEqual(validateTheme(validTheme), []);
});

test("rejects remote or dynamic color values", () => {
  const theme = structuredClone(validTheme);
  theme.tokens.pageBackground = "url(https://example.com/a.png)";

  assert.match(validateTheme(theme).join("\n"), /pageBackground/);
});

test("rejects unknown token keys", () => {
  const theme = structuredClone(validTheme);
  theme.tokens.hiddenContent = "#ffffff";

  assert.match(validateTheme(theme).join("\n"), /hiddenContent/);
});
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npm test`

Expected: FAIL with an import error for `scripts/validate-themes.js`.

- [ ] **Step 3: Implement theme validation script**

Create `scripts/validate-themes.js`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_TOKENS = Object.freeze([
  "pageBackground",
  "contentBackground",
  "topBarBackground",
  "textPrimary",
  "textMuted",
  "link",
  "visitedLink",
  "borderSubtle",
  "voteArrow",
]);

const STATIC_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}\s*(?:\/\s*(0|1|0?\.\d+|[1-9]\d?%|100%))?\s*\))$/;

export function validateTheme(theme) {
  const errors = [];

  if (!/^[a-z0-9-]+$/.test(theme.id || "")) {
    errors.push("id must use lowercase letters, numbers, and hyphens");
  }

  if (!["light", "dark"].includes(theme.mode)) {
    errors.push("mode must be light or dark");
  }

  if (!theme.name || /apple|official hacker news/i.test(theme.name)) {
    errors.push("name is missing or implies official endorsement");
  }

  const tokenEntries = Object.entries(theme.tokens || {});
  const allowed = new Set(REQUIRED_TOKENS);

  for (const key of REQUIRED_TOKENS) {
    if (!Object.hasOwn(theme.tokens || {}, key)) {
      errors.push(`missing required token: ${key}`);
    }
  }

  for (const [key, value] of tokenEntries) {
    if (!allowed.has(key)) {
      errors.push(`unknown token: ${key}`);
      continue;
    }

    if (typeof value !== "string" || !STATIC_COLOR_RE.test(value)) {
      errors.push(`token ${key} must be a static color`);
    }
  }

  return errors;
}

function loadTheme(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function validateThemeDirectory(themeDir) {
  const errors = [];
  const files = fs.readdirSync(themeDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(themeDir, file);
    for (const error of validateTheme(loadTheme(filePath))) {
      errors.push(`${file}: ${error}`);
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const errors = validateThemeDirectory(path.join(root, "extension", "themes"));

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
}
```

- [ ] **Step 4: Add bundled themes**

Create `extension/themes/hn-light.json`:

```json
{
  "id": "hn-light",
  "name": "HN Light",
  "mode": "light",
  "tokens": {
    "pageBackground": "#f6f6ef",
    "contentBackground": "#f6f6ef",
    "topBarBackground": "#ff6600",
    "textPrimary": "#000000",
    "textMuted": "#828282",
    "link": "#000000",
    "visitedLink": "#828282",
    "borderSubtle": "#d9d0b1",
    "voteArrow": "#828282"
  }
}
```

Create `extension/themes/hn-dark.json`:

```json
{
  "id": "hn-dark",
  "name": "HN Dark",
  "mode": "dark",
  "tokens": {
    "pageBackground": "#161616",
    "contentBackground": "#1f1f1a",
    "topBarBackground": "#b94d00",
    "textPrimary": "#ece7d5",
    "textMuted": "#aaa18c",
    "link": "#f2f0df",
    "visitedLink": "#b8aa88",
    "borderSubtle": "#3a3326",
    "voteArrow": "#aaa18c"
  }
}
```

- [ ] **Step 5: Implement theme CSS generation**

Create `scripts/build-themes.js`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REQUIRED_TOKENS, validateThemeDirectory } from "./validate-themes.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const themeDir = path.join(root, "extension", "themes");
const outputPath = path.join(root, "extension", "generated", "themes.css");

const errors = validateThemeDirectory(themeDir);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const files = fs
  .readdirSync(themeDir)
  .filter((file) => file.endsWith(".json"))
  .sort();
const blocks = [];

for (const file of files) {
  const theme = JSON.parse(fs.readFileSync(path.join(themeDir, file), "utf8"));
  const selector =
    theme.mode === "light"
      ? `html[data-hnr-theme="light"], html[data-hnr-theme="system"]`
      : `html[data-hnr-theme="dark"]`;

  const declarations = REQUIRED_TOKENS.map(
    (token) =>
      `  --hnr-${token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${theme.tokens[token]};`,
  ).join("\n");

  blocks.push(`${selector} {\n${declarations}\n}`);
}

blocks.push(
  `@media (prefers-color-scheme: dark) {\n  html[data-hnr-theme="system"] {\n${REQUIRED_TOKENS.map(
    (token) => {
      const darkTheme = JSON.parse(fs.readFileSync(path.join(themeDir, "hn-dark.json"), "utf8"));
      return `    --hnr-${token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${darkTheme.tokens[token]};`;
    },
  ).join("\n")}\n  }\n}`,
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${blocks.join("\n\n")}\n`);
```

- [ ] **Step 6: Run validation/build/tests and commit**

Run:

```bash
npm run validate:themes
npm run build:themes
npm test
```

Expected: all PASS and `extension/generated/themes.css` exists.

Commit:

```bash
git add extension/themes extension/generated scripts/validate-themes.js scripts/build-themes.js tests/theme-validator.test.js
git commit -m "feat: add structured theme tokens"
```

## Task 4: Manifest and Safety Checks

**Files:**

- Create: `extension/manifest.json`
- Create: `scripts/check-manifest.js`
- Create: `scripts/check-no-remote.js`

- [ ] **Step 1: Create the WebExtension manifest**

Create `extension/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "HN Refined",
  "version": "0.1.0",
  "description": "A restrained Safari extension that improves Hacker News readability.",
  "permissions": ["storage"],
  "host_permissions": ["https://news.ycombinator.com/*"],
  "content_scripts": [
    {
      "matches": ["https://news.ycombinator.com/*"],
      "css": ["generated/themes.css", "content/content.css"],
      "js": ["content/content-script.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_title": "HN Refined",
    "default_popup": "options/options.html"
  },
  "options_ui": {
    "page": "options/options.html",
    "open_in_tab": false
  }
}
```

- [ ] **Step 2: Add manifest safety check**

Create `scripts/check-manifest.js`:

```js
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}

if (
  JSON.stringify(manifest.host_permissions) !== JSON.stringify(["https://news.ycombinator.com/*"])
) {
  errors.push("host_permissions must be limited to Hacker News");
}

for (const permission of manifest.permissions || []) {
  if (!["storage"].includes(permission)) {
    errors.push(`unexpected permission: ${permission}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
```

- [ ] **Step 3: Add remote-content safety check**

Create `scripts/check-no-remote.js`:

```js
import fs from "node:fs";
import path from "node:path";

const forbidden = /\bhttps?:\/\/|@import\b|url\(\s*['"]?https?:\/\//i;
const roots = ["extension"];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(js|css|html|json)$/.test(entry.name)) {
      continue;
    }

    const text = fs.readFileSync(fullPath, "utf8");
    if (forbidden.test(text) && fullPath !== path.join("extension", "manifest.json")) {
      errors.push(`${fullPath} contains remote content syntax`);
    }
  }
}

for (const root of roots) {
  walk(root);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
```

- [ ] **Step 4: Run safety checks and commit**

Run:

```bash
npm run check:manifest
npm run check:no-remote
```

Expected: both PASS.

Commit:

```bash
git add extension/manifest.json scripts/check-manifest.js scripts/check-no-remote.js
git commit -m "chore: add extension manifest safety checks"
```

## Task 5: Preference Storage and Options UI

**Files:**

- Create: `extension/shared/preference-store.js`
- Create: `extension/options/options.html`
- Create: `extension/options/options.css`
- Create: `extension/options/options.js`

- [ ] **Step 1: Implement storage wrapper with safe fallback**

Create `extension/shared/preference-store.js`:

```js
import { DEFAULT_PREFERENCES, normalizePreferences } from "./defaults.js";

const STORAGE_KEY = "hnRefinedPreferences";

function getBrowserApi() {
  return globalThis.browser || globalThis.chrome;
}

export async function readPreferences() {
  const api = getBrowserApi();

  if (!api?.storage?.local) {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }

  try {
    const result = await api.storage.local.get(STORAGE_KEY);
    return {
      preferences: normalizePreferences(result?.[STORAGE_KEY]),
      persisted: true,
    };
  } catch {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }
}

export async function writePreferences(preferences) {
  const api = getBrowserApi();
  const normalized = normalizePreferences(preferences);

  if (!api?.storage?.local) {
    return { preferences: normalized, persisted: false };
  }

  try {
    await api.storage.local.set({ [STORAGE_KEY]: normalized });
    return { preferences: normalized, persisted: true };
  } catch {
    return { preferences: normalized, persisted: false };
  }
}

export function subscribeToPreferenceChanges(callback) {
  const api = getBrowserApi();
  const listener = (changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    callback(normalizePreferences(changes[STORAGE_KEY].newValue));
  };

  api?.storage?.onChanged?.addListener?.(listener);
  return () => api?.storage?.onChanged?.removeListener?.(listener);
}
```

- [ ] **Step 2: Create options UI markup**

Create `extension/options/options.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HN Refined</title>
    <link rel="stylesheet" href="options.css" />
  </head>
  <body>
    <main>
      <h1>HN Refined</h1>
      <p id="storage-status" class="status" hidden></p>

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

      <label>
        Mobile Layout
        <select id="mobileLayout">
          <option value="auto">Auto</option>
          <option value="off">Off</option>
        </select>
      </label>

      <label class="checkbox">
        <input id="openStoryLinksInNewTabs" type="checkbox" />
        Open external story links in new tabs
      </label>
    </main>

    <script type="module" src="options.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Style the options UI**

Create `extension/options/options.css`:

```css
:root {
  color-scheme: light dark;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 14px;
}

body {
  margin: 0;
  min-width: 280px;
  color: CanvasText;
  background: Canvas;
}

main {
  display: grid;
  gap: 12px;
  padding: 14px;
}

h1 {
  margin: 0 0 4px;
  font-size: 18px;
}

label {
  display: grid;
  gap: 4px;
}

select {
  font: inherit;
}

.checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status {
  margin: 0;
  padding: 8px;
  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
}
```

- [ ] **Step 4: Implement options behavior**

Create `extension/options/options.js`:

```js
import { readPreferences, writePreferences } from "../shared/preference-store.js";

const fields = {
  theme: document.querySelector("#theme"),
  fontPreset: document.querySelector("#fontPreset"),
  desktopDensity: document.querySelector("#desktopDensity"),
  readingWidth: document.querySelector("#readingWidth"),
  mobileLayout: document.querySelector("#mobileLayout"),
  openStoryLinksInNewTabs: document.querySelector("#openStoryLinksInNewTabs"),
};

const status = document.querySelector("#storage-status");

function setStatus(persisted) {
  status.hidden = persisted;
  status.textContent = persisted ? "" : "Settings may not be saved in this browsing environment.";
}

function render(preferences) {
  fields.theme.value = preferences.theme;
  fields.fontPreset.value = preferences.fontPreset;
  fields.desktopDensity.value = preferences.desktopDensity;
  fields.readingWidth.value = preferences.readingWidth;
  fields.mobileLayout.value = preferences.mobileLayout;
  fields.openStoryLinksInNewTabs.checked = preferences.openStoryLinksInNewTabs;
}

function readForm() {
  return {
    theme: fields.theme.value,
    fontPreset: fields.fontPreset.value,
    desktopDensity: fields.desktopDensity.value,
    readingWidth: fields.readingWidth.value,
    mobileLayout: fields.mobileLayout.value,
    openStoryLinksInNewTabs: fields.openStoryLinksInNewTabs.checked,
  };
}

const initial = await readPreferences();
render(initial.preferences);
setStatus(initial.persisted);

for (const field of Object.values(fields)) {
  field.addEventListener("change", async () => {
    const result = await writePreferences(readForm());
    render(result.preferences);
    setStatus(result.persisted);
  });
}
```

- [ ] **Step 5: Run checks and commit**

Run: `npm run check`

Expected: PASS.

Commit:

```bash
git add extension/shared/preference-store.js extension/options
git commit -m "feat: add local preference options"
```

## Task 6: Content Script

**Files:**

- Create: `extension/content/content-script.js`

- [ ] **Step 1: Implement auditable content script**

Create `extension/content/content-script.js`:

```js
const DEFAULT_PREFERENCES = {
  theme: "system",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false,
};

const STORAGE_KEY = "hnRefinedPreferences";
const HN_ORIGIN = "https://news.ycombinator.com";

let preferences = DEFAULT_PREFERENCES;

function browserApi() {
  return globalThis.browser || globalThis.chrome;
}

function normalize(raw = {}) {
  return {
    theme: ["system", "light", "dark"].includes(raw.theme) ? raw.theme : "system",
    fontPreset: ["hn-classic", "system-sans", "serif-reading", "mono-ish"].includes(raw.fontPreset)
      ? raw.fontPreset
      : "system-sans",
    desktopDensity: ["comfortable", "classic-ish"].includes(raw.desktopDensity)
      ? raw.desktopDensity
      : "comfortable",
    readingWidth: ["comfortable", "wide"].includes(raw.readingWidth)
      ? raw.readingWidth
      : "comfortable",
    mobileLayout: ["auto", "off"].includes(raw.mobileLayout) ? raw.mobileLayout : "auto",
    openStoryLinksInNewTabs:
      typeof raw.openStoryLinksInNewTabs === "boolean" ? raw.openStoryLinksInNewTabs : false,
  };
}

function applyPreferences(nextPreferences) {
  preferences = normalize(nextPreferences);
  const root = document.documentElement;

  root.dataset.hnrTheme = preferences.theme;
  root.dataset.hnrFont = preferences.fontPreset;
  root.dataset.hnrDensity = preferences.desktopDensity;
  root.dataset.hnrWidth = preferences.readingWidth;
  root.dataset.hnrMobile = preferences.mobileLayout;
}

function isHackerNewsInternalUrl(href) {
  try {
    return new URL(href, HN_ORIGIN).origin === HN_ORIGIN;
  } catch {
    return false;
  }
}

function isExternalStoryAnchor(anchor) {
  return Boolean(
    anchor && anchor.closest(".titleline") && anchor.href && !isHackerNewsInternalUrl(anchor.href),
  );
}

function updateStoryTargets() {
  for (const anchor of document.querySelectorAll(".titleline a[href]")) {
    if (!isExternalStoryAnchor(anchor)) {
      continue;
    }

    if (preferences.openStoryLinksInNewTabs) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  }
}

async function loadPreferences() {
  const api = browserApi();
  if (!api?.storage?.local) {
    applyPreferences(DEFAULT_PREFERENCES);
    return;
  }

  try {
    const result = await api.storage.local.get(STORAGE_KEY);
    applyPreferences(result?.[STORAGE_KEY] || DEFAULT_PREFERENCES);
  } catch {
    applyPreferences(DEFAULT_PREFERENCES);
  }
}

function observePreferences() {
  const api = browserApi();
  api?.storage?.onChanged?.addListener?.((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    applyPreferences(changes[STORAGE_KEY].newValue || DEFAULT_PREFERENCES);
    updateStoryTargets();
  });
}

function start() {
  loadPreferences().then(updateStoryTargets);
  observePreferences();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateStoryTargets, { once: true });
  } else {
    updateStoryTargets();
  }
}

start();
```

- [ ] **Step 2: Run checks and inspect content script size**

Run:

```bash
npm run check:no-remote
wc -l extension/content/content-script.js
```

Expected: remote check PASS. Content script should remain short enough for direct review; if it grows beyond 180 lines during implementation, split pure logic into tests while keeping runtime minimal.

- [ ] **Step 3: Commit**

```bash
git add extension/content/content-script.js
git commit -m "feat: apply preferences on Hacker News pages"
```

## Task 7: Content CSS and Fixtures

**Files:**

- Create: `extension/content/content.css`
- Create: `fixtures/hn/frontpage.html`
- Create: `fixtures/hn/item.html`
- Create: `fixtures/preview.html`

- [ ] **Step 1: Add local Hacker News fixtures**

Create `fixtures/hn/frontpage.html` with a small static HN-like table that includes:

```html
<table id="hnmain">
  <tr>
    <td class="title">
      <span class="titleline"><a href="https://example.com/a">Example story</a></span>
    </td>
  </tr>
  <tr>
    <td class="subtext">123 points by user 1 hour ago | <a href="item?id=1">42 comments</a></td>
  </tr>
  <tr class="spacer" style="height:5px"></tr>
</table>
```

Create `fixtures/hn/item.html` with at least three `.athing.comtr` rows and nested `.ind img width` values to mimic comment indentation.

- [ ] **Step 2: Add preview wrapper**

Create `fixtures/preview.html`:

```html
<!doctype html>
<html
  data-hnr-theme="system"
  data-hnr-font="system-sans"
  data-hnr-density="comfortable"
  data-hnr-width="comfortable"
  data-hnr-mobile="auto"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HN Refined Preview</title>
    <link rel="stylesheet" href="../extension/generated/themes.css" />
    <link rel="stylesheet" href="../extension/content/content.css" />
  </head>
  <body>
    <iframe title="frontpage" src="hn/frontpage.html"></iframe>
    <iframe title="item" src="hn/item.html"></iframe>
  </body>
</html>
```

If iframe isolation prevents CSS inspection, replace the iframes with copied fixture markup during implementation.

- [ ] **Step 3: Implement CSS layers**

Create `extension/content/content.css`:

```css
html {
  color-scheme: light dark;
  background: var(--hnr-page-background, #f6f6ef);
}

body,
td,
.title,
.subtext,
.comment,
.comhead {
  color: var(--hnr-text-primary, #000);
}

body {
  margin: 0;
  background: var(--hnr-page-background, #f6f6ef);
}

#hnmain {
  width: min(100%, 1120px);
  background: var(--hnr-content-background, #f6f6ef);
}

html[data-hnr-width="comfortable"] #hnmain {
  max-width: 1040px;
}

html[data-hnr-width="wide"] #hnmain {
  max-width: 1280px;
}

html[data-hnr-font="system-sans"] body,
html[data-hnr-font="system-sans"] td {
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

html[data-hnr-font="hn-classic"] body,
html[data-hnr-font="hn-classic"] td {
  font-family: Verdana, Geneva, sans-serif;
}

html[data-hnr-font="serif-reading"] body,
html[data-hnr-font="serif-reading"] td {
  font-family: ui-serif, Georgia, "Times New Roman", serif;
}

html[data-hnr-font="mono-ish"] body,
html[data-hnr-font="mono-ish"] td {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

html[data-hnr-density="comfortable"] .title {
  font-size: 11.5pt;
  line-height: 1.38;
}

html[data-hnr-density="comfortable"] .subtext,
html[data-hnr-density="comfortable"] .comhead {
  font-size: 8.5pt;
  line-height: 1.45;
}

a:link {
  color: var(--hnr-link, #000);
}

a:visited {
  color: var(--hnr-visited-link, #828282);
}

.subtext,
.comhead,
.sitestr {
  color: var(--hnr-text-muted, #828282);
}

.pagetop {
  background: var(--hnr-top-bar-background, #ff6600);
}

.comment {
  max-width: 78ch;
  line-height: 1.5;
}

@media (max-width: 700px) {
  html[data-hnr-mobile="auto"] #hnmain {
    width: 100%;
    max-width: none;
  }

  html[data-hnr-mobile="auto"] .title {
    display: block;
    padding-block: 5px;
    font-size: 14px;
    line-height: 1.45;
  }

  html[data-hnr-mobile="auto"] .subtext,
  html[data-hnr-mobile="auto"] .comhead {
    font-size: 12px;
    line-height: 1.5;
  }

  html[data-hnr-mobile="auto"] a {
    min-height: 24px;
  }

  html[data-hnr-mobile="auto"] .comment {
    max-width: none;
    overflow-wrap: anywhere;
  }
}

@media (display-mode: standalone) {
  html[data-hnr-mobile="auto"] body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

- [ ] **Step 4: Manual visual check**

Open `fixtures/preview.html` in Safari or the in-app browser. Check:

- Desktop comfortable is visibly improved but still dense.
- Narrow viewport uses larger tap targets and better wrapping.
- Comment text does not overflow.
- Dark theme variables apply after changing `data-hnr-theme="dark"` in the preview root.

- [ ] **Step 5: Commit**

```bash
git add extension/content/content.css fixtures
git commit -m "feat: add Hacker News readability CSS"
```

## Task 8: Documentation

**Files:**

- Create: `docs/development.md`
- Create: `docs/safari.md`
- Create: `docs/privacy.md`
- Create: `docs/theme-contribution.md`
- Create: `docs/app-store-checklist.md`
- Create: `README.md`

- [ ] **Step 1: Add README**

Create `README.md` with:

````markdown
# HN Refined

HN Refined is a restrained Safari extension that improves Hacker News readability while preserving the original site's behavior.

## First-version scope

- Runs only on `news.ycombinator.com`.
- Improves desktop readability with a comfortable default.
- Improves mobile and PWA-like use with responsive CSS.
- Provides local preferences for theme, font, density, width, mobile layout, and external story-link target behavior.
- Does not collect data, load remote code, or modify Hacker News account actions.

## Development

Run:

```bash
npm run check
```
````

See `docs/development.md` and `docs/safari.md`.

```

```

- [ ] **Step 2: Add development docs**

Create `docs/development.md` with exact commands:

````markdown
# Development

Run all local checks:

```bash
npm run check
```
````

Build theme CSS:

```bash
npm run build:themes
```

Run tests:

```bash
npm test
```

```

```

- [ ] **Step 3: Add Safari docs with verification checklist**

Create `docs/safari.md` documenting:

````markdown
# Safari Development

The WebExtension source lives in `extension/`.

Before creating or refreshing the Xcode wrapper, run:

```bash
npm run check
```
````

Implementation must verify current Apple documentation for:

- Supported Safari WebExtension manifest version behavior.
- Local development without paid Apple Developer Program distribution.
- iOS and iPadOS extension enabling.
- Private Browsing behavior.
- Whether extensions run inside iOS home-screen web app containers.

```

```

- [ ] **Step 4: Add privacy and contribution docs**

Create `docs/privacy.md`, `docs/theme-contribution.md`, and `docs/app-store-checklist.md` using the approved spec language. Include these exact privacy claims in `docs/privacy.md`:

```markdown
- HN Refined only runs on Hacker News.
- HN Refined stores only local extension preferences.
- HN Refined does not collect, upload, sell, or share user data.
- HN Refined does not read or store Hacker News account data.
- HN Refined does not track browsing history.
- HN Refined does not load remote code, remote themes, or analytics.
```

- [ ] **Step 5: Commit**

```bash
git add README.md docs/development.md docs/safari.md docs/privacy.md docs/theme-contribution.md docs/app-store-checklist.md
git commit -m "docs: add development and privacy guidance"
```

## Task 9: CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  check:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm run check
```

- [ ] **Step 2: Run local check**

Run: `npm run check`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: validate extension source"
```

## Task 10: Safari/Xcode Wrapper

**Files:**

- Create or refresh: `HNRefined/`
- Modify: `docs/safari.md`

- [ ] **Step 1: Verify local tooling**

Run:

```bash
xcrun --find safari-web-extension-converter
xcodebuild -version
```

Expected: both commands succeed. If `safari-web-extension-converter` is missing, install or update Xcode before continuing.

- [ ] **Step 2: Generate the Safari wrapper**

Run the converter from the repository root:

```bash
xcrun safari-web-extension-converter extension --project-location . --app-name HNRefined --bundle-identifier org.hnrefined.HNRefined --macos-only
```

Expected: an Xcode project is created under `HNRefined/` or the converter reports the exact path it wrote.

If the current converter syntax differs, run:

```bash
xcrun safari-web-extension-converter --help
```

Then update `docs/safari.md` with the exact command that works on this machine.

- [ ] **Step 3: Build the generated project**

Run:

```bash
xcodebuild -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

Expected: Debug build succeeds, or fails only on signing. If signing fails, document the local signing requirement in `docs/safari.md` and keep the WebExtension source checks passing.

- [ ] **Step 4: Manual Safari smoke test**

In Safari:

- Enable unsigned/developer extensions as documented by current Safari.
- Enable HN Refined.
- Open `https://news.ycombinator.com/`.
- Confirm default visual improvements.
- Confirm external story links open in current tab by default.
- Enable the new-tab option and confirm only external story links open in new tabs.
- Open a Private Browsing window, allow the extension if Safari requires it, and confirm default visual improvements.
- Test iOS/iPadOS separately when device or simulator setup is available.

- [ ] **Step 5: Commit wrapper or document blocker**

If the wrapper builds:

```bash
git add HNRefined docs/safari.md
git commit -m "build: add Safari extension wrapper"
```

If signing/tooling blocks wrapper creation but WebExtension source works:

```bash
git add docs/safari.md
git commit -m "docs: document Safari wrapper setup blocker"
```

## Task 11: Final Verification

**Files:**

- Modify only files required by failures found during verification.

- [ ] **Step 1: Run full source checks**

Run:

```bash
npm run check
git status --short
```

Expected: checks PASS. `git status --short` shows no uncommitted changes, unless Safari wrapper verification produced documented local-only artifacts.

- [ ] **Step 2: Run Safari wrapper build if present**

If `HNRefined/HNRefined.xcodeproj` exists, run:

```bash
xcodebuild -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

Expected: build succeeds or signing-only limitation is documented in `docs/safari.md`.

- [ ] **Step 3: Review first-version scope**

Confirm these are true before calling the implementation complete:

- `extension/manifest.json` only grants Hacker News host access and `storage`.
- No remote URLs exist in extension source except the required Hacker News host permission.
- Theme files are JSON tokens only.
- Content script is short, dependency-free, and only handles preferences plus external story-link target behavior.
- Options UI stores local preferences and degrades safely if storage fails.
- CSS includes desktop, mobile, comment-page, and standalone display rules.
- Docs cover privacy, Safari setup, theme contribution, and App Store preparation.

- [ ] **Step 4: Commit final fixes**

If verification required changes:

```bash
git add <changed-files>
git commit -m "fix: address final verification findings"
```

If no changes were required, do not create an empty commit.

## Self-Review

Spec coverage:

- Product scope is covered by Tasks 4, 6, 7, and 8.
- Preference model is covered by Tasks 1, 5, and 6.
- Link behavior is covered by Tasks 2 and 6.
- Theme contribution is covered by Task 3 and Task 8.
- Mobile, comments, standalone display, and Private Browsing behavior are covered by Tasks 5, 7, 8, 10, and 11.
- Safety, privacy, and App Store readiness are covered by Tasks 4, 8, 9, 10, and 11.

Red-flag scan:

- The plan intentionally leaves current Apple version numbers to Task 10 verification because the approved spec requires current documentation and device/tool validation before making concrete claims.
- Source files, tests, validation scripts, and documentation minimum content are specified in the tasks above.

Type consistency:

- Preference keys match across defaults, options UI, content script dataset application, and spec.
- Theme token names match the validator, examples, and generated CSS variables.
- Link behavior consistently refers only to external story title links.

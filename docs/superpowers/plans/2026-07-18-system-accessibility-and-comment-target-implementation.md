# System Accessibility and Comment Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic increased contrast, keyboard focus visibility, and targeted-comment orientation to Hacker News without adding JavaScript, settings, permissions, or dependencies.

**Architecture:** Extend the existing content stylesheet with progressive WebKit CSS: `prefers-contrast: more` overrides semantic theme variables, `:focus-visible` exposes keyboard focus, and `.comtr:target` marks fragment-linked comments. Source-level tests validate selector boundaries and calculate that the proposed color mixes improve contrast for both committed themes.

**Tech Stack:** CSS custom properties, WebKit media queries and selectors, Node.js built-in test runner, existing theme JSON and Makefile workflow.

## Global Constraints

- The implementation is CSS-only and must not change `extension/content/content-script.js`.
- Do not add preferences, permissions, dependencies, animations, timers, or DOM mutations.
- Increased contrast applies to System, Light, and Dark extension themes.
- Preserve visual hierarchy rather than converting all secondary colors to primary text.
- Bind comment feedback only to Hacker News `.comtr:target` rows.
- Unsupported CSS features must fall back to the current validated presentation.
- Static information pages remain outside the styling target.

---

### Task 1: Automatic Accessibility CSS

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: existing `--hnr-text-primary`, `--hnr-content-background`, `--hnr-top-bar-background`, `--hnr-text-muted`, `--hnr-visited-link`, `--hnr-border-subtle`, and `--hnr-vote-arrow` theme variables.
- Produces: automatic CSS behavior for increased contrast, keyboard focus, and fragment-targeted `.comtr` rows.

- [x] **Step 1: Add contrast calculation helpers to the CSS test**

Add these helpers after the imports in `tests/css-rules.test.js`:

```js
function hexChannels(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function mixChannels(foreground, background, foregroundWeight) {
  return foreground.map((channel, index) =>
    Math.round(channel * foregroundWeight + background[index] * (1 - foregroundWeight)),
  );
}

function relativeLuminance(channels) {
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function readTheme(path) {
  return JSON.parse(fs.readFileSync(path, "utf8")).tokens;
}

function contrastMixWeight(css, cssToken) {
  const match = css.match(
    new RegExp(
      `--hnr-${cssToken}:\\s*color-mix\\(in srgb, var\\(--hnr-text-primary\\) (\\d+)%, var\\(--hnr-content-background\\)\\)`,
    ),
  );

  assert.ok(match, `missing increased-contrast mix for ${cssToken}`);
  return Number(match[1]) / 100;
}
```

- [x] **Step 2: Add failing behavior tests**

Append these tests to `tests/css-rules.test.js`:

```js
test("system increased contrast strengthens secondary theme colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const contrastMediaIndex = css.indexOf("@media (prefers-contrast: more)");
  const contrastMedia = css.slice(contrastMediaIndex);
  const tokenPairs = [
    ["text-muted", "textMuted"],
    ["visited-link", "visitedLink"],
    ["border-subtle", "borderSubtle"],
    ["vote-arrow", "voteArrow"],
  ];

  assert.ok(contrastMediaIndex >= 0);

  for (const themePath of ["extension/themes/hn-light.json", "extension/themes/hn-dark.json"]) {
    const tokens = readTheme(themePath);
    const primary = hexChannels(tokens.textPrimary);
    const background = hexChannels(tokens.contentBackground);

    for (const [cssToken, themeToken] of tokenPairs) {
      const original = hexChannels(tokens[themeToken]);
      const mixed = mixChannels(primary, background, contrastMixWeight(contrastMedia, cssToken));
      assert.ok(
        contrastRatio(mixed, background) > contrastRatio(original, background),
        `${themePath} ${themeToken} contrast should increase`,
      );
    }
  }
});

test("content CSS exposes keyboard focus without pointer-only focus styling", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /:where\(a\[href\], button, input, select, textarea\):focus-visible\s*{[^}]*outline:\s*2px solid Highlight[^}]*outline-offset:\s*2px/s,
  );
  assert.doesNotMatch(
    css,
    /:where\(a\[href\], button, input, select, textarea\):focus(?!-visible)/,
  );
});

test("fragment-targeted comments receive restrained orientation feedback", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /\.comtr:target\s*{[^}]*scroll-margin-block:\s*1\.5rem/s);
  assert.match(
    css,
    /\.comtr:target\s+\.default\s*{[^}]*box-shadow:\s*inset 3px 0 0 0 var\(--hnr-top-bar-background[^}]*background:\s*color-mix\(/s,
  );
  assert.doesNotMatch(css, /animation:/);
});
```

- [x] **Step 3: Run the focused tests and verify failure**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: the three new tests fail because the media query, focus rule, and
targeted-comment rule do not exist.

- [x] **Step 4: Add the minimal CSS implementation**

Add this block before the responsive media queries in
`extension/content/content.css`:

```css
:where(a[href], button, input, select, textarea):focus-visible {
  outline: 2px solid Highlight;
  outline-offset: 2px;
}

.comtr:target {
  scroll-margin-block: 1.5rem;
}

.comtr:target .default {
  box-shadow: inset 3px 0 0 0 var(--hnr-top-bar-background, #ff6600);
  background: color-mix(
    in srgb,
    var(--hnr-top-bar-background, #ff6600) 10%,
    var(--hnr-content-background, #f6f6ef)
  );
}

@media (prefers-contrast: more) {
  html {
    --hnr-text-muted: color-mix(
      in srgb,
      var(--hnr-text-primary) 78%,
      var(--hnr-content-background)
    );
    --hnr-visited-link: color-mix(
      in srgb,
      var(--hnr-text-primary) 74%,
      var(--hnr-content-background)
    );
    --hnr-border-subtle: color-mix(
      in srgb,
      var(--hnr-text-primary) 48%,
      var(--hnr-content-background)
    );
    --hnr-vote-arrow: color-mix(
      in srgb,
      var(--hnr-text-primary) 72%,
      var(--hnr-content-background)
    );
  }
}
```

- [x] **Step 5: Run focused tests and verify green**

Run:

```bash
node --test tests/css-rules.test.js
```

Expected: every CSS rule test passes, including calculated contrast improvement
for both theme JSON files.

- [x] **Step 6: Confirm the JavaScript boundary and commit**

Run:

```bash
git diff --exit-code -- extension/content/content-script.js
git diff --check
git add extension/content/content.css tests/css-rules.test.js
git commit -m "Honor system accessibility preferences"
```

Expected: the JavaScript diff is empty and the CSS/test commit succeeds.

---

### Task 2: Maintainer Documentation

**Files:**

- Modify: `tests/docs-handoff.test.js`
- Modify: `docs/development.md`
- Modify: `docs/project-status.md`

**Interfaces:**

- Consumes: the CSS behavior completed in Task 1.
- Produces: durable scope and verification guidance for future maintainers.

- [x] **Step 1: Add a failing documentation guard**

Append to `tests/docs-handoff.test.js`:

```js
test("docs preserve automatic WebKit accessibility enhancements", () => {
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [development, status]) {
    assert.match(doc, /prefers-contrast: more/);
    assert.match(doc, /:focus-visible/);
    assert.match(doc, /\.comtr:target/);
    assert.match(doc, /CSS-only/);
  }

  assert.match(development, /System,\s+Light,\s+and Dark/);
  assert.match(development, /parent.*root.*next.*prev/s);
});
```

- [x] **Step 2: Run the documentation test and verify failure**

Run:

```bash
node --test tests/docs-handoff.test.js
```

Expected: the new test fails because current operational docs do not describe
the behavior.

- [x] **Step 3: Document implementation and acceptance boundaries**

Add an `Automatic Accessibility Enhancements` section to
`docs/development.md` stating:

```markdown
## Automatic Accessibility Enhancements

HN Refined keeps system accessibility behavior automatic and CSS-only. The
`prefers-contrast: more` media query strengthens secondary colors for System,
Light, and Dark themes without adding a user preference. A shared
`:focus-visible` rule exposes keyboard focus without forcing focus rings after
ordinary pointer or touch interaction.

Hacker News' in-thread `parent`, `root`, `next`, and `prev` links use comment
fragments. HN Refined applies `.comtr:target` for a restrained persistent marker
and scroll margin. Keep this binding limited to Hacker News comment rows; do not
add fragment observers, timers, animations, or DOM mutation.

Real Safari checks must cover macOS keyboard navigation and Increase Contrast
across all three theme choices, plus iPhone or iPad in-thread comment navigation
in portrait and landscape.
```

Add a matching Current Implementation bullet to `docs/project-status.md` that
uses the exact terms `CSS-only`, `prefers-contrast: more`, `:focus-visible`, and
`.comtr:target`, and records real Safari acceptance as pending until Task 3 is
confirmed.

- [x] **Step 4: Run documentation and full checks**

Run:

```bash
node --test tests/docs-handoff.test.js
make format
make check
```

Expected: all documentation tests and the complete repository quality gate pass.

- [x] **Step 5: Commit the documentation boundary**

Run:

```bash
git add docs/development.md docs/project-status.md tests/docs-handoff.test.js
git commit -m "Document automatic accessibility behavior"
```

Expected: the documentation commit succeeds with no unrelated files staged.

---

### Task 3: Real Safari Acceptance

**Files:**

- Modify after acceptance: `docs/project-status.md`

**Interfaces:**

- Consumes: committed CSS behavior and documented acceptance checklist.
- Produces: installed Safari extension evidence and final project-status record.

- [x] **Step 1: Re-run the complete local gate**

Run:

```bash
make format
make check
```

Expected: formatting is clean and all tests pass.

- [x] **Step 2: Refresh the installed macOS Safari extension**

Run:

```bash
make safari-reinstall
make safari-doctor
```

Expected: the stable repo-local app is installed, its package resources pass the
doctor checks, and Hacker News opens in Safari.

- [ ] **Step 3: Perform macOS Safari acceptance**

With the maintainer observing Safari:

1. In Light, Dark, and System themes, enable macOS Increase Contrast and verify
   metadata, visited links, vote arrows, and form borders become stronger while
   retaining their hierarchy.
2. Use Tab and Shift-Tab through header links, story links, comment controls,
   and form fields; verify the system-colored outline is clear.
3. Click or touch ordinary controls and verify keyboard-only focus treatment is
   not left on pointer interactions.
4. Use a comment's `parent`, `root`, `next`, or `prev` link and verify the
   selected comment keeps a thin accent line and light background without
   shifting the comment layout.

- [ ] **Step 4: Perform iPhone or iPad Safari acceptance**

Use Hacker News' in-thread `parent`, `root`, `next`, or `prev` comment navigation
in portrait and landscape. Verify the target marker identifies the intended
comment, respects indentation, and does not interfere with voting, collapsing,
replying, or scrolling. Confirm ordinary touch interaction does not display
inappropriate focus outlines.

- [ ] **Step 5: Record completed acceptance**

After the maintainer confirms both platforms, replace the pending acceptance
sentence in `docs/project-status.md` with a concise record naming the tested
macOS and iOS/iPadOS Safari surfaces. Then run:

```bash
make format
make check
git add docs/project-status.md
git commit -m "Record accessibility Safari acceptance"
```

Expected: all checks pass, the acceptance record is committed, and
`git status --short` is empty.

# Hacker News Color Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Hacker News' complete light color meaning and ship a coherent,
documented dark semantic translation without overriding HN-owned custom colors.

**Architecture:** Theme JSON becomes the canonical normal-palette contract and
generates explicit CSS custom properties. The content stylesheet maps those
properties only to exact HN semantic roles, while explicit light/dark increased-
contrast blocks preserve a strictly ordered ten-level comment ladder. Static CSS
attribute selectors recognize only HN's known default colors, so custom top bars
and unknown inline signals pass through without JavaScript.

**Tech Stack:** Safari WebExtension CSS, JSON theme data, vanilla Node.js build
and validation scripts, Node test runner, Markdown documentation, Makefile/Xcode
Safari packaging workflow.

## Global Constraints

- Normal Light must reproduce current Hacker News colors exactly for every
  HN-defined role.
- Dark must use the approved explicit semantic values from
  `docs/superpowers/specs/2026-08-01-hn-color-semantics-design.md`.
- `prefers-contrast: more` remains CSS-only, improves every faded-comment level,
  preserves strict ordering, and leaves the deepest level visibly faded.
- Only a header cell whose `bgcolor` is exactly `#ff6600`, case-insensitively,
  may receive the dark top-bar mapping and Logo C treatment.
- Logo C is `filter: saturate(0.78) brightness(0.9); opacity: 0.82;` and applies
  only to the mapped default header in dark appearance.
- Custom `topcolor`, seasonal or memorial colors, and unknown inline colors pass
  through unchanged.
- Preserve HN's original `triangle.svg`; remove the ineffective `voteArrow`
  theme surface and CSS declaration.
- Keep new-account, own-item, and YC-alumni roles as separate tokens even when
  two roles share a color.
- Add no preference, runtime JavaScript, permission, remote resource, or new logo
  asset.
- Keep the `.toptext` primary-reading exception and all Thread Focus behavior.
- Do not create implementation commits until the maintainer explicitly asks;
  retain each task as a reviewable working-tree checkpoint.

---

### Task 1: Replace the broad theme schema with the semantic palette

**Files:**

- Modify: `tests/theme-validator.test.js`
- Modify: `scripts/validate-themes.js`
- Modify: `extension/themes/hn-light.json`
- Modify: `extension/themes/hn-dark.json`
- Regenerate: `extension/generated/themes.css`

**Interfaces:**

- Consumes: `validateTheme(theme) -> string[]` and `REQUIRED_TOKENS` from
  `scripts/validate-themes.js`.
- Produces: CSS variables named from the 25 JSON keys with the existing
  camelCase-to-kebab-case generator: `--hnr-page-background` through
  `--hnr-comment-fade9`.

- [ ] **Step 1: Write failing theme-contract tests**

  Replace the `validTheme.tokens` fixture with all approved semantic tokens and
  update the dark-palette assertion to the literal approved values. Add literal
  assertions that the light theme equals HN's documented normal palette and
  that both comment ladders are strictly ordered by contrast against their
  backgrounds:

  ```js
  const semanticTokenNames = [
    "pageBackground",
    "contentBackground",
    "topBarBackground",
    "textPrimary",
    "textSecondary",
    "linkPrimary",
    "linkVisited",
    "linkSecondary",
    "topBarText",
    "topBarLink",
    "topBarSelected",
    "userNew",
    "ownItemMarker",
    "ycAlumniUser",
    "borderSubtle",
    "focusDivider",
    "commentFade1",
    "commentFade2",
    "commentFade3",
    "commentFade4",
    "commentFade5",
    "commentFade6",
    "commentFade7",
    "commentFade8",
    "commentFade9",
  ];

  test("bundled themes expose only the complete semantic contract", () => {
    for (const path of ["extension/themes/hn-light.json", "extension/themes/hn-dark.json"]) {
      const { tokens } = JSON.parse(fs.readFileSync(path, "utf8"));
      assert.deepEqual(Object.keys(tokens), semanticTokenNames);
    }
  });
  ```

  The mutation caught is reintroducing a broad token, omitting a semantic role,
  or flattening/reordering a comment level.

- [ ] **Step 2: Run the theme tests and verify RED**

  Run: `node --test tests/theme-validator.test.js`

  Expected: FAIL because the current validator and bundled themes still expose
  `textMuted`, `link`, `visitedLink`, and `voteArrow` and lack the new roles.

- [ ] **Step 3: Implement the semantic theme contract**

  Replace `REQUIRED_TOKENS` and both JSON token maps with the exact values from
  the approved design. Preserve the current static-color validation and theme
  metadata rules. Do not add aliases for removed tokens: an old or third-party
  theme using them must fail validation rather than silently lose meaning.

- [ ] **Step 4: Regenerate CSS and verify GREEN**

  Run:

  ```bash
  make build-themes
  node --test tests/theme-validator.test.js
  ```

  Expected: PASS; generated CSS exposes all semantic variables for fixed Light,
  fixed Dark, and System dark appearance, with no `--hnr-vote-arrow`.

---

### Task 2: Map exact HN roles, full comment ladders, contrast, and logo

**Files:**

- Modify: `tests/css-rules.test.js`
- Modify: `extension/content/content.css`

**Interfaces:**

- Consumes: semantic CSS variables generated by Task 1.
- Produces: selector-level color behavior for normal HN application pages; no
  JavaScript or DOM mutation.

- [ ] **Step 1: Write failing selector and cascade tests**

  Replace tests for the broad variables with behavior-focused assertions that:

  ```js
  test("content CSS preserves HN color roles instead of flattening links", () => {
    const css = fs.readFileSync("extension/content/content.css", "utf8");
    assert.match(css, /\.topsel\s+a:link,\s*\.topsel\s+a:visited\s*\{[^}]*--hnr-top-bar-selected/s);
    assert.match(css, /\.hnmore\s+a:link,\s*\.hnmore\s+a:visited\s*\{[^}]*--hnr-link-secondary/s);
    assert.doesNotMatch(css, /#hnmain\s+td\s+a:(?:link|visited)/);
  });

  test("every HN faded-comment class has its own semantic color", () => {
    const css = fs.readFileSync("extension/content/content.css", "utf8");
    for (const [className, token] of [
      ["c5a", "comment-fade1"],
      ["c73", "comment-fade2"],
      ["c82", "comment-fade3"],
      ["c88", "comment-fade4"],
      ["c9c", "comment-fade5"],
      ["cae", "comment-fade6"],
      ["cbe", "comment-fade7"],
      ["cce", "comment-fade8"],
      ["cdd", "comment-fade9"],
    ]) {
      assert.match(css, new RegExp(`\\.commtext\\.${className}[^}]*--hnr-${token}`, "s"));
    }
  });
  ```

  Add tests for these observable boundaries:

  - normal and `prefers-contrast: more` variables contain the literal light and
    dark values from the spec;
  - each increased-contrast faded value has a higher contrast ratio than its
    normal counterpart, and both ladders remain strict;
  - the default `#ff6600` header is the only header background selector;
  - dark fixed and System-dark default headers apply Logo C to
    `img[src="y18.svg"]`, while Light and arbitrary `bgcolor` do not;
  - `.hnuser > font[color="#3c963c" i]` maps only the recognized new-user
    marker; `.hnuser > font[color="#ff6600" i]` maps the YC-alumni marker;
    `.votelinks font[color="#ff6600" i]` maps the own-item marker;
  - no generic `font[color]` selector exists, leaving unknown signals untouched;
  - no `.votearrow` color override or triangle asset change exists.

  The mutation caught is a broad selector that destroys `.topsel`, `.hnmore`,
  a custom top bar, an inline signal, or a faded-comment level.

- [ ] **Step 2: Run CSS tests and verify RED**

  Run: `node --test tests/css-rules.test.js`

  Expected: FAIL on missing semantic mappings, explicit ladders and logo rules,
  and on the current broad `#hnmain td a` and ineffective `.votearrow` rules.

- [ ] **Step 3: Implement narrow semantic CSS**

  Update base rules to use `textPrimary`, `textSecondary`, `linkPrimary`,
  `linkVisited`, and `linkSecondary`. Keep ordinary global link defaults but
  remove the broad `#hnmain td a` overrides. Add narrow selectors for metadata,
  comment metadata, reply links, footer links, `.hnmore`, top-bar text/links,
  and `.topsel`.

  Map `.commtext.c00` to primary and each remaining class separately. Include
  each class's descendant `a:link` and `a:visited`, matching HN's own rule so a
  faded comment cannot regain emphasis through a link.

  Replace the current generic color-mix contrast block with explicit Light,
  Dark, and System-dark semantic values. Use the exact normal and increased-
  contrast tables in the spec.

  Scope the known inline-color selectors to their structural roles. Keep them
  case-insensitive and exact; do not use substring matching. If live HN markup
  does not match those historical `<font color>` structures, no override occurs.

  Scope Logo C beneath the exact default-header selector and only within fixed
  Dark or System-dark. Do not use `!important`, replace the asset, or affect a
  custom header.

- [ ] **Step 4: Run CSS and theme tests and verify GREEN**

  Run:

  ```bash
  node --test tests/css-rules.test.js tests/theme-validator.test.js
  ```

  Expected: PASS with strict ladders, restored HN navigation roles, conditional
  Logo C, and no vote-arrow override.

---

### Task 3: Publish and guard the semantic reference

**Files:**

- Create: `docs/color-semantics.md`
- Modify: `docs/theme-contribution.md`
- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Modify: `docs/app-store-checklist.md`
- Review without expected change: `AGENTS.md`
- Review without expected change: `docs/privacy.md`
- Modify: `tests/docs-handoff.test.js`

**Interfaces:**

- Consumes: canonical theme JSON and explicit contrast values from Tasks 1–2.
- Produces: stable public color reference and fresh-agent/device-verification
  guidance.

- [ ] **Step 1: Write failing documentation-contract tests**

  Add one test that reads the new public reference and checks behavior rather
  than incidental prose:

  ```js
  test("public docs preserve the HN color semantic contract", () => {
    const colors = read("docs/color-semantics.md");
    const development = read("docs/development.md");
    const status = read("docs/project-status.md");
    assert.match(colors, /official Hacker News.*light/is);
    assert.match(colors, /dark.*semantic translation/is);
    assert.match(colors, /new account.*own.*YC alumni/is);
    assert.match(colors, /custom.*topcolor.*unchanged/is);
    assert.match(colors, /\.c5a.*\.cdd/is);
    assert.match(development, /Logo C|saturate\(0\.78\).*opacity:\s*0\.82/is);
    assert.match(status, /color semantics.*complete/is);
  });
  ```

  Extend the test to parse the backtick-wrapped hex pairs in the normal role and
  comment tables, comparing literal documented values to the corresponding
  bundled JSON tokens. The expected mapping is a test-owned literal object, not
  derived from production code.

- [ ] **Step 2: Run docs tests and verify RED**

  Run: `node --test tests/docs-handoff.test.js`

  Expected: FAIL because `docs/color-semantics.md` does not exist and project
  status still lists color alignment as unfinished.

- [ ] **Step 3: Write the public and handoff documentation**

  Create `docs/color-semantics.md` with both normal palettes, both complete
  comment ladders, increased-contrast values, semantic explanations, fail-open
  dynamic-color policy, and conditional Logo C rule. Link to the official HN
  FAQ, current stylesheet, and the Vale article.

  Replace the old theme contribution token list. Update project status from the
  release pause to implemented/awaiting physical-device burn-in, add exact
  light/dark/System/Increase Contrast Safari checks to development guidance, and
  add the release-candidate color checklist. Record that privacy, permissions,
  JavaScript, and remote-resource behavior did not change.

- [ ] **Step 4: Run docs tests and verify GREEN**

  Run: `node --test tests/docs-handoff.test.js`

  Expected: PASS and the public values agree with the bundled theme contract.

---

### Task 4: Synchronize Safari resources and complete verification

**Files:**

- Synchronize from `extension/` into:
  `HNRefined/Shared (Extension)/Resources/`
- Modify only if needed by findings: tests or documentation from Tasks 1–3

**Interfaces:**

- Consumes: completed canonical extension resources.
- Produces: signed locally installed Safari extension containing the same
  semantic themes and CSS.

- [ ] **Step 1: Format and run the complete local gate**

  Run:

  ```bash
  make format
  make check
  ```

  Expected: all formatting, theme validation, generated CSS, manifest, no-remote,
  unit, CSS, documentation, workflow, and package tests pass with zero failures.

- [ ] **Step 2: Reinstall the packaged Safari extension**

  Run: `make safari-reinstall`

  Expected: repo-local build succeeds, extension resources synchronize into the
  Xcode wrapper, signed app installs under `~/Applications`, stale registrations
  are removed, and the installed extension is refreshed.

- [ ] **Step 3: Run package sanity checks**

  Run: `make safari-doctor`

  Expected: installed bundle identifiers/signature and packaged extension
  resources are valid. If sandbox visibility prevents a non-product diagnostic,
  report that exact limitation separately from build/test results.

- [ ] **Step 4: Inspect packaged parity and working-tree scope**

  Run:

  ```bash
  diff -ru extension "HNRefined/Shared (Extension)/Resources"
  git diff --check
  git status --short
  ```

  Expected: no extension-resource difference, no whitespace errors, and only
  the planned source, generated, mirrored, test, plan, and documentation files
  are modified.

- [ ] **Step 5: Perform Safari acceptance**

  In Safari, check fixed Light, fixed Dark, and System on a story list, item page,
  faded-comment thread, forms, and Thread Focus. Toggle macOS Increase Contrast.
  Confirm `.topsel`, `.hnmore`, visited links, full comment fading, custom
  `topcolor`, and conditional Logo C. If new-user, own-item, or YC-alumni markup
  is not available to the current account, record that as a physical-account
  acceptance item while retaining selector and fixture coverage.

- [ ] **Step 6: Present the verified working tree for maintainer review**

  Report the exact test count, Safari build/reinstall result, doctor result,
  visually checked surfaces, any account-only signal not directly observed, and
  the complete changed-file scope. Do not create a Git commit until the
  maintainer asks after reviewing the implementation.

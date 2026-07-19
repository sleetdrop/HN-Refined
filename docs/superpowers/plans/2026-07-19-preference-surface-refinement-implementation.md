# Preference Surface Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HN Classic the default font, clarify first-release setting labels, and remove the obsolete mobile-layout preference without disabling automatic mobile CSS.

**Architecture:** Keep the existing independent preference axes and stored enum values. Shrink shared and content-script normalization to user-configurable values, then set the mobile CSS binding to `auto` as an implementation constant.

**Tech Stack:** Vanilla JavaScript, HTML, Node.js test runner, CSS root data attributes, Safari WebExtension Xcode wrapper.

## Global Constraints

- Keep `Mono-ish` available.
- Do not change the Popup controls or preference refresh behavior.
- Do not rename stored font, density, or width enum values.
- Legacy `mobileLayout` values must be discarded while mobile CSS remains enabled.

---

### Task 1: Preference Schema and Mobile Binding

**Files:**

- Modify: `tests/defaults.test.js`
- Modify: `tests/preference-store.test.js`
- Modify: `tests/content-script.test.js`
- Modify: `tests/popup-behavior.test.js`
- Modify: `tests/preference-messages.test.js`
- Modify: `extension/shared/defaults.js`
- Modify: `extension/content/content-script.js`

- [x] Update tests to expect `fontPreset: "hn-classic"` by default and no `mobileLayout` key.
- [x] Add a legacy normalization case with `mobileLayout: "off"` and require that the result omits it.
- [x] Run focused tests and confirm failure against the old schema.
- [x] Remove `mobileLayout` from both normalizers and set `root.dataset.hnrMobile = "auto"` directly.
- [x] Update preference fixtures to the reduced schema and rerun focused tests.

### Task 2: User-Facing Labels and Documentation

**Files:**

- Modify: `tests/popup.test.js`
- Modify: `extension/options/options.html`
- Modify: `docs/project-status.md`
- Modify: `docs/development.md`

- [x] Add assertions for HN Classic first/default ordering, retained Mono, and the approved labels.
- [x] Run the focused UI test and confirm failure against the old labels.
- [x] Update only option labels, section text, and documentation.
- [x] Run the focused UI and documentation tests.

### Task 3: Package and Runtime Verification

**Files:**

- Update through sync: `HNRefined/Shared (Extension)/Resources/`

- [x] Run `make format && make check`.
- [x] Build, install, and launch the iOS app on the fixed iPhone Simulator target.
- [x] Run `make safari-reinstall && make safari-doctor`.
- [x] Verify the option labels and HN Classic fallback in tests, retain an existing Serif choice at runtime, and inspect automatic mobile layout on iPhone Simulator.
- [x] Confirm canonical and packaged resources match, then commit the implementation.

# Host App Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the first-release containing app with consistent HN Refined naming, complete iPhone/iPad enablement guidance, and best-effort extension status on current Apple systems.

**Architecture:** Keep the generated single local WKWebView host page. Extend the existing Swift-to-JavaScript `show(platform, enabled)` bridge with an availability-guarded iOS state lookup and foreground refresh, while retaining static instructions as the failure and older-system fallback.

**Tech Stack:** Swift, UIKit, AppKit, SafariServices, WKWebView, local HTML/CSS/JavaScript, Xcode build settings, Node.js static tests.

## Global Constraints

- All user-visible names use `HN Refined` or `HN Refined Extension`.
- Keep Xcode target names, Swift module names, wrapper/executable paths, and bundle identifiers unchanged. The app targets use the spaced logical `PRODUCT_NAME` while preserving `HNRefined.app` and its `HNRefined` executable.
- Keep the iOS 15.0 and macOS 10.14 deployment targets unchanged in this task.
- Use `SFSafariExtensionManager.getStateOfExtension` only behind `#available(iOS 26.2, *)`.
- Static iPhone/iPad setup guidance remains visible in every status state.
- Do not add private Settings URLs, remote content, analytics, dependencies, or permissions.

---

### Task 1: Lock Product Naming and Onboarding Contract

**Files:**

- Modify: `tests/host-app.test.js`
- Modify: `tests/safari-dev-script.test.js`
- Modify: `HNRefined/HNRefined.xcodeproj/project.pbxproj`
- Modify: `HNRefined/macOS (App)/Base.lproj/Main.storyboard`

**Interfaces:**

- Consumes: existing app and extension bundle identifiers.
- Produces: user-visible display names `HN Refined` and `HN Refined Extension` while preserving the existing wrapper, executable, module, and bundle identifiers.

- [x] Add failing assertions that all eight `INFOPLIST_KEY_CFBundleDisplayName` values use spaced names, the macOS menu/window strings use `HN Refined`, stable wrapper/module settings remain unchanged, and both bundle identifiers remain unchanged.
- [x] Run `node --test tests/host-app.test.js tests/safari-dev-script.test.js` and confirm failures against the unspaced display names.
- [x] Set spaced display and logical product names while explicitly preserving `HNRefined.app`, the `HNRefined` executable and module, target names, and identifiers.
- [x] Rerun the focused tests and confirm the naming assertions pass.

### Task 2: Add Progressive iPhone and iPad Status Guidance

**Files:**

- Modify: `tests/host-app.test.js`
- Modify: `HNRefined/Shared (App)/ViewController.swift`
- Modify: `HNRefined/Shared (App)/Resources/Base.lproj/Main.html`
- Modify: `HNRefined/Shared (App)/Resources/Script.js`
- Modify: `HNRefined/Shared (App)/Resources/Style.css`

**Interfaces:**

- Consumes: `show(platform, enabled, useSettingsInsteadOfPreferences)` and `extensionBundleIdentifier`.
- Produces: `refreshExtensionState()` and an iOS foreground notification callback that invoke `show('ios', true|false)` when status is available.

- [x] Add failing tests for the exact Settings path, `Allow Extension`, `news.ycombinator.com`, state-on/off/unknown iOS text, `#available(iOS 26.2, *)`, `getStateOfExtension`, foreground refresh registration, best-effort error fallback, removed iOS scroll lock, and local-only resources.
- [x] Run `node --test tests/host-app.test.js` and confirm failures identify the missing status-aware onboarding.
- [x] Import SafariServices for iOS, track when web content is ready, register and remove `UIApplication.didBecomeActiveNotification`, and implement `refreshExtensionState()` with this behavior:

```swift
guard webContentReady else { return }
if #available(iOS 26.2, *) {
    SFSafariExtensionManager.getStateOfExtension(withIdentifier: extensionBundleIdentifier) { [weak self] state, error in
        guard let self, let state, error == nil else { return }
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript("show('ios', \(state.isEnabled))")
        }
    }
}
```

- [x] Keep `show('ios')` as the initial static fallback, then call `refreshExtensionState()` after the WKWebView finishes loading and whenever the app becomes active.
- [x] Replace the iOS host content with persistent setup instructions plus state-on, state-off, and state-unknown paragraphs. Update all Mac copy and image alt text to `HN Refined`.
- [x] Remove the iOS `isScrollEnabled = false` assignment. Update the local CSS to use `min-height: 100%`, safe padding, readable line height, and natural overflow while preserving the centered compact page.
- [x] Rerun `node --test tests/host-app.test.js tests/safari-dev-script.test.js` and confirm all focused tests pass.

### Task 3: Documentation, Packaging, and Runtime Acceptance

**Files:**

- Modify: `docs/project-status.md`
- Modify: `docs/development.md`
- Modify: `docs/release-readiness.md`
- Modify: `tests/docs-handoff.test.js`

**Interfaces:**

- Consumes: completed host behavior from Tasks 1 and 2.
- Produces: maintained release evidence and regression guidance for future agents.

- [x] Add failing documentation assertions for the spaced display name, exact mobile setup path, iOS 26.2 progressive status, older-system fallback, and inability to infer website permission from extension enabled state.
- [x] Update the three current operational documents with those exact constraints and the host-app verification matrix.
- [x] Run `make format && make check` and confirm all tests pass.
- [x] Run `make safari-reinstall && make safari-doctor`, then build and launch the current iPhone and iPad simulator targets.
- [x] Verify on iPhone and iPad that on/off state copy is correct, instructions remain visible, returning from Settings refreshes status, and small screens can scroll without clipping.
- [x] Verify on macOS that the spaced naming, enabled/disabled copy, and Safari Settings handoff remain correct.
- [x] Confirm bundle identifiers, deployment targets, canonical extension resources, and signing hygiene are unchanged; run `git diff --check` before committing.

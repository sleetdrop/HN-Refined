# Local Signing Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Apple Team IDs out of the tracked Xcode project into an ignored optional local build configuration without changing existing CLI signing behavior.

**Architecture:** A tracked target-level `Signing.xcconfig` optionally includes `Signing.local.xcconfig`. All eight iOS/macOS app and extension Debug/Release configurations reference the tracked file; the ignored local file supplies `DEVELOPMENT_TEAM` for interactive Xcode builds, while command-line overrides retain highest precedence.

**Tech Stack:** Xcode project format, `.xcconfig`, Git ignore rules, Node.js built-in test runner, existing Makefile Safari workflows.

## Global Constraints

- Never commit a personal Apple Team ID, signing identity, or provisioning profile.
- Do not ignore or mark `project.pbxproj` as `skip-worktree`.
- A fresh clone without `Signing.local.xcconfig` must still parse and build through existing unsigned or CLI-configured workflows.
- Keep `HNREFINED_DEVELOPMENT_TEAM` and automatic certificate detection unchanged.

---

### Task 1: Local Signing Configuration

**Files:**

- Create: `HNRefined/Config/Signing.xcconfig`
- Create locally, ignored: `HNRefined/Config/Signing.local.xcconfig`
- Modify: `.gitignore`
- Modify: `HNRefined/HNRefined.xcodeproj/project.pbxproj`
- Modify: `tests/open-source-safety.test.js`
- Modify: `docs/development.md`
- Modify: `docs/project-status.md`

**Interfaces:**

- Consumes: Xcode target build configurations and the existing CLI `DEVELOPMENT_TEAM` override.
- Produces: an optional local Team ID source used by all app and extension targets.

- [x] **Step 1: Add failing repository-safety tests**

Assert that the shared configuration contains exactly the optional include, the
local file is ignored, all eight target configurations reference the shared
file, and no tracked file contains a concrete Team ID:

```js
const signingConfig = readFileSync("HNRefined/Config/Signing.xcconfig", "utf8");
assert.match(signingConfig, /#include\?\s+"Signing\.local\.xcconfig"/);
assert.equal(
  execFileSync("git", ["check-ignore", "-q", "HNRefined/Config/Signing.local.xcconfig"], {
    stdio: "ignore",
  }),
  undefined,
);
assert.equal((project.match(/baseConfigurationReference = .*Signing\.xcconfig/g) ?? []).length, 8);
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/open-source-safety.test.js`

Expected: failure because `Signing.xcconfig` and its project references do not exist.

- [x] **Step 3: Add shared and local configurations**

Create the tracked file:

```xcconfig
// Developer-specific signing belongs in the ignored sibling file.
#include? "Signing.local.xcconfig"
```

Add `/HNRefined/Config/Signing.local.xcconfig` to `.gitignore`. Create that local
file with the maintainer's current value:

```xcconfig
DEVELOPMENT_TEAM = CURRENT_LOCAL_TEAM_ID
```

- [x] **Step 4: Map all target configurations**

Add `Signing.xcconfig` as a `PBXFileReference`, place it in a `Config` group, and
set its file reference as `baseConfigurationReference` on these configurations:

```text
D6102822  iOS extension Debug
D6102823  iOS extension Release
D6102826  iOS app Debug
D6102827  iOS app Release
D6102829  macOS extension Debug
D610282A  macOS extension Release
D610282D  macOS app Debug
D610282E  macOS app Release
```

Remove all concrete `DEVELOPMENT_TEAM` assignments from `project.pbxproj`.

- [x] **Step 5: Document the local workflow**

Document the optional local file, explain that Xcode resolves it automatically,
and preserve the existing CLI override guidance. Update project status with the
new open-source signing boundary.

- [x] **Step 6: Run focused tests and inspect resolved settings**

Run:

```bash
node --test tests/open-source-safety.test.js tests/safari-dev-script.test.js
xcodebuild -project HNRefined/HNRefined.xcodeproj -scheme "HNRefined (iOS)" -configuration Debug -showBuildSettings
xcodebuild -project HNRefined/HNRefined.xcodeproj -scheme "HNRefined (macOS)" -configuration Debug -showBuildSettings
```

Expected: tests pass and both schemes resolve the local `DEVELOPMENT_TEAM`.

- [x] **Step 7: Run full validation and platform builds**

Run:

```bash
make format
make check
make safari-build-ios
make safari-reinstall
make safari-doctor
```

Expected: all checks and builds pass, Safari registers the stable installed app,
and after commit `git status --short` does not show `project.pbxproj` or the
ignored local file.

- [x] **Step 8: Commit**

Stage only the shared configuration, Xcode mapping, ignore rule, tests, docs,
design, and plan. Verify the staged diff contains no Team ID, then commit:

```bash
git commit -m "Keep Apple signing team local"
```

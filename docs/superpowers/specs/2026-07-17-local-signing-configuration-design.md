# Local Signing Configuration Design

## Goal

Keep developer-specific Apple Team IDs out of the tracked Xcode project while
allowing Xcode device builds to resolve a maintainer's local signing team without
making `project.pbxproj` permanently dirty.

## Configuration Structure

The repository will track `HNRefined/Config/Signing.xcconfig`. Every iOS and
macOS app and extension Debug/Release build configuration will use it as the
target configuration's base configuration.

The shared file contains no signing identity and optionally includes
`Signing.local.xcconfig` from the same directory:

```xcconfig
#include? "Signing.local.xcconfig"
```

`HNRefined/Config/Signing.local.xcconfig` is ignored by Git. A developer who
needs Xcode device signing creates it locally with:

```xcconfig
DEVELOPMENT_TEAM = YOUR_TEAM_ID
```

The maintainer's current local Team ID will move from `project.pbxproj` into
that ignored file. A fresh clone without the local file retains automatic
signing settings but contains no developer-specific Team ID.

## Build Precedence

The existing Safari development script continues to detect a signing identity
and pass `DEVELOPMENT_TEAM` to `xcodebuild`. Command-line build settings have
higher precedence than target configuration files, so the repository workflow
remains unchanged.

Interactive Xcode builds resolve the Team ID from the optional local file. The
maintainer should not need to select the team again after the local file exists.

## Repository Safety

Do not ignore `project.pbxproj`, use `skip-worktree`, or commit a Team ID. Those
approaches either hide legitimate project changes or leak developer-local build
configuration into the shared project.

Automated checks will verify:

- The tracked project contains no `DEVELOPMENT_TEAM` assignment.
- The shared signing configuration contains the optional local include.
- The local signing file is ignored.
- The project maps the shared configuration to every app and extension build
  configuration.
- Existing CLI signing overrides and iOS/macOS builds continue to work.

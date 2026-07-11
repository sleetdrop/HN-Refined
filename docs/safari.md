# Safari Development

The WebExtension source lives in `extension/`.

Use the current Makefile workflow for local Safari development:

```bash
make check
make safari-reinstall
make safari-doctor
```

This is the supported local workflow for this repository. It builds into
repo-local `.build/xcode-derived-data`, installs the signed app to
`~/Applications/HNRefined.app`, removes stale HN Refined PluginKit
registrations, registers the installed app, and opens Hacker News explicitly in
Safari.

Do not register extension builds from `/tmp` or random Xcode DerivedData paths.
That caused duplicate and stale extension registrations during development.

## Local Wrapper Generation

The original macOS-only Safari wrapper in `HNRefined/` was generated locally with:

```bash
xcrun safari-web-extension-converter extension --project-location . --app-name HNRefined --bundle-identifier org.hnrefined.HNRefined --macos-only --no-open --no-prompt
```

The current first-release wrapper was rebuilt for all platforms with:

```bash
xcrun safari-web-extension-converter extension --rebuild-project HNRefined/HNRefined.xcodeproj --project-location .build/ios-rebuild-preview --app-name HNRefined --bundle-identifier org.hnrefined.HNRefined --swift --no-open --no-prompt --force
```

The rebuilt project contains `HNRefined (iOS)` and `HNRefined (macOS)` schemes.
The committed project keeps the generated all-platform wrapper in
`HNRefined/`, while repo workflows sync the root `extension/` directory into
`HNRefined/Shared (Extension)/Resources` before Xcode builds.

The converter is supplied by Xcode:

```bash
xcrun --find safari-web-extension-converter
xcodebuild -version
```

On this machine the plain converter command failed inside the managed sandbox with:

```text
safari-web-extension-converter requires access to the supplied path.
Unable to parse manifest.json at file:///.../extension/
```

Running the same command with normal local filesystem access succeeded. The converter reported that the `open_in_tab` manifest key is not supported by the installed Safari tooling, and that the manifest does not define icons to import into the generated project.

## Build Details

The Makefile wraps this lower-level build flow:

```bash
make safari-build
make safari-build-ios
```

The workflow uses repo-local DerivedData by default, detects an Apple
Development signing identity when available, derives the development team from
the certificate, and keeps personal team ids out of committed project settings.

## Manual Safari Smoke Test

For Safari runtime behavior, run `make safari-reinstall` and `make
safari-doctor`, then test the real Safari extension UI. Automated tests cover
the WebExtension source, but Safari toolbar popup behavior, extension
registration, Private Browsing, and home-screen behavior still require real
Safari checks before making product claims. Current iPhone and iPad simulator
evidence is recorded below.

## Safari Behavior Checks

Verify against current Apple documentation before making product claims about:

- Supported Safari WebExtension manifest version behavior.
- Local development without paid Apple Developer Program distribution.
- iOS and iPadOS extension enabling.
- Private Browsing behavior.
- Whether extensions run inside iOS home-screen web app containers.

The repository now includes iOS/iPadOS targets. Record the Apple documentation
version, Safari version, platform version, and device or simulator used when
completing checks that do not yet have runtime evidence.

Current iOS evidence:

- `make safari-build-ios` succeeds outside the managed agent sandbox with Xcode
  26.3 and iOS 26.3 simulator runtimes.
- The built app installs and launches on iPhone 17 Pro / iOS 26.3 simulator.
- The iOS host app displays the HN Refined icon and Safari extension enablement
  message.
- In iOS Settings, the extension must be turned on with `Allow Extension`.
  Under Permissions, set `news.ycombinator.com` to `Allow`. Leaving the site at
  the default `Ask` state did not show a prompt when refreshing Hacker News in
  Safari, and the extension only applied after the site permission was changed
  to `Allow`.
- Live Hacker News page injection and visual behavior were checked in iOS Safari
  on iPhone 17 Pro / iOS 26.3 for news, newest, ask, show, jobs, item/comment,
  submit, and login pages, including system dark appearance. The standalone
  login form relies on the mobile form-width guard to avoid iOS Safari autofocus
  panning/zooming horizontally.
- iPad Air 11-inch / iOS 26.3 simulator checks covered logged-out news,
  item/comment, and submit/login pages plus logged-in news, submit, threads,
  profile/settings, and item/comment pages. Portrait and landscape layouts and
  fixed light and dark themes were checked. The standalone form spacing rule
  applies outside the phone breakpoint so iPad login-style forms retain viewport
  padding.
- The iPad popup and options page fit in portrait and landscape. Theme changes
  from both surfaces updated an already-open Hacker News tab without a manual
  refresh. The normal iPad Safari page, popup, and options acceptance pass is
  complete.
- Home-screen web app container behavior is still pending a runtime check.

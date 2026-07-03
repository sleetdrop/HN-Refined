# Safari Development

The WebExtension source lives in `extension/`.

Before creating or refreshing the Xcode wrapper, run the WebExtension checks:

```bash
npm run check
```

## Local Wrapper Generation

The Safari wrapper in `HNRefined/` was generated locally with:

```bash
xcrun safari-web-extension-converter extension --project-location . --app-name HNRefined --bundle-identifier com.local.HNRefined --macos-only --no-open --no-prompt
```

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

## Build

Build the generated macOS wrapper with:

```bash
xcodebuild -project HNRefined/HNRefined.xcodeproj -scheme HNRefined -configuration Debug build
```

On this machine, the managed sandbox could not write Xcode DerivedData under `~/Library/Developer/Xcode`, so the first build failed before compilation. Running the same command with normal Xcode filesystem access succeeded using Xcode local ad-hoc signing (`Sign to Run Locally`).

## Manual Safari Smoke Test

Manual Safari smoke testing was not run for this task because it requires launching the generated macOS app and interacting with Safari's GUI extension settings. Verify the wrapper manually before claiming Safari runtime behavior.

## Safari Behavior Checks

Verify against current Apple documentation before making product claims about:

- Supported Safari WebExtension manifest version behavior.
- Local development without paid Apple Developer Program distribution.
- iOS and iPadOS extension enabling.
- Private Browsing behavior.
- Whether extensions run inside iOS home-screen web app containers.

The repository does not yet claim these Safari behaviors as verified. Record the Apple documentation version, Safari version, platform version, and device or simulator used when completing those checks.

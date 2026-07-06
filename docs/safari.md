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

The Safari wrapper in `HNRefined/` was generated locally with:

```bash
xcrun safari-web-extension-converter extension --project-location . --app-name HNRefined --bundle-identifier org.hnrefined.HNRefined --macos-only --no-open --no-prompt
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

## Build Details

The Makefile wraps this lower-level build flow:

```bash
make safari-build
```

The workflow uses repo-local DerivedData by default, detects an Apple
Development signing identity when available, derives the development team from
the certificate, and keeps personal team ids out of committed project settings.

## Manual Safari Smoke Test

For Safari runtime behavior, run `make safari-reinstall` and `make
safari-doctor`, then test the real Safari extension UI. Automated tests cover
the WebExtension source, but Safari toolbar popup behavior, extension
registration, Private Browsing, iOS, and home-screen behavior still require real
Safari checks before making product claims.

## Safari Behavior Checks

Verify against current Apple documentation before making product claims about:

- Supported Safari WebExtension manifest version behavior.
- Local development without paid Apple Developer Program distribution.
- iOS and iPadOS extension enabling.
- Private Browsing behavior.
- Whether extensions run inside iOS home-screen web app containers.

The repository does not yet claim these Safari behaviors as verified. Record the Apple documentation version, Safari version, platform version, and device or simulator used when completing those checks.

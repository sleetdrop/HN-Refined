# Development

Use the `Makefile` targets as the stable development interface. Humans and AI
agents should prefer `make` commands first; npm scripts, shell scripts, and
`xcodebuild` are lower-level implementation details behind those targets.

Run all local checks:

```bash
make check
```

Build theme CSS:

```bash
make build-themes
```

Run tests:

```bash
make test
```

## Safari Local Development

Use one workflow for local Safari testing:

```bash
make safari-reinstall
```

This builds into repo-local `.build/xcode-derived-data`, copies the app to
`~/Applications/HNRefined.app`, unregisters stale HN Refined Safari extension
entries, registers only that installed app, and opens Hacker News explicitly in
Safari.

Do not register builds from `/tmp` or random Xcode DerivedData paths. Those
paths make Safari keep stale extension registrations and make toolbar popup
debugging unreliable.

Useful commands:

```bash
make safari-status
make safari-doctor
make safari-unregister
```

The workflow does not quit or restart Safari. If Safari is already open, reload
the Hacker News tab after reinstalling.

The workflow briefly opens the host app so macOS can discover the extension,
then closes it. To keep the host app open for visual inspection:

```bash
HNREFINED_KEEP_HOST_APP=1 make safari-reinstall
```

## Signing

The committed project does not include a personal Apple development team id.
That value is developer-local and should not be committed.

To use a signed local build, first create an Apple Development signing identity
in Xcode. The install script reads the first available `Apple Development`
identity, derives the real Xcode team id from the certificate `OU`, and passes
that team id to `xcodebuild`. The copied app is not re-signed after build;
`~/Applications/HNRefined.app` keeps the signature produced by Xcode.

If you need to choose a specific identity, run:

```bash
HNREFINED_SIGNING_IDENTITY="Apple Development: you@example.com (TEAMID)" make safari-reinstall
```

Check whether the machine currently has a signing identity:

```bash
security find-identity -v -p codesigning
```

If that command reports `0 valid identities found`, local Safari testing still
depends on Safari Developer settings allowing unsigned extensions. Safari may
clear that setting after restart, so verify it before treating missing toolbar
UI as an extension bug.

`HNREFINED_DEVELOPMENT_TEAM` is still available if automatic detection chooses
the wrong team. The default local workflow avoids committing or requiring a
project-level development team setting.

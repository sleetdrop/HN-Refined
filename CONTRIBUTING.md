# Contributing

HN Refined accepts focused bug fixes and compatibility updates that preserve
Hacker News behavior and keep the extension small and auditable.

## Before starting

1. Read `docs/project-status.md` and `docs/development.md`.
2. Check existing issues before opening a duplicate.
3. For behavior or product changes, open an issue before writing a large patch.

## Development

Requirements:

- Node.js 20 or later.
- Xcode for Safari builds and runtime checks.
- `librsvg` only when regenerating icons.

Install dependencies and run the local quality gate:

```bash
npm ci
make check
```

Use `extension/` as the canonical WebExtension source. The repository build
workflow syncs it into the Xcode wrapper; do not edit mirrored resources under
`HNRefined/Shared (Extension)/Resources/` independently.

## Pull requests

- By submitting a contribution, you agree that it may be distributed under the
  MIT License.
- Keep changes narrowly scoped and readable.
- Do not add remote code, analytics, arbitrary CSS, or broad host permissions.
- Add focused tests for behavior changes.
- Update user and developer documentation when behavior, permissions, workflow,
  or platform support changes.
- Run `make format && make check` before submitting.
- Include real Safari evidence when the change depends on Safari UI or extension
  lifecycle behavior.

Static Hacker News information pages and iOS/iPadOS Home Screen web apps are
outside the supported styling surface. Do not add compatibility code solely for
those pages or containers.

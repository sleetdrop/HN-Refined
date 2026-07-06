# Agent Handoff

Start here for every new HN Refined task:

1. Read `docs/project-status.md`.
2. Read `docs/development.md`.
3. Run `git status --short` before changing files.

HN Refined is a restrained Safari extension for Hacker News readability and
touch ergonomics. Preserve Hacker News behavior unless the user explicitly
chooses a local preference.

Use the `Makefile` targets as the stable interface:

- `make check` for full local validation.
- `make safari-reinstall` for signed local Safari installation.
- `make safari-doctor` for installed package sanity checks.

Do not register builds from `/tmp` or arbitrary DerivedData paths. Use the
repo-local workflow documented in `docs/development.md`.

Do not commit personal Apple development team ids, certificate names, local
DerivedData, `.superpowers/`, `.build/`, or `build/`.

For Safari runtime behavior, do not claim the work is fixed until the relevant
automated checks pass and the installed Safari extension is refreshed with
`make safari-reinstall`.

Maintain the project harness continuously. When a change affects product
behavior, Safari behavior, permissions, signing/build workflow, verification
commands, known regressions, or next-work guidance, update the relevant docs and
tests in the same change instead of waiting for a later documentation pass.
Check at least `AGENTS.md`, `docs/project-status.md`, `docs/development.md`,
`docs/privacy.md`, `docs/app-store-checklist.md`, and the workflow/handoff tests
before finishing.

Keep the Safari popup preference refresh guard intact:

- Popup preference changes notify all current-window Hacker News tabs.
- Content scripts tolerate Safari storage change events without `areaName`.
- The visible-page preference refresh fallback is intentional.

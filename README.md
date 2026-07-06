# HN Refined

HN Refined is a restrained Safari extension that improves Hacker News readability while preserving the original site's behavior.

## First-version scope

- Runs only on `news.ycombinator.com`.
- Improves desktop readability with a comfortable default.
- Improves mobile and PWA-like use with responsive CSS.
- Provides local preferences for theme, font, density, width, and external
  story-link target behavior.
- Does not collect data, load remote code, or modify Hacker News account actions.

## Site compatibility

HN Refined is a lightweight enhancement layer for Hacker News, not a separate
Hacker News client. It depends on the traditional Hacker News HTML structure for
its typography, spacing, theme, and external story-link refinements.

The extension keeps its binding logic narrow and readable. It tolerates small
markup changes around story title links by falling back from the current
`.titleline` class to the surrounding story row structure, but it does not run a
large compatibility engine or actively detect broad Hacker News redesigns. If a
future Hacker News change makes the page look wrong, disable the Safari
extension temporarily and report it with a GitHub issue. Developers are welcome
to send a pull request with a small, auditable fix.

## Development

Run:

```bash
make check
```

Start with `docs/project-status.md`, then see `docs/development.md` and
`docs/safari.md`.

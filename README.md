# HN Refined

HN Refined is a restrained Safari extension that improves Hacker News readability while preserving the original site's behavior.

## First-version scope

- Runs only on `news.ycombinator.com`.
- Improves desktop readability with a comfortable default.
- Improves mobile and PWA-like use with responsive CSS.
- Provides local preferences for theme, font, density, width, and external
  story-link target behavior.
- Does not collect data, load remote code, or modify Hacker News account actions.

## Enabling on iPhone and iPad

After installing HN Refined on iOS or iPadOS, open Settings and enable the
Safari extension:

1. Open Settings.
2. Go to Apps, Safari, Extensions, HN Refined.
3. Turn on `Allow Extension`.
4. Under Permissions, set `news.ycombinator.com` to `Allow`.

The default site permission can be `Ask`, but Safari may not show a prompt when
you refresh Hacker News. If HN Refined does not appear on Hacker News, check
that `news.ycombinator.com` is set to `Allow`, then reload the page.

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

Purely static information pages, such as FAQ, guidelines, security, and legal
pages, are outside the first-version styling target. Safari may also open some
of these pages in Reader View. HN Refined intentionally does not add extra
compatibility code for those document-like pages.

## Development

Run:

```bash
make check
```

Start with `docs/project-status.md`, then see `docs/development.md` and
`docs/safari.md`.

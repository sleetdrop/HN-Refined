# HN Refined

HN Refined is a restrained Safari extension that improves Hacker News readability while preserving the original site's behavior.

## First-version scope

- Runs only on `news.ycombinator.com`.
- Improves desktop readability with a comfortable default.
- Improves iPhone and iPad Safari readability with responsive CSS.
- Provides local preferences for theme, font, density, width, Thread Focus, and
  external story-link target behavior.
- Keeps comment scrolling native. The default-on Thread Focus link lets readers
  explicitly isolate any comment with replies in a full-width view whose
  compact, wrapping author-ancestry guide replaces the site header. Long paths
  keep the first and nearest authors visible behind one expandable ellipsis;
  tapping an ancestor zooms back to that part of the conversation. Safari Back
  and Forward traverse these reading views, while `all` returns to the complete
  discussion. Turning Thread Focus off keeps progressive indentation only.
- Does not collect data, load remote code, or modify Hacker News account actions.

## Enabling on iPhone and iPad

After installing HN Refined on iOS or iPadOS, open Settings and enable the
Safari extension:

1. Open Settings.
2. Go to Apps, Safari, Extensions, HN Refined.
3. Turn on `Allow Extension`.
4. Under Permissions, set `news.ycombinator.com` to `Allow`.

To use HN Refined in private tabs, also turn on `Allow in Private Browsing`.

The default site permission can be `Ask`, but Safari may not show a prompt when
you refresh Hacker News. If HN Refined does not appear on Hacker News, check
that `news.ycombinator.com` is set to `Allow`, then reload the page.

Home Screen web apps are not a supported iOS or iPadOS surface. HN Refined
supports Hacker News opened in Safari; an added-to-Home-Screen copy may use an
independent container without the extension popup or Safari preference state.

## Site compatibility

HN Refined is a lightweight enhancement layer for Hacker News, not a separate
Hacker News client. It depends on the traditional Hacker News HTML structure for
its typography, spacing, theme, and external story-link refinements.

The extension keeps its binding logic narrow and readable. It tolerates small
markup changes around story title links by falling back from the current
`.titleline` class to the surrounding story row structure, but it does not run a
large compatibility engine or actively detect broad Hacker News redesigns. If a
future Hacker News change makes the page look wrong, disable the Safari
extension temporarily and
[open a GitHub issue](https://github.com/sleetdrop/HN-Refined/issues). Developers
are welcome to send a pull request with a small, auditable fix.

Purely static information pages, such as FAQ, guidelines, security, and legal
pages, are outside the first-version styling target. Safari may also open some
of these pages in Reader View. HN Refined intentionally does not add extra
compatibility code for those document-like pages.

## Development

Run:

```bash
make check
```

Start with `docs/current-state.md`. See `docs/codex-workflow.md` for the Codex
workflow, then read `docs/development.md`, `docs/safari.md`, or the detailed
`docs/project-status.md` only when the current work needs them.

## Contributing and security

HN Refined is open-source software licensed under the [MIT License](LICENSE).
See `CONTRIBUTING.md` for the development and pull request workflow. Report
security issues using the private process in `SECURITY.md`, not a public issue.

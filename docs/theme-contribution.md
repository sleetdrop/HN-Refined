# Theme Contribution

Themes are JSON token files in `extension/themes/`. They are validated at build time and converted into bundled CSS custom properties. HN Refined does not load remote themes or user-provided CSS at runtime.

Each theme file must include:

- `id`: lowercase letters, numbers, and hyphens only.
- `name`: a readable name that does not imply official Hacker News or Apple endorsement.
- `mode`: `light` or `dark`.
- `tokens`: the complete set of supported color tokens.

Allowed token names:

- `pageBackground`
- `contentBackground`
- `topBarBackground`
- `textPrimary`
- `textSecondary`
- `linkPrimary`
- `linkVisited`
- `linkSecondary`
- `topBarText`
- `topBarLink`
- `topBarSelected`
- `userNew`
- `ownItemMarker`
- `ycAlumniUser`
- `borderSubtle`
- `controlSurface`
- `controlBorder`
- `controlFocus`
- `focusDivider`
- `commentFade1` through `commentFade9`

These are semantic roles, not interchangeable color slots. Keep new-account,
own-item, and YC-alumni signals separate even when two values happen to match.
Keep every comment fade level strictly ordered toward `contentBackground`. The
public light/dark contract and HN-owned color boundaries are documented in
[`docs/color-semantics.md`](color-semantics.md).

The three control roles describe form geometry only: `controlSurface` separates
an editable field from the surrounding page, `controlBorder` marks its resting
edge, and `controlFocus` marks keyboard focus. They do not affect Safari's
native caret or select appearance, nor do they translate Hacker News content
colors.

Token values must be static color values accepted by the validator. Do not use
`url()`, `var()`, `calc()`, imports, external resources, arbitrary CSS, or
JavaScript. Themes can change colors only; they cannot change layout, spacing,
fonts, content visibility, images, or behavior. The ineffective historical
`voteArrow` token is intentionally unsupported because Hacker News' vote arrow
is an SVG background image owned by the site.

Validate theme files:

```bash
make build-themes
```

Run the full local check before submitting theme changes:

```bash
make check
```

The lower-level npm scripts remain available, but `make` targets are the stable
interface for humans and agents.

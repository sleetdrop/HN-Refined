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
- `textMuted`
- `link`
- `visitedLink`
- `borderSubtle`
- `voteArrow`

Token values must be static color values accepted by the validator. Do not use `url()`, `var()`, `calc()`, imports, external resources, arbitrary CSS, or JavaScript. Themes can change colors only; they cannot change layout, spacing, fonts, content visibility, images, or behavior.

Validate theme files:

```bash
npm run validate:themes
```

Build generated theme CSS:

```bash
npm run build:themes
```

Run the full local check before submitting theme changes:

```bash
npm run check
```

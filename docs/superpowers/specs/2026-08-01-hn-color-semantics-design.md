# Hacker News Color Semantics Design

Date: 2026-08-01

## Goal

Realign HN Refined's colors with Hacker News' existing visual meaning without
turning the extension into a new visual system. The normal light presentation
must reproduce Hacker News' official colors. Dark presentation must be a
coherent HN Refined theme that translates the same semantic roles rather than
copying light colors literally. The mapping must be stable, documented, and
testable for readers and future contributors.

This correction covers colors only. It adds no setting, runtime request,
tracking, or content-script behavior.

## Source Semantics and Current Gaps

The design uses Hacker News' own stylesheet and documentation as the source of
truth:

- The current [Hacker News stylesheet](https://news.ycombinator.com/news.css)
  defines the normal light palette, selected navigation state, secondary links,
  vote arrow, and the complete comment-fading ladder.
- The [Hacker News FAQ](https://news.ycombinator.com/newsfaq.html) explains that
  gray links are visited, a green username identifies a new account, an
  orange/red asterisk identifies the reader's own submission, and faded comments
  are downvoted.
- [A Tour of Hacker News](https://vale.rocks/posts/hacker-news) records related
  community-visible conventions, including the temporary green new-account
  color, YC alumni usernames, and user-customized top bars.
- In [this Hacker News discussion](https://news.ycombinator.com/item?id=10223645),
  dang describes the green username as a simple, coherent indication that an
  account is new.

HN Refined currently loses some of those distinctions:

- It maps `.c5a` through `.cbe` to one muted color and leaves `.cce` and `.cdd`
  unmapped. In dark mode, the last two can therefore become brighter than their
  shallower neighbors and reverse HN's downvote meaning.
- Broad table-link and top-navigation selectors can override `.topsel`'s active
  white state and `.hnmore`'s deliberately secondary gray.
- The current dark visited-link color is warmer and more prominent than ordinary
  metadata even though HN uses the same gray family for both.
- The `voteArrow` token does not recolor HN's SVG vote arrow; the current CSS
  declaration targets a border that the SVG does not use.
- The unmodified `y18.svg` appears too bright and saturated on the dark mapped
  top bar.

## System Boundaries

The color system has four layers, in priority order:

1. **Official light baseline.** In normal light mode, HN Refined uses HN's
   current colors exactly for roles that HN defines. Light is not a separately
   art-directed HN Refined theme.
2. **Explicit dark semantic translation.** Dark mode assigns a deliberate dark
   value to every supported HN role, including every faded-comment class. It
   preserves relative meaning, hierarchy, and restraint rather than preserving
   literal RGB values.
3. **HN-owned dynamic expression.** User-customized `topcolor` values and other
   unknown inline or server-selected colors pass through unchanged. HN Refined
   maps only recognized default HN colors and known semantic markers.
4. **System increased-contrast overlay.** `prefers-contrast: more` strengthens
   low-emphasis roles while retaining their ordering and identity. Even the
   deepest faded comment remains visibly subordinate to ordinary comment text.

These layers apply to fixed Light, fixed Dark, and System. System uses the light
contract in a light system appearance and the dark contract in a dark system
appearance.

## Semantic Token Contract

The existing broad tokens are replaced with role-specific tokens. A token may
share a value with another token, but it must not share its semantic identity.
This keeps future changes from accidentally coupling unrelated HN signals.

| Token                           | Meaning                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `pageBackground`                | Browser-edge/page background outside the HN content table          |
| `contentBackground`             | Main HN reading surface                                            |
| `topBarBackground`              | Recognized default HN top bar after theme mapping                  |
| `textPrimary`                   | Story and comment reading text                                     |
| `textSecondary`                 | Metadata, separators, domains, scores, ages, and guide ancestors   |
| `linkPrimary`                   | Unvisited primary content and action links                         |
| `linkVisited`                   | Visited primary links                                              |
| `linkSecondary`                 | Links whose HN role is deliberately secondary, including `.hnmore` |
| `topBarText`                    | Non-link text in the default top bar                               |
| `topBarLink`                    | Ordinary links in the default top bar                              |
| `topBarSelected`                | Active `.topsel` navigation item                                   |
| `userNew`                       | New-account username; informative, not a warning or quality score  |
| `ownItemMarker`                 | Existing HN asterisk marking the reader's own submission           |
| `ycAlumniUser`                  | Existing HN YC-alumni username signal                              |
| `borderSubtle`                  | Form borders and low-emphasis structural edges                     |
| `focusDivider`                  | The restrained HN-family divider below Thread Focus navigation     |
| `commentFade1` … `commentFade9` | Ordered mappings for `.c5a` through `.cdd`                         |

`ownItemMarker` and `ycAlumniUser` remain separate even when they use the same
orange. Their coincidence is a palette choice, not a statement that the roles
are interchangeable.

`voteArrow` is removed. HN's original `triangle.svg` and its `#999` fill remain
site-owned in both themes. This is more faithful than retaining a configuration
surface that has no effect.

## Normal Palette

The complete normal-mode contract is:

| Semantic role         | HN Light  | HN Refined Dark |
| --------------------- | --------- | --------------- |
| Page background       | `#f6f6ef` | `#211f1a`       |
| Content background    | `#f6f6ef` | `#27251f`       |
| Default top bar       | `#ff6600` | `#9a4315`       |
| Primary text          | `#000000` | `#e6dcc5`       |
| Secondary text        | `#828282` | `#a89b82`       |
| Primary link          | `#000000` | `#e6dcc5`       |
| Visited link          | `#828282` | `#a89b82`       |
| Secondary link        | `#828282` | `#a89b82`       |
| Top-bar text          | `#222222` | `#e6dcc5`       |
| Top-bar link          | `#000000` | `#e6dcc5`       |
| Selected top-bar item | `#ffffff` | `#fff7e7`       |
| New-account username  | `#3c963c` | `#73b56d`       |
| Own-item marker       | `#ff6600` | `#dc8650`       |
| YC-alumni username    | `#ff6600` | `#dc8650`       |
| Subtle border         | `#d9d0b1` | `#40392e`       |
| Thread Focus divider  | `#faba8b` | `#63351a`       |

The light divider is the resolved form of the already approved restrained
orange relationship; the dark divider carries the same role at lower luminance.
Both are explicit tokens so the public semantic table and rendered CSS cannot
silently drift through a changed mixing algorithm.

HN's faded-comment ladder is preserved one step at a time:

| HN class | Token          | HN Light  | HN Refined Dark |
| -------- | -------------- | --------- | --------------- |
| `.c00`   | `textPrimary`  | `#000000` | `#e6dcc5`       |
| `.c5a`   | `commentFade1` | `#5a5a5a` | `#a09988`       |
| `.c73`   | `commentFade2` | `#737373` | `#8d8677`       |
| `.c82`   | `commentFade3` | `#828282` | `#817b6d`       |
| `.c88`   | `commentFade4` | `#888888` | `#7c7769`       |
| `.c9c`   | `commentFade5` | `#9c9c9c` | `#6d685c`       |
| `.cae`   | `commentFade6` | `#aeaeae` | `#5f5b50`       |
| `.cbe`   | `commentFade7` | `#bebebe` | `#524f45`       |
| `.cce`   | `commentFade8` | `#cecece` | `#46433a`       |
| `.cdd`   | `commentFade9` | `#dddddd` | `#3a3830`       |

In light mode, larger source values move toward the light background and become
less prominent. The dark ladder reverses that luminance direction while keeping
the same semantic order: every successive class moves closer to the dark
content background.

## Increased Contrast

`prefers-contrast: more` remains automatic and CSS-only. It uses explicit values
rather than a generic mix that could collapse or reorder semantic levels.

The high-contrast faded-comment ladder is:

| HN class | Light, increased contrast | Dark, increased contrast |
| -------- | ------------------------- | ------------------------ |
| `.c00`   | `#000000`                 | `#e6dcc5`                |
| `.c5a`   | `#3b3b39`                 | `#b9b09e`                |
| `.c73`   | `#4b4b49`                 | `#aca493`                |
| `.c82`   | `#555552`                 | `#a49d8c`                |
| `.c88`   | `#585856`                 | `#a19a89`                |
| `.c9c`   | `#656563`                 | `#979181`                |
| `.cae`   | `#71716e`                 | `#8e8879`                |
| `.cbe`   | `#7c7c78`                 | `#868072`                |
| `.cce`   | `#868682`                 | `#7e786b`                |
| `.cdd`   | `#90908c`                 | `#767164`                |

Every level gains contrast against its content background, every adjacent pair
retains the official ordering, and `.cdd` remains less prominent than `.c00`.
The overlay also uses these resolved values:

| Role                              | Light, increased contrast | Dark, increased contrast |
| --------------------------------- | ------------------------- | ------------------------ |
| Secondary text and secondary link | `#363635`                 | `#bcb4a0`                |
| Visited link                      | `#40403e`                 | `#b4ac9a`                |
| Subtle border                     | `#80807c`                 | `#837d6f`                |
| Thread Focus divider              | `#fc944c`                 | `#753918`                |

Primary reading text and the distinct new-user, own-item, YC-alumni, and
top-bar-selected signals retain their normal semantic colors. They are not
flattened into the generic high-contrast secondary color.

## Selector and Cascade Rules

Generated theme CSS exposes the semantic variables. The content stylesheet maps
them to narrow HN roles rather than broadly recoloring every link inside
`#hnmain`.

- Ordinary title and reading links use `linkPrimary`; their visited state uses
  `linkVisited`.
- Metadata and deliberately secondary links use `textSecondary` and
  `linkSecondary`.
- `.pagetop` text, ordinary top-bar links, and `.topsel` each use their own
  variables. The selected state must win in both link and visited states.
- `.commtext.c00`, `.c5a`, `.c73`, `.c82`, `.c88`, `.c9c`, `.cae`, `.cbe`,
  `.cce`, and `.cdd` receive exact one-to-one mappings.
- The existing `.toptext` primary-color override remains an intentional HN
  Refined readability exception because author-supplied story text is reading
  content, not metadata.
- Thread Focus ancestor links remain muted in both link states, and only the
  current author is primary. The divider reads from `focusDivider`.
- Form controls continue to use content, text, and border roles.

The implementation removes selectors whose scope is broader than the semantic
role they are intended to express. Selector-specific regression tests must make
the top-bar selected state, `.hnmore`, and all ten comment classes explicit.

## HN-Owned Dynamic Colors

HN lets users customize the top bar through `topcolor`. HN Refined must not turn
that personal HN choice into its own dark palette.

- A header cell whose `bgcolor` is exactly HN's default `#ff6600`
  (case-insensitive) is eligible for the light/dark mapping.
- Any other `bgcolor` remains unchanged in Light, Dark, and System.
- A preserved custom header keeps HN's original dark/black navigation text and
  the original unfiltered logo. HN Refined does not guess a contrasting palette
  for an arbitrary user color.
- Unknown inline username colors, seasonal colors, memorial treatments, and
  future server-defined colors pass through unchanged.
- Known new-user, own-item, and YC-alumni colors are remapped in dark mode only
  when their current markup and exact source color can be identified safely.
  If the expected marker is absent or ambiguous, the site value wins.

This is a fail-open color policy: uncertainty restores Hacker News' expression
rather than inventing a likely-but-wrong semantic mapping.

## Logo Treatment

HN Refined continues to use Hacker News' original `y18.svg`. It does not ship a
redrawn light or dark logo.

When, and only when, the exact default orange header is mapped into the dark
theme, apply:

```css
filter: saturate(0.78) brightness(0.9);
opacity: 0.82;
```

The treatment quiets the bright source asset while preserving its geometry and
identity. Light mode, custom top bars, and any unrecognized header structure use
the unfiltered asset at full opacity.

## Public Reference and Canonical Data

Implementation adds `docs/color-semantics.md` as the stable user/developer
reference. It contains:

- a short explanation of why light is official HN while dark is a semantic
  translation;
- the normal light/dark role table;
- the complete normal and increased-contrast comment ladders;
- the meanings of new-user green, own-item asterisk, YC-alumni orange, visited
  gray, and faded comments;
- the custom-top-bar and unknown-color pass-through rules;
- the conditional dark logo treatment.

Theme JSON is the canonical machine-readable source for normal palette values.
The public table is a versioned product contract, and automated checks compare
its documented values with theme data so neither can change alone. Increased
contrast values are defined beside the generated semantic CSS and receive the
same documentation consistency checks.

`docs/theme-contribution.md` is updated from the old broad-token list to the new
semantic contract. `docs/project-status.md`, `docs/development.md`, and
`docs/app-store-checklist.md` record the user-visible behavior and verification
expectations. Privacy and permissions do not change; their existing documents
are reviewed but need no behavioral claim unless that review finds stale text.

## Verification

Automated verification must cover:

- theme validation rejects missing, unknown, or non-static semantic tokens;
- generated CSS contains the complete normal light and dark contracts and the
  System mappings for both appearances;
- normal light values for every HN-defined role match current official HN
  values exactly; extension-owned roles such as the Focus divider remain
  explicitly documented exceptions;
- normal and increased-contrast dark text roles meet the project's existing
  readability thresholds against the appropriate background;
- both normal and increased-contrast comment ladders are strictly ordered in
  the correct direction and never make the deepest level equal to primary text;
- increased contrast improves every faded level against its background without
  changing the level order;
- `.topsel`, `.hnmore`, metadata, visited links, Thread Focus guide roles, and
  every `.commtext` class use the intended variables;
- the ineffective vote-arrow override is absent and the original SVG remains
  unmodified;
- default dark headers receive the approved filter and opacity, while light and
  custom headers do not;
- custom `topcolor` and unknown inline colors have explicit pass-through
  coverage;
- the public semantic table agrees with the canonical palette values;
- mirrored extension resources in the Safari wrapper remain synchronized.

After `make format && make check`, Safari acceptance covers ordinary story
lists, item/comment pages, Thread Focus, forms, visited links, selected top
navigation, new/own/alumni signals when the test account can expose them, and a
custom top bar. Checks run in fixed Light, fixed Dark, and System, with normal
and Increased Contrast appearances. The original and treated logo are compared
on the relevant header variants. Because this changes packaged Safari CSS, the
installed extension is refreshed with `make safari-reinstall` before the work
is reported as complete.

## Non-Goals

- Adding more selectable themes or a color editor.
- Recoloring HN's voting triangle, comment-target highlight, or arbitrary inline
  colors.
- Reconstructing HN semantic state from usernames or prose.
- Adding JavaScript solely for color styling.
- Redrawing or replacing `y18.svg`.
- Styling static information pages that are outside HN Refined's supported
  application surfaces.

## Acceptance Criteria

The work is accepted when normal Light is recognizably and numerically Hacker
News, Dark is a complete semantic translation with no reversed or flattened
comment levels, Increased Contrast strengthens rather than erases the hierarchy,
custom HN colors remain user-owned, and the same rules can be read in the public
color-semantics document and enforced by automated tests.

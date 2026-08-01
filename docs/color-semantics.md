# Color Semantics

HN Refined treats color as information, not decoration. Normal Light preserves
the official Hacker News palette for HN-defined roles. Dark is an HN Refined
semantic translation: the values change so the page remains coherent on a dark
surface, while the meaning and relative emphasis stay the same.

The machine-readable normal palette lives in `extension/themes/`. This document
is the stable reference for users and contributors.

## Normal Palette

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
| Control surface       | `#fbfaf3` | `#2f2b23`       |
| Control border        | `#d9d0b1` | `#5b5141`       |
| Control focus         | `#c96d24` | `#c67836`       |
| Thread Focus divider  | `#faba8b` | `#63351a`       |

Some values coincide without sharing meaning. In particular, the own-item
marker and YC-alumni username have separate semantic roles even though each uses
the same orange in the current palettes.

## Hacker News Signals

- A gray story link means it has been visited.
- A green username means the account was new when the item was posted. It is
  information about account age, not a warning or quality score.
- The orange/red `*` in the vote position marks your own submission or comment.
- YC alumni can see YC founder usernames in orange. Ordinary users generally do
  not see this signal.
- Faded comment text means the comment has been downvoted. Each level is
  preserved rather than collapsed into one generic muted color.

HN Refined maps a new account, own item, and YC alumni only when HN supplies the
known structural marker and exact source color. Unknown inline colors remain
HN-owned.

## Faded Comments

Normal presentation keeps all ten HN levels:

| HN class | Meaning          | HN Light  | HN Refined Dark |
| -------- | ---------------- | --------- | --------------- |
| `.c00`   | Ordinary comment | `#000000` | `#e6dcc5`       |
| `.c5a`   | Fade level 1     | `#5a5a5a` | `#a09988`       |
| `.c73`   | Fade level 2     | `#737373` | `#8d8677`       |
| `.c82`   | Fade level 3     | `#828282` | `#817b6d`       |
| `.c88`   | Fade level 4     | `#888888` | `#7c7769`       |
| `.c9c`   | Fade level 5     | `#9c9c9c` | `#6d685c`       |
| `.cae`   | Fade level 6     | `#aeaeae` | `#5f5b50`       |
| `.cbe`   | Fade level 7     | `#bebebe` | `#524f45`       |
| `.cce`   | Fade level 8     | `#cecece` | `#46433a`       |
| `.cdd`   | Fade level 9     | `#dddddd` | `#3a3830`       |

Light moves each level closer to the light content background. Dark reverses
the luminance direction and moves each level closer to the dark content
background. The semantic order is the same.

## Increased Contrast

When WebKit reports `prefers-contrast: more`, HN Refined automatically raises
the contrast of secondary content without adding a preference. Every faded
comment becomes easier to read, but all levels remain strictly ordered and the
deepest level remains visibly weaker than ordinary text.

| HN class | Light, Increased Contrast | Dark, Increased Contrast |
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

| Semantic role           | Light, Increased Contrast | Dark, Increased Contrast |
| ----------------------- | ------------------------- | ------------------------ |
| Secondary text and link | `#363635`                 | `#bcb4a0`                |
| Visited link            | `#40403e`                 | `#b4ac9a`                |
| Subtle border           | `#80807c`                 | `#837d6f`                |
| Control surface         | `#ffffff`                 | `#302d25`                |
| Control border          | `#706a57`                 | `#9b917d`                |
| Control focus           | `#9c480d`                 | `#e29a58`                |
| Thread Focus divider    | `#fc944c`                 | `#753918`                |

Control colors describe editable field boundaries rather than an HN content
signal. HN Refined uses them for resting and keyboard-focus form states while
leaving Safari's caret and native select treatment intact.

## HN-Owned Colors

The `topcolor` profile setting belongs to Hacker News. Only the exact default
`#ff6600` header is eligible for HN Refined's dark mapping. A custom `topcolor`
stays unchanged in Light, Dark, and System, and retains HN's original dark
navigation text and logo treatment.

The same fail-open rule applies to seasonal, memorial, and future inline
colors: when HN Refined cannot identify the semantic role exactly, Hacker News'
value wins.

## Logo

HN Refined uses the original `y18.svg`. On the recognized default header in dark
appearance only, it applies `saturate(0.78) brightness(0.9)` and `opacity: 0.82`
to make the source asset sit naturally on the darker orange. Light and custom
headers use the unfiltered image at full opacity.

## Sources

- [Hacker News stylesheet](https://news.ycombinator.com/news.css)
- [Hacker News FAQ](https://news.ycombinator.com/newsfaq.html)
- [A Tour of Hacker News](https://vale.rocks/posts/hacker-news)

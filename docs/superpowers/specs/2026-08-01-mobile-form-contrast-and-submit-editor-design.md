# Mobile Form Contrast and Submit Editor Design

## Purpose

Refine HN Refined's mobile form presentation so that Dark keeps a readable
control boundary and a restrained, Hacker News-compatible focus state. Extend
the existing mobile comment-editor height control to the story-submission text
area without turning the submission page into a compact comment composer.

## Scope

- Add dedicated semantic tokens for form control surface, border, and focus.
- Apply those tokens to text inputs, textareas, selects, and submit buttons.
- Use the themed focus color only for form controls. Keep the system focus
  treatment for links and ordinary buttons.
- Translate only confirmed Hacker News default black text into the primary
  reading color. Unknown inline colors and user-authored formatting continue to
  pass through unchanged.
- Add the existing small row-size controls to the story-submission `text`
  textarea on narrow, coarse-pointer devices.

## Visual Design

Controls remain plain Hacker News rectangles. Dark gives them a slightly
separate warm-gray surface and a clear one-pixel border, without cards,
shadows, or additional rounding. Light remains close to HN's existing pale
surface.

When a form control receives keyboard focus, its outline uses the explicit
theme focus token rather than WebKit's bright `Highlight` blue. The caret and
native select appearance remain Safari-owned. Increased Contrast strengthens
the form focus and border tokens with the rest of the semantic palette.

## Content Color Boundary

The implementation must identify the HN structures that still emit official
default black text on Jobs, profile/settings, and footer surfaces. Only those
confirmed default structures may map to `--hnr-text-primary`. Do not add a
generic `font[color]`, `[style*="color"]`, or broad table-text override: custom
inline colors and user content remain Hacker News-owned.

## Submission Textarea Behavior

The existing comment textarea keeps its current mobile behavior: two rows at
rest, six rows on first focus, then four-row increments between two and
twenty-two rows.

The story-submission `textarea[name="text"]` receives the same adjacent,
native-button triangle controls and the same four-row limits. It keeps Hacker
News' original six rows at rest and on first focus, because submission is a
dedicated writing page. Adjusting height must preserve text and active focus.
Profile `about` textareas and unrelated fields do not receive the controls.

## Safety and Verification

The controller remains vanilla JavaScript, small enough to review, and active
only under `(max-width: 700px) and (any-pointer: coarse)`. It must not replace
native textareas, persist a row preference, intercept form submission, or read
editor text.

Automated tests cover token use, scoped focus styling, confirmed default-black
translation, and the separate submission-editor lifecycle. Safari checks cover
iPhone 17 Pro / iOS 26.3 Simulator in Light, Dark, and Increased Contrast with
the keyboard shown, plus Jobs, profile/settings, footer search, reply, and
submit surfaces.

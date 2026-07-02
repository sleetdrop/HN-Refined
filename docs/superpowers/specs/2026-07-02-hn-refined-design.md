# HN Refined Safari Extension Design

Date: 2026-07-02
Status: Approved for planning

## Purpose

HN Refined is an open-source Safari extension that improves the reading experience on Hacker News while preserving the original site's structure, habits, and low-friction web feel. It is an original-site enhancement, not a replacement Hacker News client.

The first version should make Hacker News visibly more comfortable immediately after installation, especially on mobile devices, without changing Hacker News data operations or core behavior.

## Product Scope

The extension only targets `news.ycombinator.com`.

Default behavior:

- Desktop uses a `Comfortable` presentation: lightly larger text, improved line height, better contrast, and more controlled reading width while preserving Hacker News density.
- Mobile uses a `Readable Original` presentation: responsive layout, better wrapping, larger touch targets, safer spacing, and clearer metadata for phone and tablet browsing.
- Comment pages are optimized for readability through spacing, wrapping, indentation, and contrast only.
- Story links keep the Hacker News default behavior and open in the current tab unless the user enables a setting to open external story links in new tabs.
- The extension has no in-page settings control. Preferences live in the Safari extension popup or options page.
- There is no global "restore original style" switch. Users can disable the Safari extension if they want the untouched site.
- A `Classic-ish` preset is available for users who want a denser desktop presentation.

Out of scope for the first version:

- Rebuilding Hacker News as a modern app shell.
- Changing upvote, hide, reply, login, comments, or account workflows.
- Comment folding, filtering, sorting, read state, saved stories, local history, or keyboard navigation.
- Saving Hacker News content, reading history, or account-related data.
- Loading remote JavaScript, remote themes, remote configuration, or third-party runtime code.
- Letting users enter arbitrary CSS.

## Architecture

Use a CSS-first Safari Web Extension with one small content script and an extension-owned settings UI.

Primary pieces:

- `manifest.json`
  - Host access is limited to `https://news.ycombinator.com/*`.
  - Content CSS is injected into Hacker News pages.
  - One small content script applies local preferences and link behavior.
  - Popup/options pages are the only settings surface.

- `content.css`
  - Owns baseline readability, desktop comfort rules, mobile responsive rules, PWA-like standalone adaptations, and comment-page readability.
  - Uses attributes on the root element, such as `html[data-hnr-theme]`, `html[data-hnr-density]`, and `html[data-hnr-font]`.

- `content-script.js`
  - Has no dependencies.
  - Reads extension preferences.
  - Applies preferences by setting `document.documentElement.dataset` values.
  - Listens for preference changes when available.
  - If enabled, applies new-tab behavior only to external story title links.
  - Does not parse Hacker News business data and does not modify voting, hiding, replying, login, or comment submission behavior.

- `options.html`, `options.js`, and `options.css`
  - Provide the extension settings UI.
  - Store preferences in `browser.storage.local`.
  - Handle storage failures gracefully, including Private Browsing restrictions.

- `themes/*.json`
  - Contain structured theme tokens.
  - Are validated at build time.
  - Generate CSS custom properties.
  - Are bundled into the extension; no runtime remote theme loading is allowed.

- `docs/`
  - Includes local development instructions, Safari developer-extension setup, privacy and permission notes, theme contribution guidance, and App Store review preparation notes.

## Preference Model

Default preferences:

```json
{
  "theme": "system",
  "fontPreset": "system-sans",
  "desktopDensity": "comfortable",
  "readingWidth": "comfortable",
  "mobileLayout": "auto",
  "openStoryLinksInNewTabs": false
}
```

Preference responsibilities:

- `theme`
  - Controls colors only: page background, content background, top bar, primary text, muted text, links, visited links, subtle borders, and vote arrows.
  - Does not control spacing, layout, or font size.
  - Defaults to `system`, using the system light/dark preference.

- `fontPreset`
  - Controls font family only.
  - First-version presets are `hn-classic`, `system-sans`, `serif-reading`, and `mono-ish`.
  - Arbitrary user-entered font CSS is not supported in the first version.

- `desktopDensity`
  - Controls desktop font scale, line height, metadata size, and story spacing.
  - Defaults to `comfortable`.
  - Includes `classic-ish` for a denser feel.
  - Future accessibility presets can add larger text and stronger contrast without changing the default.

- `readingWidth`
  - Controls desktop content width.
  - Defaults to `comfortable`.
  - Does not control mobile layout; mobile layout is driven by viewport and display mode.

- `mobileLayout`
  - Defaults to `auto`.
  - Enables mobile responsive rules on narrow screens and PWA-like standalone windows.
  - May offer `off` for users who want desktop-like density on narrow windows.

- `openStoryLinksInNewTabs`
  - Defaults to `false` to preserve Hacker News behavior.
  - Only applies to external story title links.
  - Does not affect Hacker News internal navigation or account actions.

CSS application order:

1. Baseline normalization for viewport, box sizing, and shared variables.
2. Theme variables.
3. Desktop density, width, and font rules.
4. Mobile responsive rules.
5. Standalone display adaptations.
6. Comment-page refinements.

This order keeps color, typography, layout density, mobile behavior, and link behavior independent.

## Mobile and Home-Screen Behavior

The first version includes mobile and PWA-like use as a core target.

For normal mobile Safari:

- Use responsive rules that keep Hacker News recognizable while improving touch ergonomics.
- Increase tap targets for story titles and metadata links where possible.
- Improve wrapping and spacing on story lists and comments.
- Keep the original information hierarchy.

For Hacker News added to the iOS home screen:

- Add low-cost CSS adaptations for standalone display mode and iOS viewport quirks.
- Account for safe-area insets so content is not obscured by status bars or the Home indicator.
- Keep navigation and comment readability usable in app-like windows.
- Do not add service workers, offline caching, notifications, install prompts, or a custom app shell.

Technical risk:

- Safari Web Extension injection behavior inside iOS home-screen web app containers must be tested on a real device or simulator. If extensions do not apply in that container, the extension falls back to normal mobile Safari optimization and the limitation must be documented.

## Private Browsing Behavior

The extension should be usable in Safari Private Browsing when the user allows it.

Rules:

- Content CSS and the content script must work without persistent preference writes.
- If storage reads fail, storage is unavailable, or the private environment isolates data, the content script uses built-in defaults.
- The options UI must not crash if settings cannot be saved.
- The options UI should communicate that the current browsing environment may not persist changes.
- The extension must not use Hacker News page `localStorage`, cookies, or injected page state for preferences.
- Private windows use the same privacy posture: no collection, no upload, no remote loading, and no tracking.

Acceptance checks:

- A Private Browsing window gets the default visual improvements when the extension is allowed.
- Storage failures fall back to defaults.
- External story links remain current-tab by default.
- Turning off the Safari extension restores Hacker News.

## JavaScript Boundary

JavaScript is allowed only where it is necessary and easy to audit.

Allowed content-script responsibilities:

- Read local extension preferences.
- Apply root `data-*` attributes or classes.
- Subscribe to preference changes when the browser supports it.
- Apply external story-link new-tab behavior when the user enables it.

Disallowed responsibilities:

- Remote code loading.
- Third-party runtime dependencies.
- Analytics, telemetry, tracking, or network beacons.
- Scraping, storing, or transforming Hacker News content.
- Replacing Hacker News interaction models.
- Injecting complex UI into Hacker News pages.

The intended result is not "zero JS"; it is small, boring, reviewable JS with a narrow reason to exist.

## Theme Contribution Model

Themes use structured tokens and build-time generation.

Example theme:

```json
{
  "id": "solarized-light",
  "name": "Solarized Light",
  "mode": "light",
  "tokens": {
    "pageBackground": "#fdf6e3",
    "contentBackground": "#eee8d5",
    "topBarBackground": "#ff6600",
    "textPrimary": "#073642",
    "textMuted": "#657b83",
    "link": "#268bd2",
    "visitedLink": "#6c71c4",
    "borderSubtle": "#d8d0b0",
    "voteArrow": "#828282"
  }
}
```

Validation rules:

- `id` uses lowercase letters, numbers, and hyphens only.
- `mode` is `light` or `dark`.
- Token keys come from a whitelist.
- Colors are static color values.
- Values such as `url()`, `var()`, `calc()`, imports, and external resources are rejected.
- Required tokens must be present.
- Theme names must not imply official Hacker News or Apple endorsement.
- Generated CSS only contains custom properties.

Runtime rules:

- Only bundled themes are available.
- No theme is loaded from GitHub, a CDN, user input, or any remote source.
- Themes cannot alter layout, hide content, load fonts or images, or execute code.
- `System` mode selects bundled light or dark tokens using system color preference.

Contributor support:

- `docs/theme-contribution.md` explains the token system and review expectations.
- `themes/schema.json` supports editor and CI validation.
- A validation command checks all theme files.
- A preview workflow should cover story lists and comment pages in light and dark modes.

## Compatibility

The target support window is the latest three major Safari generations across:

- macOS Safari.
- iOS Safari.
- iPadOS Safari.

The implementation should prefer standard WebExtension APIs where possible and keep Safari-specific handling localized. The exact minimum macOS, iOS, iPadOS, Safari, and Xcode versions must be confirmed against current Apple documentation during implementation.

`browser.storage.local` is the first-version storage target. `storage.sync` and iCloud-backed preference sync are not first-version assumptions. They may be evaluated later after Safari behavior is tested.

## Testing Strategy

Static and unit tests:

- Theme schema validation.
- Preference default and migration validation.
- Link classification tests for external story links, Hacker News internal links, comments, reply, hide, vote, and login links.
- Build checks that reject remote URLs, arbitrary CSS theme values, broad permissions, and third-party runtime code.

Visual checks:

- Hacker News front page.
- `newest`.
- `news?p=2`.
- `item?id=...` comment pages.
- Wide desktop, narrow desktop, iPhone width, and iPad width.
- Light, dark, and system theme behavior.
- `Comfortable` and `Classic-ish` density.
- Multi-level comment indentation and wrapping.

Safari manual checks:

- macOS Safari local developer extension loading.
- iOS/iPadOS Safari extension enabling on simulator or device.
- Private Browsing behavior when the extension is allowed.
- iOS home-screen standalone behavior for Hacker News, with documented fallback if extension injection is not available.
- Extension disabled state restores original Hacker News.
- External story links default to current-tab behavior and only change when the user enables the new-tab setting.

## Release Strategy

Use a dual-track release posture.

Open-source developer track:

- The repository can be built and run locally with Xcode.
- Documentation explains Safari developer-extension setup.
- Documentation explains what can be tested without a paid Apple Developer Program membership and what requires paid signing or distribution.

App Store preparation track:

- Keep host permissions narrow from the start.
- Maintain privacy and permission documentation.
- Avoid analytics and remote configuration.
- Avoid remote code and remote theme loading.
- Maintain an App Store review checklist.
- Add signing, screenshots, privacy labels, and final review copy when distribution is ready.

## Privacy Statement

The extension should be able to truthfully say:

- It only runs on Hacker News.
- It stores only local extension preferences.
- It does not collect, upload, sell, or share user data.
- It does not read or store Hacker News account data.
- It does not track browsing history.
- It does not load remote code, remote themes, or analytics.

## Open Implementation Questions

These are implementation-time verification items, not product blockers:

- Confirm the current Safari WebExtension API support and minimum version targets.
- Confirm how Safari handles WebExtension injection in iOS home-screen web app containers.
- Confirm Private Browsing storage behavior across macOS, iOS, and iPadOS.
- Decide whether `storage.sync` is reliable enough for a future opt-in preference sync feature.
- Choose the initial build toolchain after creating the Xcode project structure.

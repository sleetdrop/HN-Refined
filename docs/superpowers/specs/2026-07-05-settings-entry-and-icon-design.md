# HN Refined Settings Entry And Icon Design

Date: 2026-07-05
Status: Approved for planning

## Purpose

This spec refines two presentation surfaces for HN Refined:

- The Safari toolbar popup should feel like a small native control surface, not a full settings panel.
- The app and extension icon should communicate "Hacker News, gently enhanced" while remaining visually distinct from official Hacker News or Y Combinator assets.

These changes must preserve the existing product direction: HN Refined is a restrained readability and touch-ergonomics extension, not a replacement Hacker News client.

## Toolbar Popup

Use a minimal popup with a theme quick switch.

The popup contains only:

- Extension status for the current Hacker News page.
- A compact enabled control if Safari extension APIs and the current permission model support it without broadening permissions.
- A `System / Light / Dark` theme segmented control.
- An `Open Settings` action that opens the full settings page in a tab.
- A short private-browsing/storage warning only when settings cannot be persisted.

The popup must not contain:

- Font preset controls.
- Desktop density controls.
- Reading width controls.
- Mobile layout controls.
- External story-link behavior controls.
- Long explanatory text.

Rationale:

- Theme switching is the only first-version preference likely to be changed frequently from the toolbar, especially for users who normally use a light system appearance but want to switch Hacker News at night.
- Other preferences are more deliberate reading-design choices and belong in a full settings page.
- Keeping the popup small lowers state-sync complexity and better matches Safari's toolbar interaction style.

## Full Settings Page

The full settings surface should open as a tab-style page, not as the toolbar popup.

It keeps the current first-version preferences:

- Theme.
- Font.
- Desktop density.
- Reading width.
- Mobile layout.
- External story-link new-tab behavior.

The settings page may group preferences by where they apply:

- Appearance: theme and font.
- Reading layout: desktop density and reading width.
- Mobile behavior: mobile layout.
- Link behavior: external story-link new-tab option.

The implementation should avoid an "airplane cockpit" of granular controls. The default experience remains opinionated and comfortable; settings exist only for meaningful user preferences.

## Icon Direction

Use the original C composition selected during visual exploration, with the C4 badge color treatment:

- Rounded-square HN orange base.
- Slightly rotated warm paper page.
- `HN` text on the page as the primary identity signal.
- Two warm gray reading lines below `HN`.
- A small upper-right `e` badge as the enhancement modifier.
- The badge uses warm ink gray, not near-black, so it aligns with the `HN` text and reading-line gray scale.

The `e` badge means "enhanced" and loosely evokes natural `e`. It is a visual metaphor, not a strict mathematical statement.

The icon should not precisely reproduce the official Hacker News or Y Combinator favicon geometry. It may reference Hacker News through orange, `HN`, and page structure, but the exact proportions, typography, radius, and composition should be original.

## Icon Palette

Target palette:

- HN orange base: `#ff6600`.
- Warm paper: approximately `#fff8ea`.
- Primary ink: approximately `#1b1814`.
- Badge warm ink gray: approximately `#3a342d`.
- Reading-line gray: approximately `#6f6255` and `#8a7f71`.

The final rendered assets may adjust these values slightly for small-size clarity, but the badge must stay in the same warm gray family instead of becoming a separate black focal point.

## Icon Asset Requirements

Generate assets for both app identity and Safari extension usage.

App icon:

- Fill the existing macOS `AppIcon.appiconset` sizes.
- Keep a high-resolution source asset in the repository so the icon can be regenerated.
- Preserve recognizability at 16, 32, 128, 256, 512, and 1024 px render sizes.

Safari extension toolbar icon:

- Use a simplified form derived from the same composition.
- Prioritize legibility over fidelity at toolbar scale.
- If the full `HN + e + lines` mark is too dense at toolbar size, simplify while keeping the orange/page/HN identity.

iOS readiness:

- Keep the master icon compatible with future iOS/iPadOS icon sizes and rounded-mask behavior.
- Avoid critical details at the extreme corners.
- Verify the mark remains readable when displayed as a home-screen icon and in Safari extension settings.

## Privacy And Review Posture

The icon and settings UI should not imply official Hacker News, Y Combinator, or Apple endorsement.

App metadata, README copy, and release materials should describe HN Refined as an independent, unofficial readability extension for Hacker News.

The toolbar popup and settings page must continue to avoid analytics, remote code, remote configuration, remote theme loading, and arbitrary user CSS.

## Acceptance Checks

Design checks:

- The toolbar popup is visibly smaller and simpler than the full settings page.
- Theme switching is available from the popup and updates active Hacker News pages without refresh.
- All non-theme preferences are available from the full settings page.
- The full settings page opens in a tab from the popup.
- Popup and settings page remain usable in Private Browsing when storage writes are unavailable.

Icon checks:

- App icon follows the selected C4 direction.
- Badge gray does not overpower the `HN` page mark.
- App icon is readable at macOS Dock, Finder, and Launchpad sizes.
- Toolbar icon is readable in Safari's toolbar and extension settings surfaces.
- Light and dark macOS appearances are checked visually.

Technical checks:

- Existing preference tests continue to pass.
- New popup/settings behavior has focused tests where possible.
- `npm run check` passes.
- Xcode Debug build passes.
- Safari visual checks cover both light and dark Hacker News themes after any style changes.

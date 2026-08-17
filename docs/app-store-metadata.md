# App Store Metadata Draft

This is a working draft for the first release. Verify field limits in App Store
Connect before submission.

## Product

- Name: `HN Refined`
- Version: `1.0`
- Bundle ID: `net.vetcafe.hnrefined`
- Category: Utilities
- Price: Free
- Support URL: `https://github.com/sleetdrop/HN-Refined/issues`
- Privacy policy URL: `https://github.com/sleetdrop/HN-Refined/blob/master/docs/privacy.md`

## Subtitle

`A calmer way to read HN`

## Description

HN Refined is a restrained Safari extension that improves Hacker News
readability while preserving the site's behavior and information architecture.

It provides comfortable typography and spacing, responsive iPhone and iPad
layouts, light and dark themes, and optional control over external story links.
Preferences stay on the device. HN Refined does not collect analytics, load
remote code, or modify Hacker News account actions.

HN Refined depends on the traditional Hacker News HTML structure. If a future
site change causes a visual problem, disable the extension temporarily and
report it through the public repository. The project welcomes small, auditable
fixes and pull requests.

On iPhone and iPad, enable HN Refined in Settings under Apps, Safari,
Extensions. Turn on Allow Extension and set `news.ycombinator.com` to Allow.
Enable Allow in Private Browsing separately if desired.

iOS and iPadOS Home Screen web apps are not supported; open Hacker News in
Safari to use HN Refined.

HN Refined is independent software and is not affiliated with Hacker News, Y
Combinator, or Apple.

## Keywords

`Hacker News,reader,readability,Safari,theme,typography`

## App Review Notes

HN Refined is a Safari WebExtension limited to
`https://news.ycombinator.com/*`. The containing app explains how to enable the
extension. No account is required for review; logged-out Hacker News pages
exercise the extension.

To test on iPhone or iPad:

1. Open Settings, Apps, Safari, Extensions, HN Refined.
2. Turn on Allow Extension.
3. Set `news.ycombinator.com` to Allow.
4. Open Hacker News in Safari.

The extension stores only local presentation preferences. It has no analytics,
advertising, remote configuration, remote code, or third-party SDKs.

## Privacy Answers

- Data collection: No, this app does not collect data.
- Tracking: No.
- Privacy choices URL: Not required because the app collects no data.
- Privacy policy URL: `https://github.com/sleetdrop/HN-Refined/blob/master/docs/privacy.md`

## Export Compliance

- HN Refined does not implement or bundle proprietary or non-Apple encryption.
- HTTPS and other cryptographic behavior are provided by Safari, WebKit, and
  Apple operating-system frameworks.
- The iOS and macOS containing apps declare
  `ITSAppUsesNonExemptEncryption = false` because the current build uses only
  exempt operating-system encryption.
- Confirm this determination in App Store Connect for the submitted build. If
  the implementation or dependencies change, reassess it before upload.

## Content Rights

HN Refined is an independent Safari extension that modifies the presentation of
Hacker News pages in the user's browser. It does not redistribute, archive, or
sell Hacker News content. The non-affiliation statement above avoids an
endorsement claim but is not itself authorization.

Because the extension accesses third-party Hacker News pages, treat App Store
Connect Content Rights as applicable; do not answer as though the app has no
third-party content. Before attesting that the app has the necessary rights or
lawful permission, the maintainer must confirm and record the basis covering
use of the Hacker News service, the `HN` name, and related visual references.
Be prepared to provide that basis to App Review if requested; do not mark this
item ready solely because the app is free or open source.

## Screenshot Plan

Prepare one to ten screenshots for each required platform set. Prefer a small,
honest set:

1. iPhone Hacker News front page in the default theme.
2. iPhone comment page in dark theme.
3. iPad front page or comment page showing the responsive layout.
4. macOS front page and toolbar popup.

Do not include private account information or imply endorsement by Hacker News,
Y Combinator, or Apple.

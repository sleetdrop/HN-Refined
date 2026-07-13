# App Store Checklist

Use this checklist before preparing App Store submission materials. It is not a substitute for current Apple documentation or device testing.

The current audit and metadata draft are in `docs/release-readiness.md` and
`docs/app-store-metadata.md`.

- Keep extension permissions narrow and limited to Hacker News.
- Confirm the manifest and host permissions match the first-version scope.
- Confirm `activeTab` is used only for user-initiated popup preference updates
  and that preference messages target only Hacker News tabs in the current
  Safari window.
- Verify the extension does not load remote code, remote configuration, remote themes, analytics, or third-party runtime resources.
- Confirm preferences are local extension preferences only.
- Prepare privacy labels and review copy that match `docs/privacy.md`.
- Prepare App Store description text that discloses the Hacker News HTML
  structure dependency, the lightweight compatibility posture, and the GitHub
  issue or pull request feedback path for future site changes.
- Include iPhone and iPad enablement text in the App Store description or
  release notes: turn on `Allow Extension`, then set `news.ycombinator.com` to
  `Allow` under Safari extension permissions.
- Prepare screenshots that show the extension on Hacker News without implying official Hacker News or Apple endorsement.
- Verify Safari WebExtension manifest behavior against current Apple documentation.
- Verify local development and distribution requirements against current Apple documentation, including what requires paid Apple Developer Program membership.
- Verify iOS and iPadOS extension enabling on the target device or simulator
  versions. iOS/iPadOS support is required for the first release. On iOS,
  confirm both `Allow Extension` and `news.ycombinator.com` set to `Allow`; do
  not assume Safari will prompt when the site permission remains `Ask`.
- Private Browsing runtime behavior has been verified on current iPhone, iPad,
  and macOS test environments. Recheck it on release-candidate builds, including
  local preference behavior.
- App Store copy must disclose that iOS/iPadOS Home Screen web apps are
  unsupported; normal Safari is the supported mobile surface.
- Confirm disabling the Safari extension restores the original Hacker News site behavior.
- Confirm external story links open in the current tab by default and only change when the user enables the new-tab preference.

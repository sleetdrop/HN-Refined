# App Store Checklist

Use this checklist before preparing App Store submission materials. It is not a substitute for current Apple documentation or device testing.

- Keep extension permissions narrow and limited to Hacker News.
- Confirm the manifest and host permissions match the first-version scope.
- Verify the extension does not load remote code, remote configuration, remote themes, analytics, or third-party runtime resources.
- Confirm preferences are local extension preferences only.
- Prepare privacy labels and review copy that match `docs/privacy.md`.
- Prepare screenshots that show the extension on Hacker News without implying official Hacker News or Apple endorsement.
- Verify Safari WebExtension manifest behavior against current Apple documentation.
- Verify local development and distribution requirements against current Apple documentation, including what requires paid Apple Developer Program membership.
- Verify iOS and iPadOS extension enabling on the target device or simulator versions.
- Verify Private Browsing behavior when the extension is allowed, including storage fallback behavior.
- Verify whether extensions run inside iOS home-screen web app containers. If they do not, document that limitation and keep normal mobile Safari support as the fallback.
- Confirm disabling the Safari extension restores the original Hacker News site behavior.
- Confirm external story links open in the current tab by default and only change when the user enables the new-tab preference.

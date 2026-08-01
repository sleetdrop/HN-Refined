# App Store Checklist

Use this checklist before preparing App Store submission materials. It is not a substitute for current Apple documentation or device testing.

The current audit and metadata draft are in `docs/release-readiness.md` and
`docs/app-store-metadata.md`.

- Keep extension permissions narrow and limited to Hacker News.
- Register and use the final explicit Bundle IDs: `net.vetcafe.hnrefined` for
  the app and `net.vetcafe.hnrefined.extension` for the Safari extension.
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
- Before purchasing the developer membership, install the current Release
  candidate on the maintainer's iPhone with a free Xcode Personal Team and use
  it for several days as the primary Hacker News browsing path.
- Private Browsing runtime behavior has been verified on current iPhone, iPad,
  and macOS test environments. Recheck it on release-candidate builds, including
  local preference behavior.
- App Store copy must disclose that iOS/iPadOS Home Screen web apps are
  unsupported; normal Safari is the supported mobile surface.
- Confirm disabling the Safari extension restores the original Hacker News site behavior.
- On iPhone Safari, open `newcomments` with an entry whose `on:` story title is
  long enough to wrap. Confirm the metadata link, account navigation, and
  comment prose stay within the viewport without horizontal clipping or a
  widened page.
- Verify the color-semantic contract in fixed Light, fixed Dark, and System.
  Confirm visited links, selected top navigation, `.hnmore`, every `.c5a`
  through `.cdd` comment level, Thread Focus hierarchy, and Increase Contrast
  retain their documented meaning. Confirm a custom `topcolor` stays unchanged
  with dark navigation text and an unfiltered logo, while the default dark
  header uses the restrained original-`y18.svg` treatment. Check new-account,
  own-item, and YC-alumni colors when the test account exposes them.
- In Light and Dark, verify generic HN application links on Jobs, account, and
  footer surfaces use the documented primary/visited link roles, while metadata
  and every faded comment level remain distinct. Check editable fields have a
  subtle control surface and border, a restrained warm focus ring, and native
  Safari caret/select behavior. On iPhone, confirm comment controls start at 2
  rows and expand on first focus, whereas the submit text editor starts at 6
  rows without auto-expanding; both retain text and focus while their height is
  adjusted.
- Confirm external story links open in the current tab by default and only change when the user enables the new-tab preference.
- On iPhone Safari, verify a deeply nested comment chain with Thread Focus on
  and off. Confirm ordinary scrolling never activates or rebases a scope and
  progressive indentation remains when Focus is off. Confirm HN's `root`,
  `parent`, `prev`, `next`, `[–]`, and `[n more]`
  behavior remains authoritative while focus and Safari Back provide the
  documented local reading scope. In focus, confirm the site header is hidden,
  the guide is the top boundary, the root has zero indent, and only the selected
  subtree remains. Rotate between portrait and landscape and confirm the same
  Focus View remains active. Verify compact comment-author ancestry can expand without
  moving the page: five authors or fewer stay complete, longer chains show the
  first author, ellipsis, and final three, and slash spacing is symmetric. Tap
  visible and newly revealed ancestor links and verify Back restores the
  previous view and Forward reapplies it. Check inside-target retention,
  nearest-common-ancestor widening, another-top-level-tree exit, and unchanged
  original HN destinations. In compact and expanded paths, confirm `all` aligns
  to the first line, ancestors remain muted, only the current author is primary,
  `focused:` has a visible following gap, and the final parent/current pair does
  not split across lines. Confirm `all` restores the story, reply form, spacers,
  footer, and outside comments.

# Release Readiness

Last reviewed: 2026-08-01

## Release Gate

Release preparation is deliberately paused while the two HN-alignment
corrections from the final pre-release article review complete physical-device
burn-in. The first correction,
deep mobile comment hierarchy and local reading scope, is implemented, covered
by automated interaction tests, and visually checked in iPhone Simulator
Safari. Physical-iPhone testing found that Automatic scope could interrupt and
oscillate during momentum scrolling, so Automatic has been removed in favor of
explicit focus. The rebuilt signed extension, package doctor, and iPhone
Simulator long-scroll pass were complete for the prior revision. Explicit focus uses HN's
`next | focus [–]` action grammar. The current Focus View Stack revision hides
the site header with the story, reply form, spacers, footer, and outside
comments; its guide becomes the top boundary and the root rebases to zero
indent. Repeated focus creates Back/Forward views, while `all` exits the entire
Focus session. A subsequent physical-iPhone check found that direct deep focus
showed only the clicked author at the far right because the guide represented
Focus History instead of original comment ancestry. The current accepted
revision makes Thread Focus default-on for every comment with replies. Five
authors or fewer remain complete; longer ancestry initially keeps the first and
final three around an expandable ellipsis. Ancestor links zoom to an exact
comment, while original HN navigation widens only to the nearest common comment
ancestor or exits for another top-level tree. Back restores the previous view,
Forward reapplies it, and History remains page-local. The guide now aligns
`all` to its first visual line, keeps ancestors muted, keeps the final
parent/current pair together, and preserves Focus through iPhone rotation. The
complete interaction-test gate, iOS build, signed macOS Safari reinstall, and
package doctor pass. iPhone 17 Pro / iOS 26.3 Simulator checks cover compact and
expanded ancestry, both themes, History navigation, collapse preservation, and
portrait/landscape retention. A subsequent physical-iPhone pass confirmed that
the current revision follows the intended interaction direction; multi-day use
now serves as burn-in for smaller follow-up adjustments rather than leaving the
hierarchy correction open.
The second correction preserves Hacker News color semantics in Light and
translates those roles into a documented warm palette in Dark. Increased
Contrast preserves the complete ordered comment-fade ladder,
custom `topcolor` values fail open, and the default dark logo receives a
CSS-only treatment. The prior 174-test gate, signed macOS Safari reinstall,
package doctor, canonical resource sync, and iPhone 17 Pro / iOS 26.3 Simulator
color matrix pass. The simulator matrix covers System Dark, fixed Dark over
system Light, fixed Light over system Dark, and normal/Increase Contrast live
HN pages. Do not resume screenshots, final release copy, archive validation, or
submission work until physical-device color burn-in is complete and any
resulting refinements are reflected in project status.

The current refinement batch adds explicit field surface/border/focus tokens,
fixes the later-loading HN default-link rule only within `#hnmain`, and gives
the mobile submit text editor the same bounded height controls as comment
editing without touching profile `about` fields. iPhone 17 Pro / iOS 26.3
Simulator checks cover focused Light and Dark submit fields, normal Dark Jobs
and profile surfaces, and the absence of submit controls from `about`. The
current 178-test gate passes. A current macOS Safari reinstall remains blocked
on this machine because its configured team has no valid Mac Development
signing identity; iOS Simulator installation succeeds. Physical-device color
burn-in remains the release gate.

## App Store Audit

| Area               | Status       | Evidence or next action                                                                                                                                                                                                        |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current SDK        | Ready        | Xcode 26.3 and iOS 26.3 SDK satisfy Apple's 2026 upload baseline.                                                                                                                                                              |
| Safari runtime     | Burn-in      | Current 178-test gate and iOS build/Simulator checks pass. The prior signed install and package doctor pass; current macOS reinstall is blocked by a missing local Mac Development identity. Continue physical-iPhone burn-in. |
| Host onboarding    | Ready        | `HN Refined` shows `Settings > Apps > Safari > Extensions > HN Refined`, `Allow Extension`, and the `news.ycombinator.com` site permission requirement.                                                                        |
| Host permissions   | Ready        | Limited to `https://news.ycombinator.com/*`.                                                                                                                                                                                   |
| Data collection    | Ready        | No collection, tracking, analytics, remote code, or third-party SDKs.                                                                                                                                                          |
| Privacy answers    | Drafted      | Select “No, we do not collect data” in App Store Connect.                                                                                                                                                                      |
| Privacy policy URL | Ready        | Public repository URL recorded in `docs/app-store-metadata.md`.                                                                                                                                                                |
| Version alignment  | Ready        | WebExtension/package use `1.0.0`; Xcode uses marketing version `1.0` and build `1`.                                                                                                                                            |
| App record         | Human action | Register `net.vetcafe.hnrefined` and its extension ID, then create the App Store Connect record.                                                                                                                               |
| Signing            | Human action | Select the distribution team and App Store distribution signing in Xcode.                                                                                                                                                      |
| Archive validation | Partial      | Unsigned iOS and macOS Release archives pass; signed App Store validation remains.                                                                                                                                             |
| Physical iPhone    | Pending      | Install with a free Xcode Personal Team and complete a multi-day first-user burn-in.                                                                                                                                           |
| Store metadata     | Drafted      | Public support and privacy URLs are set; review the final copy before submission.                                                                                                                                              |
| Screenshots        | Pending      | Capture current iPhone, iPad, and macOS release-build screenshots.                                                                                                                                                             |
| Review notes       | Drafted      | Use the enablement steps in `docs/app-store-metadata.md`.                                                                                                                                                                      |

Apple review requirements relevant to this project:

- Safari extensions must run on current Safari, avoid interfering with Safari
  UI, and request only necessary website access.
- Extension functionality must be accurately disclosed in marketing text.
- A privacy policy URL and App Privacy answers are required in App Store Connect.
- App Store uploads after April 28, 2026 must use the iOS/iPadOS 26 SDK or later.
- App Store screenshots require one to ten accepted images per required platform
  set.

The iPhone/iPad containing app uses `SFSafariExtensionManager` on iOS 26.2 and
later to report enabled state, with static guidance on older systems or lookup
failure. This status does not include website permission, so the complete
`Settings > Apps > Safari > Extensions > HN Refined` path and the instruction to
set the `news.ycombinator.com` site permission to `Allow` remain visible in every
state.

Recheck these sources immediately before submission:

- <https://developer.apple.com/app-store/review/guidelines/>
- <https://developer.apple.com/app-store/submitting/>
- <https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy>
- <https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications>
- <https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/>

## Open Source Audit

| Area                       | Status   | Evidence or next action                                                            |
| -------------------------- | -------- | ---------------------------------------------------------------------------------- |
| License                    | Ready    | MIT License in `LICENSE`.                                                          |
| Contribution guide         | Ready    | `CONTRIBUTING.md`.                                                                 |
| Security reporting         | Ready    | GitHub private advisory URL and fallback email are documented.                     |
| Code of conduct            | Optional | Add one if community participation grows.                                          |
| CI                         | Ready    | GitHub Actions runs `make check` with read-only repository permissions.            |
| Reproducible dependencies  | Ready    | `package-lock.json` is committed and CI can use the locked dependency graph.       |
| Generated/source boundary  | Ready    | `extension/` is canonical; Xcode resources are synchronized by repository tooling. |
| Sensitive committed values | Ready    | No personal Apple team ID, signing identity, or machine path is tracked.           |
| Public repository          | Ready    | `https://github.com/sleetdrop/HN-Refined`.                                         |
| Issue and PR templates     | Ready    | GitHub issue forms and pull request template are committed.                        |
| Release notes              | Pending  | Draft the first release notes after version alignment and archive validation.      |

The source is ready to publish under the MIT License.

## Pre-membership Release Evidence

- The unsigned macOS Release archive succeeds, embeds the Safari extension,
  declares the Utilities category, and contains both `arm64` and `x86_64`
  binaries.
- The unsigned iOS Release archive succeeds outside the agent sandbox, embeds
  the Safari extension, uses version `1.0` build `1`, and contains `arm64`
  device binaries with the final Bundle IDs.
- A free Xcode Personal Team can install the app on the maintainer's iPhone for
  a multi-day first-user test. Its provisioning profile expires after seven
  days and can be renewed by rebuilding and reinstalling.
- Paid membership is still required for App Store signing, upload validation,
  TestFlight, and submission. Do not purchase it until the iOS archive and
  physical-device burn-in pass.

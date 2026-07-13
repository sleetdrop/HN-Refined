# Release Readiness

Last reviewed: 2026-07-13

## App Store Audit

| Area               | Status       | Evidence or next action                                                                              |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| Current SDK        | Ready        | Xcode 26.3 and iOS 26.3 SDK satisfy Apple's 2026 upload baseline.                                    |
| Safari runtime     | Ready        | macOS, iPhone, and iPad normal and Private Browsing checks are recorded in `docs/project-status.md`. |
| Host permissions   | Ready        | Limited to `https://news.ycombinator.com/*`.                                                         |
| Data collection    | Ready        | No collection, tracking, analytics, remote code, or third-party SDKs.                                |
| Privacy answers    | Drafted      | Select “No, we do not collect data” in App Store Connect.                                            |
| Privacy policy URL | Ready        | Public repository URL recorded in `docs/app-store-metadata.md`.                                      |
| Version alignment  | Ready        | WebExtension/package use `1.0.0`; Xcode uses marketing version `1.0` and build `1`.                  |
| App record         | Human action | Register `net.vetcafe.hnrefined` and its extension ID, then create the App Store Connect record.     |
| Signing            | Human action | Select the distribution team and App Store distribution signing in Xcode.                            |
| Archive validation | Partial      | Unsigned iOS and macOS Release archives pass; signed App Store validation remains.                   |
| Physical iPhone    | Pending      | Install with a free Xcode Personal Team and complete a multi-day first-user burn-in.                 |
| Store metadata     | Drafted      | Public support and privacy URLs are set; review the final copy before submission.                    |
| Screenshots        | Pending      | Capture current iPhone, iPad, and macOS release-build screenshots.                                   |
| Review notes       | Drafted      | Use the enablement steps in `docs/app-store-metadata.md`.                                            |

Apple review requirements relevant to this project:

- Safari extensions must run on current Safari, avoid interfering with Safari
  UI, and request only necessary website access.
- Extension functionality must be accurately disclosed in marketing text.
- A privacy policy URL and App Privacy answers are required in App Store Connect.
- App Store uploads after April 28, 2026 must use the iOS/iPadOS 26 SDK or later.
- App Store screenshots require one to ten accepted images per required platform
  set.

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

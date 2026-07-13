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
| Version alignment  | Pending      | Align WebExtension/package `0.1.0` with Xcode marketing version `1.0` before archive.                |
| App record         | Human action | Create the App Store Connect record and confirm the final Bundle ID.                                 |
| Signing            | Human action | Select the distribution team and App Store distribution signing in Xcode.                            |
| Archive validation | Pending      | Archive the release configuration, validate, and inspect warnings before upload.                     |
| Store metadata     | Drafted      | Review `docs/app-store-metadata.md` and replace TODO URLs.                                           |
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

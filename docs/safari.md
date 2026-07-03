# Safari Development

The WebExtension source lives in `extension/`.

Before creating or refreshing the Xcode wrapper, run:

```bash
npm run check
```

Implementation must verify current Apple documentation for:

- Supported Safari WebExtension manifest version behavior.
- Local development without paid Apple Developer Program distribution.
- iOS and iPadOS extension enabling.
- Private Browsing behavior.
- Whether extensions run inside iOS home-screen web app containers.

The repository does not yet claim these Safari behaviors as verified. Record the Apple documentation version, Safari version, platform version, and device or simulator used when completing those checks.

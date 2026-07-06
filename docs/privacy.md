# Privacy

HN Refined is designed as a local Safari extension for Hacker News readability. Its first-version behavior is intentionally narrow:

- HN Refined only runs on Hacker News.
- HN Refined stores only local extension preferences.
- HN Refined does not collect, upload, sell, or share user data.
- HN Refined does not read or store Hacker News account data.
- HN Refined does not track browsing history.
- HN Refined does not load remote code, remote themes, or analytics.

The extension uses local preferences for presentation choices such as theme,
font, density, width, and external story-link target behavior. It does not
modify Hacker News account actions such as voting, hiding, replying, logging
in, or submitting comments.

The extension requests Safari's `activeTab` permission only for user-initiated
preference updates from the toolbar popup. Preference changes are sent only to
Hacker News tabs in the current Safari window. HN Refined does not use this
permission to inspect unrelated pages or collect browsing history.

Before release, implementation must verify current Safari and App Store privacy requirements against current Apple documentation.

const HN_ORIGIN = "https://news.ycombinator.com";

export function isHackerNewsInternalUrl(href) {
  try {
    const url = new URL(href, HN_ORIGIN);
    return url.origin === HN_ORIGIN;
  } catch {
    return false;
  }
}

export function isExternalStoryLink(linkInfo) {
  if (!linkInfo || isHackerNewsInternalUrl(linkInfo.href)) {
    return false;
  }

  if (!Array.isArray(linkInfo.closestClassNames)) {
    return false;
  }

  return linkInfo.closestClassNames.includes("titleline");
}

export function shouldForceNewTab(linkInfo, preferences) {
  return Boolean(preferences?.openStoryLinksInNewTabs === true && isExternalStoryLink(linkInfo));
}

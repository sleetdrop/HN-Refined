export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "system",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
});

export const ALLOWED_PREFERENCES = Object.freeze({
  theme: Object.freeze(["system", "light", "dark"]),
  fontPreset: Object.freeze(["hn-classic", "system-sans", "serif-reading", "mono-ish"]),
  desktopDensity: Object.freeze(["comfortable", "classic-ish"]),
  readingWidth: Object.freeze(["comfortable", "wide"]),
});

function enumOrDefault(key, value) {
  return ALLOWED_PREFERENCES[key].includes(value) ? value : DEFAULT_PREFERENCES[key];
}

function threadFocusEnabledOrDefault(preferences) {
  if (typeof preferences.threadFocusEnabled === "boolean") {
    return preferences.threadFocusEnabled;
  }

  if (preferences.deepThreadMode === "indentation-only") {
    return false;
  }

  return DEFAULT_PREFERENCES.threadFocusEnabled;
}

export function normalizePreferences(raw = {}) {
  const preferences = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  return {
    theme: enumOrDefault("theme", preferences.theme),
    fontPreset: enumOrDefault("fontPreset", preferences.fontPreset),
    desktopDensity: enumOrDefault("desktopDensity", preferences.desktopDensity),
    readingWidth: enumOrDefault("readingWidth", preferences.readingWidth),
    threadFocusEnabled: threadFocusEnabledOrDefault(preferences),
    openStoryLinksInNewTabs:
      typeof preferences.openStoryLinksInNewTabs === "boolean"
        ? preferences.openStoryLinksInNewTabs
        : DEFAULT_PREFERENCES.openStoryLinksInNewTabs,
  };
}

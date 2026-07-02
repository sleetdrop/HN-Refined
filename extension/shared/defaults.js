export const DEFAULT_PREFERENCES = Object.freeze({
  theme: "system",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false
});

export const ALLOWED_PREFERENCES = Object.freeze({
  theme: Object.freeze(["system", "light", "dark"]),
  fontPreset: Object.freeze([
    "hn-classic",
    "system-sans",
    "serif-reading",
    "mono-ish"
  ]),
  desktopDensity: Object.freeze(["comfortable", "classic-ish"]),
  readingWidth: Object.freeze(["comfortable", "wide"]),
  mobileLayout: Object.freeze(["auto", "off"])
});

function enumOrDefault(key, value) {
  return ALLOWED_PREFERENCES[key].includes(value)
    ? value
    : DEFAULT_PREFERENCES[key];
}

export function normalizePreferences(raw = {}) {
  return {
    theme: enumOrDefault("theme", raw.theme),
    fontPreset: enumOrDefault("fontPreset", raw.fontPreset),
    desktopDensity: enumOrDefault("desktopDensity", raw.desktopDensity),
    readingWidth: enumOrDefault("readingWidth", raw.readingWidth),
    mobileLayout: enumOrDefault("mobileLayout", raw.mobileLayout),
    openStoryLinksInNewTabs:
      typeof raw.openStoryLinksInNewTabs === "boolean"
        ? raw.openStoryLinksInNewTabs
        : DEFAULT_PREFERENCES.openStoryLinksInNewTabs
  };
}

const DEFAULT_PREFERENCES = {
  theme: "system",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false
};

const STORAGE_KEY = "hnRefinedPreferences";
const HN_HOSTNAME = "news.ycombinator.com";

const ALLOWED = {
  theme: ["system", "light", "dark"],
  fontPreset: ["hn-classic", "system-sans", "serif-reading", "mono-ish"],
  desktopDensity: ["comfortable", "classic-ish"],
  readingWidth: ["comfortable", "wide"],
  mobileLayout: ["auto", "off"]
};

let preferences = DEFAULT_PREFERENCES;

function browserApi() {
  return globalThis.browser || globalThis.chrome;
}

function getStorageValue(api, key) {
  if (api === globalThis.browser) {
    const result = api.storage.local.get(key);
    if (result && typeof result.then === "function") {
      return result;
    }

    return Promise.reject(new Error("storage.local.get did not return a Promise"));
  }

  return new Promise((resolve, reject) => {
    api.storage.local.get(key, (result) => {
      const lastError = api?.runtime?.lastError;

      if (lastError) {
        reject(new Error(lastError.message || String(lastError)));
        return;
      }

      resolve(result);
    });
  });
}

function enumOrDefault(key, value) {
  return ALLOWED[key].includes(value) ? value : DEFAULT_PREFERENCES[key];
}

function normalize(raw = {}) {
  const next = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  return {
    theme: enumOrDefault("theme", next.theme),
    fontPreset: enumOrDefault("fontPreset", next.fontPreset),
    desktopDensity: enumOrDefault("desktopDensity", next.desktopDensity),
    readingWidth: enumOrDefault("readingWidth", next.readingWidth),
    mobileLayout: enumOrDefault("mobileLayout", next.mobileLayout),
    openStoryLinksInNewTabs:
      typeof next.openStoryLinksInNewTabs === "boolean"
        ? next.openStoryLinksInNewTabs
        : DEFAULT_PREFERENCES.openStoryLinksInNewTabs
  };
}

function applyPreferences(nextPreferences) {
  preferences = normalize(nextPreferences);
  const root = document.documentElement;

  root.dataset.hnrTheme = preferences.theme;
  root.dataset.hnrFont = preferences.fontPreset;
  root.dataset.hnrDensity = preferences.desktopDensity;
  root.dataset.hnrWidth = preferences.readingWidth;
  root.dataset.hnrMobile = preferences.mobileLayout;
}

function isHackerNewsInternalUrl(href) {
  try {
    const url = new URL(href, document.location.href);
    return url.protocol === "https:" && url.hostname === HN_HOSTNAME;
  } catch {
    return false;
  }
}

function isExternalStoryAnchor(anchor) {
  return Boolean(
    anchor &&
      anchor.closest(".titleline") &&
      anchor.href &&
      !isHackerNewsInternalUrl(anchor.href)
  );
}

function hasOriginalValue(anchor, key) {
  return Object.prototype.hasOwnProperty.call(anchor.dataset, key);
}

function rememberAttribute(anchor, attributeName, dataKey) {
  if (anchor.hasAttribute(attributeName)) {
    anchor.dataset[dataKey] = anchor.getAttribute(attributeName);
  }
}

function restoreAttribute(anchor, attributeName, dataKey) {
  if (hasOriginalValue(anchor, dataKey)) {
    anchor.setAttribute(attributeName, anchor.dataset[dataKey]);
  } else {
    anchor.removeAttribute(attributeName);
  }

  delete anchor.dataset[dataKey];
}

function rememberStoryTarget(anchor) {
  if (anchor.dataset.hnrTargetManaged) {
    return;
  }

  anchor.dataset.hnrTargetManaged = "true";
  rememberAttribute(anchor, "target", "hnrOriginalTarget");
  rememberAttribute(anchor, "rel", "hnrOriginalRel");
}

function addRequiredRelTokens(anchor) {
  const relTokens = new Set(anchor.rel.split(/\s+/).filter(Boolean));

  relTokens.add("noopener");
  relTokens.add("noreferrer");

  anchor.rel = [...relTokens].join(" ");
}

function restoreStoryTarget(anchor) {
  if (!anchor.dataset.hnrTargetManaged) {
    return;
  }

  restoreAttribute(anchor, "target", "hnrOriginalTarget");
  restoreAttribute(anchor, "rel", "hnrOriginalRel");
  delete anchor.dataset.hnrTargetManaged;
}

function updateStoryTargets() {
  for (const anchor of document.querySelectorAll(".titleline a[href]")) {
    if (!isExternalStoryAnchor(anchor)) {
      continue;
    }

    if (preferences.openStoryLinksInNewTabs) {
      rememberStoryTarget(anchor);
      anchor.target = "_blank";
      addRequiredRelTokens(anchor);
    } else {
      restoreStoryTarget(anchor);
    }
  }
}

async function loadPreferences() {
  const api = browserApi();
  if (!api?.storage?.local) {
    applyPreferences(DEFAULT_PREFERENCES);
    return;
  }

  try {
    const result = await getStorageValue(api, STORAGE_KEY);
    applyPreferences(result?.[STORAGE_KEY] || DEFAULT_PREFERENCES);
  } catch {
    applyPreferences(DEFAULT_PREFERENCES);
  }
}

function observePreferences() {
  const api = browserApi();
  api?.storage?.onChanged?.addListener?.((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    applyPreferences(changes[STORAGE_KEY].newValue || DEFAULT_PREFERENCES);
    updateStoryTargets();
  });
}

function start() {
  loadPreferences().then(updateStoryTargets);
  observePreferences();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateStoryTargets, { once: true });
  } else {
    updateStoryTargets();
  }
}

start();

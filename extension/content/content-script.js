const DEFAULT_PREFERENCES = {
  theme: "system",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
};

const STORAGE_KEY = "hnRefinedPreferences";
const HN_HOSTNAME = "news.ycombinator.com";
const PREFERENCES_CHANGED_MESSAGE_TYPE = "hn-refined:preferences-changed";
const PREFERENCE_REFRESH_INTERVAL_MS = 1000;
const TITLELINE_STORY_ANCHOR_SELECTOR = ".titleline a[href]";
const STORY_ROW_ANCHOR_SELECTOR = ".athing:not(.comtr) a[href]";
const COMMENT_EDITOR_SELECTOR = '#hnmain form[action="comment"] textarea[name="text"]';
const MOBILE_COMMENT_EDITOR_QUERY = "(max-width: 700px) and (any-pointer: coarse)";
const COMMENT_EDITOR_MIN_ROWS = 2;
const COMMENT_EDITOR_FOCUS_ROWS = 6;
const COMMENT_EDITOR_ROW_STEP = 4;
const COMMENT_EDITOR_MAX_ROWS = 22;
const commentEditorStates = new WeakMap();
const mobileCommentEditorQuery = window.matchMedia(MOBILE_COMMENT_EDITOR_QUERY);

const ALLOWED = {
  theme: ["system", "light", "dark"],
  fontPreset: ["hn-classic", "system-sans", "serif-reading", "mono-ish"],
  desktopDensity: ["comfortable", "classic-ish"],
  readingWidth: ["comfortable", "wide"],
};

let preferences = DEFAULT_PREFERENCES;
let deepCommentsController = null;

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

function threadFocusEnabledOrDefault(next) {
  if (typeof next.threadFocusEnabled === "boolean") {
    return next.threadFocusEnabled;
  }

  if (next.deepThreadMode === "indentation-only") {
    return false;
  }

  return DEFAULT_PREFERENCES.threadFocusEnabled;
}

function normalize(raw = {}) {
  const next = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  return {
    theme: enumOrDefault("theme", next.theme),
    fontPreset: enumOrDefault("fontPreset", next.fontPreset),
    desktopDensity: enumOrDefault("desktopDensity", next.desktopDensity),
    readingWidth: enumOrDefault("readingWidth", next.readingWidth),
    threadFocusEnabled: threadFocusEnabledOrDefault(next),
    openStoryLinksInNewTabs:
      typeof next.openStoryLinksInNewTabs === "boolean"
        ? next.openStoryLinksInNewTabs
        : DEFAULT_PREFERENCES.openStoryLinksInNewTabs,
  };
}

function applyPreferences(nextPreferences) {
  preferences = normalize(nextPreferences);
  const root = document.documentElement;

  root.dataset.hnrTheme = preferences.theme;
  root.dataset.hnrFont = preferences.fontPreset;
  root.dataset.hnrDensity = preferences.desktopDensity;
  root.dataset.hnrWidth = preferences.readingWidth;
  root.dataset.hnrMobile = "auto";
  delete root.dataset.hnrDeepThreads;
  updateDeepComments(preferences.threadFocusEnabled);
}

function updateDeepComments(enabled) {
  if (!deepCommentsController) {
    deepCommentsController = globalThis.HNRefinedDeepComments?.createController?.({
      document,
      window,
    });
    deepCommentsController?.start(enabled);
    return;
  }

  deepCommentsController.setEnabled(enabled);
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
    anchor?.href &&
      !isHackerNewsInternalUrl(anchor.href) &&
      (anchor.closest(".titleline") || isFallbackStoryAnchor(anchor)),
  );
}

function isFallbackStoryAnchor(anchor) {
  if (!anchor?.href || isHackerNewsInternalUrl(anchor.href)) {
    return false;
  }

  if (!anchor.closest(".athing:not(.comtr)") || !anchor.closest("td.title")) {
    return false;
  }

  return !(
    anchor.closest(".subtext") ||
    anchor.closest(".comhead") ||
    anchor.closest(".reply") ||
    anchor.closest(".pagetop")
  );
}

function storyAnchorCandidates() {
  const anchors = new Set(document.querySelectorAll(TITLELINE_STORY_ANCHOR_SELECTOR));

  for (const anchor of document.querySelectorAll(STORY_ROW_ANCHOR_SELECTOR)) {
    if (isFallbackStoryAnchor(anchor)) {
      anchors.add(anchor);
    }
  }

  return anchors;
}

function hasOriginalValue(anchor, key) {
  return Object.hasOwn(anchor.dataset, key);
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
  for (const anchor of storyAnchorCandidates()) {
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

function refreshPreferences() {
  return loadPreferences().then(updateStoryTargets);
}

function isLocalStorageArea(areaName) {
  return areaName === "local" || areaName == null;
}

function observePreferences() {
  const api = browserApi();
  api?.storage?.onChanged?.addListener?.((changes, areaName) => {
    if (!isLocalStorageArea(areaName) || !changes[STORAGE_KEY]) {
      return;
    }

    applyPreferences(changes[STORAGE_KEY].newValue || DEFAULT_PREFERENCES);
    updateStoryTargets();
  });

  api?.runtime?.onMessage?.addListener?.((message) => {
    if (message?.type !== PREFERENCES_CHANGED_MESSAGE_TYPE) {
      return;
    }

    applyPreferences(message.preferences || DEFAULT_PREFERENCES);
    updateStoryTargets();
  });
}

function startPreferenceRefreshFallback() {
  window.setInterval(() => {
    if (document.visibilityState !== "visible") {
      return Promise.resolve();
    }

    return refreshPreferences();
  }, PREFERENCE_REFRESH_INTERVAL_MS);
}

function observePageActivation() {
  window.addEventListener("focus", refreshPreferences);
  window.addEventListener("pageshow", refreshPreferences);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshPreferences();
    }
  });
}

function clampCommentEditorRows(rows) {
  return Math.min(COMMENT_EDITOR_MAX_ROWS, Math.max(COMMENT_EDITOR_MIN_ROWS, rows));
}

function applyCommentEditorRows(editor, state) {
  editor.rows = mobileCommentEditorQuery.matches ? state.mobileRows : state.originalRows;
  state.decreaseButton.disabled = state.mobileRows <= COMMENT_EDITOR_MIN_ROWS;
  state.increaseButton.disabled = state.mobileRows >= COMMENT_EDITOR_MAX_ROWS;
}

function changeCommentEditorRows(editor, delta) {
  const state = commentEditorStates.get(editor);
  if (!state) {
    return;
  }

  state.mobileRows = clampCommentEditorRows(state.mobileRows + delta);
  applyCommentEditorRows(editor, state);
}

function createCommentEditorSizeButton(editor, direction, label, delta) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `hnr-comment-editor-size-button hnr-comment-editor-size-button--${direction}`;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("pointerdown", (event) => {
    if (document.activeElement === editor) {
      event.preventDefault();
    }
  });
  button.addEventListener("click", () => changeCommentEditorRows(editor, delta));
  return button;
}

function createCommentEditorControls(editor) {
  const controls = document.createElement("span");
  controls.className = "hnr-comment-editor-controls";
  controls.append(
    createCommentEditorSizeButton(
      editor,
      "decrease",
      "Decrease comment editor height",
      -COMMENT_EDITOR_ROW_STEP,
    ),
    createCommentEditorSizeButton(
      editor,
      "increase",
      "Increase comment editor height",
      COMMENT_EDITOR_ROW_STEP,
    ),
  );
  return controls;
}

function enhanceCommentEditor(editor) {
  if (commentEditorStates.has(editor)) {
    return;
  }

  const controls = createCommentEditorControls(editor);
  const [decreaseButton, increaseButton] = controls.children;
  const state = {
    originalRows: editor.rows,
    mobileRows: COMMENT_EDITOR_MIN_ROWS,
    focusedOnce: false,
    controls,
    decreaseButton,
    increaseButton,
  };

  commentEditorStates.set(editor, state);
  editor.insertAdjacentElement("afterend", controls);
  applyCommentEditorRows(editor, state);
}

function enhanceCommentEditors() {
  for (const editor of document.querySelectorAll(COMMENT_EDITOR_SELECTOR)) {
    enhanceCommentEditor(editor);
  }
}

function handleCommentEditorFocus(event) {
  const editor = event.target;
  const state = commentEditorStates.get(editor);
  if (!state || state.focusedOnce || !mobileCommentEditorQuery.matches) {
    return;
  }

  state.focusedOnce = true;
  state.mobileRows = Math.max(state.mobileRows, COMMENT_EDITOR_FOCUS_ROWS);
  applyCommentEditorRows(editor, state);
}

function refreshCommentEditorViewports() {
  for (const editor of document.querySelectorAll(COMMENT_EDITOR_SELECTOR)) {
    const state = commentEditorStates.get(editor);
    if (state) {
      applyCommentEditorRows(editor, state);
    }
  }
}

function observeCommentEditors() {
  document.addEventListener("focusin", handleCommentEditorFocus);
  mobileCommentEditorQuery.addEventListener("change", refreshCommentEditorViewports);
}

function start() {
  applyPreferences(DEFAULT_PREFERENCES);
  refreshPreferences();
  observePreferences();
  observePageActivation();
  observeCommentEditors();
  startPreferenceRefreshFallback();

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        updateStoryTargets();
        enhanceCommentEditors();
      },
      { once: true },
    );
  } else {
    updateStoryTargets();
    enhanceCommentEditors();
  }
}

start();

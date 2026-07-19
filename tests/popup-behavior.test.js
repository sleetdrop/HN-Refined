import assert from "node:assert/strict";
import test from "node:test";

const existingPreferences = {
  theme: "dark",
  fontPreset: "serif-reading",
  desktopDensity: "classic-ish",
  readingWidth: "wide",
  openStoryLinksInNewTabs: true,
};

function makeElement(initial = {}) {
  return {
    checked: false,
    hidden: false,
    textContent: "",
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    ...initial,
  };
}

function restoreGlobals(originalBrowser, originalChrome, originalDocument) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
  globalThis.document = originalDocument;
}

test("popup writes quick setting changes, notifies Hacker News tabs, and opens all settings", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const originalDocument = globalThis.document;
  const writes = [];
  const messages = [];
  const createdTabs = [];
  let storedPreferences = existingPreferences;

  const status = makeElement({ hidden: true });
  const openSettings = makeElement();
  const openStoryLinksInNewTabs = makeElement();
  const themeControls = ["system", "light", "dark"].map((value) => makeElement({ value }));

  globalThis.document = {
    querySelector(selector) {
      if (selector === "#storage-status") {
        return status;
      }

      if (selector === "#open-settings") {
        return openSettings;
      }

      if (selector === "#openStoryLinksInNewTabs") {
        return openStoryLinksInNewTabs;
      }

      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'input[name="theme"]') {
        return themeControls;
      }

      return [];
    },
  };

  globalThis.browser = {
    runtime: {
      getURL(path) {
        return `safari-web-extension://example/${path}`;
      },
    },
    storage: {
      local: {
        async get(key) {
          assert.equal(key, "hnRefinedPreferences");
          return {
            hnRefinedPreferences: storedPreferences,
          };
        },
        async set(value) {
          writes.push(value);
          storedPreferences = value.hnRefinedPreferences;
        },
      },
    },
    tabs: {
      async query(query) {
        assert.deepEqual(query, {
          currentWindow: true,
          url: "https://news.ycombinator.com/*",
        });
        return [{ id: 7 }];
      },
      async sendMessage(tabId, message) {
        messages.push({ tabId, message });
      },
      async create(tab) {
        createdTabs.push(tab);
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    await import(`../extension/popup/popup.js?test=${Date.now()}`);

    assert.equal(themeControls[2].checked, true);
    assert.equal(openStoryLinksInNewTabs.checked, true);

    themeControls[1].checked = true;
    await themeControls[1].listeners.change({ currentTarget: themeControls[1] });

    openStoryLinksInNewTabs.checked = false;
    await openStoryLinksInNewTabs.listeners.change();

    assert.deepEqual(writes, [
      {
        hnRefinedPreferences: {
          ...existingPreferences,
          theme: "light",
        },
      },
      {
        hnRefinedPreferences: {
          ...existingPreferences,
          theme: "light",
          openStoryLinksInNewTabs: false,
        },
      },
    ]);
    assert.deepEqual(messages, [
      {
        tabId: 7,
        message: {
          type: "hn-refined:preferences-changed",
          preferences: {
            ...existingPreferences,
            theme: "light",
          },
        },
      },
      {
        tabId: 7,
        message: {
          type: "hn-refined:preferences-changed",
          preferences: {
            ...existingPreferences,
            theme: "light",
            openStoryLinksInNewTabs: false,
          },
        },
      },
    ]);

    await openSettings.listeners.click();

    assert.deepEqual(createdTabs, [{ url: "safari-web-extension://example/options/options.html" }]);
  } finally {
    restoreGlobals(originalBrowser, originalChrome, originalDocument);
  }
});

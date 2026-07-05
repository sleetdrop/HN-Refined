import test from "node:test";
import assert from "node:assert/strict";

const existingPreferences = {
  theme: "dark",
  fontPreset: "serif-reading",
  desktopDensity: "classic-ish",
  readingWidth: "wide",
  mobileLayout: "off",
  openStoryLinksInNewTabs: true
};

const latestPreferences = {
  theme: "dark",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false
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
    ...initial
  };
}

function restoreGlobals(originalBrowser, originalChrome, originalDocument) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
  globalThis.document = originalDocument;
}

test("popup writes only theme changes, notifies the active tab, and opens full settings", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const originalDocument = globalThis.document;
  const writes = [];
  const messages = [];
  const createdTabs = [];
  let readCount = 0;

  const status = makeElement({ hidden: true });
  const openSettings = makeElement();
  const themeControls = ["system", "light", "dark"].map((value) =>
    makeElement({ value })
  );

  globalThis.document = {
    querySelector(selector) {
      if (selector === "#storage-status") {
        return status;
      }

      if (selector === "#open-settings") {
        return openSettings;
      }

      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'input[name="theme"]') {
        return themeControls;
      }

      return [];
    }
  };

  globalThis.browser = {
    runtime: {
      getURL(path) {
        return `safari-web-extension://example/${path}`;
      }
    },
    storage: {
      local: {
        async get(key) {
          assert.equal(key, "hnRefinedPreferences");
          readCount += 1;
          return {
            hnRefinedPreferences:
              readCount === 1 ? existingPreferences : latestPreferences
          };
        },
        async set(value) {
          writes.push(value);
        }
      }
    },
    tabs: {
      async query(query) {
        assert.deepEqual(query, { active: true, currentWindow: true });
        return [{ id: 7 }];
      },
      async sendMessage(tabId, message) {
        messages.push({ tabId, message });
      },
      async create(tab) {
        createdTabs.push(tab);
      }
    }
  };
  globalThis.chrome = undefined;

  try {
    await import(`../extension/popup/popup.js?test=${Date.now()}`);

    assert.equal(themeControls[2].checked, true);

    themeControls[1].checked = true;
    await themeControls[1].listeners.change({ currentTarget: themeControls[1] });

    assert.deepEqual(writes, [
      {
        hnRefinedPreferences: {
          ...latestPreferences,
          theme: "light"
        }
      }
    ]);
    assert.deepEqual(messages, [
      {
        tabId: 7,
        message: {
          type: "hn-refined:preferences-changed",
          preferences: {
            ...latestPreferences,
            theme: "light"
          }
        }
      }
    ]);

    await openSettings.listeners.click();

    assert.deepEqual(createdTabs, [
      { url: "safari-web-extension://example/options/options.html" }
    ]);
  } finally {
    restoreGlobals(originalBrowser, originalChrome, originalDocument);
  }
});

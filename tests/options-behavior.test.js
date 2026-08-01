import assert from "node:assert/strict";
import test from "node:test";

const initialPreferences = {
  theme: "system",
  fontPreset: "hn-classic",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
};

function makeField(initial = {}) {
  return {
    value: "",
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

test("full settings persists and notifies thread-focus changes", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const originalDocument = globalThis.document;
  const writes = [];
  const messages = [];
  const fields = Object.fromEntries(
    [
      "theme",
      "fontPreset",
      "desktopDensity",
      "readingWidth",
      "threadFocusEnabled",
      "openStoryLinksInNewTabs",
    ].map((id) => [id, makeField()]),
  );
  const status = makeField({ hidden: true });

  globalThis.document = {
    querySelector(selector) {
      if (selector === "#storage-status") {
        return status;
      }
      return fields[selector.slice(1)] || null;
    },
  };
  globalThis.browser = {
    storage: {
      local: {
        async get() {
          return { hnRefinedPreferences: initialPreferences };
        },
        async set(value) {
          writes.push(value);
        },
      },
    },
    tabs: {
      async query() {
        return [{ id: 3 }];
      },
      async sendMessage(tabId, message) {
        messages.push({ tabId, message });
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    await import(`../extension/options/options.js?test=${Date.now()}`);
    assert.equal(fields.threadFocusEnabled.checked, true);
    assert.equal(typeof fields.threadFocusEnabled.listeners.change, "function");

    fields.threadFocusEnabled.checked = false;
    await fields.threadFocusEnabled.listeners.change();

    assert.equal(writes.at(-1).hnRefinedPreferences.threadFocusEnabled, false);
    assert.equal(messages.at(-1).message.preferences.threadFocusEnabled, false);
  } finally {
    globalThis.browser = originalBrowser;
    globalThis.chrome = originalChrome;
    globalThis.document = originalDocument;
  }
});

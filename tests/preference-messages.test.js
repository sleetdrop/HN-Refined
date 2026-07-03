import test from "node:test";
import assert from "node:assert/strict";
import {
  PREFERENCES_CHANGED_MESSAGE_TYPE,
  isPreferencesChangedMessage,
  notifyActiveTabPreferencesChanged
} from "../extension/shared/preference-messages.js";

const preferences = {
  theme: "dark",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false
};

function restoreBrowserApi(originalBrowser, originalChrome) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
}

test("recognizes only HN Refined preference change messages", () => {
  assert.equal(
    isPreferencesChangedMessage({
      type: PREFERENCES_CHANGED_MESSAGE_TYPE,
      preferences
    }),
    true
  );
  assert.equal(isPreferencesChangedMessage({ type: "other", preferences }), false);
  assert.equal(isPreferencesChangedMessage(null), false);
});

test("notifies the active tab after preferences change", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const sentMessages = [];

  globalThis.browser = {
    tabs: {
      async query(query) {
        assert.deepEqual(query, { active: true, currentWindow: true });
        return [{ id: 42 }];
      },
      async sendMessage(tabId, message) {
        sentMessages.push({ tabId, message });
      }
    }
  };
  globalThis.chrome = undefined;

  try {
    assert.equal(await notifyActiveTabPreferencesChanged(preferences), true);
    assert.deepEqual(sentMessages, [
      {
        tabId: 42,
        message: {
          type: PREFERENCES_CHANGED_MESSAGE_TYPE,
          preferences
        }
      }
    ]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("preference change notification is best-effort", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = undefined;
  globalThis.chrome = undefined;

  try {
    assert.equal(await notifyActiveTabPreferencesChanged(preferences), false);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PREFERENCES } from "../extension/shared/defaults.js";
import { writePreferences } from "../extension/shared/preference-store.js";

const customPreferences = {
  theme: "dark",
  fontPreset: "serif-reading",
  desktopDensity: "classic-ish",
  readingWidth: "wide",
  mobileLayout: "off",
  openStoryLinksInNewTabs: true
};

function restoreBrowserApi(originalBrowser, originalChrome) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
}

test("writePreferences falls back to defaults when storage is unavailable", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = undefined;
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: DEFAULT_PREFERENCES,
      persisted: false
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences falls back to defaults when storage write fails", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = {
    storage: {
      local: {
        async set() {
          throw new Error("storage unavailable");
        }
      }
    }
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: DEFAULT_PREFERENCES,
      persisted: false
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences returns normalized preferences after a storage write succeeds", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const writes = [];
  globalThis.browser = {
    storage: {
      local: {
        async set(value) {
          writes.push(value);
        }
      }
    }
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: customPreferences,
      persisted: true
    });
    assert.deepEqual(writes, [{ hnRefinedPreferences: customPreferences }]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

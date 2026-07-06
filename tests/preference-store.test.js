import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PREFERENCES } from "../extension/shared/defaults.js";
import { readPreferences, writePreferences } from "../extension/shared/preference-store.js";

const customPreferences = {
  theme: "dark",
  fontPreset: "serif-reading",
  desktopDensity: "classic-ish",
  readingWidth: "wide",
  mobileLayout: "off",
  openStoryLinksInNewTabs: true,
};

function restoreBrowserApi(originalBrowser, originalChrome) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
}

test("readPreferences calls strict promise-style storage get without callbacks", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = {
    storage: {
      local: {
        async get(...args) {
          assert.equal(args.length, 1);
          const [key] = args;
          assert.equal(key, "hnRefinedPreferences");
          return { hnRefinedPreferences: customPreferences };
        },
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await readPreferences(), {
      preferences: customPreferences,
      persisted: true,
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences falls back to defaults when storage is unavailable", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = undefined;
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: DEFAULT_PREFERENCES,
      persisted: false,
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
        },
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: DEFAULT_PREFERENCES,
      persisted: false,
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences calls strict promise-style storage set without callbacks", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const writes = [];
  globalThis.browser = {
    storage: {
      local: {
        async set(...args) {
          assert.equal(args.length, 1);
          const [value] = args;
          writes.push(value);
        },
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: customPreferences,
      persisted: true,
    });
    assert.deepEqual(writes, [{ hnRefinedPreferences: customPreferences }]);
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
        },
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: customPreferences,
      persisted: true,
    });
    assert.deepEqual(writes, [{ hnRefinedPreferences: customPreferences }]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("readPreferences supports callback-style chrome storage get", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = undefined;
  globalThis.chrome = {
    runtime: {},
    storage: {
      local: {
        get(key, callback) {
          assert.equal(key, "hnRefinedPreferences");
          callback({ hnRefinedPreferences: customPreferences });
        },
      },
    },
  };

  try {
    assert.deepEqual(await readPreferences(), {
      preferences: customPreferences,
      persisted: true,
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences supports callback-style chrome storage set", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const writes = [];
  globalThis.browser = undefined;
  globalThis.chrome = {
    runtime: {},
    storage: {
      local: {
        set(value, callback) {
          writes.push(value);
          callback();
        },
      },
    },
  };

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: customPreferences,
      persisted: true,
    });
    assert.deepEqual(writes, [{ hnRefinedPreferences: customPreferences }]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("writePreferences falls back to defaults for callback-style chrome storage errors", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const storageError = new Error("private browsing disallows storage");
  globalThis.browser = undefined;
  globalThis.chrome = {
    runtime: {},
    storage: {
      local: {
        set(_value, callback) {
          globalThis.chrome.runtime.lastError = storageError;
          callback();
          delete globalThis.chrome.runtime.lastError;
        },
      },
    },
  };

  try {
    assert.deepEqual(await writePreferences(customPreferences), {
      preferences: DEFAULT_PREFERENCES,
      persisted: false,
    });
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

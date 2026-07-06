import assert from "node:assert/strict";
import test from "node:test";
import { openFullSettingsPage } from "../extension/shared/extension-navigation.js";

function restoreBrowserApi(originalBrowser, originalChrome) {
  globalThis.browser = originalBrowser;
  globalThis.chrome = originalChrome;
}

test("opens options.html in a new tab when tab APIs are available", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const calls = [];

  globalThis.browser = {
    runtime: {
      getURL(path) {
        assert.equal(path, "options/options.html");
        return `safari-web-extension://example/${path}`;
      },
      async openOptionsPage() {
        calls.push("openOptionsPage");
      },
    },
    tabs: {
      async create(tab) {
        calls.push(["tabs.create", tab]);
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), true);
    assert.deepEqual(calls, [
      ["tabs.create", { url: "safari-web-extension://example/options/options.html" }],
    ]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("falls back to runtime.openOptionsPage when tab APIs are unavailable", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  const calls = [];

  globalThis.browser = {
    runtime: {
      async openOptionsPage() {
        calls.push("openOptionsPage");
      },
    },
  };
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), true);
    assert.deepEqual(calls, ["openOptionsPage"]);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

test("reports false when no settings navigation API is available", async () => {
  const originalBrowser = globalThis.browser;
  const originalChrome = globalThis.chrome;
  globalThis.browser = {};
  globalThis.chrome = undefined;

  try {
    assert.equal(await openFullSettingsPage(), false);
  } finally {
    restoreBrowserApi(originalBrowser, originalChrome);
  }
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const lightPreferences = {
  theme: "light",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  mobileLayout: "auto",
  openStoryLinksInNewTabs: false,
};

const darkPreferences = {
  ...lightPreferences,
  theme: "dark",
};

function nextMicrotask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createContentScriptContext(initialPreferences) {
  let storedPreferences = initialPreferences;
  let intervalId = 0;
  const windowListeners = new Map();
  const documentListeners = new Map();
  const intervalCallbacks = new Map();
  const runtimeMessageListeners = [];
  const storageChangeListeners = [];

  const context = {
    URL,
    Promise,
    console,
    document: {
      documentElement: { dataset: {} },
      location: { href: "https://news.ycombinator.com/" },
      readyState: "complete",
      visibilityState: "visible",
      addEventListener(type, listener) {
        documentListeners.set(type, listener);
      },
      querySelectorAll() {
        return [];
      },
    },
    window: {
      addEventListener(type, listener) {
        windowListeners.set(type, listener);
      },
      setInterval(callback, delay) {
        intervalId += 1;
        intervalCallbacks.set(intervalId, { callback, delay });
        return intervalId;
      },
    },
    browser: {
      storage: {
        local: {
          async get(key) {
            assert.equal(key, "hnRefinedPreferences");
            return { hnRefinedPreferences: storedPreferences };
          },
        },
        onChanged: {
          addListener(listener) {
            storageChangeListeners.push(listener);
          },
        },
      },
      runtime: {
        onMessage: {
          addListener(listener) {
            runtimeMessageListeners.push(listener);
          },
        },
      },
    },
    setStoredPreferences(nextPreferences) {
      storedPreferences = nextPreferences;
    },
    dispatchWindowEvent(type) {
      windowListeners.get(type)?.();
    },
    dispatchDocumentEvent(type) {
      documentListeners.get(type)?.();
    },
    dispatchStorageChange(nextPreferences, areaName) {
      for (const listener of storageChangeListeners) {
        listener(
          {
            hnRefinedPreferences: {
              newValue: nextPreferences,
            },
          },
          areaName,
        );
      }
    },
    async runInterval(index = 0) {
      const interval = [...intervalCallbacks.values()][index];
      assert.ok(interval, `missing interval callback at index ${index}`);
      await interval.callback();
    },
    get intervalDelays() {
      return [...intervalCallbacks.values()].map((interval) => interval.delay);
    },
    get storageChangeListenerCount() {
      return storageChangeListeners.length;
    },
    get runtimeMessageListenerCount() {
      return runtimeMessageListeners.length;
    },
  };

  vm.createContext(context);
  return context;
}

test("content script refreshes preferences when the HN tab regains focus", async () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "light");
  context.setStoredPreferences(darkPreferences);
  context.dispatchWindowEvent("focus");
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "dark");
  assert.equal(context.storageChangeListenerCount, 1);
  assert.equal(context.runtimeMessageListenerCount, 1);
});

test("content script accepts Safari storage change events without an area name", async () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "light");
  context.dispatchStorageChange(darkPreferences, undefined);

  assert.equal(context.document.documentElement.dataset.hnrTheme, "dark");
});

test("content script periodically refreshes visible pages as a Safari fallback", async () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "light");
  assert.deepEqual(context.intervalDelays, [1000]);

  context.setStoredPreferences(darkPreferences);
  await context.runInterval();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "dark");
});

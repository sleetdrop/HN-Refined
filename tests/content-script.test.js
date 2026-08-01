import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const lightPreferences = {
  theme: "light",
  fontPreset: "system-sans",
  desktopDensity: "comfortable",
  readingWidth: "comfortable",
  threadFocusEnabled: true,
  openStoryLinksInNewTabs: false,
};

const darkPreferences = {
  ...lightPreferences,
  theme: "dark",
};

function nextMicrotask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createAnchor({
  href,
  closestSelectors = [],
  target,
  rel = "",
  dataset = {},
  attributes = {},
} = {}) {
  const anchorAttributes = { ...attributes };
  if (target !== undefined) {
    anchorAttributes.target = target;
  }
  if (rel) {
    anchorAttributes.rel = rel;
  }

  return {
    href,
    rel,
    dataset: { ...dataset },
    closest(selector) {
      return closestSelectors.includes(selector) ? {} : null;
    },
    hasAttribute(name) {
      return Object.hasOwn(anchorAttributes, name);
    },
    getAttribute(name) {
      return anchorAttributes[name] ?? null;
    },
    setAttribute(name, value) {
      anchorAttributes[name] = value;
      this[name] = value;
    },
    removeAttribute(name) {
      delete anchorAttributes[name];
      delete this[name];
    },
  };
}

function createElement(tagName) {
  const attributes = {};
  const listeners = new Map();

  return {
    tagName: tagName.toUpperCase(),
    children: [],
    className: "",
    textContent: "",
    type: "",
    title: "",
    disabled: false,
    append(...children) {
      this.children.push(...children);
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    getAttribute(name) {
      return attributes[name] ?? null;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.(event);
    },
  };
}

function createTextarea({ isCommentEditor = false, rows = 6 } = {}) {
  return {
    rows,
    dataset: {},
    insertedElement: null,
    matches(selector) {
      return isCommentEditor && selector === '#hnmain form[action="comment"] textarea[name="text"]';
    },
    insertAdjacentElement(position, element) {
      assert.equal(position, "afterend");
      this.insertedElement = element;
    },
  };
}

function createContentScriptContext(
  initialPreferences,
  { selectorMatches = {}, mobileMatches = false } = {},
) {
  let storedPreferences = initialPreferences;
  let intervalId = 0;
  const windowListeners = new Map();
  const documentListeners = new Map();
  const intervalCallbacks = new Map();
  const mediaQueryListeners = [];
  const threadFocusUpdates = [];
  const runtimeMessageListeners = [];
  const storageChangeListeners = [];
  const mobileQuery = {
    matches: mobileMatches,
    addEventListener(type, listener) {
      assert.equal(type, "change");
      mediaQueryListeners.push(listener);
    },
  };

  const context = {
    URL,
    Promise,
    console,
    document: {
      documentElement: { dataset: {} },
      location: { href: "https://news.ycombinator.com/" },
      readyState: "complete",
      visibilityState: "visible",
      activeElement: null,
      addEventListener(type, listener) {
        documentListeners.set(type, listener);
      },
      createElement,
      querySelectorAll(selector) {
        return selectorMatches[selector] || [];
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
      matchMedia(query) {
        assert.equal(query, "(max-width: 700px) and (any-pointer: coarse)");
        return mobileQuery;
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
    HNRefinedDeepComments: {
      createController() {
        return {
          start(enabled) {
            threadFocusUpdates.push(["start", enabled]);
          },
          setEnabled(enabled) {
            threadFocusUpdates.push(["set", enabled]);
          },
        };
      },
    },
    setStoredPreferences(nextPreferences) {
      storedPreferences = nextPreferences;
    },
    dispatchWindowEvent(type) {
      windowListeners.get(type)?.();
    },
    dispatchDocumentEvent(type, event) {
      documentListeners.get(type)?.(event);
    },
    setActiveElement(element) {
      context.document.activeElement = element;
    },
    setMobileMatches(matches) {
      mobileQuery.matches = matches;
      for (const listener of mediaQueryListeners) {
        listener({ matches });
      }
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
    get threadFocusUpdates() {
      return [...threadFocusUpdates];
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

test("content script applies default attributes before async storage resolves", () => {
  const context = createContentScriptContext(darkPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  assert.equal(context.document.documentElement.dataset.hnrTheme, "system");
  assert.equal(context.document.documentElement.dataset.hnrMobile, "auto");
  assert.equal(context.document.documentElement.dataset.hnrDeepThreads, undefined);
  assert.deepEqual(context.threadFocusUpdates, [["start", true]]);
});

test("content script ignores legacy mobile layout preferences", async () => {
  const context = createContentScriptContext({ ...darkPreferences, mobileLayout: "off" });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrMobile, "auto");
  assert.equal(context.document.documentElement.dataset.hnrDeepThreads, undefined);
  assert.deepEqual(context.threadFocusUpdates, [
    ["start", true],
    ["set", true],
  ]);
});

test("content script migrates legacy indentation-only mode to disabled focus", async () => {
  const { threadFocusEnabled: _removed, ...legacyPreferences } = darkPreferences;
  const context = createContentScriptContext({
    ...legacyPreferences,
    deepThreadMode: "indentation-only",
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.deepEqual(context.threadFocusUpdates, [
    ["start", true],
    ["set", false],
  ]);
});

test("mobile comment editors initialize at two rows and first focus expands once", () => {
  const textarea = createTextarea({ isCommentEditor: true });
  const context = createContentScriptContext(lightPreferences, {
    mobileMatches: true,
    selectorMatches: {
      '#hnmain form[action="comment"] textarea[name="text"]': [textarea],
    },
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  assert.equal(textarea.rows, 2);
  context.dispatchDocumentEvent("focusin", { target: textarea });
  assert.equal(textarea.rows, 6);

  const decreaseButton = textarea.insertedElement.children[0];
  decreaseButton.dispatch("click");
  assert.equal(textarea.rows, 2);

  context.dispatchDocumentEvent("focusin", { target: textarea });
  assert.equal(textarea.rows, 2);
});

test("comment editor controls step by four rows and clamp between two and twenty-two", () => {
  const textarea = createTextarea({ isCommentEditor: true });
  const context = createContentScriptContext(lightPreferences, {
    mobileMatches: true,
    selectorMatches: {
      '#hnmain form[action="comment"] textarea[name="text"]': [textarea],
    },
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  const [decreaseButton, increaseButton] = textarea.insertedElement.children;
  assert.equal(decreaseButton.textContent, "");
  assert.equal(increaseButton.textContent, "");
  assert.match(decreaseButton.className, /hnr-comment-editor-size-button--decrease/);
  assert.match(increaseButton.className, /hnr-comment-editor-size-button--increase/);
  assert.equal(decreaseButton.getAttribute("aria-label"), "Decrease comment editor height");
  assert.equal(increaseButton.getAttribute("aria-label"), "Increase comment editor height");

  for (let index = 0; index < 10; index += 1) {
    increaseButton.dispatch("click");
  }
  assert.equal(textarea.rows, 22);
  assert.equal(increaseButton.disabled, true);

  for (let index = 0; index < 10; index += 1) {
    decreaseButton.dispatch("click");
  }
  assert.equal(textarea.rows, 2);
  assert.equal(decreaseButton.disabled, true);
});

test("comment editor controls preserve active textarea focus on pointer input", () => {
  const textarea = createTextarea({ isCommentEditor: true });
  const context = createContentScriptContext(lightPreferences, {
    mobileMatches: true,
    selectorMatches: {
      '#hnmain form[action="comment"] textarea[name="text"]': [textarea],
    },
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  const increaseButton = textarea.insertedElement.children[1];
  let prevented = false;
  context.setActiveElement(textarea);
  increaseButton.dispatch("pointerdown", {
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);

  prevented = false;
  context.setActiveElement(null);
  increaseButton.dispatch("pointerdown", {
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, false);
});

test("comment editors restore original rows outside the mobile breakpoint", () => {
  const textarea = createTextarea({ isCommentEditor: true, rows: 8 });
  const context = createContentScriptContext(lightPreferences, {
    mobileMatches: true,
    selectorMatches: {
      '#hnmain form[action="comment"] textarea[name="text"]': [textarea],
    },
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  const increaseButton = textarea.insertedElement.children[1];
  increaseButton.dispatch("click");
  increaseButton.dispatch("click");
  assert.equal(textarea.rows, 10);

  context.setMobileMatches(false);
  assert.equal(textarea.rows, 8);

  context.setMobileMatches(true);
  assert.equal(textarea.rows, 10);
});

test("content script ignores unrelated textareas", () => {
  const textarea = createTextarea({ rows: 8 });
  const context = createContentScriptContext(lightPreferences, {
    mobileMatches: true,
    selectorMatches: { textarea: [textarea] },
  });
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);

  assert.equal(textarea.rows, 8);
  assert.equal(textarea.insertedElement, null);
});

test("content script accepts Safari storage change events without an area name", async () => {
  const context = createContentScriptContext(lightPreferences);
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(context.document.documentElement.dataset.hnrTheme, "light");
  context.dispatchStorageChange({ ...darkPreferences, threadFocusEnabled: false }, undefined);

  assert.equal(context.document.documentElement.dataset.hnrTheme, "dark");
  assert.deepEqual(context.threadFocusUpdates.at(-1), ["set", false]);
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

test("content script keeps managing traditional titleline story anchors", async () => {
  const storyAnchor = createAnchor({
    href: "https://example.com/article",
    closestSelectors: [".titleline", ".athing:not(.comtr)", "td.title"],
  });
  const context = createContentScriptContext(
    { ...lightPreferences, openStoryLinksInNewTabs: true },
    { selectorMatches: { ".titleline a[href]": [storyAnchor] } },
  );
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(storyAnchor.target, "_blank");
  assert.match(storyAnchor.rel, /noopener/);
  assert.match(storyAnchor.rel, /noreferrer/);
});

test("content script can manage story anchors when titleline class changes", async () => {
  const storyAnchor = createAnchor({
    href: "https://example.com/article",
    closestSelectors: [".athing:not(.comtr)", "td.title"],
  });
  const context = createContentScriptContext(
    { ...lightPreferences, openStoryLinksInNewTabs: true },
    { selectorMatches: { ".athing:not(.comtr) a[href]": [storyAnchor] } },
  );
  const script = fs.readFileSync("extension/content/content-script.js", "utf8");

  vm.runInContext(script, context);
  await nextMicrotask();

  assert.equal(storyAnchor.target, "_blank");
  assert.match(storyAnchor.rel, /noopener/);
  assert.match(storyAnchor.rel, /noreferrer/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function createStyle() {
  const values = new Map();
  return {
    setProperty(name, value) {
      values.set(name, value);
    },
    removeProperty(name) {
      values.delete(name);
    },
    getPropertyValue(name) {
      return values.get(name) || "";
    },
  };
}

function createRow(id, depth) {
  const indent = {
    getAttribute(name) {
      return name === "indent" ? String(depth) : null;
    },
  };

  return {
    id,
    dataset: {},
    style: createStyle(),
    querySelector(selector) {
      return selector === "td.ind[indent]" ? indent : null;
    },
  };
}

function createNode(tagName = "span") {
  const attributes = new Map();
  const listeners = new Map();
  const node = {
    tagName: tagName.toUpperCase(),
    children: [],
    parentNode: null,
    dataset: {},
    style: createStyle(),
    className: "",
    hidden: false,
    href: "",
    _textContent: "",
    append(...children) {
      for (const child of children) {
        this.children.push(child);
        if (child && typeof child === "object") {
          child.parentNode = this;
        }
      }
    },
    replaceChildren(...children) {
      this.children = [];
      this._textContent = "";
      this.append(...children);
    },
    insertBefore(child, reference) {
      const index = this.children.indexOf(reference);
      assert.notEqual(index, -1);
      this.children.splice(index, 0, child);
      if (child && typeof child === "object") {
        child.parentNode = this;
      }
    },
    remove() {
      if (!this.parentNode) {
        return;
      }
      const index = this.parentNode.children.indexOf(this);
      if (index >= 0) {
        this.parentNode.children.splice(index, 1);
      }
      this.parentNode = null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? (name === "href" && this.href ? this.href : null);
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.({
        preventDefault() {},
        currentTarget: this,
        target: this,
        ...event,
      });
    },
    closest(selector) {
      return selector === "a[href]" && this.tagName === "A" ? this : null;
    },
  };

  Object.defineProperty(node, "textContent", {
    get() {
      const childText = this.children
        .map((child) => (typeof child === "string" ? child : child.textContent))
        .join("");
      return this._textContent + childText;
    },
    set(value) {
      this._textContent = String(value);
      this.children = [];
    },
  });

  Object.defineProperties(node, {
    parentElement: {
      get() {
        return this.parentNode;
      },
    },
    firstElementChild: {
      get() {
        return this.children.find((child) => child && typeof child === "object") || null;
      },
    },
  });

  node.contains = (candidate) => {
    if (candidate === node) {
      return true;
    }
    return node.children.some(
      (child) => child && typeof child === "object" && child.contains?.(candidate),
    );
  };

  return node;
}

function createInteractiveRow(id, depth, username, top, { deleted = false, display = "" } = {}) {
  const row = createRow(id, depth);
  const navs = createNode("span");
  const toggle = createNode("a");
  const user = username == null ? null : createNode("a");
  const commentText = createNode("div");
  toggle.className = "togg";
  toggle.textContent = "[–]";
  commentText.textContent = deleted ? "[deleted]" : "visible comment";
  if (user) {
    user.textContent = username;
  }
  navs.append(toggle);

  row.rect = { top, bottom: top + 80, height: 80 };
  row.style.display = display;
  row.toggle = toggle;
  row.navs = navs;
  row.user = user;
  row.navLinks = ["root", "parent"].map((label) => {
    const link = createNode("a");
    link.textContent = label;
    link.className = "clicky";
    link.setAttribute("href", `item?id=1#${label}-${id}`);
    link.href = `https://news.ycombinator.com/item?id=1#${label}-${id}`;
    return link;
  });
  const originalQuerySelector = row.querySelector;
  row.querySelector = (selector) => {
    if (selector === ".commtext") {
      return commentText;
    }
    if (selector === ".togg") {
      return toggle;
    }
    if (selector === ".hnuser") {
      return user;
    }
    return originalQuerySelector(selector);
  };
  row.getBoundingClientRect = () => ({ ...row.rect });
  row.scrollIntoViewCalls = [];
  row.scrollIntoView = (options) => {
    row.scrollIntoViewCalls.push(options);
  };
  row.getClientRects = () => (row.rect.height > 0 ? [row.rect] : []);
  row.querySelectorAll = (selector) => (selector === ".comhead a[href]" ? row.navLinks : []);
  return row;
}

function createControllerFixture(
  depths,
  {
    enabled = true,
    mobile = true,
    validSurface = true,
    usernames = depths.map((_, index) => `user${index}`),
    deletedIndexes = [],
  } = {},
) {
  const rows = depths.map((depth, index) =>
    createInteractiveRow(`comment-${index}`, depth, usernames[index], 80 + index * 80, {
      deleted: deletedIndexes.includes(index),
    }),
  );
  const main = createNode("table");
  const body = createNode("tbody");
  const headerRow = createNode("tr");
  const spacerRow = createNode("tr");
  const bigbox = createNode("tr");
  const treeCell = createNode("td");
  const fatitem = createNode("table");
  const breakNode = createNode("br");
  const replyForm = createNode("form");
  const tree = createNode("table");
  const footerRow = createNode("tr");
  main.tBodies = [body];
  main.append(body);
  body.append(headerRow, spacerRow, bigbox, footerRow);
  bigbox.append(treeCell);
  treeCell.append(fatitem, breakNode, replyForm, tree);
  const documentListeners = new Map();
  const windowListeners = new Map();
  const mediaListeners = [];
  const scrolls = [];
  let guide = null;
  let mediaQueryString = null;
  const mediaQuery = {
    matches: mobile,
    addEventListener(type, listener) {
      assert.equal(type, "change");
      mediaListeners.push(listener);
    },
  };
  const document = {
    readyState: "complete",
    createElement: createNode,
    createTextNode(value) {
      const node = createNode("#text");
      node.textContent = String(value);
      return node;
    },
    querySelectorAll(selector) {
      return selector === ".comment-tree .comtr" ? rows : [];
    },
    querySelector(selector) {
      if (selector === ".comment-tree") {
        return tree;
      }
      if (selector === "#hnmain") {
        return main;
      }
      if (selector === "#bigbox") {
        return validSurface ? bigbox : null;
      }
      return null;
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
  };
  tree.before = (node) => {
    guide = node;
    treeCell.insertBefore(node, tree);
  };

  const initialUrl = "https://news.ycombinator.com/item?id=1";
  const historyEntries = [];
  const historyStack = [{ state: null, url: initialUrl }];
  const navigations = [];
  let historyIndex = 0;
  const location = {
    _href: initialUrl,
    get href() {
      return this._href;
    },
    set href(value) {
      this._href = new URL(value, this._href).href;
      navigations.push(this._href);
    },
  };
  let window;

  function emitPop() {
    const entry = historyStack[historyIndex];
    window.history.state = entry.state;
    location._href = entry.url;
    windowListeners.get("popstate")?.({ state: entry.state });
  }

  window = {
    location,
    matchMedia(query) {
      mediaQueryString = query;
      return mediaQuery;
    },
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    scrollBy(x, y) {
      scrolls.push({ x, y });
    },
    history: {
      state: null,
      pushState(state, _title, url) {
        this.state = state;
        const resolvedUrl = new URL(url, location.href).href;
        historyStack.splice(historyIndex + 1);
        historyStack.push({ state, url: resolvedUrl });
        historyIndex += 1;
        location._href = resolvedUrl;
        historyEntries.push({ type: "push", state, url });
      },
      replaceState(state, _title, url) {
        this.state = state;
        const resolvedUrl = new URL(url, location.href).href;
        historyStack[historyIndex] = { state, url: resolvedUrl };
        location._href = resolvedUrl;
        historyEntries.push({ type: "replace", state, url });
      },
      go(delta) {
        historyEntries.push({ type: "go", delta });
        const nextIndex = historyIndex + delta;
        if (nextIndex < 0 || nextIndex >= historyStack.length) {
          return;
        }
        historyIndex = nextIndex;
        emitPop();
      },
      back() {
        historyEntries.push({ type: "back" });
        if (historyIndex === 0) {
          return;
        }
        historyIndex -= 1;
        emitPop();
      },
      forward() {
        historyEntries.push({ type: "forward" });
        if (historyIndex + 1 >= historyStack.length) {
          return;
        }
        historyIndex += 1;
        emitPop();
      },
    },
  };

  const api = loadDeepCommentsApi();
  assert.ok(api, "deep comment controller should be available");
  const controller = api.createController({ document, window });
  controller.start(enabled);

  return {
    api,
    controller,
    document,
    window,
    rows,
    page: {
      main,
      body,
      headerRow,
      spacerRow,
      bigbox,
      treeCell,
      fatitem,
      breakNode,
      replyForm,
      tree,
      footerRow,
    },
    historyEntries,
    historyStack,
    navigations,
    scrolls,
    dispatchWindow(type, event = {}) {
      windowListeners.get(type)?.(event);
    },
    dispatchDocument(type, event) {
      documentListeners.get(type)?.(event);
    },
    dispatchMediaChange(matches) {
      mediaQuery.matches = matches;
      for (const listener of mediaListeners) {
        listener({ matches });
      }
    },
    navigateHash(href) {
      const resolvedUrl = new URL(href, location.href).href;
      historyStack.splice(historyIndex + 1);
      historyStack.push({ state: null, url: resolvedUrl });
      historyIndex += 1;
      window.history.state = null;
      location._href = resolvedUrl;
      windowListeners.get("hashchange")?.({ newURL: resolvedUrl });
    },
    get guide() {
      return guide;
    },
    get historyIndex() {
      return historyIndex;
    },
    get mediaQueryString() {
      return mediaQueryString;
    },
  };
}

function findLink(node, text) {
  return node.children.find(
    (child) => typeof child === "object" && child.tagName === "A" && child.textContent === text,
  );
}

function descendantNodes(root) {
  const nodes = [];
  for (const child of root.children || []) {
    if (!child || typeof child !== "object") {
      continue;
    }
    nodes.push(child, ...descendantNodes(child));
  }
  return nodes;
}

function findDescendant(root, predicate) {
  return descendantNodes(root).find(predicate) || null;
}

function renderedGuideLabels(guide) {
  return descendantNodes(guide)
    .filter((node) =>
      ["hnr-comment-scope-author", "hnr-comment-scope-ellipsis"].some((className) =>
        String(node.className || "")
          .split(/\s+/)
          .includes(className),
      ),
    )
    .map((node) => node.textContent);
}

function clickGuideAuthor(guide, label) {
  const link = findDescendant(
    guide,
    (node) =>
      node.tagName === "A" &&
      String(node.className || "")
        .split(/\s+/)
        .includes("hnr-comment-scope-ancestor") &&
      node.textContent === label,
  );
  assert.ok(link, `missing guide ancestor link for ${label}`);
  link.dispatch("click");
}

function createCommentTarget(index, label = "next") {
  const link = createNode("a");
  link.textContent = label;
  link.className = "clicky";
  link.href = `https://news.ycombinator.com/item?id=1#comment-${index}`;
  link.setAttribute("href", `item?id=1#comment-${index}`);
  return link;
}

function loadDeepCommentsApi() {
  const context = { console, URL };
  context.globalThis = context;
  vm.createContext(context);

  const path = "extension/content/deep-comments.js";
  if (fs.existsSync(path)) {
    vm.runInContext(fs.readFileSync(path, "utf8"), context);
  }

  return context.HNRefinedDeepComments;
}

test("comment model derives parents and contiguous subtree boundaries from HN indentation", () => {
  const api = loadDeepCommentsApi();
  assert.ok(api, "deep comment controller should be available");

  const rows = [
    createRow("a", 0),
    createRow("b", 1),
    createRow("c", 2),
    createRow("d", 1),
    createRow("e", 2),
    createRow("f", 0),
  ];
  const records = api.buildCommentRecords(rows);

  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        records.map(({ id, depth, parentIndex, endIndex }) => ({
          id,
          depth,
          parentIndex,
          endIndex,
        })),
      ),
    ),
    [
      { id: "a", depth: 0, parentIndex: -1, endIndex: 4 },
      { id: "b", depth: 1, parentIndex: 0, endIndex: 2 },
      { id: "c", depth: 2, parentIndex: 1, endIndex: 2 },
      { id: "d", depth: 1, parentIndex: 0, endIndex: 4 },
      { id: "e", depth: 2, parentIndex: 3, endIndex: 4 },
      { id: "f", depth: 0, parentIndex: -1, endIndex: 5 },
    ],
  );
});

test("comment model rejects rows without a finite nonnegative HN indent", () => {
  const api = loadDeepCommentsApi();
  assert.ok(api, "deep comment controller should be available");

  const malformed = createRow("bad", 1);
  malformed.querySelector = () => ({ getAttribute: () => "sideways" });

  assert.equal(api.buildCommentRecords([createRow("good", 0), malformed]).length, 0);
});

test("comment ancestry exposes the complete original HN author records", () => {
  const api = loadDeepCommentsApi();
  const usernames = [
    "root-user",
    "level-2-user",
    "level-3-user",
    "level-4-user",
    "level-5-user",
    "focused-user",
  ];
  const rows = usernames.map((username, index) =>
    createInteractiveRow(`comment-${index}`, index, username, 80 + index * 80),
  );
  const records = api.buildCommentRecords(rows);

  assert.deepEqual(
    JSON.parse(JSON.stringify(api.authorAncestryEntriesForRecord(5, records))),
    usernames.map((label, index) => ({ index, id: `comment-${index}`, label })),
  );
});

test("comment ancestry preserves offset roots and explicit deleted author records", () => {
  const api = loadDeepCommentsApi();
  const rows = [
    createInteractiveRow("offset-root", 4, "first-visible-author", 80),
    createInteractiveRow("deleted-child", 5, null, 160, { deleted: true }),
    createInteractiveRow("focused-child", 6, "focused-author", 240),
  ];
  const records = api.buildCommentRecords(rows);

  assert.deepEqual(JSON.parse(JSON.stringify(api.authorAncestryEntriesForRecord(2, records))), [
    { index: 0, id: "offset-root", label: "first-visible-author" },
    { index: 1, id: "deleted-child", label: "[deleted]" },
    { index: 2, id: "focused-child", label: "focused-author" },
  ]);
});

test("comment ancestry fails closed when an author is unexpectedly missing", () => {
  const api = loadDeepCommentsApi();
  const rows = [
    createInteractiveRow("root", 0, "root-user", 80),
    createInteractiveRow("missing", 1, null, 160),
    createInteractiveRow("descendant", 2, "descendant-user", 240),
  ];
  const records = api.buildCommentRecords(rows);

  assert.equal(api.authorAncestryEntriesForRecord(1, records), null);
  assert.equal(api.authorAncestryEntriesForRecord(2, records), null);
});

test("comment ancestry rejects invalid indexes, parent links, and cycles", () => {
  const api = loadDeepCommentsApi();
  const rows = [
    createInteractiveRow("root", 0, "root-user", 80),
    createInteractiveRow("child", 1, "child-user", 160),
    createInteractiveRow("grandchild", 2, "grandchild-user", 240),
  ];
  const records = api.buildCommentRecords(rows);

  assert.equal(api.authorAncestryEntriesForRecord(-1, records), null);
  assert.equal(api.authorAncestryEntriesForRecord(3, records), null);

  records[1].parentIndex = 20;
  assert.equal(api.authorAncestryEntriesForRecord(2, records), null);

  records[1].parentIndex = 2;
  assert.equal(api.authorAncestryEntriesForRecord(2, records), null);
});

test("nearest common ancestor distinguishes shared and separate top-level comment trees", () => {
  const api = loadDeepCommentsApi();
  const depths = [0, 1, 2, 2, 1, 2, 0];
  const rows = depths.map((depth, index) =>
    createInteractiveRow(`comment-${index}`, depth, `user${index}`, 80 + index * 80),
  );
  const records = api.buildCommentRecords(rows);

  assert.equal(api.nearestCommonAncestorIndex(2, 3, records), 1);
  assert.equal(api.nearestCommonAncestorIndex(2, 4, records), 0);
  assert.equal(api.nearestCommonAncestorIndex(2, 1, records), 1);
  assert.equal(api.nearestCommonAncestorIndex(2, 6, records), -1);
  assert.equal(api.nearestCommonAncestorIndex(-1, 2, records), null);

  records[1].parentIndex = 20;
  assert.equal(api.nearestCommonAncestorIndex(2, 3, records), null);
});

test("ancestry presentation stays complete through five authors and compacts longer paths", () => {
  const api = loadDeepCommentsApi();
  const entries = Array.from({ length: 6 }, (_, index) => ({
    index,
    id: `comment-${index}`,
    label: `user${index}`,
  }));

  assert.deepEqual(
    JSON.parse(JSON.stringify(api.ancestryPresentation(entries.slice(0, 5), false))),
    entries.slice(0, 5).map((entry) => ({ kind: "author", entry })),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(api.ancestryPresentation(entries, false))), [
    { kind: "author", entry: entries[0] },
    { kind: "ellipsis" },
    { kind: "author", entry: entries[3] },
    { kind: "author", entry: entries[4] },
    { kind: "author", entry: entries[5] },
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.ancestryPresentation(entries, true))),
    entries.map((entry) => ({ kind: "author", entry })),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(api.ancestryPresentation([], false))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(api.ancestryPresentation(null, false))), []);
});

test("Focus View History serializes one complete bidirectional view", () => {
  const api = loadDeepCommentsApi();
  const state = api.historyStateForView(
    {
      rootId: "comment-4",
      label: "user4",
      returnAnchor: { id: "comment-4", offset: 80 },
      resumeAnchor: { id: "comment-5", offset: 236 },
      transitionIndex: 2,
    },
    { preserved: true },
  );

  assert.deepEqual(JSON.parse(JSON.stringify(state)), {
    preserved: true,
    hnrCommentFocusView: {
      rootId: "comment-4",
      label: "user4",
      returnAnchor: { id: "comment-4", offset: 80 },
      resumeAnchor: { id: "comment-5", offset: 236 },
      transitionIndex: 2,
    },
  });
});

test("Focus View History resolution distinguishes absent, malformed, and valid states", () => {
  const api = loadDeepCommentsApi();
  const rows = [0, 1, 2].map((depth, index) =>
    createInteractiveRow(`comment-${index}`, depth, `user${index}`, 80 + index * 80),
  );
  const records = api.buildCommentRecords(rows);
  const valid = {
    hnrCommentFocusView: {
      rootId: "comment-1",
      label: "user1",
      returnAnchor: { id: "comment-1", offset: 160 },
      resumeAnchor: null,
      transitionIndex: 1,
    },
  };

  assert.equal(api.resolveHistoryView({}, records), undefined);
  for (const malformed of [
    { hnrCommentFocusView: null },
    { hnrCommentFocusView: { ...valid.hnrCommentFocusView, rootId: "missing" } },
    { hnrCommentFocusView: { ...valid.hnrCommentFocusView, label: "" } },
    { hnrCommentFocusView: { ...valid.hnrCommentFocusView, returnAnchor: null } },
    {
      hnrCommentFocusView: {
        ...valid.hnrCommentFocusView,
        resumeAnchor: { id: "missing", offset: 1 },
      },
    },
    { hnrCommentFocusView: { ...valid.hnrCommentFocusView, transitionIndex: 0 } },
  ]) {
    assert.equal(api.resolveHistoryView(malformed, records), null);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(api.resolveHistoryView(valid, records))), {
    rootId: "comment-1",
    rootIndex: 1,
    label: "user1",
    returnAnchor: { id: "comment-1", offset: 160 },
    resumeAnchor: null,
    transitionIndex: 1,
  });
});

test("guide ellipsis expands without changing Focus History or scrolling", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 7]);
  findLink(fixture.rows[6].navs, "focus").dispatch("click");

  assert.deepEqual(renderedGuideLabels(fixture.guide), ["user0", "…", "user4", "user5", "user6"]);
  const ellipsis = findDescendant(fixture.guide, (node) => node.tagName === "BUTTON");
  assert.ok(ellipsis);
  assert.equal(ellipsis.getAttribute("aria-label"), "Show complete comment ancestry");
  const historyCount = fixture.historyEntries.length;
  const scrollCount = fixture.scrolls.length;

  ellipsis.dispatch("click");

  assert.deepEqual(renderedGuideLabels(fixture.guide), [
    "user0",
    "user1",
    "user2",
    "user3",
    "user4",
    "user5",
    "user6",
  ]);
  assert.equal(fixture.historyEntries.length, historyCount);
  assert.equal(fixture.scrolls.length, scrollCount);
});

test("focus guide keeps the nearest parent and current author together", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 7]);
  findLink(fixture.rows[6].navs, "focus").dispatch("click");

  const prefix = findDescendant(fixture.guide, (node) =>
    String(node.className || "")
      .split(/\s+/)
      .includes("hnr-comment-scope-prefix"),
  );
  assert.equal(prefix?.textContent, " | focused:");

  function nearestLabels() {
    const nearest = findDescendant(fixture.guide, (node) =>
      String(node.className || "")
        .split(/\s+/)
        .includes("hnr-comment-scope-nearest"),
    );
    assert.ok(nearest);
    return descendantNodes(nearest)
      .filter((node) =>
        String(node.className || "")
          .split(/\s+/)
          .includes("hnr-comment-scope-author"),
      )
      .map((node) => node.textContent);
  }

  assert.deepEqual(nearestLabels(), ["user5", "user6"]);
  findDescendant(fixture.guide, (node) => node.tagName === "BUTTON").dispatch("click");
  assert.deepEqual(nearestLabels(), ["user5", "user6"]);
});

test("Thread Focus eligibility follows a coarse pointer instead of portrait width", () => {
  const fixture = createControllerFixture([0, 1, 2, 3]);
  findLink(fixture.rows[1].navs, "focus").dispatch("click");

  assert.equal(fixture.mediaQueryString, "(any-pointer: coarse)");
  const historyCount = fixture.historyEntries.length;
  fixture.dispatchMediaChange(true);

  assert.equal(fixture.controller.getState().rootId, "comment-1");
  assert.equal(fixture.historyEntries.length, historyCount);
});

test("expanded ancestry lasts for one Focus session and resets after all", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  findLink(fixture.rows[6].navs, "focus").dispatch("click");
  findDescendant(fixture.guide, (node) => node.tagName === "BUTTON").dispatch("click");
  findLink(fixture.rows[7].navs, "focus").dispatch("click");

  assert.deepEqual(renderedGuideLabels(fixture.guide), [
    "user0",
    "user1",
    "user2",
    "user3",
    "user4",
    "user5",
    "user6",
    "user7",
  ]);
  fixture.window.history.back();
  assert.deepEqual(renderedGuideLabels(fixture.guide), [
    "user0",
    "user1",
    "user2",
    "user3",
    "user4",
    "user5",
    "user6",
  ]);

  findLink(fixture.guide, "all").dispatch("click");
  findLink(fixture.rows[6].navs, "focus").dispatch("click");
  assert.deepEqual(renderedGuideLabels(fixture.guide), ["user0", "…", "user4", "user5", "user6"]);
});

test("focus is offered at every useful depth and rebases the selected branch", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 4]);
  const { controller, guide, historyEntries, page, rows } = fixture;

  assert.deepEqual(
    rows.map((row) => row.style.getPropertyValue("--hnr-comment-base-indent")),
    ["0px", "12px", "24px", "32px", "40px", "48px", "40px"],
  );

  for (const index of [0, 1, 2, 3, 4]) {
    assert.ok(findLink(rows[index].navs, "focus"));
  }
  for (const index of [5, 6]) {
    assert.equal(findLink(rows[index].navs, "focus"), undefined);
  }

  const focus = findLink(rows[4].navs, "focus");
  assert.ok(focus);
  const toggleIndex = rows[4].navs.children.indexOf(rows[4].toggle);
  assert.equal(rows[4].navs.children[toggleIndex - 3].textContent, " | ");
  assert.equal(rows[4].navs.children[toggleIndex - 2].textContent, "focus");
  assert.equal(rows[4].navs.children[toggleIndex - 1].textContent, " ");
  focus.dispatch("click");

  assert.deepEqual(JSON.parse(JSON.stringify(controller.getState())), {
    kind: "focused",
    rootId: "comment-4",
  });
  assert.equal(guide.hidden, false);
  assert.equal(guide.children[0].tagName, "A");
  assert.equal(guide.children[0].textContent, "all");
  assert.deepEqual(renderedGuideLabels(guide), ["user0", "user1", "user2", "user3", "user4"]);
  assert.equal(findLink(rows[4].navs, "focus"), undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(rows[4].scrollIntoViewCalls)), [{ block: "start" }]);
  assert.equal(rows[4].style.getPropertyValue("--hnr-comment-indent"), "0px");
  assert.equal(rows[5].style.getPropertyValue("--hnr-comment-indent"), "12px");
  assert.equal(rows[4].dataset.hnrFocusExcluded, undefined);
  assert.equal(rows[5].dataset.hnrFocusExcluded, undefined);

  for (const index of [0, 1, 2, 3, 6]) {
    assert.equal(rows[index].dataset.hnrFocusExcluded, "");
  }

  for (const element of [
    page.headerRow,
    page.spacerRow,
    page.fatitem,
    page.breakNode,
    page.replyForm,
    page.footerRow,
  ]) {
    assert.equal(element.dataset.hnrFocusPageExcluded, "");
  }
  assert.equal(page.tree.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(guide.dataset.hnrFocusPageExcluded, undefined);

  assert.equal(historyEntries[0].type, "push");
  assert.deepEqual(JSON.parse(JSON.stringify(historyEntries[0].state.hnrCommentFocusView)), {
    rootId: "comment-4",
    label: "user4",
    returnAnchor: { id: "comment-4", offset: 400 },
    resumeAnchor: null,
    transitionIndex: 1,
  });
});

test("direct and nested focus render the same compact original author ancestry", () => {
  const direct = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(direct.rows[5].navs, "focus").dispatch("click");
  assert.deepEqual(renderedGuideLabels(direct.guide), ["user0", "…", "user3", "user4", "user5"]);

  const nested = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  for (const index of [3, 4, 5]) {
    findLink(nested.rows[index].navs, "focus").dispatch("click");
  }
  assert.deepEqual(renderedGuideLabels(nested.guide), renderedGuideLabels(direct.guide));

  nested.window.history.back();
  assert.deepEqual(renderedGuideLabels(nested.guide), [
    "user0",
    "user1",
    "user2",
    "user3",
    "user4",
  ]);
});

test("focus preserves an explicit deleted-author step in the ancestry", () => {
  const fixture = createControllerFixture([0, 1, 2], {
    usernames: ["user0", null, "user2"],
    deletedIndexes: [1],
  });

  findLink(fixture.rows[1].navs, "focus").dispatch("click");
  assert.deepEqual(renderedGuideLabels(fixture.guide), ["user0", "[deleted]"]);
});

test("focus is omitted for a branch with an unexpectedly missing author", () => {
  const fixture = createControllerFixture([0, 1, 2, 3], {
    usernames: ["user0", null, "user2", "user3"],
  });

  assert.ok(findLink(fixture.rows[0].navs, "focus"));
  assert.equal(findLink(fixture.rows[1].navs, "focus"), undefined);
  assert.equal(findLink(fixture.rows[2].navs, "focus"), undefined);
});

test("disabled thread focus keeps indentation and exposes no focus actions", () => {
  const fixture = createControllerFixture([0, 1, 2, 3], { enabled: false });

  assert.equal(fixture.controller.getState().kind, "global");
  assert.equal(fixture.rows[3].style.getPropertyValue("--hnr-comment-base-indent"), "32px");
  for (const row of fixture.rows) {
    assert.equal(findLink(row.navs, "focus"), undefined);
  }
});

test("focus is omitted when the Hacker News page surface cannot be resolved safely", () => {
  const { rows } = createControllerFixture([0, 1, 2, 3, 4, 5], {
    validSurface: false,
  });

  assert.equal(findLink(rows[4].navs, "focus"), undefined);
});

test("all leaves focus without changing Hacker News collapse state and restores the saved anchor", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5]);
  const { controller, guide, historyEntries, page, rows, scrolls } = fixture;
  rows[5].style.display = "none";
  findLink(rows[4].navs, "focus").dispatch("click");
  rows[4].rect.top = 465;

  const all = findLink(guide, "all");
  assert.ok(all);
  all.dispatch("click");

  assert.deepEqual(JSON.parse(JSON.stringify(controller.getState())), {
    kind: "global",
    rootId: null,
  });
  assert.equal(guide.hidden, true);
  assert.equal(rows[5].style.display, "none");
  assert.equal(rows[4].toggle.textContent, "[–]");
  assert.equal(rows[5].dataset.hnrFocusExcluded, undefined);
  assert.equal(rows[5].dataset.hnrScopeRow, undefined);
  assert.equal(page.fatitem.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(page.footerRow.dataset.hnrFocusPageExcluded, undefined);
  assert.deepEqual(scrolls.at(-1), { x: 0, y: 65 });
  assert.equal(historyEntries.at(-1).type, "back");
});

test("Safari Back leaves focus and restores the comment at its saved viewport offset", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5]);
  const { controller, historyEntries, page, rows, scrolls } = fixture;
  findLink(rows[4].navs, "focus").dispatch("click");
  rows[4].rect.top = 430;

  fixture.window.history.back();

  assert.deepEqual(JSON.parse(JSON.stringify(controller.getState())), {
    kind: "global",
    rootId: null,
  });
  assert.deepEqual(scrolls.at(-1), { x: 0, y: 30 });
  assert.equal(page.fatitem.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(page.footerRow.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(historyEntries.filter(({ type }) => type === "push").length, 1);
  assert.equal(historyEntries.at(-1).type, "back");
});

test("nested focus creates one History level and Back and Forward traverse it", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  const { controller, historyEntries, page, rows, scrolls } = fixture;
  findLink(rows[4].navs, "focus").dispatch("click");
  rows[5].rect.top = 236;
  findLink(rows[5].navs, "focus").dispatch("click");
  rows[5].rect.top = 286;

  assert.deepEqual(JSON.parse(JSON.stringify(controller.getState())), {
    kind: "focused",
    rootId: "comment-5",
  });
  assert.deepEqual(
    historyEntries.map(({ type }) => type),
    ["push", "replace", "push"],
  );
  assert.equal(page.fatitem.dataset.hnrFocusPageExcluded, "");
  assert.deepEqual(JSON.parse(JSON.stringify(rows[4].scrollIntoViewCalls)), [{ block: "start" }]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows[5].scrollIntoViewCalls)), [{ block: "start" }]);

  fixture.window.history.back();
  assert.equal(controller.getState().rootId, "comment-4");
  assert.deepEqual(scrolls.at(-1), { x: 0, y: 50 });

  fixture.window.history.forward();
  assert.equal(controller.getState().rootId, "comment-5");
});

test("ancestor zoom creates a wider Focus View and Safari Back and Forward traverse it", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  findLink(fixture.rows[5].navs, "focus").dispatch("click");

  clickGuideAuthor(fixture.guide, "user3");

  assert.equal(fixture.controller.getState().rootId, "comment-3");
  assert.deepEqual(
    fixture.historyEntries
      .filter(({ type }) => type === "push")
      .map(({ state }) => state.hnrCommentFocusView.transitionIndex),
    [1, 2, 3],
  );
  fixture.window.history.back();
  assert.equal(fixture.controller.getState().rootId, "comment-5");
  fixture.window.history.forward();
  assert.equal(fixture.controller.getState().rootId, "comment-3");
});

test("document capture and ancestor link activation create only one Focus View", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 7]);
  findLink(fixture.rows[6].navs, "focus").dispatch("click");
  const ancestor = findDescendant(
    fixture.guide,
    (node) => node.tagName === "A" && node.textContent === "user4",
  );
  assert.ok(ancestor);

  fixture.dispatchDocument("click", {
    target: ancestor,
    preventDefault() {},
  });
  ancestor.dispatch("click");

  assert.equal(fixture.controller.getState().rootId, "comment-4");
  assert.deepEqual(
    fixture.historyEntries
      .filter(({ type }) => type === "push")
      .map(({ state }) => state.hnrCommentFocusView.transitionIndex),
    [1, 2],
  );
});

test("all leaves a three-level focus stack with one user action", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 7]);

  for (const index of [4, 5, 6]) {
    findLink(fixture.rows[index].navs, "focus").dispatch("click");
  }
  fixture.rows[4].rect.top = 460;
  findLink(fixture.guide, "all").dispatch("click");

  assert.equal(fixture.controller.getState().kind, "global");
  assert.deepEqual(
    fixture.historyEntries.slice(-3).map(({ type }) => type),
    ["back", "back", "back"],
  );
  assert.deepEqual(fixture.scrolls.at(-1), { x: 0, y: 60 });
});

test("invalid HN Refined History state fails closed to the complete thread", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");

  fixture.dispatchWindow("popstate", {
    state: {
      hnrCommentFocusView: {
        rootId: "missing",
        label: "missing",
        returnAnchor: { id: "comment-4", offset: 400 },
        resumeAnchor: null,
        transitionIndex: 1,
      },
    },
  });

  assert.equal(fixture.controller.getState().kind, "global");
  assert.equal(fixture.page.headerRow.dataset.hnrFocusPageExcluded, undefined);
});

test("enabling thread focus adds actions without navigation or scrolling", () => {
  const fixture = createControllerFixture([0, 1, 2], { enabled: false });

  fixture.controller.setEnabled(true);

  assert.equal(fixture.controller.getState().kind, "global");
  assert.ok(findLink(fixture.rows[0].navs, "focus"));
  assert.deepEqual(fixture.historyEntries, []);
  assert.deepEqual(fixture.scrolls, []);
});

test("scrolling never creates a local scope whether thread focus is enabled or disabled", () => {
  for (const enabled of [true, false]) {
    const fixture = createControllerFixture([0, 1, 2, 3, 4, 5], { enabled });
    fixture.rows.slice(0, -1).forEach((row) => {
      row.rect = { top: -90, bottom: -10, height: 80 };
    });
    fixture.rows.at(-1).rect = { top: 8, bottom: 88, height: 80 };
    fixture.dispatchWindow("scroll");

    assert.equal(fixture.controller.getState().kind, "global");
  }
});

test("an HN target inside the current subtree retains the deepest focus", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  findLink(fixture.rows[5].navs, "focus").dispatch("click");
  const operationCount = fixture.historyEntries.length;
  let prevented = false;

  fixture.dispatchDocument("click", {
    target: createCommentTarget(6),
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(fixture.controller.getState().rootId, "comment-5");
  assert.equal(prevented, false);
  assert.equal(fixture.historyEntries.length, operationCount);
  assert.deepEqual(fixture.navigations, []);
});

test("HN navigation widens to the nearest common comment ancestor", () => {
  const depths = [0, 1, 2, 3, 2, 3, 1, 2, 0, 1];
  for (const { targetIndex, expectedRoot } of [
    { targetIndex: 4, expectedRoot: "comment-1" },
    { targetIndex: 7, expectedRoot: "comment-0" },
    { targetIndex: 1, expectedRoot: "comment-1" },
  ]) {
    const fixture = createControllerFixture(depths);
    findLink(fixture.rows[2].navs, "focus").dispatch("click");
    let prevented = false;
    const target = createCommentTarget(targetIndex);

    fixture.dispatchDocument("click", {
      target,
      preventDefault() {
        prevented = true;
      },
    });

    assert.equal(prevented, true);
    assert.equal(fixture.controller.getState().rootId, expectedRoot);
    assert.equal(fixture.window.location.href, target.href);
    assert.equal(fixture.historyEntries.at(-1).type, "push");
    fixture.window.history.back();
    assert.equal(fixture.controller.getState().rootId, "comment-2");
  }
});

test("HN navigation to another top-level comment tree exits Focus", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 2, 3, 1, 2, 0, 1]);
  findLink(fixture.rows[2].navs, "focus").dispatch("click");
  const target = createCommentTarget(9, "next");
  let prevented = false;

  fixture.dispatchDocument("click", {
    target,
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.controller.getState().kind, "global");
  assert.equal(fixture.window.location.href, target.href);
  assert.deepEqual(fixture.scrolls, []);
});

test("root parent prev and next preserve their literal targets through Focus coordination", () => {
  for (const label of ["root", "parent", "prev", "next"]) {
    const inside = createControllerFixture([0, 1, 2, 3, 2, 3]);
    findLink(inside.rows[2].navs, "focus").dispatch("click");
    const insideTarget = createCommentTarget(3, label);
    let insidePrevented = false;
    const operationCount = inside.historyEntries.length;
    inside.dispatchDocument("click", {
      target: insideTarget,
      preventDefault() {
        insidePrevented = true;
      },
    });
    assert.equal(insidePrevented, false, label);
    assert.equal(inside.controller.getState().rootId, "comment-2", label);
    assert.equal(inside.historyEntries.length, operationCount, label);
    assert.equal(insideTarget.getAttribute("href"), "item?id=1#comment-3", label);

    const wider = createControllerFixture([0, 1, 2, 3, 2, 3]);
    findLink(wider.rows[2].navs, "focus").dispatch("click");
    const widerTarget = createCommentTarget(4, label);
    let widerPrevented = false;
    wider.dispatchDocument("click", {
      target: widerTarget,
      preventDefault() {
        widerPrevented = true;
      },
    });
    assert.equal(widerPrevented, true, label);
    assert.equal(wider.controller.getState().rootId, "comment-1", label);
    assert.equal(wider.window.location.href, widerTarget.href, label);
    assert.equal(widerTarget.getAttribute("href"), "item?id=1#comment-4", label);
  }
});

test("an unresolved same-page HN comment target fails closed before navigation", () => {
  const fixture = createControllerFixture([0, 1, 2, 3]);
  findLink(fixture.rows[2].navs, "focus").dispatch("click");
  const target = createCommentTarget(99, "next");
  let prevented = false;

  fixture.dispatchDocument("click", {
    target,
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.controller.getState().kind, "global");
  assert.equal(fixture.window.location.href, target.href);
  assert.deepEqual(fixture.scrolls, []);
});

test("native HN fragment entries retain their focus state across Back and Forward", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  const inside = createCommentTarget(5);

  fixture.dispatchDocument("click", { target: inside, preventDefault() {} });
  fixture.navigateHash(inside.href);

  assert.equal(fixture.historyStack.at(-1).state?.hnrCommentFocusView?.rootId, "comment-4");
  fixture.window.history.back();
  assert.equal(fixture.controller.getState().rootId, "comment-4");
  fixture.window.history.forward();
  assert.equal(fixture.controller.getState().rootId, "comment-4");
});

test("all crosses native HN fragment entries before leaving the complete focus stack", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  fixture.navigateHash(createCommentTarget(5).href);
  fixture.rows[4].rect.top = 450;

  findLink(fixture.guide, "all").dispatch("click");

  assert.equal(fixture.controller.getState().kind, "global");
  assert.deepEqual(
    fixture.historyEntries.slice(-2).map(({ type }) => type),
    ["back", "back"],
  );
  assert.deepEqual(fixture.scrolls.at(-1), { x: 0, y: 50 });
});

test("an HN target at an ancestor creates a wider Focus View", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  findLink(fixture.rows[5].navs, "focus").dispatch("click");
  fixture.rows[4].rect.top = 500;
  let prevented = false;

  fixture.dispatchDocument("click", {
    target: createCommentTarget(4),
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.controller.getState().rootId, "comment-4");
  assert.equal(fixture.historyEntries.at(-1).type, "push");
  assert.deepEqual(fixture.scrolls, []);
  assert.equal(fixture.window.location.href, "https://news.ycombinator.com/item?id=1#comment-4");
});

test("ancestor navigation adds a wider view after a native fragment entry", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  findLink(fixture.rows[5].navs, "focus").dispatch("click");
  fixture.navigateHash(createCommentTarget(6).href);
  let prevented = false;

  fixture.dispatchDocument("click", {
    target: createCommentTarget(4),
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.controller.getState().rootId, "comment-4");
  assert.deepEqual(
    fixture.historyEntries.slice(-2).map(({ type }) => type),
    ["replace", "push"],
  );
  assert.equal(fixture.window.location.href, "https://news.ycombinator.com/item?id=1#comment-4");
});

test("an HN target outside clicked views still widens through original comment ancestry", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6, 4]);
  findLink(fixture.rows[4].navs, "focus").dispatch("click");
  findLink(fixture.rows[5].navs, "focus").dispatch("click");
  fixture.rows[4].rect.top = 500;
  let prevented = false;

  fixture.dispatchDocument("click", {
    target: createCommentTarget(7),
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.controller.getState().rootId, "comment-3");
  assert.deepEqual(
    fixture.historyEntries.slice(-2).map(({ type }) => type),
    ["replace", "push"],
  );
  assert.deepEqual(fixture.scrolls, []);
  assert.equal(fixture.page.fatitem.dataset.hnrFocusPageExcluded, "");
  assert.equal(fixture.page.footerRow.dataset.hnrFocusPageExcluded, "");
  assert.equal(fixture.window.location.href, "https://news.ycombinator.com/item?id=1#comment-7");
  fixture.window.history.back();
  assert.equal(fixture.controller.getState().rootId, "comment-5");
});

test("links that navigate to another HN page remain outside focus coordination", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5]);
  const { controller, rows } = fixture;
  findLink(rows[4].navs, "focus").dispatch("click");

  const reply = createNode("a");
  reply.href = "https://news.ycombinator.com/reply?id=comment-5";
  reply.setAttribute("href", "reply?id=comment-5");
  fixture.dispatchDocument("click", { target: reply, preventDefault() {} });

  assert.equal(controller.getState().kind, "focused");
});

test("disabling thread focus exits a nested focus stack and removes all actions", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5]);
  const { controller, historyEntries, page, rows } = fixture;
  findLink(rows[3].navs, "focus").dispatch("click");
  rows[4].rect.top = 230;
  findLink(rows[4].navs, "focus").dispatch("click");
  rows[3].rect.top = 450;

  controller.setEnabled(false);

  assert.equal(controller.getState().kind, "global");
  for (const row of rows) {
    assert.equal(findLink(row.navs, "focus"), undefined);
  }
  assert.equal(rows[3].style.getPropertyValue("--hnr-comment-base-indent"), "32px");
  assert.equal(page.fatitem.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(page.footerRow.dataset.hnrFocusPageExcluded, undefined);
  assert.equal(historyEntries.at(-1).type, "back");
  assert.deepEqual(fixture.scrolls.at(-1), { x: 0, y: 130 });
});

test("leaving explicit focus returns to the full thread without a scroll-triggered scope", () => {
  const fixture = createControllerFixture([0, 1, 2, 3, 4, 5, 6]);
  const { controller, guide, rows } = fixture;
  rows.slice(0, 5).forEach((row, index) => {
    row.rect.top = -400 + index * 80;
    row.rect.bottom = row.rect.top + 80;
  });
  rows[5].rect = { top: 8, bottom: 88, height: 80 };
  rows[6].rect = { top: 88, bottom: 168, height: 80 };
  fixture.dispatchWindow("scroll");
  assert.equal(controller.getState().kind, "global");

  findLink(rows[4].navs, "focus").dispatch("click");
  assert.equal(controller.getState().kind, "focused");
  findLink(guide, "all").dispatch("click");

  assert.deepEqual(JSON.parse(JSON.stringify(controller.getState())), {
    kind: "global",
    rootId: null,
  });
});

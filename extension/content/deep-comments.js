(() => {
  function readDepth(row) {
    const value = Number(row.querySelector("td.ind[indent]")?.getAttribute("indent"));
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  function buildCommentRecords(rows) {
    const records = [];
    const ancestors = [];

    for (const row of rows) {
      const depth = readDepth(row);
      if (depth == null || !row.id) {
        return [];
      }

      while (ancestors.length > 0 && records[ancestors.at(-1)].depth >= depth) {
        ancestors.pop();
      }

      records.push({
        row,
        id: row.id,
        depth,
        parentIndex: ancestors.at(-1) ?? -1,
        endIndex: records.length,
      });
      ancestors.push(records.length - 1);
    }

    for (let index = 0; index < records.length; index += 1) {
      let endIndex = index;
      while (endIndex + 1 < records.length && records[endIndex + 1].depth > records[index].depth) {
        endIndex += 1;
      }
      records[index].endIndex = endIndex;
    }

    return records;
  }

  function indentForDepth(depth) {
    if (depth <= 0) {
      return 0;
    }
    if (depth <= 2) {
      return depth * 12;
    }
    if (depth <= 6) {
      return 24 + (depth - 2) * 8;
    }
    return 56 + (depth - 6) * 4;
  }

  function resolveFocusSurface(document, tree, guide) {
    const main = document.querySelector("#hnmain");
    const bigbox = document.querySelector("#bigbox");
    const body = main?.tBodies?.[0] || main?.querySelector(":scope > tbody");
    const treeCell = tree?.parentElement;
    const headerRow = body?.firstElementChild;

    if (
      !main ||
      !bigbox ||
      !body ||
      !treeCell ||
      !headerRow ||
      bigbox.parentElement !== body ||
      !bigbox.contains(tree) ||
      treeCell.parentElement !== bigbox ||
      guide?.parentElement !== treeCell
    ) {
      return null;
    }

    return {
      pageElements: [
        ...Array.from(body.children).filter((row) => row !== bigbox),
        ...Array.from(treeCell.children).filter((node) => node !== guide && node !== tree),
      ],
    };
  }

  function authorLabelForRecord(record) {
    const username = record?.row.querySelector(".hnuser")?.textContent?.trim();
    if (username) {
      return username;
    }

    const commentText = record?.row.querySelector(".commtext")?.textContent?.trim();
    return commentText === "[deleted]" ? "[deleted]" : null;
  }

  function authorAncestryEntriesForRecord(index, records) {
    if (!Number.isInteger(index) || index < 0 || index >= records.length) {
      return null;
    }

    const entries = [];
    const visited = new Set();
    let cursor = index;
    while (cursor >= 0) {
      if (visited.has(cursor) || cursor >= records.length) {
        return null;
      }
      visited.add(cursor);

      const record = records[cursor];
      if (!record) {
        return null;
      }
      const label = authorLabelForRecord(record);
      if (!label || typeof record.id !== "string" || !record.id) {
        return null;
      }

      entries.push({ index: cursor, id: record.id, label });
      cursor = record.parentIndex;
    }

    return entries.reverse();
  }

  function authorAncestryForRecord(index, records) {
    return authorAncestryEntriesForRecord(index, records)?.map(({ label }) => label) || null;
  }

  function nearestCommonAncestorIndex(leftIndex, rightIndex, records) {
    const left = authorAncestryEntriesForRecord(leftIndex, records);
    const right = authorAncestryEntriesForRecord(rightIndex, records);
    if (!left || !right) {
      return null;
    }

    let common = -1;
    const length = Math.min(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      if (left[index].index !== right[index].index) {
        break;
      }
      common = left[index].index;
    }
    return common;
  }

  function ancestryPresentation(entries, expanded) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }
    if (expanded || entries.length <= 5) {
      return entries.map((entry) => ({ kind: "author", entry }));
    }
    return [
      { kind: "author", entry: entries[0] },
      { kind: "ellipsis" },
      ...entries.slice(-3).map((entry) => ({ kind: "author", entry })),
    ];
  }

  const FOCUS_HISTORY_KEY = "hnrCommentFocusView";

  function captureAnchor(record) {
    return {
      id: record.id,
      offset: record.row.getBoundingClientRect().top,
    };
  }

  function historyStateForView(view, currentState) {
    return {
      ...(currentState && typeof currentState === "object" ? currentState : {}),
      [FOCUS_HISTORY_KEY]: {
        rootId: view.rootId,
        label: view.label,
        returnAnchor: view.returnAnchor,
        resumeAnchor: view.resumeAnchor,
        transitionIndex: view.transitionIndex,
      },
    };
  }

  function resolveHistoryView(state, records) {
    if (!state || typeof state !== "object" || !Object.hasOwn(state, FOCUS_HISTORY_KEY)) {
      return undefined;
    }

    const serialized = state[FOCUS_HISTORY_KEY];
    if (!serialized || typeof serialized !== "object") {
      return null;
    }

    const recordIndexById = new Map(records.map((record, index) => [record.id, index]));
    const validAnchor = (anchor, allowNull) => {
      if (allowNull && anchor == null) {
        return true;
      }
      return (
        anchor &&
        typeof anchor === "object" &&
        typeof anchor.id === "string" &&
        recordIndexById.has(anchor.id) &&
        Number.isFinite(anchor.offset)
      );
    };

    if (
      typeof serialized.rootId !== "string" ||
      typeof serialized.label !== "string" ||
      !serialized.label.trim() ||
      !validAnchor(serialized.returnAnchor, false) ||
      !validAnchor(serialized.resumeAnchor, true) ||
      !Number.isInteger(serialized.transitionIndex) ||
      serialized.transitionIndex < 1
    ) {
      return null;
    }

    const rootIndex = recordIndexById.get(serialized.rootId);
    if (rootIndex == null) {
      return null;
    }

    return {
      rootId: serialized.rootId,
      rootIndex,
      label: serialized.label,
      returnAnchor: { ...serialized.returnAnchor },
      resumeAnchor: serialized.resumeAnchor ? { ...serialized.resumeAnchor } : null,
      transitionIndex: serialized.transitionIndex,
    };
  }

  function createController({ document, window }) {
    const mobileQuery = window.matchMedia("(any-pointer: coarse)");
    let records = [];
    let guide = null;
    let focusSurface = null;
    let enabled = true;
    let focusView = null;
    let pendingExit = null;
    let ancestryExpanded = false;
    let started = false;
    const focusAffordances = [];

    function state() {
      return {
        kind: focusView ? "focused" : "global",
        rootId: focusView?.rootId || null,
      };
    }

    function ensureGuide() {
      if (guide) {
        return guide;
      }

      const tree = document.querySelector(".comment-tree");
      if (!tree) {
        return null;
      }

      guide = document.createElement("div");
      guide.className = "hnr-comment-scope-guide";
      guide.hidden = true;
      tree.before(guide);
      return guide;
    }

    function clearScopeAttributes() {
      for (const record of records) {
        delete record.row.dataset.hnrFocusExcluded;
        delete record.row.dataset.hnrScopeRow;
        record.row.style.removeProperty("--hnr-comment-indent");
      }
    }

    function applyPageFocus() {
      for (const element of focusSurface?.pageElements || []) {
        element.dataset.hnrFocusPageExcluded = "";
      }
    }

    function clearPageFocus() {
      for (const element of focusSurface?.pageElements || []) {
        delete element.dataset.hnrFocusPageExcluded;
      }
    }

    function applyScope(rootIndex) {
      clearScopeAttributes();
      const root = records[rootIndex];
      if (!root) {
        return;
      }

      for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        if (index >= rootIndex && index <= root.endIndex) {
          record.row.dataset.hnrScopeRow = "";
          record.row.style.setProperty(
            "--hnr-comment-indent",
            `${indentForDepth(record.depth - root.depth)}px`,
          );
        } else {
          record.row.dataset.hnrFocusExcluded = "";
        }
      }
    }

    function restoreAnchor(anchor) {
      if (!anchor) {
        return;
      }

      const record = records.find(({ id }) => id === anchor.id);
      if (record) {
        const currentTop = record.row.getBoundingClientRect().top;
        window.scrollBy(0, currentTop - anchor.offset);
      }
    }

    function applyFocusView(nextView, { restoreAnchor: anchor = null, revealIndex = -1 } = {}) {
      clearPageFocus();
      clearScopeAttributes();

      focusView = nextView;
      const root = records[focusView?.rootIndex ?? -1];
      const entries = authorAncestryEntriesForRecord(focusView?.rootIndex ?? -1, records);
      if (!focusSurface || !root || !entries) {
        focusView = null;
      }

      if (focusView) {
        applyPageFocus();
        applyScope(focusView.rootIndex);
        renderFocusGuide(entries);
        addFocusAffordances();
        const reveal = records[revealIndex];
        if (reveal) {
          reveal.row.scrollIntoView({ block: "start" });
        } else {
          restoreAnchor(anchor);
        }
        return;
      }

      if (guide) {
        guide.hidden = true;
        guide.replaceChildren();
      }
      ancestryExpanded = false;
      addFocusAffordances();
      restoreAnchor(anchor);
    }

    function leaveAllFocus({ restoreAnchor: anchor = null } = {}) {
      applyFocusView(null, { restoreAnchor: anchor });
    }

    function finishPendingExit() {
      const exit = pendingExit;
      pendingExit = null;
      leaveAllFocus({ restoreAnchor: exit?.restoreAnchor ? exit.anchor : null });
      if (exit?.href) {
        window.location.href = exit.href;
      }
    }

    function handleHistoryPop(event) {
      const nextView = resolveHistoryView(event.state, records);

      if (pendingExit) {
        if (nextView) {
          window.history.back();
          return;
        }
        finishPendingExit();
        return;
      }

      if (!nextView) {
        const anchor = nextView === undefined ? focusView?.returnAnchor || null : null;
        leaveAllFocus({ restoreAnchor: anchor });
        return;
      }

      const previousTransition = focusView?.transitionIndex ?? 0;
      if (nextView.transitionIndex < previousTransition) {
        applyFocusView(nextView, {
          restoreAnchor: nextView.resumeAnchor || nextView.returnAnchor,
        });
        return;
      }

      if (nextView.transitionIndex > previousTransition) {
        const targetId = decodeURIComponent(new URL(window.location.href).hash.slice(1));
        const targetIndex = records.findIndex(({ id }) => id === targetId);
        const root = records[nextView.rootIndex];
        const revealIndex =
          targetIndex >= nextView.rootIndex && targetIndex <= root.endIndex
            ? targetIndex
            : nextView.rootIndex;
        applyFocusView(nextView, { revealIndex });
        return;
      }

      applyFocusView(nextView);
    }

    function handleHashChange() {
      if (!focusView) {
        return;
      }

      const historyView = resolveHistoryView(window.history.state, records);
      if (
        historyView?.rootId === focusView.rootId &&
        historyView.transitionIndex === focusView.transitionIndex
      ) {
        return;
      }

      window.history.replaceState(
        historyStateForView(focusView, window.history.state),
        "",
        window.location.href,
      );
    }

    function beginExit({ href = null, restoreAnchor: shouldRestore = false } = {}) {
      if (!focusView) {
        if (href) {
          window.location.href = href;
        }
        return;
      }
      pendingExit = {
        href,
        restoreAnchor: shouldRestore,
        anchor: focusView.returnAnchor,
      };
      window.history.back();
    }

    function exitFromGuide(event) {
      event.preventDefault();
      beginExit({ restoreAnchor: true });
    }

    function renderCurrentFocusGuide() {
      const entries = authorAncestryEntriesForRecord(focusView?.rootIndex ?? -1, records);
      if (entries) {
        renderFocusGuide(entries);
      }
    }

    function appendSeparator(segment) {
      const separator = document.createElement("span");
      separator.className = "hnr-comment-scope-separator";
      separator.textContent = "/";
      separator.setAttribute("aria-hidden", "true");
      segment.append(separator);
    }

    function pushFocusView(
      rootIndex,
      {
        url = window.location.href,
        revealIndex = rootIndex,
        saveAnchorIndex = focusView?.rootIndex ?? rootIndex,
      } = {},
    ) {
      const record = records[rootIndex];
      const label = authorLabelForRecord(record);
      if (!record || !label || !authorAncestryEntriesForRecord(rootIndex, records)) {
        return false;
      }

      if (focusView) {
        const anchorRecord = records[saveAnchorIndex];
        if (!anchorRecord) {
          return false;
        }
        focusView = { ...focusView, resumeAnchor: captureAnchor(anchorRecord) };
        window.history.replaceState(
          historyStateForView(focusView, window.history.state),
          "",
          window.location.href,
        );
      }

      const nextView = {
        rootId: record.id,
        rootIndex,
        label,
        returnAnchor: focusView?.returnAnchor || captureAnchor(record),
        resumeAnchor: null,
        transitionIndex: (focusView?.transitionIndex || 0) + 1,
      };
      window.history.pushState(historyStateForView(nextView, window.history.state), "", url);
      applyFocusView(nextView, { revealIndex });
      return true;
    }

    function renderFocusGuide(entries) {
      const scopeGuide = ensureGuide();
      if (!scopeGuide) {
        return;
      }

      const all = document.createElement("a");
      all.href = "#";
      all.className = "hnr-comment-scope-exit";
      all.textContent = "all";
      all.setAttribute("aria-label", "Exit focused comments");
      all.addEventListener("click", exitFromGuide);

      const prefix = document.createElement("span");
      prefix.className = "hnr-comment-scope-prefix";
      prefix.textContent = " | focused:";

      const path = document.createElement("span");
      path.className = "hnr-comment-scope-path";
      path.setAttribute(
        "aria-label",
        `Focused comment ancestry: ${entries.map(({ label }) => label).join(" / ")}`,
      );
      path.append(prefix);
      const presentation = ancestryPresentation(entries, ancestryExpanded);

      function createGuideStep(token, index) {
        const segment = document.createElement("span");
        segment.className = "hnr-comment-scope-step";

        if (token.kind === "ellipsis") {
          segment.className += " hnr-comment-scope-step-ancestor";
          const ellipsis = document.createElement("button");
          ellipsis.type = "button";
          ellipsis.className = "hnr-comment-scope-ellipsis";
          ellipsis.textContent = "…";
          ellipsis.setAttribute("aria-label", "Show complete comment ancestry");
          ellipsis.addEventListener("click", () => {
            ancestryExpanded = true;
            renderCurrentFocusGuide();
          });
          segment.append(ellipsis);
        } else {
          const current = token.entry.index === focusView.rootIndex;
          segment.className += current
            ? " hnr-comment-scope-step-current"
            : " hnr-comment-scope-step-ancestor";
          const author = document.createElement(current ? "span" : "a");
          author.className = current
            ? "hnr-comment-scope-author"
            : "hnr-comment-scope-author hnr-comment-scope-ancestor";
          author.textContent = token.entry.label;
          if (!current) {
            author.href = `#${token.entry.id}`;
            author.setAttribute("aria-label", `Widen focus to comments by ${token.entry.label}`);
            author.addEventListener("click", (event) => {
              event.preventDefault();
              pushFocusView(token.entry.index, {
                url: author.href,
                revealIndex: token.entry.index,
                saveAnchorIndex: focusView.rootIndex,
              });
            });
          }
          segment.append(author);
        }

        if (index < presentation.length - 1) {
          appendSeparator(segment);
        }
        return segment;
      }

      for (let index = 0; index < presentation.length; index += 1) {
        const token = presentation[index];
        const beginsNearestPair =
          index === presentation.length - 2 &&
          token.kind === "author" &&
          presentation[index + 1]?.kind === "author";
        if (beginsNearestPair) {
          const nearest = document.createElement("span");
          nearest.className = "hnr-comment-scope-nearest";
          nearest.append(createGuideStep(token, index));
          index += 1;
          nearest.append(createGuideStep(presentation[index], index));
          path.append(nearest);
          continue;
        }
        path.append(createGuideStep(token, index));
      }

      scopeGuide.replaceChildren(all, path);
      scopeGuide.hidden = false;
    }

    function enterFocus(index) {
      const record = records[index];
      if (
        !enabled ||
        !mobileQuery.matches ||
        !focusSurface ||
        !record ||
        record.endIndex <= index ||
        !authorLabelForRecord(record) ||
        !authorAncestryEntriesForRecord(index, records)
      ) {
        return;
      }

      pushFocusView(index, { saveAnchorIndex: index });
    }

    function removeFocusAffordances() {
      for (const nodes of focusAffordances.splice(0)) {
        for (const node of nodes) {
          node.remove();
        }
      }
    }

    function addFocusAffordances() {
      removeFocusAffordances();
      if (!focusSurface || !mobileQuery.matches || !enabled) {
        return;
      }

      const currentRootIndex = focusView?.rootIndex ?? -1;
      records.forEach((record, index) => {
        if (
          record.endIndex <= index ||
          index === currentRootIndex ||
          !authorAncestryEntriesForRecord(index, records)
        ) {
          return;
        }

        const toggle = record.row.querySelector(".togg");
        if (!toggle?.parentNode) {
          return;
        }

        const before = document.createTextNode(" | ");
        const focus = document.createElement("a");
        const after = document.createTextNode(" ");
        focus.href = `#${record.id}`;
        focus.className = "hnr-comment-focus";
        focus.textContent = "focus";
        const username = authorLabelForRecord(record);
        focus.setAttribute(
          "aria-label",
          username ? `Focus replies to ${username}` : "Focus this comment thread",
        );
        focus.addEventListener("click", (event) => {
          event.preventDefault();
          enterFocus(index);
        });

        toggle.parentNode.insertBefore(before, toggle);
        toggle.parentNode.insertBefore(focus, toggle);
        toggle.parentNode.insertBefore(after, toggle);
        focusAffordances.push([before, focus, after]);
      });
    }

    function refresh() {
      const nextRecords = buildCommentRecords(
        Array.from(document.querySelectorAll(".comment-tree .comtr")),
      );
      if (nextRecords.length === 0) {
        records = [];
        focusSurface = null;
        removeFocusAffordances();
        return;
      }

      records = nextRecords;
      for (const record of records) {
        record.row.style.setProperty(
          "--hnr-comment-base-indent",
          `${indentForDepth(record.depth)}px`,
        );
      }
      const tree = document.querySelector(".comment-tree");
      const scopeGuide = ensureGuide();
      focusSurface = resolveFocusSurface(document, tree, scopeGuide);
      addFocusAffordances();
    }

    function handleCommentNavigation(event) {
      if (!focusView) {
        return;
      }

      const anchor = event.target?.closest?.("a[href]");
      const anchorClasses = String(anchor?.className || "").split(/\s+/);
      if (
        anchorClasses.includes("hnr-comment-focus") ||
        anchorClasses.includes("hnr-comment-scope-ancestor") ||
        anchorClasses.includes("hnr-comment-scope-exit")
      ) {
        return;
      }
      const href = anchor?.getAttribute("href");
      if (!href) {
        return;
      }

      let current;
      let target;
      try {
        current = new URL(window.location.href);
        target = new URL(href, current);
      } catch {
        return;
      }

      if (
        target.origin !== current.origin ||
        target.pathname !== current.pathname ||
        target.search !== current.search ||
        !target.hash
      ) {
        return;
      }

      const targetId = decodeURIComponent(target.hash.slice(1));
      const targetIndex = records.findIndex(({ id }) => id === targetId);
      if (targetIndex < 0) {
        event.preventDefault();
        beginExit({ href: target.href });
        return;
      }

      const root = records[focusView.rootIndex];
      if (targetIndex >= focusView.rootIndex && targetIndex <= root.endIndex) {
        return;
      }

      const commonIndex = nearestCommonAncestorIndex(focusView.rootIndex, targetIndex, records);
      if (commonIndex >= 0) {
        event.preventDefault();
        pushFocusView(commonIndex, {
          url: target.href,
          revealIndex: targetIndex,
          saveAnchorIndex: focusView.rootIndex,
        });
        return;
      }

      event.preventDefault();
      beginExit({ href: target.href });
    }

    function setEnabled(nextEnabled) {
      enabled = nextEnabled !== false;

      if (focusView && (!enabled || !mobileQuery.matches)) {
        beginExit({ restoreAnchor: true });
      }
      addFocusAffordances();
    }

    function handleViewportChange() {
      setEnabled(enabled);
    }

    function start(initialEnabled = true) {
      if (started) {
        setEnabled(initialEnabled);
        return;
      }

      started = true;
      enabled = initialEnabled !== false;
      window.addEventListener("popstate", handleHistoryPop);
      window.addEventListener("hashchange", handleHashChange);
      document.addEventListener("click", handleCommentNavigation, true);
      mobileQuery.addEventListener("change", handleViewportChange);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", refresh, { once: true });
      } else {
        refresh();
      }
      setEnabled(initialEnabled);
    }

    return Object.freeze({
      start,
      setEnabled,
      refresh,
      getState: state,
    });
  }

  globalThis.HNRefinedDeepComments = Object.freeze({
    ancestryPresentation,
    authorAncestryEntriesForRecord,
    authorAncestryForRecord,
    authorLabelForRecord,
    buildCommentRecords,
    captureAnchor,
    createController,
    historyStateForView,
    indentForDepth,
    nearestCommonAncestorIndex,
    resolveFocusSurface,
    resolveHistoryView,
  });
})();

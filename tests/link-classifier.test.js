import test from "node:test";
import assert from "node:assert/strict";
import {
  isHackerNewsInternalUrl,
  isExternalStoryLink,
  shouldForceNewTab
} from "../extension/shared/link-classifier.js";

test("classifies Hacker News internal URLs", () => {
  assert.equal(isHackerNewsInternalUrl("https://news.ycombinator.com/item?id=1"), true);
  assert.equal(isHackerNewsInternalUrl("/item?id=1"), true);
  assert.equal(isHackerNewsInternalUrl("news"), true);
  assert.equal(isHackerNewsInternalUrl("https://example.com/article"), false);
});

test("external story links are only title links", () => {
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/article",
      className: "titleline",
      closestClassNames: ["titleline"]
    }),
    true
  );
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/comment",
      className: "subtext",
      closestClassNames: ["subtext"]
    }),
    false
  );
  assert.equal(
    isExternalStoryLink({
      href: "item?id=1",
      className: "titleline",
      closestClassNames: ["titleline"]
    }),
    false
  );
});

test("malformed story link class information is not external story link", () => {
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/article",
      className: "titleline"
    }),
    false
  );
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/article",
      className: "titleline",
      closestClassNames: null
    }),
    false
  );
  assert.equal(
    isExternalStoryLink({
      href: "https://example.com/article",
      className: "titleline",
      closestClassNames: "not-titleline"
    }),
    false
  );
});

test("new-tab behavior is opt-in", () => {
  const story = {
    href: "https://example.com/article",
    className: "",
    closestClassNames: ["titleline"]
  };

  assert.equal(shouldForceNewTab(story, { openStoryLinksInNewTabs: false }), false);
  assert.equal(shouldForceNewTab(story, { openStoryLinksInNewTabs: true }), true);
});

test("new-tab behavior treats missing preferences as disabled", () => {
  const story = {
    href: "https://example.com/article",
    className: "",
    closestClassNames: ["titleline"]
  };

  assert.equal(shouldForceNewTab(story, null), false);
  assert.equal(shouldForceNewTab(story, undefined), false);
});

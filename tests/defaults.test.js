import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_PREFERENCES,
  DEFAULT_PREFERENCES,
  normalizePreferences,
} from "../extension/shared/defaults.js";

test("default preferences match the approved spec", () => {
  assert.deepEqual(DEFAULT_PREFERENCES, {
    theme: "system",
    fontPreset: "hn-classic",
    desktopDensity: "comfortable",
    readingWidth: "comfortable",
    openStoryLinksInNewTabs: false,
  });
});

test("allowed preferences expose only first-version options", () => {
  assert.deepEqual(ALLOWED_PREFERENCES.theme, ["system", "light", "dark"]);
  assert.deepEqual(ALLOWED_PREFERENCES.fontPreset, [
    "hn-classic",
    "system-sans",
    "serif-reading",
    "mono-ish",
  ]);
  assert.deepEqual(ALLOWED_PREFERENCES.desktopDensity, ["comfortable", "classic-ish"]);
  assert.deepEqual(ALLOWED_PREFERENCES.readingWidth, ["comfortable", "wide"]);
  assert.equal(ALLOWED_PREFERENCES.mobileLayout, undefined);
});

test("normalizePreferences falls back for invalid or missing values", () => {
  assert.deepEqual(
    normalizePreferences({
      theme: "remote",
      fontPreset: "serif-reading",
      desktopDensity: "huge",
      readingWidth: "wide",
      mobileLayout: "off",
      openStoryLinksInNewTabs: "yes",
    }),
    {
      theme: "system",
      fontPreset: "serif-reading",
      desktopDensity: "comfortable",
      readingWidth: "wide",
      openStoryLinksInNewTabs: false,
    },
  );
});

test("normalizePreferences treats null as missing preferences", () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
});

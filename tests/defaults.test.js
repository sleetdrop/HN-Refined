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
    fontPreset: "system-sans",
    desktopDensity: "comfortable",
    readingWidth: "comfortable",
    mobileLayout: "auto",
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
  assert.deepEqual(ALLOWED_PREFERENCES.mobileLayout, ["auto", "off"]);
});

test("normalizePreferences falls back for invalid or missing values", () => {
  assert.deepEqual(
    normalizePreferences({
      theme: "remote",
      fontPreset: "serif-reading",
      desktopDensity: "huge",
      readingWidth: "wide",
      mobileLayout: "auto",
      openStoryLinksInNewTabs: "yes",
    }),
    {
      theme: "system",
      fontPreset: "serif-reading",
      desktopDensity: "comfortable",
      readingWidth: "wide",
      mobileLayout: "auto",
      openStoryLinksInNewTabs: false,
    },
  );
});

test("normalizePreferences treats null as missing preferences", () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
});

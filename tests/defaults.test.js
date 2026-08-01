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
    threadFocusEnabled: true,
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
  assert.equal(ALLOWED_PREFERENCES.threadFocusEnabled, undefined);
  assert.equal(ALLOWED_PREFERENCES.mobileLayout, undefined);
});

test("normalizePreferences falls back for invalid or missing values", () => {
  assert.deepEqual(
    normalizePreferences({
      theme: "remote",
      fontPreset: "serif-reading",
      desktopDensity: "huge",
      readingWidth: "wide",
      threadFocusEnabled: "yes",
      mobileLayout: "off",
      openStoryLinksInNewTabs: "yes",
    }),
    {
      theme: "system",
      fontPreset: "serif-reading",
      desktopDensity: "comfortable",
      readingWidth: "wide",
      threadFocusEnabled: true,
      openStoryLinksInNewTabs: false,
    },
  );
});

test("normalizePreferences preserves an explicit thread-focus choice over legacy state", () => {
  assert.equal(
    normalizePreferences({ threadFocusEnabled: false, deepThreadMode: "on-demand" })
      .threadFocusEnabled,
    false,
  );
});

test("normalizePreferences migrates legacy deep-thread modes to the Boolean preference", () => {
  assert.equal(
    normalizePreferences({ deepThreadMode: "indentation-only" }).threadFocusEnabled,
    false,
  );
  assert.equal(normalizePreferences({ deepThreadMode: "on-demand" }).threadFocusEnabled, true);
  assert.equal(normalizePreferences({ deepThreadMode: "automatic" }).threadFocusEnabled, true);
  assert.equal(normalizePreferences({ deepThreadMode: "sideways" }).threadFocusEnabled, true);
  assert.equal("deepThreadMode" in normalizePreferences({ deepThreadMode: "on-demand" }), false);
});

test("normalizePreferences treats null as missing preferences", () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
});

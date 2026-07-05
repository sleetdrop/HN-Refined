import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const popupHtml = fs.readFileSync("extension/popup/popup.html", "utf8");

test("manifest separates toolbar popup from full settings page", () => {
  assert.equal(manifest.action.default_popup, "popup/popup.html");
  assert.equal(manifest.options_ui.page, "options/options.html");
  assert.equal(manifest.options_ui.open_in_tab, true);
  assert.deepEqual(manifest.permissions, ["storage", "activeTab"]);
  assert.deepEqual(manifest.host_permissions, ["https://news.ycombinator.com/*"]);
});

test("popup exposes only theme choice and full settings entry", () => {
  for (const theme of ["system", "light", "dark"]) {
    assert.match(popupHtml, new RegExp(`value="${theme}"`));
  }

  assert.match(popupHtml, /id="open-settings"/);

  for (const fullSettingsId of [
    "fontPreset",
    "desktopDensity",
    "readingWidth",
    "mobileLayout",
    "openStoryLinksInNewTabs"
  ]) {
    assert.doesNotMatch(popupHtml, new RegExp(`id="${fullSettingsId}"`));
  }
});

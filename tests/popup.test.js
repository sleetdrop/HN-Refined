import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const popupHtml = fs.readFileSync("extension/popup/popup.html", "utf8");
const optionsHtml = fs.readFileSync("extension/options/options.html", "utf8");
const xcodeProject = fs.readFileSync("HNRefined/HNRefined.xcodeproj/project.pbxproj", "utf8");

test("manifest separates toolbar popup from full settings page", () => {
  assert.equal(manifest.action.default_popup, "popup/popup.html");
  assert.equal(manifest.options_ui.page, "options/options.html");
  assert.equal(manifest.options_ui.open_in_tab, true);
  assert.deepEqual(manifest.permissions, ["storage", "activeTab"]);
  assert.deepEqual(manifest.host_permissions, ["https://news.ycombinator.com/*"]);
});

test("popup exposes only quick settings and full settings entry", () => {
  for (const theme of ["system", "light", "dark"]) {
    assert.match(popupHtml, new RegExp(`value="${theme}"`));
  }

  assert.match(popupHtml, /id="openStoryLinksInNewTabs"/);
  assert.match(popupHtml, /<legend>Story links<\/legend>/);
  assert.match(popupHtml, /class="single-option"/);
  assert.doesNotMatch(popupHtml, /class="toggle-row"/);
  assert.match(popupHtml, /id="open-settings"/);
  assert.match(popupHtml, />All Settings</);

  for (const fullSettingsId of ["fontPreset", "desktopDensity", "readingWidth", "mobileLayout"]) {
    assert.doesNotMatch(popupHtml, new RegExp(`id="${fullSettingsId}"`));
  }
});

test("full settings page groups only meaningful user-facing controls", () => {
  for (const heading of ["Appearance", "Desktop Reading", "Links"]) {
    assert.match(optionsHtml, new RegExp(`>${heading}<`));
  }

  assert.match(optionsHtml, /Desktop reading settings mainly affect wide Hacker News layouts/);
  assert.doesNotMatch(optionsHtml, /Mobile Reading/);
  assert.doesNotMatch(optionsHtml, /Mobile Layout/);
  assert.doesNotMatch(optionsHtml, /id="mobileLayout"/);

  for (const fieldId of [
    "theme",
    "fontPreset",
    "desktopDensity",
    "readingWidth",
    "openStoryLinksInNewTabs",
  ]) {
    assert.match(optionsHtml, new RegExp(`id="${fieldId}"`));
  }
});

test("Xcode packages toolbar popup resources into the Safari extension", () => {
  assert.match(xcodeProject, /\/\* popup \*\//);
  assert.match(xcodeProject, /\/\* popup in Resources \*\//);
});

test("Xcode packages icon resources into the Safari extension", () => {
  assert.match(xcodeProject, /\/\* icons \*\//);
  assert.match(xcodeProject, /\/\* icons in Resources \*\//);
});

test("Xcode wrapper includes iOS and macOS Safari extension targets", () => {
  assert.match(xcodeProject, /HNRefined \(iOS\)/);
  assert.match(xcodeProject, /HNRefined \(macOS\)/);
  assert.match(xcodeProject, /HNRefined Extension \(iOS\)/);
  assert.match(xcodeProject, /HNRefined Extension \(macOS\)/);
  assert.match(xcodeProject, /IPHONEOS_DEPLOYMENT_TARGET/);
  assert.match(xcodeProject, /TARGETED_DEVICE_FAMILY = "1,2"/);
});

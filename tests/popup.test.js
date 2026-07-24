import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const popupHtml = fs.readFileSync("extension/popup/popup.html", "utf8");
const popupCss = fs.readFileSync("extension/popup/popup.css", "utf8");
const optionsHtml = fs.readFileSync("extension/options/options.html", "utf8");
const optionsCss = fs.readFileSync("extension/options/options.css", "utf8");
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

test("popup uses native system controls and adaptive interaction styling", () => {
  assert.match(popupHtml, /<input id="openStoryLinksInNewTabs" type="checkbox" switch\s*\/>/);
  assert.match(popupHtml, /class="settings-chevron" aria-hidden="true">›<\/span>/);

  assert.match(
    popupCss,
    /\.segmented-control input:checked \+ span\s*{[^}]*color: AccentColorText;[^}]*background: AccentColor;/s,
  );
  assert.match(popupCss, /\.single-option input\s*{[^}]*accent-color: AccentColor;/s);
  assert.doesNotMatch(popupCss, /LinkText/);
  assert.match(popupCss, /\.settings-link\s*{[^}]*color: CanvasText;/s);
  assert.match(popupCss, /@media \(hover: hover\)/);
  assert.match(popupCss, /@media \(any-pointer: coarse\)/);
  assert.match(popupCss, /min-height: 44px/);
});

test("full settings page groups only meaningful user-facing controls", () => {
  for (const heading of ["Appearance", "Reading Layout", "Links"]) {
    assert.match(optionsHtml, new RegExp(`>${heading}<`));
  }

  assert.match(optionsHtml, /Reading layout settings mainly affect Mac and wider iPad layouts/);
  assert.match(optionsHtml, /Reading Density/);
  assert.match(optionsHtml, /<option value="classic-ish">Classic<\/option>/);
  assert.match(optionsHtml, /<option value="comfortable">Focused<\/option>/);
  assert.match(optionsHtml, /<option value="serif-reading">Serif<\/option>/);
  assert.match(optionsHtml, /<option value="mono-ish">Mono-ish<\/option>/);
  assert.doesNotMatch(optionsHtml, /Mobile Reading/);
  assert.doesNotMatch(optionsHtml, /Mobile Layout/);
  assert.doesNotMatch(optionsHtml, /id="mobileLayout"/);

  const fontOptions = optionsHtml.match(/<select id="fontPreset">([\s\S]*?)<\/select>/)?.[1];
  assert.ok(fontOptions);
  assert.ok(fontOptions.indexOf('value="hn-classic"') < fontOptions.indexOf('value="system-sans"'));

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

test("full settings page uses continuous native system rows", () => {
  assert.equal(optionsHtml.match(/class="setting-row(?: [^"]+)?"/g)?.length, 5);
  assert.match(
    optionsHtml,
    /<label class="setting-row">\s*<span class="setting-label">Theme<\/span>\s*<select id="theme">/s,
  );
  assert.match(
    optionsHtml,
    /<label class="setting-row setting-row-stack-narrow">\s*<span class="setting-label">Reading Density<\/span>\s*<select id="desktopDensity">/s,
  );
  assert.match(
    optionsHtml,
    /<label class="setting-row setting-row-switch">\s*<span class="setting-label">Open external story links in new tabs<\/span>\s*<input id="openStoryLinksInNewTabs" type="checkbox" switch\s*\/>/s,
  );

  assert.match(
    optionsCss,
    /\.setting-row\s*{[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(128px, 190px\);[^}]*min-height: 42px;/s,
  );
  assert.match(
    optionsCss,
    /\.setting-row-switch\s*{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/s,
  );
  assert.match(optionsCss, /@media \(max-width: 520px\)/);
  assert.match(optionsCss, /\.setting-row-stack-narrow\s*{[^}]*grid-template-columns: 1fr;/s);
  assert.match(optionsCss, /@media \(any-pointer: coarse\)/);
  assert.match(optionsCss, /min-height: 44px/);
  assert.match(optionsCss, /:focus-visible/);
  assert.doesNotMatch(optionsCss, /#(?:007aff|0a84ff|006cff)/i);
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

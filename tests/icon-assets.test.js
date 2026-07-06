import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const appIconContents = JSON.parse(
  fs.readFileSync("HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/Contents.json", "utf8"),
);
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const makefile = fs.readFileSync("Makefile", "utf8");
const generateIconsScript = fs.readFileSync("scripts/generate-icons.js", "utf8");
const developmentDoc = fs.readFileSync("docs/development.md", "utf8");

const requiredExtensionIcons = [
  "extension/icons/icon-16.png",
  "extension/icons/icon-19.png",
  "extension/icons/icon-32.png",
  "extension/icons/icon-38.png",
  "extension/icons/icon-48.png",
  "extension/icons/icon-128.png",
];

const requiredAppIcons = [
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-16.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-16@2x.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-32.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-32@2x.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-128.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-128@2x.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-256.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-256@2x.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-512.png",
  "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
];

test("icon generation is an explicit development command", () => {
  assert.equal(packageJson.scripts["build:icons"], "node scripts/generate-icons.js");
  assert.match(makefile, /^build-icons:/m);
  assert.match(makefile, /\n\tnpm run build:icons/);
  assert.doesNotMatch(packageJson.scripts.check, /build:icons/);
  assert.match(generateIconsScript, /rsvg-convert/);
  assert.doesNotMatch(generateIconsScript, /magick/);
  assert.match(developmentDoc, /make build-icons/);
  assert.match(developmentDoc, /rsvg-convert/);
});

test("manifest references generated extension icons", () => {
  assert.deepEqual(manifest.icons, {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  });

  assert.deepEqual(manifest.action.default_icon, {
    "16": "icons/icon-16.png",
    "19": "icons/icon-19.png",
    "32": "icons/icon-32.png",
    "38": "icons/icon-38.png",
  });
});

test("generated icon files are present in committed asset locations", () => {
  for (const iconPath of [
    "assets/icon/hn-refined-icon.svg",
    "assets/icon/hn-refined-toolbar-icon.svg",
    "HNRefined/HNRefined/Resources/Icon.png",
    ...requiredExtensionIcons,
    ...requiredAppIcons,
  ]) {
    assert.equal(fs.existsSync(iconPath), true, `${iconPath} should exist`);
  }
});

test("Xcode app icon catalog references all generated macOS icon files", () => {
  const filenames = appIconContents.images.map((image) => image.filename);

  assert.deepEqual(filenames, [
    "AppIcon-16.png",
    "AppIcon-16@2x.png",
    "AppIcon-32.png",
    "AppIcon-32@2x.png",
    "AppIcon-128.png",
    "AppIcon-128@2x.png",
    "AppIcon-256.png",
    "AppIcon-256@2x.png",
    "AppIcon-512.png",
    "AppIcon-512@2x.png",
  ]);
});

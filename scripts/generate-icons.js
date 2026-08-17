import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const appIconSource = "assets/icon/hn-refined-icon.svg";
const toolbarIconSource = "assets/icon/hn-refined-toolbar-icon.svg";
const appIconDir = "HNRefined/Shared (App)/Assets.xcassets/AppIcon.appiconset";
const extensionIconDir = "extension/icons";
const hostIcon = ["HNRefined/Shared (App)/Resources/Icon.png", 384];
const largeIcon = ["HNRefined/Shared (App)/Assets.xcassets/LargeIcon.imageset/icon-128.png", 128];
const iosAppIcon = ["universal-icon-1024@1x.png", 1024];

const appIcons = [
  ["mac-icon-16@1x.png", 16],
  ["mac-icon-16@2x.png", 32],
  ["mac-icon-32@1x.png", 32],
  ["mac-icon-32@2x.png", 64],
  ["mac-icon-128@1x.png", 128],
  ["mac-icon-128@2x.png", 256],
  ["mac-icon-256@1x.png", 256],
  ["mac-icon-256@2x.png", 512],
  ["mac-icon-512@1x.png", 512],
  ["mac-icon-512@2x.png", 1024],
];

const extensionIcons = [
  ["icon-16.png", 16],
  ["icon-19.png", 19],
  ["icon-32.png", 32],
  ["icon-38.png", 38],
  ["icon-48.png", 48],
  ["icon-128.png", 128],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function renderPng(source, outputPath, size, backgroundColor) {
  const args = ["-w", String(size), "-h", String(size)];

  if (backgroundColor) {
    args.push("--background-color", backgroundColor);
  }

  args.push(source, "-o", outputPath);
  execFileSync("rsvg-convert", args);
}

function requireRenderer() {
  const result = spawnSync("rsvg-convert", ["--version"], { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(
      "Icon generation requires rsvg-convert. Install librsvg before running build:icons.",
    );
  }
}

ensureDir(appIconDir);
ensureDir(extensionIconDir);
requireRenderer();

renderPng(appIconSource, path.join(appIconDir, iosAppIcon[0]), iosAppIcon[1], "#ff6600");

for (const [filename, size] of appIcons) {
  renderPng(appIconSource, path.join(appIconDir, filename), size);
}

for (const [filename, size] of extensionIcons) {
  renderPng(toolbarIconSource, path.join(extensionIconDir, filename), size);
}

renderPng(appIconSource, hostIcon[0], hostIcon[1]);
renderPng(appIconSource, largeIcon[0], largeIcon[1]);

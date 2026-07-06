import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const appIconSource = "assets/icon/hn-refined-icon.svg";
const toolbarIconSource = "assets/icon/hn-refined-toolbar-icon.svg";
const appIconDir = "HNRefined/HNRefined/Assets.xcassets/AppIcon.appiconset";
const extensionIconDir = "extension/icons";
const hostIcon = ["HNRefined/HNRefined/Resources/Icon.png", 384];

const appIcons = [
  ["AppIcon-16.png", 16],
  ["AppIcon-16@2x.png", 32],
  ["AppIcon-32.png", 32],
  ["AppIcon-32@2x.png", 64],
  ["AppIcon-128.png", 128],
  ["AppIcon-128@2x.png", 256],
  ["AppIcon-256.png", 256],
  ["AppIcon-256@2x.png", 512],
  ["AppIcon-512.png", 512],
  ["AppIcon-512@2x.png", 1024],
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

function renderPng(source, outputPath, size) {
  execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), source, "-o", outputPath]);
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

for (const [filename, size] of appIcons) {
  renderPng(appIconSource, path.join(appIconDir, filename), size);
}

for (const [filename, size] of extensionIcons) {
  renderPng(toolbarIconSource, path.join(extensionIconDir, filename), size);
}

renderPng(appIconSource, hostIcon[0], hostIcon[1]);

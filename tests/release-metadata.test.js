import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

function appStoreSubtitle() {
  const metadata = fs.readFileSync("docs/app-store-metadata.md", "utf8");
  return metadata.match(/## Subtitle\s+`([^`]+)`/)?.[1] ?? "";
}

function plistBoolean(plistPath, key) {
  try {
    return execFileSync("plutil", ["-extract", key, "raw", plistPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

test("App Store subtitle stays within Apple's 30-character limit", () => {
  const subtitle = appStoreSubtitle();

  assert.notEqual(subtitle, "");
  assert.ok([...subtitle].length <= 30, `${subtitle} is longer than 30 characters`);
});

test("containing apps declare that they use no non-exempt encryption", () => {
  for (const plistPath of ["HNRefined/iOS (App)/Info.plist", "HNRefined/macOS (App)/Info.plist"]) {
    assert.equal(plistBoolean(plistPath, "ITSAppUsesNonExemptEncryption"), "false");
  }
});

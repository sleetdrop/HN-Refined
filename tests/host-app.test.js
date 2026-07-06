import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const viewController = fs.readFileSync("HNRefined/HNRefined/ViewController.swift", "utf8");

test("host app renders its install status with native Cocoa controls", () => {
  assert.doesNotMatch(viewController, /\bimport\s+WebKit\b/);
  assert.doesNotMatch(viewController, /\bWKWebView\b/);
  assert.doesNotMatch(viewController, /loadFileURL/);

  assert.match(viewController, /NSStackView/);
  assert.match(viewController, /NSTextField\(labelWithString:/);
  assert.match(viewController, /NSButton\(title:\s*"Open Safari Settings.*"/);
});

test("host app still opens Safari settings for its embedded extension", () => {
  assert.match(viewController, /SFSafariExtensionManager\.getStateOfSafariExtension/);
  assert.match(viewController, /SFSafariApplication\.showPreferencesForExtension/);
  assert.match(viewController, /extensionBundleIdentifier\(\)/);
});

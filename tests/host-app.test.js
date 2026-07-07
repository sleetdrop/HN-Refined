import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const viewController = fs.readFileSync("HNRefined/Shared (App)/ViewController.swift", "utf8");
const hostHtml = fs.readFileSync("HNRefined/Shared (App)/Resources/Base.lproj/Main.html", "utf8");

test("host app is shared across iOS, iPadOS, and macOS", () => {
  assert.match(viewController, /#if os\(iOS\)/);
  assert.match(viewController, /import UIKit/);
  assert.match(viewController, /#elseif os\(macOS\)/);
  assert.match(viewController, /import SafariServices/);
  assert.match(viewController, /\bWKWebView\b/);
  assert.match(viewController, /show\('ios'\)/);
  assert.match(hostHtml, /You can turn on HNRefined.*Safari extension in Settings/);
});

test("host app still opens Safari settings for its embedded extension", () => {
  assert.match(viewController, /SFSafariExtensionManager\.getStateOfSafariExtension/);
  assert.match(viewController, /SFSafariApplication\.showPreferencesForExtension/);
  assert.match(viewController, /extensionBundleIdentifier/);
});

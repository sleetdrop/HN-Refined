import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const viewController = fs.readFileSync("HNRefined/Shared (App)/ViewController.swift", "utf8");
const hostHtml = fs.readFileSync("HNRefined/Shared (App)/Resources/Base.lproj/Main.html", "utf8");
const hostScript = fs.readFileSync("HNRefined/Shared (App)/Resources/Script.js", "utf8");
const hostCss = fs.readFileSync("HNRefined/Shared (App)/Resources/Style.css", "utf8");
const project = fs.readFileSync("HNRefined/HNRefined.xcodeproj/project.pbxproj", "utf8");
const macAppDelegate = fs.readFileSync("HNRefined/macOS (App)/AppDelegate.swift", "utf8");
const macStoryboard = fs.readFileSync("HNRefined/macOS (App)/Base.lproj/Main.storyboard", "utf8");

test("host app uses spaced user-visible product names without renaming build products", () => {
  assert.equal(
    (project.match(/INFOPLIST_KEY_CFBundleDisplayName = "HN Refined";/g) ?? []).length,
    4,
  );
  assert.equal(
    (project.match(/INFOPLIST_KEY_CFBundleDisplayName = "HN Refined Extension";/g) ?? []).length,
    4,
  );
  assert.equal((project.match(/PRODUCT_NAME = "HN Refined";/g) ?? []).length, 4);
  assert.equal((project.match(/EXECUTABLE_NAME = HNRefined;/g) ?? []).length, 4);
  assert.equal((project.match(/PRODUCT_MODULE_NAME = HNRefined;/g) ?? []).length, 4);
  assert.equal((project.match(/WRAPPER_NAME = HNRefined\.app;/g) ?? []).length, 4);
  assert.equal((project.match(/PRODUCT_NAME = "HNRefined Extension";/g) ?? []).length, 4);
  assert.equal(
    (project.match(/PRODUCT_BUNDLE_IDENTIFIER = net\.vetcafe\.hnrefined;/g) ?? []).length,
    4,
  );
  assert.equal(
    (project.match(/PRODUCT_BUNDLE_IDENTIFIER = net\.vetcafe\.hnrefined\.extension;/g) ?? [])
      .length,
    4,
  );

  for (const label of [
    'title="HN Refined"',
    'title="About HN Refined"',
    'title="Hide HN Refined"',
    'title="Quit HN Refined"',
    'title="HN Refined Help"',
  ]) {
    assert.match(macStoryboard, new RegExp(label));
  }
  assert.doesNotMatch(macStoryboard, /title="(?:About |Hide |Quit )?HNRefined/);
});

test("host app is shared across iOS, iPadOS, and macOS", () => {
  assert.match(viewController, /#if os\(iOS\)/);
  assert.match(viewController, /import UIKit/);
  assert.match(viewController, /import SafariServices/);
  assert.match(viewController, /#elseif os\(macOS\)/);
  assert.match(viewController, /\bWKWebView\b/);
  assert.match(viewController, /show\('ios'\)/);
  assert.match(hostHtml, /HN Refined/);
});

test("iPhone and iPad host app explains both Safari extension permissions", () => {
  assert.match(hostHtml, /Settings.*Apps.*Safari.*Extensions.*HN Refined/s);
  assert.match(hostHtml, /Allow Extension/);
  assert.match(hostHtml, /news\.ycombinator\.com/);
  assert.match(hostHtml, />Allow</);
  assert.match(hostHtml, /platform-ios state-unknown/);
  assert.match(hostHtml, /platform-ios state-on/);
  assert.match(hostHtml, /platform-ios state-off/);
});

test("current iOS host reports extension state with an older-system fallback", () => {
  assert.match(viewController, /#available\(iOS 26\.2, \*\)/);
  assert.match(viewController, /SFSafariExtensionManager\.getStateOfExtension/);
  assert.match(viewController, /UIApplication\.didBecomeActiveNotification/);
  assert.match(viewController, /webContentReady/);
  assert.match(viewController, /guard let self, let state, error == nil else \{ return \}/);
  assert.ok(viewController.includes("show('ios', \\(state.isEnabled))"));
  assert.doesNotMatch(viewController, /scrollView\.isScrollEnabled\s*=\s*false/);

  assert.match(hostScript, /function show\(platform, enabled/);
  assert.doesNotMatch(hostScript, /HNRefined/);
});

test("host help stays local and scrollable on small screens", () => {
  assert.match(hostHtml, /Content-Security-Policy" content="default-src 'self'"/);
  assert.doesNotMatch(hostHtml, /https?:\/\//);
  assert.match(hostCss, /body\s*{[^}]*min-height:\s*100%/s);
  assert.match(hostCss, /body\s*{[^}]*padding-block:/s);
  assert.doesNotMatch(hostCss, /overflow:\s*hidden/);
});

test("host app still opens Safari settings for its embedded extension", () => {
  assert.match(viewController, /SFSafariExtensionManager\.getStateOfSafariExtension/);
  assert.match(viewController, /SFSafariApplication\.showPreferencesForExtension/);
  assert.match(viewController, /extensionBundleIdentifier/);
});

test("macOS host sets its runtime icon from the packaged app icon", () => {
  assert.match(macAppDelegate, /path\(forResource: "AppIcon", ofType: "icns"\)/);
  assert.match(macAppDelegate, /NSImage\(contentsOfFile: iconPath\)/);
  assert.match(macAppDelegate, /NSApp\.applicationIconImage = icon/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("handoff docs point new agents at the current project status", () => {
  const agents = read("AGENTS.md");
  const readme = read("README.md");
  const status = read("docs/project-status.md");

  assert.match(agents, /docs\/project-status\.md/);
  assert.match(readme, /docs\/project-status\.md/);
  assert.match(status, /Remaining Work Candidates/);
  assert.match(status, /Historical Planning Docs/);
});

test("workflow docs and CI prefer Makefile entrypoints", () => {
  const ci = read(".github/workflows/ci.yml");
  const readme = read("README.md");
  const safari = read("docs/safari.md");
  const themeContribution = read("docs/theme-contribution.md");

  assert.match(ci, /npm ci/);
  assert.match(ci, /make check/);
  assert.match(readme, /make check/);
  assert.match(safari, /make safari-reinstall/);
  assert.match(themeContribution, /make check/);
});

test("quality docs require agent-friendly format and lint gates", () => {
  const agents = read("AGENTS.md");
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(agents, /make format && make check/);
  assert.match(development, /make format/);
  assert.match(development, /make lint/);
  assert.match(status, /make format/);
  assert.equal(packageJson.scripts.format, "npm run format:biome && npm run format:prettier");
  assert.equal(packageJson.scripts.lint, "npm run lint:biome && npm run lint:prettier");
  assert.match(packageJson.scripts.check, /npm run lint/);
});

test("docs preserve the Safari popup refresh regression guard", () => {
  const agents = read("AGENTS.md");
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");
  const privacy = read("docs/privacy.md");

  for (const doc of [agents, development, status]) {
    assert.match(doc, /current-window\s+Hacker News tabs/);
    assert.match(doc, /areaName/);
  }

  assert.match(privacy, /Hacker News tabs in the current Safari window/);
  assert.doesNotMatch(privacy, /currently open Hacker News tab/);
});

test("development docs preserve the system-native popup contract", () => {
  const development = read("docs/development.md");

  assert.match(development, /native `switch`/);
  assert.match(development, /system accent color/);
  assert.match(development, /44 px/);
  assert.match(development, /macOS, iPhone, and iPad/);
  assert.match(development, /light\s+and dark appearance/);
});

test("development docs preserve the system-native settings surfaces contract", () => {
  const development = read("docs/development.md");

  assert.match(development, /full settings page/i);
  assert.match(development, /continuous setting rows/i);
  assert.match(development, /native `select` controls/i);
  assert.match(development, /native `switch` control/i);
  assert.match(development, /maximum content width of 680 px/i);
  assert.match(development, /minimum 44 px activation height/i);
  assert.match(development, /Select rows stay\s+side\s+by\s+side\s+above\s+360 px/i);
  assert.match(development, /Safari owns the native select focus appearance/i);
  assert.match(development, /Mac.*iPhone.*iPad/s);
});

test("agent docs require continuous docs and harness maintenance", () => {
  const agents = read("AGENTS.md");
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [agents, development, status]) {
    assert.match(doc, /harness/i);
    assert.match(doc, /same change/);
  }

  assert.match(development, /docs-and-harness impact check/);
});

test("public docs disclose Hacker News structure dependency", () => {
  const readme = read("README.md");
  const appStoreChecklist = read("docs/app-store-checklist.md");

  assert.match(readme, /Hacker News HTML\s+structure/);
  assert.match(readme, /GitHub issue/);
  assert.match(readme, /pull request/);
  assert.match(appStoreChecklist, /Hacker News HTML\s+structure/);
});

test("docs keep iOS and iPadOS in first-version release scope", () => {
  const readme = read("README.md");
  const development = read("docs/development.md");
  const safari = read("docs/safari.md");
  const status = read("docs/project-status.md");
  const appStoreChecklist = read("docs/app-store-checklist.md");

  assert.match(status, /First-version release scope includes iOS and iPadOS/);
  assert.match(development, /iOS and iPadOS support is part of the first-version release scope/);
  assert.match(development, /make safari-build-ios/);
  assert.match(safari, /HNRefined \(iOS\)/);
  assert.match(safari, /Allow Extension/);
  assert.match(safari, /news\.ycombinator\.com.*Allow/s);
  assert.match(safari, /default `Ask` state did not show a prompt/);
  assert.match(status, /default `Ask` state did not\s+prompt/);
  assert.match(status, /iPad Air 11-inch/);
  assert.match(status, /logged-in/);
  assert.match(status, /profile\/settings/);
  assert.match(status, /popup and options\s+preference changes/);
  assert.match(safari, /iPad Air 11-inch/);
  assert.match(safari, /logged-in/);
  assert.match(status, /Private Browsing acceptance.*complete/s);
  assert.match(safari, /Allow in Private Browsing/);
  assert.match(safari, /iPhone 17 Pro.*iPad Air 11-inch.*macOS/s);
  assert.match(readme, /Allow in Private Browsing/);
  assert.match(readme, /Enabling on iPhone and iPad/);
  assert.match(readme, /Allow Extension/);
  assert.match(readme, /news\.ycombinator\.com` is set to `Allow/);
  assert.match(readme, /Home Screen web apps are not a supported iOS or iPadOS surface/);
  assert.match(status, /Home Screen web apps.*outside the supported iOS\/iPadOS scope/s);
  assert.match(safari, /does not support iOS or iPadOS Home Screen web apps/);
  assert.match(
    appStoreChecklist,
    /disclose that iOS\/iPadOS Home Screen web apps are\s+unsupported/,
  );
  assert.match(appStoreChecklist, /iOS\/iPadOS support is required for the first release/);
  assert.match(appStoreChecklist, /Include iPhone and iPad enablement text/);
  assert.match(appStoreChecklist, /do\s+not assume Safari will prompt/);
  assert.doesNotMatch(readme, /PWA-like/);
  assert.doesNotMatch(status, /standalone\/PWA-like/);
});

test("docs keep static information pages outside the styling target", () => {
  const readme = read("README.md");
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [readme, development, status]) {
    assert.match(doc, /static information pages/);
    assert.match(doc, /outside the\s+first-version styling target/);
  }

  assert.match(development, /Do not add special selectors/);
  assert.match(status, /Do not add\s+compatibility code/);
});

test("docs preserve automatic WebKit accessibility enhancements", () => {
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [development, status]) {
    assert.match(doc, /prefers-contrast: more/);
    assert.match(doc, /:focus-visible/);
    assert.match(doc, /CSS-only/);
  }

  assert.match(development, /System,\s+Light,\s+and Dark/);
  assert.match(development, /fragment navigation.*owned by Hacker News/is);
});

test("docs preserve complete Hacker News font preset coverage", () => {
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [development, status]) {
    assert.match(doc, /--hnr-font-family/);
    assert.match(doc, /navigation.*title.*metadata.*footer.*comment/is);
    assert.match(doc, /form editing\s+fonts/i);
  }
});

test("docs preserve the Apple-native retro mono stack", () => {
  for (const relativePath of ["docs/development.md", "docs/project-status.md"]) {
    const doc = read(relativePath);
    assert.match(doc, /Menlo/);
    assert.match(doc, /Monaco/);
    assert.match(doc, /ui-monospace/);
  }
});

test("docs preserve the mobile footer search layout", () => {
  for (const relativePath of ["docs/development.md", "docs/project-status.md"]) {
    const doc = read(relativePath);
    assert.match(doc, /Algolia/);
    assert.match(doc, /two-line/);
    assert.match(doc, /12 px/);
  }
});

test("docs preserve host app onboarding and progressive status behavior", () => {
  for (const relativePath of [
    "docs/development.md",
    "docs/project-status.md",
    "docs/release-readiness.md",
  ]) {
    const doc = read(relativePath);
    assert.match(doc, /HN Refined/);
    assert.match(doc, /Settings.*Apps.*Safari.*Extensions.*HN Refined/s);
    assert.match(doc, /iOS 26\.2/);
    assert.match(doc, /SFSafariExtensionManager/);
    assert.match(doc, /news\.ycombinator\.com/);
    assert.match(doc, /website permission|site permission/i);
  }
});

test("docs preserve the macOS runtime icon regression guard", () => {
  for (const relativePath of ["docs/development.md", "docs/project-status.md"]) {
    const doc = read(relativePath);
    assert.match(doc, /AppIcon\.icns/);
    assert.match(doc, /Dock/);
    assert.match(doc, /runtime icon/i);
  }
});

test("docs preserve the first-release preference surface", () => {
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");

  for (const doc of [development, status]) {
    assert.match(doc, /HN Classic.*default/is);
    assert.match(doc, /Mono-ish/);
    assert.match(doc, /mobile layout.*automatic/is);
    assert.match(doc, /legacy.*mobileLayout/is);
  }
});

test("docs preserve thread-focus ancestry behavior and the pre-release alignment pause", () => {
  const development = read("docs/development.md");
  const status = read("docs/project-status.md");
  const privacy = read("docs/privacy.md");
  const appStoreChecklist = read("docs/app-store-checklist.md");
  const releaseReadiness = read("docs/release-readiness.md");

  for (const doc of [development, status]) {
    assert.match(doc, /Thread Focus.*default.*(?:on|enabled)/is);
    assert.match(doc, /every.*comment.*repl(?:y|ies).*focus/is);
    assert.match(doc, /five.*authors.*complete/is);
    assert.match(doc, /first.*ellipsis.*final three/is);
    assert.match(doc, /ellipsis.*expand.*without.*History/is);
    assert.match(doc, /ancestor.*link.*zoom|zoom.*ancestor.*link/is);
    assert.match(doc, /all.*first.*line|first.*line.*all/is);
    assert.match(doc, /ancestor.*muted|muted.*ancestor/is);
    assert.match(doc, /final.*parent.*current.*(?:pair|together|wrapping)/is);
    assert.match(doc, /nearest common.*ancestor/is);
    assert.match(doc, /original.*(?:root|parent|prev|next).*target.*unchanged/is);
    assert.match(doc, /off.*indentation.*remain/is);
    assert.match(doc, /scroll(?:ing)?.*never.*focus/is);
    assert.match(doc, /coarse pointer.*700 px|700 px.*coarse pointer/is);
    assert.match(doc, /rotat.*(?:must not|no longer|cannot|keeps?).*exit.*Focus/is);
    assert.match(doc, /vanilla JavaScript/i);
    assert.match(doc, /Safari\/WebKit/i);
    assert.match(doc, /collapse.*scope.*separate/is);
    assert.match(doc, /next\s*\|\s*focus\s*\[–\]/i);
    assert.match(doc, /site header.*hidden.*focus guide.*top boundary/is);
    assert.match(doc, /story.*reply form.*footer.*hidden/is);
    assert.match(doc, /fail(?:s|-closed).*HN.*structure/is);
    assert.match(doc, /Back.*previous.*view.*Forward/is);
    assert.match(doc, /all.*entire.*Focus/is);
    assert.match(doc, /root.*(?:depth zero|zero indent|rebases? to zero)/is);
  }

  assert.match(privacy, /Thread Focus preference/i);
  assert.match(privacy, /focus state.*page-local.*ephemeral/is);
  assert.match(appStoreChecklist, /Thread Focus/i);
  assert.match(appStoreChecklist, /compact.*author.*ancestry.*expand/is);
  assert.match(appStoreChecklist, /all.*first.*line/is);
  assert.match(appStoreChecklist, /final.*parent.*current.*pair/is);
  assert.match(appStoreChecklist, /site header.*hidden.*guide.*top boundary/is);
  assert.match(releaseReadiness, /release preparation.*paused/is);
  assert.match(releaseReadiness, /physical.*iPhone.*confirmed/is);
  assert.match(releaseReadiness, /multi-day.*burn-in/is);
  assert.match(releaseReadiness, /Hacker News.*color semantics/is);
});

test("release docs keep App Store and open-source blockers explicit", () => {
  const readme = read("README.md");
  const contributing = read("CONTRIBUTING.md");
  const security = read("SECURITY.md");
  const readiness = read("docs/release-readiness.md");
  const metadata = read("docs/app-store-metadata.md");

  assert.match(readme, /MIT License/);
  assert.match(contributing, /make format && make check/);
  assert.match(contributing, /canonical WebExtension source/);
  assert.match(security, /Do not open a public issue/);
  assert.match(readiness, /License\s+\| Ready/);
  assert.match(readiness, /Privacy policy URL\s+\| Ready/);
  assert.match(readiness, /Version alignment\s+\| Ready/);
  assert.match(metadata, /No, this app does not collect data/);
  assert.match(metadata, /Home Screen web apps are not supported/);
  assert.match(read("LICENSE"), /Copyright \(c\) 2026 HN Refined contributors/);
  assert.match(metadata, /github\.com\/sleetdrop\/HN-Refined\/issues/);
  assert.match(security, /sleetdrop@gmail\.com/);
});

test("first release version surfaces stay aligned", () => {
  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  const manifest = JSON.parse(read("extension/manifest.json"));
  const xcodeProject = read("HNRefined/HNRefined.xcodeproj/project.pbxproj");
  const marketingVersions = [...xcodeProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)];
  const buildVersions = [...xcodeProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)];

  assert.equal(packageJson.version, "1.0.0");
  assert.equal(packageLock.version, "1.0.0");
  assert.equal(packageLock.packages[""].version, "1.0.0");
  assert.equal(manifest.version, "1.0.0");
  assert.ok(marketingVersions.length > 0);
  assert.ok(marketingVersions.every((match) => match[1] === "1.0"));
  assert.ok(buildVersions.length > 0);
  assert.ok(buildVersions.every((match) => match[1] === "1"));
});

test("macOS release metadata declares the Utilities App Store category", () => {
  const xcodeProject = read("HNRefined/HNRefined.xcodeproj/project.pbxproj");
  const categories = xcodeProject.match(
    /INFOPLIST_KEY_LSApplicationCategoryType = "public\.app-category\.utilities";/g,
  );

  assert.equal(categories?.length, 2);
});

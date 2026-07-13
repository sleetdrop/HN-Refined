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
  assert.match(safari, /does not guarantee iOS or iPadOS Home Screen web apps/);
  assert.match(
    appStoreChecklist,
    /disclose that iOS\/iPadOS Home Screen web apps are\s+unsupported/,
  );
  assert.match(appStoreChecklist, /iOS\/iPadOS support is required for the first release/);
  assert.match(appStoreChecklist, /Include iPhone and iPad enablement text/);
  assert.match(appStoreChecklist, /do\s+not assume Safari will prompt/);
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
  assert.match(readiness, /Version alignment\s+\| Pending/);
  assert.match(metadata, /No, this app does not collect data/);
  assert.match(metadata, /Home Screen web apps are not supported/);
  assert.match(read("LICENSE"), /Copyright \(c\) 2026 HN Refined contributors/);
  assert.match(metadata, /github\.com\/sleetdrop\/HN-Refined\/issues/);
  assert.match(security, /sleetdrop@gmail\.com/);
});

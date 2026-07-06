import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

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

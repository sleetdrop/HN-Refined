import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const makefile = fs.readFileSync("Makefile", "utf8");
const developmentDoc = fs.readFileSync("docs/development.md", "utf8");

test("Makefile exposes stable top-level development targets", () => {
  for (const target of [
    "help",
    "check",
    "test",
    "build-themes",
    "build-icons",
    "safari-build",
    "safari-install",
    "safari-reinstall",
    "safari-status",
    "safari-doctor",
    "safari-unregister",
    "safari-open",
  ]) {
    assert.match(makefile, new RegExp(`^${target}:`, "m"));
  }
});

test("Makefile wraps lower-level npm scripts instead of duplicating toolchain commands", () => {
  assert.match(makefile, /\n\tnpm run check/);
  assert.match(makefile, /\n\tnpm run safari:reinstall/);
  assert.doesNotMatch(makefile, /xcodebuild/);
  assert.doesNotMatch(makefile, /pluginkit/);
  assert.doesNotMatch(makefile, /codesign/);
});

test("development docs direct humans and agents to Makefile targets", () => {
  assert.match(developmentDoc, /Use the `Makefile` targets as the stable development interface/);
  assert.match(developmentDoc, /make check/);
  assert.match(developmentDoc, /make safari-reinstall/);
  assert.doesNotMatch(developmentDoc, /npm run safari:reinstall/);
});

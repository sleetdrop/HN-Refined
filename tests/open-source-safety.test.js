import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);

test("tracked files exclude local build and IDE state", () => {
  for (const file of trackedFiles) {
    assert.doesNotMatch(
      file,
      /(^|\/)(\.DS_Store|xcuserdata|DerivedData|\.build|build|node_modules)(\/|$)/,
    );
  }
});

test("tracked text does not contain developer-machine absolute paths", () => {
  for (const file of trackedFiles) {
    const contents = readFileSync(file);
    if (contents.includes(0)) {
      continue;
    }

    assert.doesNotMatch(contents.toString("utf8"), /\/Users\/[^/\s]+\//, file);
  }
});

test("Xcode project does not commit a personal development team", () => {
  const project = readFileSync("HNRefined/HNRefined.xcodeproj/project.pbxproj", "utf8");
  assert.doesNotMatch(project, /DEVELOPMENT_TEAM\s*=/);
  assert.doesNotMatch(project, /PROVISIONING_PROFILE_SPECIFIER\s*=/);
});

test("Xcode targets use an ignored optional local signing configuration", () => {
  const localConfig = "HNRefined/Config/Signing.local.xcconfig";
  const project = readFileSync("HNRefined/HNRefined.xcodeproj/project.pbxproj", "utf8");
  const signingConfig = readFileSync("HNRefined/Config/Signing.xcconfig", "utf8");

  assert.match(signingConfig, /#include\?\s+"Signing\.local\.xcconfig"/);
  assert.doesNotThrow(() =>
    execFileSync("git", ["check-ignore", "-q", localConfig], { stdio: "ignore" }),
  );
  assert.equal(
    (project.match(/baseConfigurationReference = [^;]+ \/\* Signing\.xcconfig \*\//g) ?? []).length,
    8,
  );
  assert.equal(trackedFiles.includes(localConfig), false);
});

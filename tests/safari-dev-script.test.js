import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync("scripts/safari-dev.sh", "utf8");
const developmentDoc = fs.readFileSync("docs/development.md", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const gitignore = fs.readFileSync(".gitignore", "utf8");

test("Safari development workflow uses stable local paths", () => {
  assert.match(script, /\.build\/xcode-derived-data/);
  assert.match(script, /\$HOME\/Applications\/HNRefined\.app/);
  assert.match(script, /detect_signing_identity/);
  assert.match(script, /detect_development_team/);
  assert.match(script, /DEVELOPMENT_TEAM=\$team/);
  assert.match(script, /CODE_SIGN_IDENTITY=Apple Development/);
  assert.match(script, /verify_installed_app_signature/);
  assert.doesNotMatch(script, /codesign --force --deep --sign/);
  assert.match(script, /codesign --verify --deep --strict/);
  assert.match(script, /pluginkit -r/);
  assert.match(script, /pluginkit -a "\$INSTALL_APP_PATH"/);
  assert.match(script, /icons\/icon-16\.png/);
  assert.match(script, /icons\/icon-128\.png/);
  assert.match(script, /pgrep -fl HNRefined/);
  assert.match(script, /-quiet/);
  assert.match(script, /open -a Safari https:\/\/news\.ycombinator\.com\/news/);
  assert.match(script, /HNREFINED_KEEP_HOST_APP/);
  assert.doesNotMatch(script, /\/tmp\/HNRefined/);
});

test("Safari development workflow avoids automatic Safari restarts", () => {
  assert.doesNotMatch(script, /tell application "Safari" to quit/);
  assert.doesNotMatch(script, /killall Safari/);
});

test("npm exposes the Safari development workflow", () => {
  assert.equal(packageJson.scripts["safari:reinstall"], "bash scripts/safari-dev.sh reinstall");
  assert.equal(packageJson.scripts["safari:status"], "bash scripts/safari-dev.sh status");
  assert.equal(packageJson.scripts["safari:doctor"], "bash scripts/safari-dev.sh doctor");
  assert.equal(packageJson.scripts["safari:open"], "bash scripts/safari-dev.sh open-safari");
});

test("development docs call out signing and unsigned extension caveat", () => {
  assert.match(developmentDoc, /make safari-reinstall/);
  assert.match(developmentDoc, /HNREFINED_SIGNING_IDENTITY="Apple Development:/);
  assert.match(developmentDoc, /0 valid identities found/);
  assert.match(developmentDoc, /Do not register builds from `\/tmp`/);
});

test("local build products are ignored", () => {
  assert.match(gitignore, /^\.build\/$/m);
  assert.match(gitignore, /^build\/$/m);
});

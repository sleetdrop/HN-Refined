import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("content CSS overrides Hacker News title link colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:link/);
  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:visited/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitebit/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitestr/);
});

test("content CSS overrides Hacker News footer link colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.yclinks\s+a:link/);
  assert.match(css, /#hnmain\s+\.yclinks\s+a:visited/);
});

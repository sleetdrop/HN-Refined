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

test("mobile CSS raises reading size and touch targets", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.titleline\s*{[^}]*font-size:\s*16px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.subtext,[\s\S]*?font-size:\s*13px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.comment,[\s\S]*?font-size:\s*14px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.titleline\s+a,[\s\S]*?min-height:\s*32px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.pagetop\s*{[^}]*font-size:\s*14px/s);
});

test("mobile CSS keeps Hacker News dense while improving reading rhythm", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*display:\s*block/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*font-size:\s*12px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.subtext\s+a,[\s\S]*?padding-block:\s*4px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.commtext\s*{[^}]*line-height:\s*1\.6/s);
});

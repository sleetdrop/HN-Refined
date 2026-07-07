import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("content CSS overrides Hacker News title link colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:link/);
  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:visited/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitebit/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitestr/);
});

test("content CSS keeps top navigation links on the active header color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.pagetop\s+a:link/);
  assert.match(css, /#hnmain\s+\.pagetop\s+a:visited/);
});

test("content CSS overrides Hacker News footer link colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.yclinks\s+a:link/);
  assert.match(css, /#hnmain\s+\.yclinks\s+a:visited/);
});

test("desktop comfortable CSS refines story and comment reading rhythm", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.titleline\s*{[^}]*font-size:\s*15\.5px/s,
  );
  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.titleline\s*{[^}]*line-height:\s*1\.42/s,
  );
  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.subtext\s*{[^}]*padding-top:\s*2px/s,
  );
  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.comment\s*{[^}]*font-size:\s*14px/s,
  );
  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.comment\s*{[^}]*max-width:\s*72ch/s,
  );
  assert.match(
    css,
    /html\[data-hnr-density="comfortable"\]\s+\.commtext\s*{[^}]*line-height:\s*1\.58/s,
  );
});

test("mobile CSS raises reading size and touch targets", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.titleline\s*{[^}]*font-size:\s*16px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.subtext,[\s\S]*?font-size:\s*13px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.comment,[\s\S]*?font-size:\s*14px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.titleline\s+a,[\s\S]*?min-height:\s*32px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.pagetop\s*{[^}]*font-size:\s*14px/s);
  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+body\s*{[^}]*padding-bottom:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/s,
  );
  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+#hnmain\s*{[^}]*margin-bottom:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/s,
  );
});

test("mobile CSS keeps Hacker News dense while improving reading rhythm", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*display:\s*block/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*font-size:\s*12px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.subtext\s+a,[\s\S]*?padding-block:\s*4px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.commtext\s*{[^}]*line-height:\s*1\.6/s);
});

test("content CSS covers comment page reading and reply affordances", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /\.comtr\s+\.default/);
  assert.match(css, /\.commtext\.c00/);
  assert.match(css, /\.commtext\.c5a/);
  assert.match(css, /\.commtext\s+p/);
  assert.match(css, /\.commtext\s+a:link/);
  assert.match(css, /\.default\s+\.comhead\s+a:link/);
  assert.match(css, /\.reply\s+a:link/);
  assert.match(css, /html\[data-hnr-density="comfortable"\]\s+\.comtr\s*{[^}]*height:\s*auto/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.reply\s+a/);
});

test("content CSS covers forms without special-casing static Hacker News pages", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /input\[type="text"\]/);
  assert.match(css, /input\[type="url"\]/);
  assert.match(css, /input\[type="search"\]/);
  assert.match(css, /input\[type="submit"\]/);
  assert.match(css, /select/);
  assert.match(css, /textarea/);
  assert.match(css, /#hnmain\s+td\s+a:link/);
  assert.match(css, /\.default\s+a:link/);
  assert.match(css, /\.admin\s+a:link/);
  assert.match(css, /\.pagetop\s+a:visited/);
  assert.doesNotMatch(css, /body\s*>\s*center\s*>\s*table/);
  assert.doesNotMatch(css, /\[bgcolor="#ffffff"/);
  assert.doesNotMatch(css, /\[bgcolor="#f6f6ef"/);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+textarea/);
  assert.match(css, /width:\s*min\(100%,\s*22rem\)/);
  assert.match(css, /body:not\(:has\(#hnmain\)\):has\(form\)/);
  assert.match(css, /max-width:\s*calc\(100vw - 32px\)/);
});

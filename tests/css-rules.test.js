import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function hexChannels(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function mixChannels(foreground, background, foregroundWeight) {
  return foreground.map((channel, index) =>
    Math.round(channel * foregroundWeight + background[index] * (1 - foregroundWeight)),
  );
}

function relativeLuminance(channels) {
  const linear = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function readTheme(path) {
  return JSON.parse(fs.readFileSync(path, "utf8")).tokens;
}

function contrastMixWeight(css, cssToken) {
  const match = css.match(
    new RegExp(
      `--hnr-${cssToken}:\\s*color-mix\\(\\s*in srgb,\\s*var\\(--hnr-text-primary\\)\\s+(\\d+)%,\\s*var\\(--hnr-content-background\\)\\s*\\)`,
    ),
  );

  assert.ok(match, `missing increased-contrast mix for ${cssToken}`);
  return Number(match[1]) / 100;
}

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

test("story submission text uses the primary reading color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.toptext\s*{[^}]*color:\s*var\(--hnr-text-primary,\s*#000\)/s);
  assert.doesNotMatch(css, /\.toptext[^}]*color:\s*var\(--hnr-text-muted/s);
});

test("font presets override Hacker News reading and metadata fonts", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  for (const preset of ["system-sans", "hn-classic", "serif-reading", "mono-ish"]) {
    assert.match(
      css,
      new RegExp(`html\\[data-hnr-font="${preset}"\\]\\s*\\{[^}]*--hnr-font-family:`, "s"),
    );
  }

  const presetSelectors = [
    "body",
    "td",
    ".default",
    ".admin",
    ".title",
    ".subtext",
    ".yclinks",
    ".pagetop",
    ".comhead",
    ".comment",
  ];
  const selectorList = presetSelectors
    .map((selector) => `html\\[data-hnr-font\\]\\s+${selector.replace(".", "\\.")}`)
    .join(",\\s*");

  assert.match(
    css,
    new RegExp(`${selectorList}\\s*\\{[^}]*font-family:\\s*var\\(--hnr-font-family\\)`, "s"),
  );
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

test("mobile item pages wrap story text and preserve a right gutter", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileMediaIndex = css.indexOf("@media (max-width: 700px)");
  const desktopCss = css.slice(0, mobileMediaIndex);
  const mobileCss = css.slice(mobileMediaIndex);

  assert.notEqual(mobileMediaIndex, -1);
  assert.doesNotMatch(desktopCss, /\.toptext\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(mobileCss, /#hnmain\s+\.toptext\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(
    mobileCss,
    /#bigbox\s*>\s*td\s*{[^}]*box-sizing:\s*border-box[^}]*padding-inline-end:\s*12px/s,
  );
  assert.doesNotMatch(css, /overflow-x:\s*hidden|table-layout:\s*fixed/);
});

test("mobile comment editors keep symmetric gutters and restrained size controls", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const touchMediaIndex = css.indexOf("@media (max-width: 700px) and (any-pointer: coarse)");
  const desktopCss = css.slice(0, touchMediaIndex);
  const mobileCss = css.slice(touchMediaIndex);

  assert.notEqual(touchMediaIndex, -1);
  assert.match(desktopCss, /\.hnr-comment-editor-controls\s*{[^}]*display:\s*none/s);
  assert.doesNotMatch(desktopCss, /\.hnr-comment-editor-controls\s*{[^}]*display:\s*flex/s);
  assert.match(
    mobileCss,
    /#hnmain\s+form\[action="comment"\]\s+textarea\[name="text"\]\s*{[^}]*width:\s*calc\(100% - 28px\)[^}]*max-width:\s*calc\(100% - 28px\)/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-editor-controls\s*{[^}]*display:\s*flex[^}]*float:\s*right[^}]*margin-right:\s*28px/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-editor-size-button\s*{[^}]*min-width:\s*32px[^}]*min-height:\s*32px[^}]*border:\s*0[^}]*background:\s*transparent/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-editor-size-button::before\s*{[^}]*content:\s*""[^}]*width:\s*0[^}]*height:\s*0/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-editor-size-button--decrease::before\s*{[^}]*border-bottom:\s*5px solid currentColor/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-editor-size-button--increase::before\s*{[^}]*border-top:\s*5px solid currentColor/s,
  );
  assert.match(mobileCss, /\.hnr-comment-editor-size-button:disabled/);
  assert.doesNotMatch(mobileCss, /transition:/);
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

test("top-level interactive forms keep page spacing beyond the phone breakpoint", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const phoneMediaIndex = css.indexOf("@media (max-width: 700px)");
  const topLevelFormIndex = css.indexOf(
    'html[data-hnr-mobile="auto"] body:not(:has(#hnmain)):has(form)',
  );

  assert.ok(phoneMediaIndex >= 0);
  assert.ok(topLevelFormIndex >= 0);
  assert.ok(topLevelFormIndex < phoneMediaIndex);
  assert.match(css.slice(topLevelFormIndex, phoneMediaIndex), /padding:\s*16px/);
  assert.doesNotMatch(css, /display-mode:\s*standalone/);
});

test("system increased contrast strengthens secondary theme colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const contrastMediaIndex = css.indexOf("@media (prefers-contrast: more)");
  const contrastMedia = css.slice(contrastMediaIndex);
  const tokenPairs = [
    ["text-muted", "textMuted"],
    ["visited-link", "visitedLink"],
    ["border-subtle", "borderSubtle"],
    ["vote-arrow", "voteArrow"],
  ];

  assert.ok(contrastMediaIndex >= 0);

  for (const themePath of ["extension/themes/hn-light.json", "extension/themes/hn-dark.json"]) {
    const tokens = readTheme(themePath);
    const primary = hexChannels(tokens.textPrimary);
    const background = hexChannels(tokens.contentBackground);

    for (const [cssToken, themeToken] of tokenPairs) {
      const original = hexChannels(tokens[themeToken]);
      const mixed = mixChannels(primary, background, contrastMixWeight(contrastMedia, cssToken));
      assert.ok(
        contrastRatio(mixed, background) > contrastRatio(original, background),
        `${themePath} ${themeToken} contrast should increase`,
      );
    }
  }
});

test("content CSS exposes keyboard focus without pointer-only focus styling", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /:where\(a\[href\], button, input, select, textarea\):focus-visible\s*{[^}]*outline:\s*2px solid Highlight[^}]*outline-offset:\s*2px/s,
  );
  assert.doesNotMatch(
    css,
    /:where\(a\[href\], button, input, select, textarea\):focus(?!-visible)/,
  );
});

test("content CSS leaves Hacker News fragment-target visuals unchanged", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.doesNotMatch(css, /\.comtr:target|\.togg:target|:has\(:target\)/);
});

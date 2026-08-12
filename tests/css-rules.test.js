import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function hexChannels(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
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

test("content CSS overrides Hacker News title link colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:link/);
  assert.match(css, /#hnmain\s+\.titleline\s*>\s*a:visited/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitebit/);
  assert.match(css, /#hnmain\s+\.titleline\s+\.sitestr/);
});

test("content CSS translates HN's unclassed application links without flattening comment fades", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+a:link\s*{[^}]*color:\s*var\(--hnr-link-primary,\s*#000\)/s);
  assert.match(css, /#hnmain\s+a:visited\s*{[^}]*color:\s*var\(--hnr-link-visited,\s*#828282\)/s);
  assert.match(css, /#hnmain\s+\.subtext\s+a:link/);
  assert.match(css, /#hnmain\s+\.comhead\s+a:visited/);
  assert.match(css, /#hnmain\s+\.commtext\.c5a\s+a:link/);
  assert.doesNotMatch(css, /#hnmain\s+td\s*{[^}]*color:/s);
  assert.doesNotMatch(css, /(?:font\[color\]|\[style\*=[^\]]*color)/);
});

test("logged-out password recovery links use the extension's primary link color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /body:not\(:has\(#hnmain\)\):has\(form\)\s+a\[href\^="forgot"\]:link\s*{[^}]*color:\s*var\(--hnr-link-primary,\s*#000\)/s,
  );
  assert.match(
    css,
    /body:not\(:has\(#hnmain\)\):has\(form\)\s+a\[href\^="forgot"\]:visited\s*{[^}]*color:\s*var\(--hnr-link-visited,\s*#828282\)/s,
  );
});

test("content CSS keeps top navigation links on the active header color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /td\[bgcolor="#ff6600" i\]\s+\.pagetop\s+a:link,[\s\S]*td\[bgcolor="#ff6600" i\]\s+\.pagetop\s+a:visited\s*{[^}]*color:\s*var\(--hnr-top-bar-link/s,
  );
  assert.match(
    css,
    /td\[bgcolor="#ff6600" i\]\s+\.topsel\s+a:link,[\s\S]*td\[bgcolor="#ff6600" i\]\s+\.topsel\s+a:visited\s*{[^}]*color:\s*var\(--hnr-top-bar-selected/s,
  );
});

test("story submission text uses the primary reading color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /#hnmain\s+\.toptext\s*{[^}]*color:\s*var\(--hnr-text-primary,\s*#000\)/s);
  assert.doesNotMatch(css, /\.toptext[^}]*color:\s*var\(--hnr-text-secondary/s);
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

  assert.match(
    css,
    /html\[data-hnr-font="mono-ish"\]\s*{[^}]*--hnr-font-family:\s*Menlo, Monaco, ui-monospace, monospace/s,
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

test("mobile CSS preserves touch targets and bottom breathing room", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.titleline\s+a,[\s\S]*?min-height:\s*32px/s);
  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+body\s*{[^}]*padding-bottom:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/s,
  );
  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+#hnmain\s*{[^}]*margin-bottom:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/s,
  );
});

test("mobile typography scales every Hacker News text role by the same ratio", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));

  assert.match(
    mobileCss,
    /html\[data-hnr-mobile="auto"\]\s+body,\s*html\[data-hnr-mobile="auto"\]\s+td,\s*html\[data-hnr-mobile="auto"\]\s+\.title,\s*html\[data-hnr-mobile="auto"\]\s+\.titleline,\s*html\[data-hnr-mobile="auto"\]\s+\.pagetop\s*{[^}]*font-size:\s*12pt/s,
  );
  assert.match(
    mobileCss,
    /html\[data-hnr-mobile="auto"\]\s+\.admin,\s*html\[data-hnr-mobile="auto"\]\s+\.admin\s+td\s*{[^}]*font-size:\s*10\.2pt/s,
  );
  assert.match(
    mobileCss,
    /html\[data-hnr-mobile="auto"\]\s+\.subtext\s*{[^}]*font-size:\s*8\.4pt/s,
  );
  assert.match(
    mobileCss,
    /html\[data-hnr-mobile="auto"\]\s+\.yclinks,\s*html\[data-hnr-mobile="auto"\]\s+\.comhead\s*{[^}]*font-size:\s*9\.6pt/s,
  );
  assert.match(
    mobileCss,
    /html\[data-hnr-mobile="auto"\]\s+\.default,\s*html\[data-hnr-mobile="auto"\]\s+\.comment,\s*html\[data-hnr-mobile="auto"\]\s+\.commtext\s*{[^}]*font-size:\s*10\.8pt/s,
  );
});

test("mobile CSS keeps Hacker News dense while improving reading rhythm", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*display:\s*block/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.sitebit\s*{[^}]*font-size:\s*9\.6pt/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.subtext\s+a,[\s\S]*?padding-block:\s*4px/s);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+\.commtext\s*{[^}]*line-height:\s*1\.6/s);
});

test("mobile comment metadata lets long new-comments story links wrap", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));
  const inlineBlockSelectorLists = [
    ...mobileCss.matchAll(/([^{}]+)\{[^{}]*display:\s*inline-block/g),
  ].map(([, selectors]) => selectors);

  assert.ok(
    inlineBlockSelectorLists.every((selectors) => !selectors.includes(".comhead a")),
    "long story-title links inside .comhead must stay inline so they cannot widen HN's table layout",
  );
});

test("mobile comments preserve progressively compressed indentation through deep threads", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));

  assert.match(
    mobileCss,
    /\.comment-tree\s+\.comtr\s+\.ind img\[width\]\s*{[^}]*width:\s*var\(--hnr-comment-base-indent\)/s,
  );
  assert.doesNotMatch(mobileCss, /\.ind img\[width="\d+"\]/);
  assert.doesNotMatch(mobileCss, /\.ind img\s*\{[^}]*max-width:\s*32px/s);
});

test("deep-thread scope uses a separate restrained mobile presentation layer", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));
  const focusMediaIndex = css.indexOf("@media (any-pointer: coarse)");
  const baseRule = mobileCss.match(
    /\.comment-tree\s+\.comtr\s+\.ind img\[width\]\s*{[^}]*width:\s*var\(--hnr-comment-base-indent\)/s,
  );
  const focusRule = mobileCss.match(
    /\.comment-tree\s+\.comtr\[data-hnr-scope-row\]\s+\.ind\s+img\[width\]\s*{[^}]*width:\s*var\(--hnr-comment-indent\)/s,
  );

  assert.ok(baseRule);
  assert.ok(focusRule);
  assert.ok(focusRule.index > baseRule.index);
  assert.notEqual(focusMediaIndex, -1);
  assert.ok(
    css.indexOf(".hnr-comment-scope-guide:not([hidden])", focusMediaIndex) > focusMediaIndex,
  );
  assert.match(mobileCss, /\.comtr\[data-hnr-focus-excluded\]\s*{[^}]*display:\s*none/s);
  assert.match(mobileCss, /\[data-hnr-focus-page-excluded\]\s*{[^}]*display:\s*none/s);
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-guide:not\(\[hidden\]\)\s*{[^}]*position:\s*sticky[^}]*top:\s*env\(safe-area-inset-top\)[^}]*background:\s*var\(--hnr-content-background/s,
  );
  assert.match(mobileCss, /\.hnr-comment-scope-guide\s+a\s*{[^}]*color:\s*inherit/s);
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-guide:not\(\[hidden\]\)\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*48px minmax\(0, 1fr\)[^}]*align-items:\s*baseline[^}]*white-space:\s*normal/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-path\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap[^}]*min-height:\s*44px[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-step\s*{[^}]*display:\s*inline-flex[^}]*flex:\s*0 0 auto[^}]*max-width:\s*100%/s,
  );
  assert.match(mobileCss, /\.hnr-comment-scope-prefix\s*{[^}]*padding-inline-end:\s*0\.35em/s);
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-nearest\s*{[^}]*display:\s*inline-flex[^}]*flex:\s*0 0 auto/s,
  );
  assert.match(mobileCss, /\.hnr-comment-scope-separator\s*{[^}]*padding-inline:\s*0\.35em/s);
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-ellipsis\s*{[^}]*appearance:\s*none[^}]*border:\s*0[^}]*background:\s*transparent/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-step-current\s*{[^}]*color:\s*var\(--hnr-text-primary/s,
  );
  assert.match(
    mobileCss,
    /#hnmain\s+\.hnr-comment-scope-ancestor:link,[\s\S]*#hnmain\s+\.hnr-comment-scope-ancestor:visited\s*{[^}]*color:\s*var\(--hnr-text-secondary/s,
  );
  assert.doesNotMatch(mobileCss, /\.hnr-comment-scope-path-(?:prior|current)/);
  assert.doesNotMatch(mobileCss, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(mobileCss, /max-width:\s*50%/);
  assert.match(mobileCss, /scroll-margin-top:\s*calc\(40px \+ env\(safe-area-inset-top\)\)/);
  assert.doesNotMatch(
    mobileCss,
    /\.hnr-comment-scope-guide[^}]*?(?:border-radius|box-shadow|transition):/s,
  );
});

test("focus guide uses the explicit divider from each active HN theme", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const themesCss = fs.readFileSync("extension/generated/themes.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));

  assert.match(
    themesCss,
    /html\[data-hnr-theme="light"\],[^{]*html\[data-hnr-theme="system"\]\s*{[^}]*--hnr-focus-divider:\s*#faba8b/s,
  );
  assert.match(themesCss, /html\[data-hnr-theme="dark"\]\s*{[^}]*--hnr-focus-divider:\s*#63351a/s);
  assert.match(
    themesCss,
    /prefers-color-scheme:\s*dark[\s\S]*html\[data-hnr-theme="system"\]\s*{[^}]*--hnr-focus-divider:\s*#63351a/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-exit\s*{[^}]*min-width:\s*48px[^}]*min-height:\s*44px/s,
  );
  assert.match(
    mobileCss,
    /\.hnr-comment-scope-guide:not\(\[hidden\]\)\s*{[^}]*border-bottom:\s*1px solid var\(--hnr-focus-divider\)/s,
  );
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

test("mobile footer search preserves Hacker News' centered two-line layout", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px)"));

  assert.match(
    mobileCss,
    /#hnmain\s+form\[action\$="hn\.algolia\.com\/"\]\s*{[^}]*box-sizing:\s*border-box[^}]*padding-inline:\s*12px[^}]*text-align:\s*center/s,
  );
  assert.match(
    mobileCss,
    /#hnmain\s+form\[action\$="hn\.algolia\.com\/"\]\s+input\[name="q"\]\s*{[^}]*display:\s*block[^}]*margin-inline:\s*auto/s,
  );
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
    /#hnmain\s+form\[action="comment"\]\s+textarea\[name="text"\][\s\S]*?{[^}]*width:\s*calc\(100% - 28px\)[^}]*max-width:\s*calc\(100% - 28px\)/s,
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

test("mobile submission editor preserves Hacker News field width while exposing controls", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px) and (any-pointer: coarse)"));

  assert.match(mobileCss, /form:not\(\[action="comment"\]\)\s+\.hnr-comment-editor-controls/);
  assert.match(
    mobileCss,
    /form:not\(\[action="comment"\]\)\s+textarea\[name="text"\]\s*{[^}]*box-sizing:\s*border-box[^}]*width:\s*calc\(100% - 4px\)[^}]*max-width:\s*calc\(100% - 4px\)/s,
  );
  assert.doesNotMatch(mobileCss, /textarea\[name="about"\][\s\S]*hnr-comment-editor-controls/);
});

test("mobile submission editor aligns its text label with the first textarea line", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const mobileCss = css.slice(css.indexOf("@media (max-width: 700px) and (any-pointer: coarse)"));

  assert.match(
    mobileCss,
    /form:not\(\[action="comment"\]\)\s+tr:has\(textarea\[name="text"\]\)\s*>\s*td:first-child\s*{[^}]*vertical-align:\s*top/s,
  );
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
  assert.doesNotMatch(css, /#hnmain\s+td\s+a:(?:link|visited)/);
  assert.match(css, /\.default\s+a:link/);
  assert.match(css, /\.pagetop\s+a:visited/);
  assert.doesNotMatch(css, /body\s*>\s*center\s*>\s*table/);
  assert.doesNotMatch(css, /\[bgcolor="#ffffff"/);
  assert.doesNotMatch(css, /\[bgcolor="#f6f6ef"/);
  assert.match(css, /html\[data-hnr-mobile="auto"\]\s+textarea/);
  assert.match(css, /width:\s*min\(100%,\s*22rem\)/);
  assert.match(css, /body:not\(:has\(#hnmain\)\):has\(form\)/);
  assert.match(css, /max-width:\s*calc\(100vw - 32px\)/);
  assert.match(
    css,
    /input\[type="text"\],[\s\S]*textarea\s*{[^}]*background:\s*var\(--hnr-control-surface[^}]*border:\s*1px solid var\(--hnr-control-border/s,
  );
  assert.match(
    css,
    /input\[type="submit"\]\s*{[^}]*background:\s*var\(--hnr-control-surface[^}]*border:\s*1px solid var\(--hnr-control-border/s,
  );
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

test("mobile logged-out forms give labels and submit controls the reading scale", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+body:not\(:has\(#hnmain\)\):has\(form\)\s+form\s*{[^}]*font-size:\s*16px[^}]*line-height:\s*1\.4/s,
  );
  assert.match(
    css,
    /html\[data-hnr-mobile="auto"\]\s+body:not\(:has\(#hnmain\)\):has\(form\)\s+input\[type="submit"\]\s*{[^}]*min-height:\s*32px[^}]*font-size:\s*16px/s,
  );
});

test("increased contrast strengthens every faded level without changing its order", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const contrastMediaIndex = css.indexOf("@media (prefers-contrast: more)");
  const contrastMedia = css.slice(contrastMediaIndex);
  const expected = {
    light: [
      "#3b3b39",
      "#4b4b49",
      "#555552",
      "#585856",
      "#656563",
      "#71716e",
      "#7c7c78",
      "#868682",
      "#90908c",
    ],
    dark: [
      "#b9b09e",
      "#aca493",
      "#a49d8c",
      "#a19a89",
      "#979181",
      "#8e8879",
      "#868072",
      "#7e786b",
      "#767164",
    ],
  };

  assert.ok(contrastMediaIndex >= 0);

  for (const mode of ["light", "dark"]) {
    const themePath = `extension/themes/hn-${mode}.json`;
    const tokens = readTheme(themePath);
    const background = hexChannels(tokens.contentBackground);
    const selector =
      mode === "light"
        ? /html\[data-hnr-theme="light"\],\s*html\[data-hnr-theme="system"\]\s*{([^}]*)}/s
        : /html\[data-hnr-theme="dark"\]\s*{([^}]*)}/s;
    const block = contrastMedia.match(selector);

    assert.ok(block, `missing ${mode} increased-contrast block`);
    const values = Array.from({ length: 9 }, (_, index) => {
      const match = block[1].match(
        new RegExp(`--hnr-comment-fade${index + 1}:\\s*(#[0-9a-f]{6})`, "i"),
      );
      assert.ok(match, `missing ${mode} increased-contrast fade ${index + 1}`);
      return match[1].toLowerCase();
    });
    assert.deepEqual(values, expected[mode]);

    const normalRatios = Array.from({ length: 9 }, (_, index) =>
      contrastRatio(hexChannels(tokens[`commentFade${index + 1}`]), background),
    );
    const contrastRatios = values.map((value) => contrastRatio(hexChannels(value), background));
    assert.ok(contrastRatios.every((ratio, index) => ratio > normalRatios[index]));
    assert.ok(
      contrastRatios.every((ratio, index) => index === 0 || ratio < contrastRatios[index - 1]),
    );
    assert.ok(
      contrastRatios.at(-1) < contrastRatio(hexChannels(tokens.textPrimary), background),
      `${mode} deepest comment should remain faded`,
    );
  }
});

test("content CSS preserves exact HN semantic signals and custom colors", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /\.hnuser\s*>\s*font\[color="#3c963c"\s+i\]\s*{[^}]*--hnr-user-new/s);
  assert.match(css, /\.hnuser\s*>\s*font\[color="#ff6600"\s+i\]\s*{[^}]*--hnr-yc-alumni-user/s);
  assert.match(css, /\.votelinks\s+font\[color="#ff6600"\s+i\]\s*{[^}]*--hnr-own-item-marker/s);
  assert.doesNotMatch(css, /font\[color\]\s*{/);
  assert.doesNotMatch(css, /\[bgcolor\]\s*{/);
});

test("content CSS maps only the default top bar and quiets its dark logo", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const defaultHeader = 'td[bgcolor="#ff6600" i]';

  assert.match(
    css,
    new RegExp(
      `${defaultHeader.replace("[", "\\[").replace("]", "\\]")}\\s*\\{[^}]*--hnr-top-bar-background`,
      "s",
    ),
  );
  assert.match(
    css,
    /html\[data-hnr-theme="dark"\][\s\S]*td\[bgcolor="#ff6600" i\][\s\S]*img\[src="y18\.svg"\][^{]*{[^}]*filter:\s*saturate\(0\.78\) brightness\(0\.9\)[^}]*opacity:\s*0\.82/s,
  );
  assert.match(
    css,
    /prefers-color-scheme:\s*dark[\s\S]*html\[data-hnr-theme="system"\][\s\S]*img\[src="y18\.svg"\][^{]*{[^}]*filter:\s*saturate\(0\.78\) brightness\(0\.9\)[^}]*opacity:\s*0\.82/s,
  );
  assert.doesNotMatch(css, /html\[data-hnr-theme="light"\][^{]*img\[src="y18\.svg"\]/s);
  assert.doesNotMatch(css, /\.votearrow\s*{[^}]*color|\.votearrow\s*{[^}]*border-bottom-color/s);
});

test("every HN faded-comment class has its own semantic color", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const classes = ["c5a", "c73", "c82", "c88", "c9c", "cae", "cbe", "cce", "cdd"];

  for (const [index, className] of classes.entries()) {
    assert.match(
      css,
      new RegExp(
        `\\.commtext\\.${className}[\\s\\S]*?color:\\s*var\\(--hnr-comment-fade${index + 1}`,
        "s",
      ),
    );
  }
});

test("content CSS keeps secondary HN links secondary", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(css, /\.hnmore\s+a:link,[\s\S]*\.hnmore\s+a:visited\s*{[^}]*--hnr-link-secondary/s);
  assert.doesNotMatch(css, /#hnmain\s+td\s+a:(?:link|visited)/);
});

test("content CSS uses semantic focus for fields and system focus for links and buttons", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.match(
    css,
    /:where\(input, select, textarea\):focus-visible\s*{[^}]*outline:\s*2px solid var\(--hnr-control-focus\)[^}]*outline-offset:\s*1px/s,
  );
  assert.match(
    css,
    /:where\(a\[href\], button\):focus-visible\s*{[^}]*outline:\s*2px solid Highlight[^}]*outline-offset:\s*2px/s,
  );
  assert.doesNotMatch(
    css,
    /:where\(a\[href\], button, input, select, textarea\):focus(?!-visible)/,
  );
});

test("increased contrast strengthens semantic form boundaries", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");
  const contrastCss = css.slice(css.indexOf("@media (prefers-contrast: more)"));

  assert.match(
    contrastCss,
    /html\[data-hnr-theme="light"\],[\s\S]*--hnr-control-surface:\s*#ffffff[^}]*--hnr-control-border:\s*#706a57[^}]*--hnr-control-focus:\s*#9c480d/s,
  );
  assert.match(
    contrastCss,
    /html\[data-hnr-theme="dark"\]\s*{[^}]*--hnr-control-surface:\s*#302d25[^}]*--hnr-control-border:\s*#9b917d[^}]*--hnr-control-focus:\s*#e29a58/s,
  );
  assert.match(
    contrastCss,
    /prefers-color-scheme:\s*dark[\s\S]*html\[data-hnr-theme="system"\]\s*{[^}]*--hnr-control-focus:\s*#e29a58/s,
  );
});

test("content CSS leaves Hacker News fragment-target visuals unchanged", () => {
  const css = fs.readFileSync("extension/content/content.css", "utf8");

  assert.doesNotMatch(css, /\.comtr:target|\.togg:target|:has\(:target\)/);
});

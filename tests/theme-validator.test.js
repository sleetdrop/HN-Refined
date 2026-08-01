import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateTheme } from "../scripts/validate-themes.js";

const validTheme = {
  id: "hn-light",
  name: "HN Light",
  mode: "light",
  tokens: {
    pageBackground: "#f6f6ef",
    contentBackground: "#f6f6ef",
    topBarBackground: "#ff6600",
    textPrimary: "#000000",
    textSecondary: "#828282",
    linkPrimary: "#000000",
    linkVisited: "#828282",
    linkSecondary: "#828282",
    topBarText: "#222222",
    topBarLink: "#000000",
    topBarSelected: "#ffffff",
    userNew: "#3c963c",
    ownItemMarker: "#ff6600",
    ycAlumniUser: "#ff6600",
    borderSubtle: "#d9d0b1",
    controlSurface: "#fbfaf3",
    controlBorder: "#d9d0b1",
    controlFocus: "#c96d24",
    focusDivider: "#faba8b",
    commentFade1: "#5a5a5a",
    commentFade2: "#737373",
    commentFade3: "#828282",
    commentFade4: "#888888",
    commentFade5: "#9c9c9c",
    commentFade6: "#aeaeae",
    commentFade7: "#bebebe",
    commentFade8: "#cecece",
    commentFade9: "#dddddd",
  },
};

const semanticTokenNames = [
  "pageBackground",
  "contentBackground",
  "topBarBackground",
  "textPrimary",
  "textSecondary",
  "linkPrimary",
  "linkVisited",
  "linkSecondary",
  "topBarText",
  "topBarLink",
  "topBarSelected",
  "userNew",
  "ownItemMarker",
  "ycAlumniUser",
  "borderSubtle",
  "controlSurface",
  "controlBorder",
  "controlFocus",
  "focusDivider",
  "commentFade1",
  "commentFade2",
  "commentFade3",
  "commentFade4",
  "commentFade5",
  "commentFade6",
  "commentFade7",
  "commentFade8",
  "commentFade9",
];

test("accepts a complete static theme", () => {
  assert.deepEqual(validateTheme(validTheme), []);
});

test("rejects remote or dynamic color values", () => {
  const theme = structuredClone(validTheme);
  theme.tokens.pageBackground = "url(https://example.com/a.png)";

  assert.match(validateTheme(theme).join("\n"), /pageBackground/);
});

test("rejects invalid hex color lengths", () => {
  for (const value of ["#12345", "#1234567"]) {
    const theme = structuredClone(validTheme);
    theme.tokens.pageBackground = value;

    assert.match(validateTheme(theme).join("\n"), /pageBackground/);
  }
});

test("rejects rgb channels outside 0 to 255", () => {
  const theme = structuredClone(validTheme);
  theme.tokens.pageBackground = "rgb(999 999 999)";

  assert.match(validateTheme(theme).join("\n"), /pageBackground/);
});

test("rejects unknown token keys", () => {
  const theme = structuredClone(validTheme);
  theme.tokens.hiddenContent = "#ffffff";

  assert.match(validateTheme(theme).join("\n"), /hiddenContent/);
});

function channelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hexColor) {
  const [, r, g, b] = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexColor);
  return (
    0.2126 * channelToLinear(Number.parseInt(r, 16)) +
    0.7152 * channelToLinear(Number.parseInt(g, 16)) +
    0.0722 * channelToLinear(Number.parseInt(b, 16))
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

test("bundled dark theme keeps core text readable", () => {
  const darkTheme = JSON.parse(fs.readFileSync("extension/themes/hn-dark.json", "utf8"));
  const { tokens } = darkTheme;

  for (const token of [
    "textPrimary",
    "linkPrimary",
    "linkVisited",
    "textSecondary",
    "topBarText",
  ]) {
    assert.equal(typeof tokens[token], "string", `missing semantic token: ${token}`);
  }

  assert.ok(
    contrastRatio(tokens.textPrimary, tokens.contentBackground) >= 6,
    "primary text should stay clear without becoming harsh on dark content",
  );
  assert.ok(
    contrastRatio(tokens.linkPrimary, tokens.contentBackground) >= 6,
    "story links should stay clear without becoming harsh on dark content",
  );
  assert.ok(
    contrastRatio(tokens.linkVisited, tokens.contentBackground) >= 4.5,
    "visited links should meet normal text contrast on dark content",
  );
  assert.ok(
    contrastRatio(tokens.textSecondary, tokens.contentBackground) >= 4.5,
    "metadata should remain readable on dark content",
  );
  assert.ok(
    contrastRatio(tokens.topBarText, tokens.topBarBackground) >= 4.5,
    "top bar text should stay readable",
  );
  assert.ok(
    contrastRatio(tokens.controlFocus, tokens.controlSurface) >= 3,
    "control focus should remain visible without system-blue glare",
  );
  assert.ok(
    contrastRatio(tokens.controlBorder, tokens.controlSurface) >= 1.5,
    "control border should distinguish unfocused fields",
  );
});

test("bundled themes expose only the complete semantic contract", () => {
  for (const path of ["extension/themes/hn-light.json", "extension/themes/hn-dark.json"]) {
    const { tokens } = JSON.parse(fs.readFileSync(path, "utf8"));
    assert.deepEqual(Object.keys(tokens), semanticTokenNames);
  }
});

test("bundled light theme preserves Hacker News' normal palette", () => {
  const lightTheme = JSON.parse(fs.readFileSync("extension/themes/hn-light.json", "utf8"));

  assert.deepEqual(lightTheme.tokens, validTheme.tokens);
});

test("bundled dark theme keeps a warm Hacker News family palette", () => {
  const darkTheme = JSON.parse(fs.readFileSync("extension/themes/hn-dark.json", "utf8"));

  assert.deepEqual(darkTheme.tokens, {
    pageBackground: "#211f1a",
    contentBackground: "#27251f",
    topBarBackground: "#9a4315",
    textPrimary: "#e6dcc5",
    textSecondary: "#a89b82",
    linkPrimary: "#e6dcc5",
    linkVisited: "#a89b82",
    linkSecondary: "#a89b82",
    topBarText: "#e6dcc5",
    topBarLink: "#e6dcc5",
    topBarSelected: "#fff7e7",
    userNew: "#73b56d",
    ownItemMarker: "#dc8650",
    ycAlumniUser: "#dc8650",
    borderSubtle: "#40392e",
    controlSurface: "#2f2b23",
    controlBorder: "#5b5141",
    controlFocus: "#c67836",
    focusDivider: "#63351a",
    commentFade1: "#a09988",
    commentFade2: "#8d8677",
    commentFade3: "#817b6d",
    commentFade4: "#7c7769",
    commentFade5: "#6d685c",
    commentFade6: "#5f5b50",
    commentFade7: "#524f45",
    commentFade8: "#46433a",
    commentFade9: "#3a3830",
  });
});

test("bundled comment fade ladders stay strictly ordered toward their backgrounds", () => {
  for (const path of ["extension/themes/hn-light.json", "extension/themes/hn-dark.json"]) {
    const { tokens } = JSON.parse(fs.readFileSync(path, "utf8"));
    const ladder = [
      tokens.textPrimary,
      ...Array.from({ length: 9 }, (_, index) => tokens[`commentFade${index + 1}`]),
    ];
    assert.ok(
      ladder.every((color) => typeof color === "string"),
      `${path} is missing a level`,
    );
    const ratios = ladder.map((color) => contrastRatio(color, tokens.contentBackground));

    assert.ok(
      ratios.every((ratio, index) => index === 0 || ratio < ratios[index - 1]),
      `${path} should fade strictly at every HN level`,
    );
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
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
    textMuted: "#828282",
    link: "#000000",
    visitedLink: "#828282",
    borderSubtle: "#d9d0b1",
    voteArrow: "#828282"
  }
};

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
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
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
  const darkTheme = JSON.parse(
    fs.readFileSync("extension/themes/hn-dark.json", "utf8")
  );
  const { tokens } = darkTheme;

  assert.ok(
    contrastRatio(tokens.textPrimary, tokens.contentBackground) >= 7,
    "primary text should meet enhanced contrast on dark content"
  );
  assert.ok(
    contrastRatio(tokens.link, tokens.contentBackground) >= 7,
    "story links should meet enhanced contrast on dark content"
  );
  assert.ok(
    contrastRatio(tokens.visitedLink, tokens.contentBackground) >= 4.5,
    "visited links should meet normal text contrast on dark content"
  );
  assert.ok(
    contrastRatio(tokens.textMuted, tokens.contentBackground) >= 4.5,
    "metadata should remain readable on dark content"
  );
  assert.ok(
    contrastRatio(tokens.textPrimary, tokens.topBarBackground) >= 4.5,
    "top bar text should stay readable"
  );
});

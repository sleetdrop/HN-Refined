import test from "node:test";
import assert from "node:assert/strict";
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

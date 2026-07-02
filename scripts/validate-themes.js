import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_TOKENS = Object.freeze([
  "pageBackground",
  "contentBackground",
  "topBarBackground",
  "textPrimary",
  "textMuted",
  "link",
  "visitedLink",
  "borderSubtle",
  "voteArrow"
]);

const STATIC_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}\s*(?:\/\s*(0|1|0?\.\d+|[1-9]\d?%|100%))?\s*\))$/;

export function validateTheme(theme) {
  const errors = [];

  if (!/^[a-z0-9-]+$/.test(theme.id || "")) {
    errors.push("id must use lowercase letters, numbers, and hyphens");
  }

  if (!["light", "dark"].includes(theme.mode)) {
    errors.push("mode must be light or dark");
  }

  if (!theme.name || /apple|official hacker news/i.test(theme.name)) {
    errors.push("name is missing or implies official endorsement");
  }

  const tokenEntries = Object.entries(theme.tokens || {});
  const allowed = new Set(REQUIRED_TOKENS);

  for (const key of REQUIRED_TOKENS) {
    if (!Object.hasOwn(theme.tokens || {}, key)) {
      errors.push(`missing required token: ${key}`);
    }
  }

  for (const [key, value] of tokenEntries) {
    if (!allowed.has(key)) {
      errors.push(`unknown token: ${key}`);
      continue;
    }

    if (typeof value !== "string" || !STATIC_COLOR_RE.test(value)) {
      errors.push(`token ${key} must be a static color`);
    }
  }

  return errors;
}

function loadTheme(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function validateThemeDirectory(themeDir) {
  const errors = [];
  const files = fs.readdirSync(themeDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(themeDir, file);
    for (const error of validateTheme(loadTheme(filePath))) {
      errors.push(`${file}: ${error}`);
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const errors = validateThemeDirectory(path.join(root, "extension", "themes"));

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
}

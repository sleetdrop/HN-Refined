import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REQUIRED_TOKENS, validateThemeDirectory } from "./validate-themes.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const themeDir = path.join(root, "extension", "themes");
const outputPath = path.join(root, "extension", "generated", "themes.css");

const errors = validateThemeDirectory(themeDir);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const files = fs
  .readdirSync(themeDir)
  .filter((file) => file.endsWith(".json"))
  .sort();
const blocks = [];

for (const file of files) {
  const theme = JSON.parse(fs.readFileSync(path.join(themeDir, file), "utf8"));
  const selector =
    theme.mode === "light"
      ? `html[data-hnr-theme="light"], html[data-hnr-theme="system"]`
      : `html[data-hnr-theme="dark"]`;

  const declarations = REQUIRED_TOKENS.map(
    (token) =>
      `  --hnr-${token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${theme.tokens[token]};`,
  ).join("\n");

  blocks.push(`${selector} {\n${declarations}\n}`);
}

blocks.push(
  `@media (prefers-color-scheme: dark) {\n  html[data-hnr-theme="system"] {\n${REQUIRED_TOKENS.map(
    (token) => {
      const darkTheme = JSON.parse(fs.readFileSync(path.join(themeDir, "hn-dark.json"), "utf8"));
      return `    --hnr-${token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${darkTheme.tokens[token]};`;
    },
  ).join("\n")}\n  }\n}`,
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${blocks.join("\n\n")}\n`);

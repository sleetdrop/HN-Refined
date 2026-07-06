import fs from "node:fs";
import path from "node:path";

const remoteUrlToken = /\bhttps?:\/\/[^\s"'`<>)\]}]+/gi;
const protocolRelativeRemoteUrl = /(^|[^\w:])\/\/[^\s"'`<>)\]}]+/;
const forbiddenImport = /@import\b/i;
const forbiddenRemoteCssUrl = /url\(\s*['"]?(?:https?:)?\/\//i;
const manifestPath = path.join("extension", "manifest.json");
const linkClassifierPath = path.join("extension", "shared", "link-classifier.js");
const allowedRemoteUrlTokensByPath = new Map([
  [manifestPath, new Set(["https://news.ycombinator.com/*"])],
]);
const roots = ["extension"];
const errors = [];

function findUnexpectedRemoteUrlTokens(filePath, text) {
  const allowed = allowedRemoteUrlTokensByPath.get(filePath) || new Set();
  const unexpected = [];

  for (const match of text.matchAll(remoteUrlToken)) {
    if (!allowed.has(match[0])) {
      unexpected.push(match[0]);
    }
  }

  return unexpected;
}

function removeAllowedIntentionalReferences(filePath, text) {
  if (filePath !== linkClassifierPath) {
    return text;
  }

  return text.replace('const HN_ORIGIN = "https://news.ycombinator.com";', "");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(js|css|html|json)$/.test(entry.name)) {
      continue;
    }

    const text = fs.readFileSync(fullPath, "utf8");
    const textWithoutIntentionalReferences = removeAllowedIntentionalReferences(fullPath, text);
    const unexpectedRemoteUrlTokens = findUnexpectedRemoteUrlTokens(
      fullPath,
      textWithoutIntentionalReferences,
    );
    if (
      forbiddenImport.test(textWithoutIntentionalReferences) ||
      forbiddenRemoteCssUrl.test(textWithoutIntentionalReferences) ||
      protocolRelativeRemoteUrl.test(textWithoutIntentionalReferences) ||
      unexpectedRemoteUrlTokens.length > 0
    ) {
      errors.push(`${fullPath} contains remote content syntax`);
    }
  }
}

for (const root of roots) {
  walk(root);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

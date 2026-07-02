import fs from "node:fs";
import path from "node:path";

const remoteUrlToken = /\bhttps?:\/\/[^\s"'`<>)\]}]+/gi;
const forbiddenImport = /@import\b/i;
const forbiddenRemoteCssUrl = /url\(\s*['"]?https?:\/\//i;
const allowedRemoteUrlTokensByPath = new Map([
  [path.join("extension", "manifest.json"), new Set(["https://news.ycombinator.com/*"])],
  [path.join("extension", "shared", "link-classifier.js"), new Set(["https://news.ycombinator.com"])]
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
    const unexpectedRemoteUrlTokens = findUnexpectedRemoteUrlTokens(fullPath, text);
    if (
      forbiddenImport.test(text) ||
      forbiddenRemoteCssUrl.test(text) ||
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

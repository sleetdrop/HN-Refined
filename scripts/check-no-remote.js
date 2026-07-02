import fs from "node:fs";
import path from "node:path";

const remoteReference = /\bhttps?:\/\//i;
const forbiddenImport = /@import\b/i;
const forbiddenRemoteCssUrl = /url\(\s*['"]?https?:\/\//i;
const allowedRemoteReferencesByPath = new Map([
  [path.join("extension", "manifest.json"), ["https://news.ycombinator.com/*"]],
  [path.join("extension", "shared", "link-classifier.js"), ["https://news.ycombinator.com"]]
]);
const roots = ["extension"];
const errors = [];

function removeAllowedRemoteReferences(filePath, text) {
  let result = text;
  for (const reference of allowedRemoteReferencesByPath.get(filePath) || []) {
    result = result.split(reference).join("");
  }
  return result;
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
    const textWithoutAllowedReferences = removeAllowedRemoteReferences(fullPath, text);
    if (
      forbiddenImport.test(text) ||
      forbiddenRemoteCssUrl.test(text) ||
      remoteReference.test(textWithoutAllowedReferences)
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

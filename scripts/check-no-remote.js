import fs from "node:fs";
import path from "node:path";

const forbidden = /\bhttps?:\/\/|@import\b|url\(\s*['"]?https?:\/\//i;
const allowedRemoteReferences = /\bhttps:\/\/news\.ycombinator\.com(?:\/\*)?\b/g;
const roots = ["extension"];
const errors = [];

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

    const text = fs.readFileSync(fullPath, "utf8").replace(allowedRemoteReferences, "");
    if (forbidden.test(text) && fullPath !== path.join("extension", "manifest.json")) {
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

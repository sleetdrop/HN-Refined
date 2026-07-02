import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const errors = [];

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}

if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(["https://news.ycombinator.com/*"])) {
  errors.push("host_permissions must be limited to Hacker News");
}

for (const permission of manifest.permissions || []) {
  if (!["storage"].includes(permission)) {
    errors.push(`unexpected permission: ${permission}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

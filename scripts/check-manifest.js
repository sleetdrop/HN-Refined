import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const errors = [];
const allowedHostLikeFields = new Set(["host_permissions", "optional_host_permissions"]);

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}

if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(["https://news.ycombinator.com/*"])) {
  errors.push("host_permissions must be limited to Hacker News");
}

if (manifest.optional_permissions !== undefined) {
  errors.push("optional_permissions must be absent");
}

if (manifest.optional_host_permissions !== undefined) {
  errors.push("optional_host_permissions must be absent");
}

for (const key of Object.keys(manifest)) {
  if (key.includes("host") && !allowedHostLikeFields.has(key)) {
    errors.push(`unexpected host-like manifest field: ${key}`);
  }
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

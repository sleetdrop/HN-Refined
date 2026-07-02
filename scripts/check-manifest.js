import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("extension/manifest.json", "utf8"));
const errors = [];
const allowedHostPattern = "https://news.ycombinator.com/*";
const allowedHostLikeFields = new Set(["host_permissions", "optional_host_permissions"]);
const requiredPermissions = ["storage"];
const requiredContentScriptCss = ["generated/themes.css", "content/content.css"];
const requiredContentScriptJs = ["content/content-script.js"];

function equalsArray(actual, expected) {
  return Array.isArray(actual) && JSON.stringify(actual) === JSON.stringify(expected);
}

if (manifest.manifest_version !== 3) {
  errors.push("manifest_version must be 3");
}

if (!equalsArray(manifest.permissions, requiredPermissions)) {
  errors.push("permissions must exactly equal storage");
}

if (!equalsArray(manifest.host_permissions, [allowedHostPattern])) {
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

if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
  errors.push("content_scripts must be a non-empty array");
} else {
  for (const [index, contentScript] of manifest.content_scripts.entries()) {
    if (!equalsArray(contentScript.matches, [allowedHostPattern])) {
      errors.push(`content_scripts[${index}].matches must exactly equal Hacker News`);
    }

    if (!equalsArray(contentScript.css, requiredContentScriptCss)) {
      errors.push(`content_scripts[${index}].css must exactly equal planned stylesheets`);
    }

    if (!equalsArray(contentScript.js, requiredContentScriptJs)) {
      errors.push(`content_scripts[${index}].js must exactly equal planned scripts`);
    }
  }
}

if (Array.isArray(manifest.permissions)) {
  for (const permission of manifest.permissions) {
    if (!requiredPermissions.includes(permission)) {
      errors.push(`unexpected permission: ${permission}`);
      continue;
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

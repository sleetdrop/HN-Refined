#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/HNRefined/HNRefined.xcodeproj"
MACOS_SCHEME="HNRefined (macOS)"
IOS_SCHEME="HNRefined (iOS)"
CONFIGURATION="${CONFIGURATION:-Debug}"
DERIVED_DATA_PATH="${HNREFINED_DERIVED_DATA:-$ROOT_DIR/.build/xcode-derived-data}"
INSTALL_APP_PATH="${HNREFINED_INSTALL_APP:-$HOME/Applications/HNRefined.app}"
PRODUCT_APP_PATH="$DERIVED_DATA_PATH/Build/Products/$CONFIGURATION/HNRefined.app"
IOS_DESTINATION="${HNREFINED_IOS_DESTINATION:-generic/platform=iOS Simulator}"
APP_ID="net.vetcafe.hnrefined"
EXTENSION_ID="net.vetcafe.hnrefined.extension"
LEGACY_APP_ID="org.hnrefined.HNRefined"
LEGACY_EXTENSION_ID="org.hnrefined.HNRefined.Extension"
PLUGIN_TYPE="com.apple.Safari.web-extension"

usage() {
  cat <<'USAGE'
Usage: scripts/safari-dev.sh <command>

Commands:
  build          Build the macOS host app into .build/xcode-derived-data.
  build-ios      Build the iOS/iPadOS host app into .build/xcode-derived-data.
  install        Copy the built app to ~/Applications and register that one app.
  reinstall     Build, install, and open Safari on Hacker News.
  unregister    Remove every local HN Refined Safari extension registration.
  status        Print signing and Safari extension registration state.
  doctor        Run status plus package sanity checks.
  open-safari   Open Hacker News explicitly in Safari.

Environment:
  CONFIGURATION=Debug|Release
  HNREFINED_DEVELOPMENT_TEAM=<team id>     Optional Xcode build team id.
  HNREFINED_SIGNING_IDENTITY=<identity>    Optional codesign identity.
  HNREFINED_KEEP_HOST_APP=1                Keep the host app open after install.
  HNREFINED_DERIVED_DATA=<path>            Defaults to repo .build/xcode-derived-data.
  HNREFINED_INSTALL_APP=<path>             Defaults to ~/Applications/HNRefined.app.
  HNREFINED_IOS_DESTINATION=<destination>  Defaults to generic/platform=iOS Simulator.
USAGE
}

log() {
  printf '==> %s\n' "$*"
}

detect_signing_identity() {
  if [[ -n "${HNREFINED_SIGNING_IDENTITY:-}" ]]; then
    printf '%s\n' "$HNREFINED_SIGNING_IDENTITY"
    return 0
  fi

  security find-identity -v -p codesigning | sed -n 's/.*"\(Apple Development:[^"]*\)".*/\1/p' | head -n 1
}

detect_development_team() {
  if [[ -n "${HNREFINED_DEVELOPMENT_TEAM:-}" ]]; then
    printf '%s\n' "$HNREFINED_DEVELOPMENT_TEAM"
    return 0
  fi

  local identity
  identity="$(detect_signing_identity)"
  [[ -z "$identity" ]] && return 0

  security find-certificate -c "$identity" -p \
    | openssl x509 -noout -subject \
    | sed -n 's/.*\/OU=\([^\/]*\).*/\1/p'
}

sync_extension_resources() {
  log "Syncing WebExtension resources into the Xcode wrapper"
  rsync -a --delete \
    --exclude '.DS_Store' \
    "$ROOT_DIR/extension/" \
    "$ROOT_DIR/HNRefined/Shared (Extension)/Resources/"
}

run_xcode_build() {
  local scheme="$1"
  shift

  log "Building $scheme ($CONFIGURATION)"
  npm run build:themes
  sync_extension_resources

  local identity
  local team
  identity="$(detect_signing_identity)"
  team="$(detect_development_team)"

  local args=(
    xcodebuild
    -project "$PROJECT_PATH"
    -scheme "$scheme"
    -configuration "$CONFIGURATION"
    -derivedDataPath "$DERIVED_DATA_PATH"
    -quiet
    "$@"
    build
  )

  if [[ -n "$identity" && -n "$team" ]]; then
    log "Using Apple Development team $team"
    args+=("DEVELOPMENT_TEAM=$team" "CODE_SIGN_IDENTITY=Apple Development")
  fi

  "${args[@]}"
}

run_build() {
  run_xcode_build "$MACOS_SCHEME"
}

run_ios_build() {
  run_xcode_build "$IOS_SCHEME" -destination "$IOS_DESTINATION"
}

stop_host_app() {
  local app_id
  for app_id in "$APP_ID" "$LEGACY_APP_ID"; do
    osascript -e "tell application id \"$app_id\" to quit" >/dev/null 2>&1 || true
  done
}

verify_installed_app_signature() {
  log "Verifying installed app signature"
  codesign --verify --deep --strict --verbose=2 "$INSTALL_APP_PATH"
}

unregister_hnrefined() {
  log "Removing existing HN Refined Safari extension registrations"
  local paths
  paths="$(pluginkit -m -D -v -p "$PLUGIN_TYPE" 2>/dev/null \
    | awk -F '\t' -v current="$EXTENSION_ID" -v legacy="$LEGACY_EXTENSION_ID" \
      'index($0, current) || index($0, legacy) {print $4}')"

  if [[ -z "$paths" ]]; then
    log "No existing HN Refined registrations found"
    return 0
  fi

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    log "Unregistering $path"
    pluginkit -r "$path" || true
  done <<< "$paths"
}

install_app() {
  if [[ ! -d "$PRODUCT_APP_PATH" ]]; then
    printf 'Built app not found: %s\nRun scripts/safari-dev.sh build first.\n' "$PRODUCT_APP_PATH" >&2
    exit 1
  fi

  stop_host_app
  unregister_hnrefined

  log "Installing stable local app to $INSTALL_APP_PATH"
  mkdir -p "$(dirname "$INSTALL_APP_PATH")"
  ditto "$PRODUCT_APP_PATH" "$INSTALL_APP_PATH"
  verify_installed_app_signature

  log "Registering installed app with LaunchServices and PluginKit"
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$INSTALL_APP_PATH"
  pluginkit -a "$INSTALL_APP_PATH"
  open -a "$INSTALL_APP_PATH"
  sleep 2
  pluginkit -e use -p "$PLUGIN_TYPE" -i "$EXTENSION_ID" || true

  if [[ "${HNREFINED_KEEP_HOST_APP:-0}" != "1" ]]; then
    stop_host_app
  fi
}

print_signing_status() {
  log "Code signing identities"
  security find-identity -v -p codesigning || true

  if [[ -d "$INSTALL_APP_PATH" ]]; then
    log "Installed app signature"
    codesign -dv --verbose=2 "$INSTALL_APP_PATH" 2>&1 | sed -n '/Identifier=/p;/Signature=/p;/TeamIdentifier=/p' | awk '!seen[$0]++'
  else
    log "Installed app missing: $INSTALL_APP_PATH"
  fi
}

print_process_status() {
  log "HN Refined host app processes"
  pgrep -fl HNRefined || true
}

print_registration_status() {
  log "Safari Web Extension registrations"
  pluginkit -m -D -v -p "$PLUGIN_TYPE" || true
}

status() {
  printf 'Project: %s\n' "$PROJECT_PATH"
  printf 'DerivedData: %s\n' "$DERIVED_DATA_PATH"
  printf 'Install app: %s\n' "$INSTALL_APP_PATH"
  print_signing_status
  print_process_status
  print_registration_status
}

doctor() {
  status

  log "Packaged extension sanity checks"
  local resources="$INSTALL_APP_PATH/Contents/PlugIns/HNRefined Extension.appex/Contents/Resources"
  test -f "$resources/manifest.json"
  test -f "$resources/popup/popup.html"
  test -f "$resources/options/options.html"
  test -f "$resources/content/deep-comments.js"
  test -f "$resources/content/content-script.js"
  test -f "$resources/icons/icon-16.png"
  test -f "$resources/icons/icon-19.png"
  test -f "$resources/icons/icon-32.png"
  test -f "$resources/icons/icon-38.png"
  test -f "$resources/icons/icon-48.png"
  test -f "$resources/icons/icon-128.png"
  node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (m.action.default_popup !== 'popup/popup.html') process.exit(1);" "$resources/manifest.json"
  log "Package has manifest, popup, options, content, and icon resources"
}

open_safari() {
  open -a Safari https://news.ycombinator.com/news
}

case "${1:-}" in
  build)
    run_build
    ;;
  build-ios)
    run_ios_build
    ;;
  install)
    install_app
    status
    ;;
  reinstall)
    run_build
    install_app
    open_safari
    status
    ;;
  unregister)
    stop_host_app
    unregister_hnrefined
    status
    ;;
  status)
    status
    ;;
  doctor)
    doctor
    ;;
  open-safari)
    open_safari
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 2
    ;;
esac

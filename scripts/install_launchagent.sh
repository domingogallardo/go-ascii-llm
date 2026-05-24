#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_UID="$(id -u)"
LABEL="com.domingo.go-ascii-llm"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
LOG_DIR="${HOME}/Library/Logs/go-ascii-llm"
PLIST_PATH="${LAUNCH_AGENTS_DIR}/${LABEL}.plist"
NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
PORT="${PORT:-3091}"
HOST="${HOST:-127.0.0.1}"

mkdir -p "${LAUNCH_AGENTS_DIR}" "${LOG_DIR}"

cat > "${PLIST_PATH}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${ROOT_DIR}/scripts/go_ascii_web.sh</string>
  </array>
  <key>WorkingDirectory</key><string>${ROOT_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>NODE_BIN</key><string>${NODE_BIN}</string>
    <key>HOST</key><string>${HOST}</string>
    <key>PORT</key><string>${PORT}</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${LOG_DIR}/server.out.log</string>
  <key>StandardErrorPath</key><string>${LOG_DIR}/server.err.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true
launchctl bootstrap "gui/${USER_UID}" "${PLIST_PATH}"
launchctl enable "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true
launchctl kickstart -k "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true

echo "LaunchAgent instalado: ${PLIST_PATH}"
echo "Servicio: ${LABEL}"
echo "URL local: http://${HOST}:${PORT}"

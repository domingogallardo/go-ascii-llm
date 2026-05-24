#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3091}"
PATH_PREFIX="${PATH_PREFIX:-/go}"

if ! command -v tailscale >/dev/null 2>&1; then
  echo "tailscale no esta instalado o no esta en PATH." >&2
  exit 1
fi

tailscale serve --bg --set-path "${PATH_PREFIX}" "${PORT}"
tailscale serve status

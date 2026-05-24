#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="${NODE_BIN:-/opt/homebrew/bin/node}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3091}"

if [ ! -x "${NODE_BIN}" ]; then
  NODE_BIN="$(command -v node || true)"
fi

if [ -z "${NODE_BIN}" ] || [ ! -x "${NODE_BIN}" ]; then
  echo "Node no encontrado. Define NODE_BIN o instala Node." >&2
  exit 1
fi

cd "${ROOT_DIR}"
export HOST PORT
exec "${NODE_BIN}" "${ROOT_DIR}/server.js"

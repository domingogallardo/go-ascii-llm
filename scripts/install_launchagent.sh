#!/usr/bin/env bash
# La configuración y la operación del servicio se gestionan en computer-ops.
set -euo pipefail
MANAGER="/Users/domingo/Programacion/computer-ops/ops/bin/local_service.py"
if [ -n "${NODE_BIN-}${HOST-}${PORT-}" ]; then
  echo "Configura NODE_BIN/HOST/PORT en computer-ops/ops/launchagents/go.plist." >&2
  exit 2
fi
exec /usr/bin/python3 "${MANAGER}" go install "$@"

#!/usr/bin/env bash
# Lanzador de compatibilidad; el código de la aplicación permanece en este proyecto.
set -euo pipefail
exec /bin/bash /Users/domingo/Programacion/computer-ops/ops/bin/go_web.sh "$@"

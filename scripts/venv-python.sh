#!/usr/bin/env sh
set -eu

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Prefer the local project virtualenv, fall back to system python3.
if [ -x "$PROJECT_ROOT/.venv/bin/python3" ]; then
  exec "$PROJECT_ROOT/.venv/bin/python3" "$@"
elif [ -x "$PROJECT_ROOT/.venv/bin/python" ]; then
  exec "$PROJECT_ROOT/.venv/bin/python" "$@"
else
  exec python3 "$@"
fi

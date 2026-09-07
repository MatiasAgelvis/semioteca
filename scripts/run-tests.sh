#!/usr/bin/env sh
# Run the backend unit tests from the project root using the project's venv.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/backend"

exec sh ../scripts/venv-python.sh -m pytest tests/ "$@"

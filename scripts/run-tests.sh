#!/usr/bin/env sh
# Run the backend unit tests from the project root using uv.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

unset VIRTUAL_ENV
unset VIRTUAL_ENV_PROMPT

if [ -f "$BACKEND_DIR/uv.lock" ]; then
    exec uv run --project "$BACKEND_DIR" -- pytest tests/ "$@"
fi

# Fall back to the legacy mise-managed venv at the project root if it
# has pytest installed.
if [ -x "$PROJECT_ROOT/.venv/bin/python3" ]; then
    exec "$PROJECT_ROOT/.venv/bin/python3" -m pytest tests/ "$@"
fi
if [ -x "$PROJECT_ROOT/.venv/bin/python" ]; then
    exec "$PROJECT_ROOT/.venv/bin/python" -m pytest tests/ "$@"
fi

exec python3 -m pytest tests/ "$@"

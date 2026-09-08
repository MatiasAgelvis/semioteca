#!/usr/bin/env sh
# Run a Python script under `uv run`, falling back to the legacy
# mise-managed venv if no uv.lock is yet available.
#
# Once `cd backend && uv sync` has been run, this script always uses
# `uv run`. Before that, if the legacy venv at `.venv/` exists (created by
# mise via `_.python.venv`), we transparently use it so existing developer
# workflows don't break during the transition.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

unset VIRTUAL_ENV
unset VIRTUAL_ENV_PROMPT

# Prefer uv if a lockfile exists (i.e. uv sync has been run).
if [ -f "$BACKEND_DIR/uv.lock" ]; then
    exec uv run --project "$BACKEND_DIR" -- python "$@"
fi

# Fall back to the legacy mise-managed venv at the project root if it has
# the script we want to run.
if [ -x "$PROJECT_ROOT/.venv/bin/python3" ]; then
    exec "$PROJECT_ROOT/.venv/bin/python3" "$@"
fi
if [ -x "$PROJECT_ROOT/.venv/bin/python" ]; then
    exec "$PROJECT_ROOT/.venv/bin/python" "$@"
fi

# Last resort: rely on PATH.
exec python3 "$@"

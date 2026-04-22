#!/usr/bin/env sh
set -eu

# Prefer the project virtualenv when present, otherwise fall back to system python3.
if [ -x "../.vercel-venv/bin/python3" ]; then
  exec "../.vercel-venv/bin/python3" "$@"
elif [ -x "../.vercel-venv/bin/python" ]; then
  exec "../.vercel-venv/bin/python" "$@"
elif [ -x "./.vercel-venv/bin/python3" ]; then
  exec "./.vercel-venv/bin/python3" "$@"
elif [ -x "./.vercel-venv/bin/python" ]; then
  exec "./.vercel-venv/bin/python" "$@"
else
  exec python3 "$@"
fi

#!/usr/bin/env sh
set -eu

./.vercel-venv/bin/python -m pip --version >/dev/null
npm run build

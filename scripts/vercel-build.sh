#!/usr/bin/env sh
set -eu

ROOT="$(pwd)"
export PATH="$ROOT/.vercel-venv/bin:$PATH"
export PYPANDOC_PANDOC="$ROOT/.vercel-venv/bin/pandoc"
npm run build

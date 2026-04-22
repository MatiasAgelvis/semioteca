#!/usr/bin/env sh
set -eu

export PATH="./.vercel-venv/bin:$PATH"
npm run build

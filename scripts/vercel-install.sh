#!/usr/bin/env sh
set -eu

npm --prefix frontend ci
python3 -m venv .vercel-venv
if [ ! -x ./.vercel-venv/bin/python3 ] && [ -x ./.vercel-venv/bin/python ]; then
  ln -sf python ./.vercel-venv/bin/python3
fi
./.vercel-venv/bin/python -m pip install --upgrade pip
./.vercel-venv/bin/python -m pip install -r requirements.txt
./.vercel-venv/bin/python -m pip install pandoc

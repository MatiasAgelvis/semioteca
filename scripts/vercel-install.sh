#!/usr/bin/env sh
set -eu

npm --prefix frontend ci
python3 -m venv .vercel-venv
if [ ! -x ./.vercel-venv/bin/python3 ] && [ -x ./.vercel-venv/bin/python ]; then
  ln -sf python ./.vercel-venv/bin/python3
fi
mkdir -p ./.vercel-venv/bin
./.vercel-venv/bin/python -m pip install --upgrade pip
./.vercel-venv/bin/python -m pip install -r requirements.txt
ROOT_PYTHON_PATH="$(pwd)/.vercel-venv/bin"
./.vercel-venv/bin/python - <<PY
import os
import pypandoc
os.makedirs(r'${ROOT_PYTHON_PATH}', exist_ok=True)
pypandoc.download_pandoc(targetfolder=r'${ROOT_PYTHON_PATH}')
PY

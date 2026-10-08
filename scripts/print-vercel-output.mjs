#!/usr/bin/env node
// Dumps SvelteKit's and Vercel's build output to stdout so the Vercel build
// log shows exactly what the build produced. Self-skips outside Vercel CI.
//
// Resolves `frontend/` by walking up from this script's own location, so it
// works whether called from the project root (`npm run frontend:build`) or
// from `frontend/` (`npm run build` — Vercel's auto-detected entry point).

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.VERCEL) {
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const frontendDir = join(projectRoot, 'frontend');

const targets = [
  { label: 'sveltekit-output', path: join(frontendDir, '.svelte-kit', 'output') },
  { label: 'vercel-output', path: join(frontendDir, '.vercel', 'output') },
];

for (const { label, path } of targets) {
  console.log(`[${label}] root: ${path}`);
  if (!existsSync(path)) {
    console.log(`[${label}] (not present)`);
    continue;
  }

  const top = readdirSync(path).sort();
  console.log(`[${label}] entries (${top.length}): ${top.join(', ')}`);

  let tree = '';
  try {
    tree = execSync(`find "${path}" -maxdepth 4 -print 2>/dev/null | sort`, {
      encoding: 'utf8',
    });
  } catch (err) {
    console.log(`[${label}] find failed: ${err.message}`);
  }
  const lines = tree.split('\n').filter(Boolean);
  console.log(`[${label}] tree (maxdepth 4, ${lines.length} entries):`);
  for (const line of lines) console.log('  ' + line.replace(path, '.'));

  console.log(`[${label}] sizes:`);
  for (const entry of top) {
    const full = join(path, entry);
    try {
      const size = execSync(`du -sh "${full}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
      const kind = statSync(full).isDirectory() ? 'dir ' : 'file';
      console.log(`  ${kind}  ${size.padEnd(8)} ${entry}`);
    } catch {
      console.log(`  ?            ${entry}`);
    }
  }
}

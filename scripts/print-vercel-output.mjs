#!/usr/bin/env node
// Dumps the Vercel build output to stdout so it shows up in the Vercel build log.
// Useful for diagnosing "where did the build go?" and "is the api function there?".
//
// Vercel sets $VERCEL=1 in CI builds. The script is a no-op locally.

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

if (!process.env.VERCEL) {
  process.exit(0);
}

const root = join(process.cwd(), 'frontend', '.vercel', 'output');

if (!existsSync(root)) {
  console.log('[vercel-output] expected path not found:', root);
  process.exit(0);
}

const top = readdirSync(root).sort();
console.log(`[vercel-output] root: ${root}`);
console.log(`[vercel-output] entries (${top.length}): ${top.join(', ')}`);

// Print the full tree, but cap depth so it doesn't drown the build log.
try {
  const tree = execSync(`find "${root}" -maxdepth 4 -print | sort`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const lines = tree.split('\n').filter(Boolean);
  console.log(`[vercel-output] tree (maxdepth 4, ${lines.length} entries):`);
  for (const line of lines) console.log('  ' + line.replace(root, '.'));
} catch (err) {
  console.log('[vercel-output] find failed:', err.message);
}

// Per-entry size summary (handy for spotting "is the JS bundle actually shipped?").
console.log('[vercel-output] sizes:');
for (const entry of top) {
  const full = join(root, entry);
  try {
    const size = execSync(`du -sh "${full}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
    const isDir = statSync(full).isDirectory();
    console.log(`  ${isDir ? 'dir ' : 'file'}  ${size.padEnd(8)} ${entry}`);
  } catch {
    console.log(`  ?            ${entry}`);
  }
}

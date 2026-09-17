import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sources = {
  cardsJson: path.join(rootDir, 'backend', 'cards.json'),
  cardRelations: path.join(rootDir, 'backend', 'card-relations.json'),
  cardsImages: path.join(rootDir, 'backend', 'cards_images'),
  cardTags: path.join(rootDir, 'backend', 'card-tags.json'),
  blog: path.join(rootDir, 'backend', 'BLOG'),
  cv: path.join(rootDir, 'backend', 'CV'),
};

const staticRoot = path.join(rootDir, 'frontend', 'static', 'content');
const libDataRoot = path.join(rootDir, 'frontend', 'src', 'lib', 'data');

async function ensureExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(source, destination) {
  if (!(await ensureExists(source))) {
    console.warn(`[sync-content] Missing source: ${source}`);
    return;
  }

  await cp(source, destination, { recursive: true, force: true });
  console.log(
    `[sync-content] Copied ${path.relative(rootDir, source)} -> ${path.relative(rootDir, destination)}`,
  );
}

async function writeCardIds() {
  if (!(await ensureExists(sources.cardsJson))) {
    console.warn('[sync-content] Missing source for card-ids:', sources.cardsJson);
    return;
  }
  const dataset = JSON.parse(await readFile(sources.cardsJson, 'utf8'));
  const ids = dataset.books.flatMap((book) => book.cards.map((card) => card.id));
  await writeFile(path.join(staticRoot, 'card-ids.json'), JSON.stringify(ids), 'utf8');
  console.log('[sync-content] Wrote card-ids.json');
}

async function main() {
  await rm(staticRoot, { recursive: true, force: true });
  await mkdir(staticRoot, { recursive: true });
  await mkdir(libDataRoot, { recursive: true });

  await copyIfExists(sources.cardsJson, path.join(staticRoot, 'cards.json'));
  await writeCardIds();
  await copyIfExists(sources.cardRelations, path.join(staticRoot, 'card-relations.json'));
  await copyIfExists(sources.cardsImages, path.join(staticRoot, 'cards_images'));
  await copyIfExists(sources.blog, path.join(staticRoot, 'blog'));
  await copyIfExists(sources.cv, path.join(staticRoot, 'cv'));

  // Importable copy for frontend static imports (backend/card-tags.json is the source of truth)
  await copyIfExists(sources.cardTags, path.join(libDataRoot, 'card-tags.json'));
}

main().catch((error) => {
  console.error('[sync-content] Failed:', error);
  process.exit(1);
});

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sources = {
	cardsJson: path.join(rootDir, 'backend', 'cards.json'),
	cardsImages: path.join(rootDir, 'backend', 'cards_images'),
	cardTags: path.join(rootDir, 'backend', 'card-tags.json'),
	blog: path.join(rootDir, 'backend', 'BLOG'),
	cv: path.join(rootDir, 'backend', 'CV')
};

const targetRoot = path.join(rootDir, 'frontend', 'static', 'content');

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
	console.log(`[sync-content] Copied ${path.relative(rootDir, source)} -> ${path.relative(rootDir, destination)}`);
}

async function main() {
	await rm(targetRoot, { recursive: true, force: true });
	await mkdir(targetRoot, { recursive: true });

	await copyIfExists(sources.cardsJson, path.join(targetRoot, 'cards.json'));
	await copyIfExists(sources.cardTags, path.join(targetRoot, 'card-tags.json'));
	await copyIfExists(sources.cardsImages, path.join(targetRoot, 'cards_images'));
	await copyIfExists(sources.blog, path.join(targetRoot, 'blog'));
	await copyIfExists(sources.cv, path.join(targetRoot, 'cv'));
}

main().catch((error) => {
	console.error('[sync-content] Failed:', error);
	process.exit(1);
});

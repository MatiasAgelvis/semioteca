import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import type { BlogPost, BlogPostMeta, CardsDataset, PdfResource } from '$lib/types/content';

const CONTENT_ROOT = path.resolve(process.cwd(), 'static', 'content');
const BLOG_ROOT = path.join(CONTENT_ROOT, 'blog');
const CV_ROOT = path.join(CONTENT_ROOT, 'cv');
const CARDS_JSON_PATH = path.join(CONTENT_ROOT, 'cards.json');

marked.setOptions({
	gfm: true,
	breaks: true
});

function titleFromMarkdown(markdown: string, fallback: string): string {
	const heading = markdown.match(/^#\s+(.+)$/m);
	return heading?.[1]?.trim() ?? fallback;
}

function excerptFromMarkdown(markdown: string): string {
	for (const line of markdown.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('![') || trimmed.startsWith('>')) {
			continue;
		}
		return trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed;
	}
	return 'Post available in the Semioteca archive.';
}

function coverFromMarkdown(markdown: string, slug: string): string | null {
	const imageMatch = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
	if (!imageMatch) {
		return null;
	}
	const rawPath = imageMatch[1]?.trim();
	if (!rawPath) {
		return null;
	}
	if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('/')) {
		return rawPath;
	}
	return toPublicUrl('blog', slug, rawPath);
}

function toPublicUrl(...segments: string[]): string {
	const normalized = segments
		.flatMap((segment) => segment.split('/'))
		.filter(Boolean)
		.join('/');
	return `/content/${encodeURI(normalized)}`;
}

function rewriteMarkdownAssetUrls(markdown: string, slug: string): string {
	return markdown
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, altText: string, assetPath: string) => {
			const clean = assetPath.trim();
			if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
				return full;
			}
			return `![${altText}](${toPublicUrl('blog', slug, clean)})`;
		})
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, text: string, href: string) => {
			const clean = href.trim();
			if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('#')) {
				return full;
			}
			return `[${text}](${toPublicUrl('blog', slug, clean)})`;
		});
}

async function exists(targetPath: string): Promise<boolean> {
	try {
		await stat(targetPath);
		return true;
	} catch {
		return false;
	}
}

async function listFilesRecursive(root: string, extension: string): Promise<string[]> {
	if (!(await exists(root))) {
		return [];
	}

	const files: string[] = [];
	const entries = await readdir(root, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith('.')) {
			continue;
		}
		const absolutePath = path.join(root, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await listFilesRecursive(absolutePath, extension)));
			continue;
		}
		if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
			files.push(absolutePath);
		}
	}

	return files;
}

export async function readCardsDataset(): Promise<CardsDataset> {
	if (!(await exists(CARDS_JSON_PATH))) {
		return { books: [] };
	}

	const raw = await readFile(CARDS_JSON_PATH, 'utf-8');
	const parsed = JSON.parse(raw) as CardsDataset;
	if (!Array.isArray(parsed.books)) {
		return { books: [] };
	}
	return parsed;
}

export async function listBlogPosts(): Promise<BlogPostMeta[]> {
	if (!(await exists(BLOG_ROOT))) {
		return [];
	}

	const postDirs = (await readdir(BLOG_ROOT, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));

	const posts: BlogPostMeta[] = [];
	for (const slug of postDirs) {
		const dirPath = path.join(BLOG_ROOT, slug);
		const files = await readdir(dirPath, { withFileTypes: true });
		const markdownFile = files.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'));
		if (!markdownFile) {
			continue;
		}

		const markdown = await readFile(path.join(dirPath, markdownFile.name), 'utf-8');
		const fallbackTitle = markdownFile.name.replace(/\.md$/i, '');
		posts.push({
			slug,
			title: titleFromMarkdown(markdown, fallbackTitle),
			excerpt: excerptFromMarkdown(markdown),
			coverImage: coverFromMarkdown(markdown, slug)
		});
	}

	return posts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
	const postDir = path.join(BLOG_ROOT, slug);
	if (!(await exists(postDir))) {
		return null;
	}

	const files = await readdir(postDir, { withFileTypes: true });
	const markdownFile = files.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'));
	if (!markdownFile) {
		return null;
	}

	const markdown = await readFile(path.join(postDir, markdownFile.name), 'utf-8');
	const normalizedMarkdown = rewriteMarkdownAssetUrls(markdown, slug);
	const fallbackTitle = markdownFile.name.replace(/\.md$/i, '');
	const title = titleFromMarkdown(markdown, fallbackTitle);

	return {
		slug,
		title,
		excerpt: excerptFromMarkdown(markdown),
		coverImage: coverFromMarkdown(markdown, slug),
		markdown: normalizedMarkdown,
		html: marked.parse(normalizedMarkdown) as string
	};
}

export async function listPdfResources(): Promise<PdfResource[]> {
	const pdfFiles = await listFilesRecursive(CV_ROOT, '.pdf');
	return pdfFiles
		.map((absolutePath) => {
			const relativePath = path.relative(CV_ROOT, absolutePath);
			const dirname = path.dirname(relativePath);
			const section = dirname === '.' ? 'cv' : dirname;
			const filename = path.basename(relativePath, '.pdf');
			const normalizedRelative = relativePath.split(path.sep).join('/');
			return {
				title: filename,
				section,
				url: toPublicUrl('cv', normalizedRelative)
			};
		})
		.sort((a, b) => a.title.localeCompare(b.title));
}

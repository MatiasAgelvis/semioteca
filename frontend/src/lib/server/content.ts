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

function stripInlineMarkdown(text: string): string {
	return text
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // remove images
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
		.replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
		.replace(/(\*|_)(.*?)\1/g, '$2') // italic
		.replace(/`([^`]+)`/g, '$1') // inline code
		.trim();
}

function excerptFromMarkdown(markdown: string): string {
	for (const line of markdown.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('![') || trimmed.startsWith('>')) {
			continue;
		}
		const clean = stripInlineMarkdown(trimmed);
		if (!clean) continue;
		return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
	}
	return 'Post available in the Significado Total archive.';
}

function coverFromMarkdown(markdown: string, slug: string): string | null {
	// Try inline image first: ![alt](path)
	const inlineMatch = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
	if (inlineMatch) {
		const rawPath = inlineMatch[1]?.trim();
		if (rawPath) {
			if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('/')) {
				return rawPath;
			}
			return toPublicUrl('blog', slug, rawPath);
		}
	}

	// Fall back to reference-style image: ![][label] resolved via [label]: path
	const refImageMatch = markdown.match(/!\[[^\]]*\]\[([^\]]+)\]/);
	if (refImageMatch) {
		const label = refImageMatch[1];
		const defRegex = new RegExp(`^\\[${label}\\]:\\s*(\\S+)`, 'm');
		const defMatch = markdown.match(defRegex);
		if (defMatch) {
			const rawPath = defMatch[1]?.trim();
			if (rawPath) {
				if (rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('/')) {
					return rawPath;
				}
				return toPublicUrl('blog', slug, rawPath);
			}
		}
	}

	return null;
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
		// Inline images: ![alt](path)
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, altText: string, assetPath: string) => {
			const clean = assetPath.trim();
			if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) {
				return full;
			}
			return `![${altText}](${toPublicUrl('blog', slug, clean)})`;
		})
		// Reference-style link/image definitions: [label]: path
		.replace(/^(\[[^\]]+\]):\s+(\S+)(.*)$/gm, (full, label: string, href: string, rest: string) => {
			const clean = href.trim();
			if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('#')) {
				return full;
			}
			return `${label}: ${toPublicUrl('blog', slug, clean)}${rest}`;
		})
		// Inline links: [text](href)
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
	const fallbackTitle = markdownFile.name.replace(/\.md$/i, '');
	const title = titleFromMarkdown(markdown, fallbackTitle);
	// Remove the first h1 so it isn't rendered twice (the template already shows the title)
	const markdownWithoutTitle = markdown.replace(/^#\s+.+\n?/m, '');
	const normalizedMarkdown = rewriteMarkdownAssetUrls(markdownWithoutTitle, slug);

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

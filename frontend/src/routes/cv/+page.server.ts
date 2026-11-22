import { SHOW_CV } from '$lib/config/features';
import { listPdfResources } from '$lib/server/content';
import type { PdfResource } from '$lib/types/content';

export const prerender = true;

/**
 * Some articles have a second export of the same work ("... 2.pdf"). The
 * duplicate should not be listed twice; prefer the file without the numeric
 * suffix. The extra file remains downloadable at its direct URL.
 */
function dedupeArticles(articles: PdfResource[]): PdfResource[] {
  const byBaseTitle = new Map<string, PdfResource>();
  for (const article of articles) {
    const base = article.title.replace(/\s+2$/, '');
    const current = byBaseTitle.get(base);
    if (!current || current.title.endsWith(' 2')) {
      byBaseTitle.set(base, article);
    }
  }
  return [...byBaseTitle.values()];
}

export async function load() {
  if (!SHOW_CV) {
    return { resources: [], articles: [] };
  }

  const resources = await listPdfResources();
  return {
    resources: resources.filter((resource) => resource.section === 'cv'),
    articles: dedupeArticles(resources.filter((resource) => resource.section === 'articulos')),
  };
}

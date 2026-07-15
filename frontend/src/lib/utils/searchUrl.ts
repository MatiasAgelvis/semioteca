export interface SearchUrlParams {
  q: string;
  tags: string[];
  authors: string[];
  mode: 'all' | 'any';
}

/** Parse URL searchParams into typed search state */
export function parseSearchUrl(sp: URLSearchParams): Partial<SearchUrlParams> {
  const result: Partial<SearchUrlParams> = {};
  const q = sp.get('q');
  if (q) result.q = q;
  const tags = sp.get('tags');
  if (tags) result.tags = tags.split(',').map(decodeURIComponent).filter(Boolean);
  const authors = sp.get('authors');
  if (authors) result.authors = authors.split(',').map(decodeURIComponent).filter(Boolean);
  const mode = sp.get('mode');
  if (mode === 'any' || mode === 'all') result.mode = mode;
  return result;
}

/** Build URLSearchParams from search state */
export function buildSearchParams(params: SearchUrlParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.tags.length > 0) sp.set('tags', params.tags.map(encodeURIComponent).join(','));
  if (params.authors.length > 0) sp.set('authors', params.authors.map(encodeURIComponent).join(','));
  if (params.mode === 'any') sp.set('mode', 'any');
  return sp;
}

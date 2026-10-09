import { error } from '@sveltejs/kit';

import { buildRelatedCards, readCardsDataset } from '$lib/server/content';

// Per-card pages are rendered on demand by the SvelteKit catchall serverless
// function. Prerendering all 2,700+ cards would emit two routes per page
// (rewrite + canonical 308) in the Vercel Build Output API, blowing past the
// platform's 2048 route limit. The catchall uses SvelteKit's load() to render
// each card and writes a static-friendly Cache-Control header.
export const prerender = false;

export async function load({ params, url }) {
  const [dataset, relations] = await Promise.all([
    readCardsDataset(),
    buildRelatedCards(params.id),
  ]);
  const card = dataset.books.flatMap((book) => book.cards).find((item) => item.id === params.id);
  if (!card) {
    error(404, 'Card not found');
  }

  let fromGraph = false;
  let graphOrigin = '';
  try {
    fromGraph = url.searchParams.get('from') === 'graph';
    graphOrigin = url.searchParams.get('origin') ?? '';
  } catch {
    // query params unavailable during prerendering — both stay false/empty
  }

  return { card, relations, fromGraph, graphOrigin };
}

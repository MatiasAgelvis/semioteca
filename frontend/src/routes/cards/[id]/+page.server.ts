import { error } from '@sveltejs/kit';

import { buildRelatedCards, readCardsDataset } from '$lib/server/content';

export const prerender = true;

export async function entries() {
  const dataset = await readCardsDataset();
  return dataset.books.flatMap((book) => book.cards.map((card) => ({ id: card.id })));
}

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

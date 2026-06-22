import { readCardsDataset } from '$lib/server/content';
import type { CardRecord } from '$lib/types/content';

export const prerender = true;

export async function load() {
  const dataset = await readCardsDataset();
  const cards: CardRecord[] = dataset.books.flatMap((book) => book.cards);

  return { cards };
}

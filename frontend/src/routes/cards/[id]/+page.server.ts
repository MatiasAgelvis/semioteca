import { error } from '@sveltejs/kit';

import { readCardsDataset } from '$lib/server/content';

export const prerender = true;

export async function entries() {
	const dataset = await readCardsDataset();
	return dataset.books.flatMap((book) => book.cards.map((card) => ({ id: card.id })));
}

export async function load({ params }) {
	const dataset = await readCardsDataset();
	const card = dataset.books.flatMap((book) => book.cards).find((item) => item.id === params.id);
	if (!card) {
		error(404, 'Card not found');
	}

	return { card };
}

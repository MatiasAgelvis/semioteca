import { readCardsDataset } from '$lib/server/content';

export const prerender = true;

export async function load() {
	const dataset = await readCardsDataset();
	const books = dataset.books.map((book) => ({
		key: `${book.author}-${book.year}-${book.book}`,
		title: book.title,
		author: book.author,
		year: book.year,
		count: book.cards.length
	}));
	const totalCards = books.reduce((sum, book) => sum + book.count, 0);

	return {
		books,
		totalCards
	};
}

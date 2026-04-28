import { listBlogPosts, readCardsDataset } from '$lib/server/content';

export const prerender = true;

export async function load() {
	const [posts, dataset] = await Promise.all([listBlogPosts(), readCardsDataset()]);

	const recentPosts = posts.slice(-3).reverse();
	const totalCards = dataset.books.reduce((sum, book) => sum + book.cards.length, 0);
	const totalBooks = dataset.books.length;

	return {
		recentPosts,
		totalCards,
		totalBooks
	};
}

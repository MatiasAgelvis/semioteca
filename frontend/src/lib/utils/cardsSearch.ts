import type { CardRecord } from '$lib/types/content';
import { countMatchedTerms, getMatchCount, matchesAllTerms, matchesAnyTerm } from './search';

export type CardSearchFields = {
	content: boolean;
	authorBook: boolean;
	page: boolean;
	tags: boolean;
};

function buildSearchableText(card: CardRecord, searchFields: CardSearchFields) {
	const parts: string[] = [];

	if (searchFields.authorBook) parts.push(card.author, card.book);
	if (searchFields.page) parts.push(card.page ?? '');
	if (searchFields.content) parts.push(card.content);
	if (searchFields.tags && card.tags) parts.push(...card.tags);

	return parts.join(' ');
}

function cardMatchesAuthorFilter(cardAuthor: string, selectedAuthors: Set<string>) {
	return selectedAuthors.size === 0 || selectedAuthors.has(cardAuthor);
}

function cardMatchesTagFilter(
	cardTags: string[] | undefined,
	selectedTags: Set<string>,
	matchMode: 'all' | 'any'
) {
	if (selectedTags.size === 0) return true;
	if (!cardTags?.length) return false;

	if (matchMode === 'all') {
		return Array.from(selectedTags).every((tag) => cardTags.includes(tag));
	}

	return cardTags.some((tag) => selectedTags.has(tag));
}

export function getRankedSearchResults(
	cards: CardRecord[],
	terms: string[],
	selectedAuthors: Set<string>,
	selectedTags: Set<string>,
	searchFields: CardSearchFields,
	matchMode: 'all' | 'any'
) {
	const hasFilters = selectedAuthors.size > 0 || selectedTags.size > 0;
	if (terms.length === 0 && !hasFilters) return [] as CardRecord[];

	const matchFn = matchMode === 'all' ? matchesAllTerms : matchesAnyTerm;

	return cards
		.map((card, index) => ({
			card,
			index,
			searchableText: buildSearchableText(card, searchFields)
		}))
		.filter(({ card, searchableText }) => {
			if (!cardMatchesAuthorFilter(card.author, selectedAuthors)) return false;
			if (!cardMatchesTagFilter(card.tags, selectedTags, matchMode)) return false;
			if (terms.length === 0) return true;
			return matchFn(searchableText, terms);
		})
		.map(({ card, index, searchableText }) => ({
			card,
			index,
			score: (() => {
				const coverageBonus = terms.length > 0
					? (countMatchedTerms(searchableText, terms) / terms.length) * 20
					: 0;
				const authorScore = searchFields.authorBook ? Math.min(getMatchCount(card.author, terms), 3) * 6 : 0;
				const bookScore = searchFields.authorBook ? Math.min(getMatchCount(card.book, terms), 3) * 5 : 0;
				const pageScore = searchFields.page ? Math.min(getMatchCount(card.page ?? '', terms), 3) * 4 : 0;
				const tagScore = searchFields.tags && card.tags
					? Math.min(card.tags.reduce((sum, t) => sum + getMatchCount(t, terms), 0), 3) * 5
					: 0;
				const contentScore = searchFields.content
					? Math.min(getMatchCount(card.content, terms), 5)
					: 0;
				return coverageBonus + authorScore + bookScore + pageScore + tagScore + contentScore;
			})()
		}))
		.sort((left, right) => {
			if (right.score !== left.score) return right.score - left.score;
			return left.index - right.index;
		})
		.map(({ card }) => card);
}

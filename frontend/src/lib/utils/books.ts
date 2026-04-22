import type { CardRecord } from '$lib/types/content';

export function normalizeBookPart(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();
}

export function getBookKey(card: Pick<CardRecord, 'author' | 'book'>): string {
	return `${normalizeBookPart(card.author)}-${normalizeBookPart(card.book)}`;
}

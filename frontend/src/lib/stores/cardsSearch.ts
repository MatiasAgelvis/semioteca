import { writable } from 'svelte/store';

export const cardsSearchDialogOpen = writable(false);
export const cardsSearchQuery = writable('');
export const cardsSearchInitialTags = writable<string[]>([]);

export function openCardsSearch(initialTags: string[] = []) {
	cardsSearchInitialTags.set(initialTags);
	cardsSearchDialogOpen.set(true);
}

export function closeCardsSearch() {
	cardsSearchDialogOpen.set(false);
	cardsSearchInitialTags.set([]);
}
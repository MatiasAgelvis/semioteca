import { writable } from 'svelte/store';

export const cardsSearchDialogOpen = writable(false);
export const cardsSearchQuery = writable('');

export function openCardsSearch() {
	cardsSearchDialogOpen.set(true);
}

export function closeCardsSearch() {
	cardsSearchDialogOpen.set(false);
}
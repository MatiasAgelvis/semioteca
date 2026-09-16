import { writable } from 'svelte/store';
import type { CardSearchFields } from '$lib/utils/cardsSearch';

export const cardsSearchDialogOpen = writable(false);
export const cardsSearchQuery = writable('');
export const cardsSearchInitialTags = writable<string[]>([]);

// Fired when the user clicks "go to full results" in the global SearchDialog.
// The cards page watches this and enters full-results mode.
export const cardsSearchFullResultsRequest = writable<{
  query: string;
  tags: Set<string>;
  authors: Set<string>;
  mode: 'all' | 'any';
  fields: CardSearchFields;
} | null>(null);

export function openCardsSearch(initialTags: string[] = []) {
  cardsSearchInitialTags.set(initialTags);
  cardsSearchDialogOpen.set(true);
}

export function closeCardsSearch() {
  cardsSearchDialogOpen.set(false);
  cardsSearchInitialTags.set([]);
}

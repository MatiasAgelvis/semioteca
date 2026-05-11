<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import type { CardRecord } from '$lib/types/content';
	import { createExcerpt, getHighlightSegments } from '$lib/utils/search';

	let {
		card,
		searchTerms,
		onselect
	}: {
		card: CardRecord;
		searchTerms: string[];
		onselect: (card: CardRecord) => void;
	} = $props();

	const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
	const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
	const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));
	const previewText = $derived(createExcerpt(card.content, searchTerms, 90));
	const previewSegments = $derived(getHighlightSegments(previewText, searchTerms));
</script>

<button
	type="button"
	class="w-full rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-left transition hover:border-primary/50 hover:bg-base-200/60"
	onclick={() => onselect(card)}
>
	<div class="grid gap-3 grid-cols-4">
		<p class="text-sm font-semibold col-span-3 flex flex-wrap gap-1 min-w-0 overflow-hidden">
			<span class="inline-block min-w-0 truncate whitespace-nowrap">
				<HighlightedText segments={authorSegments} />
			</span>
			<span class="inline-block truncate">—</span>
			<span class="inline-block min-w-0 truncate whitespace-nowrap">
				<HighlightedText segments={bookSegments} />
			</span>
		</p>
		<span class="badge badge-ghost badge-sm justify-self-end self-start col-span-1 whitespace-nowrap">
			p. <HighlightedText segments={pageSegments} />
		</span>
		<p class="mt-2 line-clamp-3 text-sm leading-6 opacity-80 col-span-4">
			<HighlightedText segments={previewSegments} />
		</p>
	</div>
</button>
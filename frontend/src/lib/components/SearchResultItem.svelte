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
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-semibold">
				<HighlightedText segments={authorSegments} />
				<span> — </span>
				<HighlightedText segments={bookSegments} />
			</p>
			<p class="mt-2 line-clamp-3 text-sm leading-6 opacity-75">
				<HighlightedText segments={previewSegments} />
			</p>
		</div>
		<span class="badge badge-ghost badge-sm shrink-0">p. <HighlightedText segments={pageSegments} /></span>
	</div>
</button>
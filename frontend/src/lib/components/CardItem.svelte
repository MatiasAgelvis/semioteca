<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import type { CardRecord } from '$lib/types/content';
	import { createExcerpt, getHighlightSegments, getMatchCount } from '$lib/utils/search';

	let {
		card,
		focused,
		searchTerms = [],
		onregister,
		onunregister
	}: {
		card: CardRecord;
		focused: boolean;
		searchTerms?: string[];
		onregister?: (el: HTMLElement, id: string) => void;
		onunregister?: (el: HTMLElement, id: string) => void;
	} = $props();

	let element: HTMLElement;
	const searchActive = $derived(searchTerms.length > 0);
	const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
	const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
	const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));
	const previewText = $derived(searchActive ? createExcerpt(card.content, searchTerms) : card.content);
	const contentSegments = $derived(getHighlightSegments(previewText, searchTerms));
	const matchCount = $derived(
		searchActive
			? getMatchCount([card.title, card.author, card.book, card.page ?? '', card.content].join(' '), searchTerms)
			: 0
	);

	$effect(() => {
		if (!element) return;
		const id = card.id;
		onregister?.(element, id);

		return () => {
			onunregister?.(element, id);
		};
	});
</script>

<article
	bind:this={element}
	id={`card-${card.id}`}
	data-card-id={card.id}
	class={`card bg-base-100 border scroll-mt-28 transition-colors ${focused ? 'border-primary shadow-sm' : 'border-base-300'}`}
>
	<div class="card-body p-5">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="font-bold">
				<HighlightedText segments={authorSegments} />
				<span> — </span>
				<HighlightedText segments={bookSegments} />
			</p>
			<div class="flex items-center gap-2">
				<span class="badge badge-ghost badge-sm">p. <HighlightedText segments={pageSegments} /></span>
				{#if searchActive}
					<span class="badge badge-warning badge-sm">{matchCount} coincidencias</span>
				{/if}
			</div>
		</div>
		<p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
			<HighlightedText segments={contentSegments} />
		</p>
		<div class="card-actions items-center justify-between">
			<span class="text-xs opacity-50">ID: {card.id}</span>
			<a class="btn btn-sm btn-outline" href={`/cards/${card.id}`}>Ver detalle</a>
		</div>
	</div>
</article>

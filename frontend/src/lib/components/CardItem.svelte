<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import type { CardImage, CardRecord } from '$lib/types/content';
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
	let expanded = $state(false);

	const searchActive = $derived(searchTerms.length > 0);
	const hasImages = $derived(card.images.length > 0);

	const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
	const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
	const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));

	// Compact preview: excerpt when searching, otherwise first ~350 chars (no image placeholders)
	const compactText = $derived(
		searchActive
			? createExcerpt(card.content, searchTerms)
			: (() => {
					const stripped = card.content.replace(/\[\[IMAGE:\d+\]\]\n?/g, '');
					return stripped.length > 350 ? stripped.slice(0, 350).trimEnd() + '\u2026' : stripped;
				})()
	);
	const contentSegments = $derived(getHighlightSegments(compactText, searchTerms));

	const matchCount = $derived(
		searchActive
			? getMatchCount([card.title, card.author, card.book, card.page ?? '', card.content].join(' '), searchTerms)
			: 0
	);

	// Expanded: parse content into alternating text/image parts
	type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImage };
	const expandedParts = $derived.by<ContentPart[]>(() => {
		const imageMap = new Map(card.images.map((img) => [img.placeholder_id, img]));
		const chunks = card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
		const parts: ContentPart[] = [];
		for (let i = 0; i < chunks.length; i++) {
			if (i % 2 === 0) {
				if (chunks[i].trim()) parts.push({ kind: 'text', text: chunks[i] });
			} else {
				const img = imageMap.get(Number(chunks[i]));
				if (img) parts.push({ kind: 'image', image: img });
			}
		}
		return parts;
	});

	function imageUrl(image: CardImage): string {
		const idx = image.path.indexOf('cards_images/');
		return idx !== -1 ? `/content/${image.path.slice(idx)}` : '';
	}

	$effect(() => {
		if (!element) return;
		const id = card.id;
		onregister?.(element, id);
		return () => { onunregister?.(element, id); };
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
				{#if hasImages}
					<span class="badge badge-ghost badge-sm opacity-60">{card.images.length} {card.images.length === 1 ? 'imagen' : 'imágenes'}</span>
				{/if}
			</div>
		</div>

		{#if expanded}
			<div class="mt-1 space-y-3">
				{#each expandedParts as part}
					{#if part.kind === 'text'}
						<p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
							<HighlightedText segments={getHighlightSegments(part.text, searchTerms)} />
						</p>
					{:else}
						<figure class="my-2">
							<img
								src={imageUrl(part.image)}
								alt={part.image.alt_text ?? part.image.caption ?? ''}
								loading="lazy"
								class="max-w-full rounded-lg border border-base-200"
							/>
							{#if part.image.caption}
								<figcaption class="mt-1 text-xs opacity-50">{part.image.caption}</figcaption>
							{/if}
						</figure>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
				<HighlightedText segments={contentSegments} />
			</p>
		{/if}

		<div class="card-actions justify-end">
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn btn-sm btn-outline"
					onclick={() => { expanded = !expanded; }}
				>
					{expanded ? 'Cerrar' : 'Ver detalle'}
				</button>
				<a
					href={`/cards/${card.id}`}
					class="btn btn-sm btn-ghost btn-square"
					title="Abrir página de esta tarjeta"
					aria-label="Abrir página de esta tarjeta"
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</article>

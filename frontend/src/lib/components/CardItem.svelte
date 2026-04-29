<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import { showToast } from '$lib/stores/toast';
	import type { CardImage, CardRecord } from '$lib/types/content';
	import { buildCardCitationAPA, buildCardFullText, copyTextToClipboard } from '$lib/utils/citation';
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
	let detailsEl: HTMLDetailsElement;
	let expanded = $state(false);

	$effect(() => {
		function handleClick(e: MouseEvent) {
			if (detailsEl && !detailsEl.contains(e.target as Node)) {
				detailsEl.removeAttribute('open');
			}
		}
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});

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

	async function copyCitation() {
		detailsEl?.removeAttribute('open');
		const copied = await copyTextToClipboard(buildCardCitationAPA(card));
		showToast(copied ? 'Cita copiada' : 'No se pudo copiar', copied ? 'success' : 'error');
	}

	async function copyCardText() {
		detailsEl?.removeAttribute('open');
		const copied = await copyTextToClipboard(buildCardFullText(card));
		showToast(copied ? 'Texto copiado' : 'No se pudo copiar', copied ? 'success' : 'error');
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
	class={`card bg-base-100 border transition-colors ${focused ? 'border-primary shadow-sm' : 'border-base-300'}`}
	style="scroll-margin-top: var(--header-height, 7rem)"
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
			<div class="flex flex-wrap items-center justify-end gap-2">
				<details bind:this={detailsEl} class="dropdown dropdown-end">
					<summary class="btn btn-sm btn-ghost">Opciones</summary>
					<ul class="menu dropdown-content z-20 mt-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow">
						<li>
							<a
								href={`/cards/${card.id}`}
								target="_blank"
								rel="noopener noreferrer"
								data-sveltekit-reload
								onclick={() => detailsEl?.removeAttribute('open')}
							>
								Abrir en nueva pestana
							</a>
						</li>
						<li><button type="button" onclick={copyCitation}>Copiar cita</button></li>
						<li><button type="button" onclick={copyCardText}>Copiar texto</button></li>
					</ul>
				</details>
				<button
					type="button"
					class="btn btn-sm btn-outline"
					onclick={() => { expanded = !expanded; }}
				>
					{expanded ? 'Cerrar' : 'Ver detalle'}
				</button>
			</div>
		</div>
	</div>
</article>
